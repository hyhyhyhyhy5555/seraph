# 04. PostgreSQL과 Express API 배포

## 목표

DB는 영구 저장하고 API는 교체 가능한 컨테이너로 만든다. 이 문서의 YAML은 앞으로 작성할 배포 파일의 예시다. 아직 실제 배포가 구현된 상태는 아니다. 처음에는 `seraph-staging`에서 전 과정을 검증한다.

## 1. 먼저 정할 값

- namespace: staging부터, 이후 prod
- DB 이미지: `pgvector/pgvector:pg17`을 검증한 digest로 고정
- DB PVC 용량·StorageClass·백업 위치: 사양 확인 후 결정
- API 이미지: 현재 커밋 기반 태그 또는 자체 Registry digest
- API CPU·RAM requests/limits: 초기값으로 시작해 실측
- CORS origin: 실제 웹 호스트 또는 준비용 명시 값, wildcard로 두지 않음

## 2. Secret 만들기

DB 관리자와 앱용 계정을 분리하는 것을 목표로 한다. PostgreSQL 초기 POSTGRES_USER는 높은 권한 계정이므로 장기 API 연결에 그대로 쓰지 않는다. 초기화/마이그레이션 전용 계정과 앱의 읽기·쓰기 권한을 구분한다.

보안 입력 방법 예시:

1. VM의 저장소 밖 관리 디렉터리를 만들고 권한을 700으로 설정한다.
2. 편집기로 DB 비밀번호 파일과 API 환경 파일을 만들고 권한 600으로 둔다.
3. 파일 내용을 출력하거나 터미널 명령에 비밀번호를 직접 넣지 않는다.
4. 다음처럼 파일에서 Secret을 만든다.

```bash
kubectl -n seraph-staging create secret generic seraph-db-admin \
  --from-file=POSTGRES_PASSWORD=<PRIVATE_DB_PASSWORD_FILE>
kubectl -n seraph-staging create secret generic seraph-api-env \
  --from-env-file=<PRIVATE_API_ENV_FILE>
```

API 파일에는 PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD를 각각 넣으면 URL 특수문자 인코딩 문제를 피할 수 있다. 현재 backend env 구현이 개별 PG 변수를 지원한다. Secret은 base64 인코딩만으로 암호화되지 않는다. RBAC와 K3s Secret at-rest encryption 정책을 함께 적용한다.

## 3. DB 리소스 설계

- 일반 ClusterIP Service `seraph-postgres`: 앱의 DB 접속 주소, port 5432.
- headless Service `seraph-postgres-headless`: StatefulSet `serviceName`과 일치.
- StatefulSet `seraph-postgres`, replicas 1.
- volumeClaimTemplates, ReadWriteOnce, local-path 초기 선택.
- mountPath `/var/lib/postgresql/data`, PGDATA는 그 아래 하위 폴더로 지정 가능.
- POSTGRES_DB=seraph, 초기 관리자 계정·암호는 Secret.
- readiness/startup에 `pg_isready` 사용. 초기화 중 강제 재시작되지 않게 시간을 확보.
- DB는 NodePort·LoadBalancer·hostPort로 공개하지 않음.

PVC와 StatefulSet의 파일은 별도 관리한다. StatefulSet 삭제와 PVC 삭제의 효과를 확인하고 운영 PVC는 배포 정리 스크립트에 넣지 않는다.

## 4. 최초 스키마와 이후 마이그레이션

초기에는 **빈 DB를 기동한 후 별도 마이그레이션 작업으로 001~009를 적용하는 방식**을 권장한다. Compose의 initdb와 Job 두 경로를 같은 DB에 중복 적용하지 않는다.

현재 SQL은 모든 파일의 재실행 안전성이 보장된 마이그레이션 도구가 아니다. 다음 구현이 먼저 필요하다.

1. schema_migrations에 파일명·checksum·적용 시간 저장.
2. DB advisory lock 등으로 동시에 두 배포가 migration하지 못하게 함.
3. 이미 적용된 파일은 건너뛰고 checksum이 달라지면 중단.
4. 새 SQL 파일만 오름차순으로 적용.
5. 트랜잭션 가능 SQL과 별도 실행이 필요한 SQL 구분.
6. 실패한 파일을 성공 처리하지 않음.
7. 빈 DB·기존 DB 양쪽에서 검증.

부트스트랩 수동 실행 예시는 **완전히 새 DB에 한 번만** 사용한다.

```bash
for sql_file in db/migrations/*.sql; do
  kubectl -n seraph-staging exec -i seraph-postgres-0 -- \
    psql -v ON_ERROR_STOP=1 -U <DB_ADMIN_USER> -d seraph < "$sql_file" || break
done
```

마지막 파일까지 성공했는지 각 결과와 schema를 확인한다. 실패 후 전체 loop를 재실행하지 않는다. 어디까지 반영됐는지 조사한다. 실운영은 이 수동 loop 대신 이력 관리된 migration Job을 사용한다. 002 등 seed SQL도 별도 분류해 운영에 샘플 데이터가 들어가는지 검토한다.

## 5. API 구성

ConfigMap 후보:

```text
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://<WEB_HOST>
TRUST_PROXY=<VERIFIED_PROXY_SETTING>
```

현재 TRUST_PROXY는 boolean 설정뿐이다. 무조건 true를 넣기 전에 Ingress만 API에 접근 가능한지 확인한다. 향후 신뢰 프록시 범위/홉 수 설정을 지원하도록 개선하고 X-Forwarded-For 위조 테스트를 한다.

초기 Deployment 예시: 이미지와 ConfigMap/Secret을 먼저 준비해야 한다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: seraph-api
  namespace: seraph-staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: seraph-api
  template:
    metadata:
      labels:
        app: seraph-api
    spec:
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: seraph-backend:lab-001
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 4000
          envFrom:
            - configMapRef:
                name: seraph-api-config
            - secretRef:
                name: seraph-api-env
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: '1'
              memory: 768Mi
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: [ALL]
          startupProbe:
            httpGet:
              path: /live
              port: http
            failureThreshold: 30
            periodSeconds: 2
          livenessProbe:
            httpGet:
              path: /live
              port: http
            periodSeconds: 10
            timeoutSeconds: 3
          readinessProbe:
            httpGet:
              path: /health
              port: http
            periodSeconds: 5
            timeoutSeconds: 3
```

CPU·메모리는 검증 전 초기값이다. PDF 처리·임베딩을 API 안에 무제한으로 넣지 않는다. DB 장애는 readiness를 내리되 liveness로 API를 반복 재시작하지 않는다.

Service 예시:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: seraph-api
  namespace: seraph-staging
spec:
  selector:
    app: seraph-api
  ports:
    - name: http
      port: 80
      targetPort: http
```

## 6. 배포와 검증 순서

1. namespace → Secret·ConfigMap → DB Service·StatefulSet·PVC 적용.
2. DB Ready 확인.
3. migration Job 실행, 완료 상태와 로그 확인.
4. DB 앱 계정 최소 권한 확인.
5. API Service·Deployment 적용.
6. rollout 상태 확인 후 port-forward로 테스트.

```bash
kubectl -n seraph-staging get pods,pvc,svc
kubectl -n seraph-staging rollout status deployment/seraph-api --timeout=180s
kubectl -n seraph-staging port-forward service/seraph-api 4000:80
```

다른 SSH 창에서:

```bash
curl --fail http://127.0.0.1:4000/live
curl --fail http://127.0.0.1:4000/health
curl --fail http://127.0.0.1:4000/api/categories
```

port-forward는 임시 관리 경로다. 외부 공개 수단으로 0.0.0.0에 무조건 바인딩하지 않는다.

## 7. 데이터와 재시작 검증

권한 있는 샘플을 넣고 행 수를 기록한다. DB Pod를 정상적으로 재생성해 같은 PVC를 다시 마운트하는지 확인한다. 데이터가 남았는지 확인한다. 이는 노드 디스크 손실 복구 테스트가 아니다.

staging과 prod의 Secret·PVC·호스트명이 서로 다른지 검증한 뒤 prod에 반복 적용한다. namespace만 바꿨는데 같은 외부 DB 주소를 쓰는 실수를 피한다.

## 8. 실패 진단

| 증상 | 확인 |
| --- | --- |
| Pending | PVC Pending, StorageClass, 용량, node affinity |
| ImagePullBackOff | 이미지 태그, Registry TLS·인증, 노드별 import |
| CreateContainerConfigError | Secret·ConfigMap 이름과 key |
| CrashLoopBackOff | `logs --previous`, production env, DB 인증 |
| API Ready가 안 됨 | DB host·DNS·권한·NetworkPolicy |
| migration 실패 | SQL 적용 이력·확장 권한·기존 스키마 |

```bash
kubectl -n seraph-staging describe pod <POD_NAME>
kubectl -n seraph-staging logs deployment/seraph-api --tail=100
kubectl -n seraph-staging get events --sort-by=.lastTimestamp
```

## 완료 조건

- [ ] DB는 ClusterIP 내부 접속만 허용
- [ ] API·migration 계정 분리 및 권한 확인
- [ ] schema migration 이력·checksum·동시 실행 잠금 구현
- [ ] /live와 /health probe 분리
- [ ] Pod 재생성 후 데이터 유지
- [ ] staging/prod 격리 확인
- [ ] API 이전 이미지와 DB 호환성 확인
