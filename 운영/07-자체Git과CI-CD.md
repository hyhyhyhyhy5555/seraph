# 07. 자체 Git, 컨테이너 저장소, CI/CD

## 목표와 제안

소스 저장·검사·컨테이너 빌드·Android 빌드·배포를 내 장비에서 수행한다. 개발·검사·컨테이너·Android·iOS 빌드 러너는 보유 맥북 측에서 실행하고 그램은 배포·상시 서비스만 담당한다. 도구 수를 줄이기 위해 **Gitea + Gitea Actions runner + 내장 Container Registry**를 우선 제안한다. 설치 버전·VM 자원은 아직 미정이다.

별도 Harbor는 이미지 관리·보안 기능을 더 배우고 싶을 때 확장한다. 처음부터 둘을 동시에 운영하지 않는다. 내장 Registry는 Git 호스트 이름으로 제공할 수 있으므로 별도 REGISTRY_HOST가 반드시 필요한 것은 아니다. 실제 선택에 맞춰 주소표를 갱신한다.

## 개발 장비와 서버 역할

사용자 확정: 맥북에서 소스 작성·검사·서버 이미지·Android/iOS 서명 빌드·스토어 제출을 수행한다. 그램 Ubuntu VM에서는 완성된 이미지를 pull/import하고 Kubernetes 배포·migration·실행 상태 검사·백업만 수행한다. 그램에 개발 소스를 가져와 빌드하는 단계를 두지 않는다.

맥북이 일상 개발 장비이므로 CI runner 방식은 도구 호환성을 확인한 뒤 결정한다. macOS host runner 또는 맥북 안의 격리된 Linux 빌드 환경을 사용할 수 있지만 모든 빌드 연산은 맥북에서 수행한다. 맥북 수면·종료 시 새 빌드는 대기하며 기존 그램 서비스는 계속 동작한다. 그램에는 namespace 권한이 제한된 배포 runner만 둘 수 있다.

서버 이미지 대상은 linux/amd64다. Apple Silicon Mac이면 Buildx의 대상 platform을 명시해 빌드한다. 개발 이미지 arm64를 그램에 그대로 배포하지 않는다.

## 1. 배치와 순환 의존성

Gitea와 Registry는 service K3s와 다른 tooling VM에 두는 구성을 우선한다. 클러스터가 완전히 내려갔을 때 클러스터 복구에 필요한 소스·이미지를 가져올 수 있어야 한다.

사양상 한 VM에 합친다면 다음을 별도로 보관한다.

- 인프라 YAML·버전 목록의 오프라인 사본
- 마지막 정상 API·DB·모델 이미지
- Git·Registry 데이터·DB 백업
- 클러스터 없이 Gitea/Registry를 임시 기동하는 절차

## 2. Gitea 초기 설치

1. Ubuntu tooling VM·고정 IP·데이터 디스크 준비.
2. 검증된 Gitea 버전과 DB 지원 범위 확인, 이미지 digest 기록.
3. SQLite 또는 별도 PostgreSQL 선택. 초기 단일 사용자 환경이면 SQLite도 검토하되 백업 절차를 맞춘다.
4. 저장소·LFS·패키지·설정·DB 볼륨을 영구 디스크에 둔다.
5. ROOT_URL, SSH hostname/port, HTTPS reverse proxy를 실제 주소에 맞춘다.
6. 관리자 계정을 만들고 불필요한 공개 가입을 막는다.
7. 2FA·복구 코드·관리 계정 복구 경로 확보.
8. LAN에서 Git clone/push와 패키지 접근 확인.

외부에 UI를 공개할 필요는 없다. Mac·빌드 VM이 LAN에서 HTTPS를 신뢰하도록 CA chain을 배포한다. TLS 검증을 끄는 방식은 운영 표준으로 삼지 않는다.

## 3. 현재 저장소 이전

기존 원격을 지우거나 force push하지 않는다. 새 원격을 추가한다.

```bash
git remote -v
git remote add onprem <PRIVATE_GITEA_REPOSITORY_URL>
git push onprem <CURRENT_BRANCH>
```

태그는 필요한 것만 검토해 전달한다. 작업 트리의 미커밋 변경은 push로 전달되지 않는다. 기존 사용자 변경을 임의 커밋하지 않는다. secrets가 과거 history에 있는지 확인하고 발견 시 history 정리보다 먼저 해당 secret을 폐기·교체한다.

## 4. Runner 분리

세 역할을 논리적으로 나눈다.

| 러너 | 역할 | 허용 자격증명 |
| --- | --- | --- |
| 맥북 검사·빌드 | npm·linux/amd64 컨테이너·Android | Registry push, 필요한 빌드 키 |
| 그램 운영 배포 | migration Job·K8s 배포, 소스 빌드 없음 | 해당 namespace 제한 자격증명 |
| macOS | iOS 빌드·서명 | Apple 인증서·profile·업로드 키 |

러너 label은 실제 등록한 값과 workflow `runs-on`을 일치시킨다. GitHub의 ubuntu-latest를 그대로 쓰면 로컬 러너가 자동 생성되는 것이 아니다.

Docker socket을 마운트한 runner는 호스트 제어 권한을 가질 수 있다. 빌드 격리가 필요하면 맥북 측의 빌드 환경에서 구성한다. 그램에 빌드 VM을 만들지 않는다. 서비스 VM의 Docker socket·관리 kubeconfig를 공유하지 않는다. 신뢰하지 않는 PR 코드는 운영 secret이 있는 러너에서 실행하지 않는다. 관리되지 않은 public runner로 등록하지 않는다.

## 5. 워크플로 이식

현재 `.github/workflows/ci.yml`, `release-artifacts.yml`은 GitHub용이다. Gitea용 `.gitea/workflows/`를 작성하고 단계별 호환성을 검증한다.

- checkout/setup-node를 외부 action으로 가져오면 자체 CI여도 실행 시 GitHub에 의존한다.
- 완전한 자체 실행을 목표로 action을 로컬 mirror하고 immutable commit에 고정하거나 자체 shell task로 대체한다.
- npm/Docker/Gradle/CocoaPods 최초 다운로드는 외부 인터넷 의존성을 기록한다.
- 오프라인 재빌드까지 목표로 하면 npm·Maven·CocoaPods·컨테이너 캐시/mirror가 별도 필요하다. 기본 실습 완료 이후 확장한다.
- toolchain lock, package-lock.json, Gradle wrapper, Podfile.lock을 보존한다.

검사 pipeline:

```text
checkout 고정 commit
 → Node 고정 버전
 → npm ci
 → npm run audit:prod
 → npm run check
 → npm run build
 → 테스트용 DB 통합 검사
 → 컨테이너 build·취약점 확인
 → Registry push
 → digest·SBOM·검사 결과 보관
```

의존성 감사가 외부 registry 서비스를 이용한다는 점도 경계에 기록한다. 자체 scanner DB도 초기·주기 갱신이 필요하다.

## 6. Registry 사용

실제 Registry TLS·계정·권한이 준비된 뒤 **맥북에서** 실행한다. 로컬 builder를 사용하며 그램을 원격 build node로 등록하지 않는다:

```bash
docker login <REGISTRY_HOST>
docker buildx build --platform linux/amd64 \
  -t <REGISTRY_HOST>/<OWNER>/seraph-backend:<COMMIT_SHA> --push .
```

CI에서는 password-stdin과 secret 입력을 사용하고 shell trace를 끈다. push 계정과 K3s pull 계정을 분리한다. K8s imagePullSecret은 namespace별로 생성하고 pull 전용 자격증명을 넣는다. 인증서 신뢰는 Windows·Docker daemon·K3s containerd·Mac 각각 설정이 필요할 수 있다.

`latest`를 운영 배포 식별자로 쓰지 않는다. 실제 배포는 `image@sha256:...`로 고정하고 commit→image digest→배포→앱 빌드의 연결을 남긴다. Registry 정리 정책에서 현재 운영 이미지와 롤백 이미지는 제외한다.

## 7. 배포 pipeline

```text
검사 성공
 → staging DB migration
 → staging 이미지 배포
 → rollout·기능 검사
 → 운영 승격 조건 확인
 → 운영 DB 백업
 → 호환 migration
 → 같은 digest로 운영 배포
 → readiness·검색·질문 검사
 → 실패 시 이전 digest 복구
```

배포 동시성은 환경별 1개로 제한한다. 단순 API 이미지를 바꾸는 동안 두 migration이 겹치지 않게 한다. 배포 계정은 cluster-admin 대신 필요한 namespace의 Deployment/Job/ConfigMap 등으로 RBAC를 제한하고 Secret 조회 권한도 최소화한다. migration 계정은 별도 DB 권한을 사용한다.

기본 명령 예시:

```bash
kubectl -n seraph-staging set image deployment/seraph-api api=<IMAGE_BY_DIGEST>
kubectl -n seraph-staging rollout status deployment/seraph-api --timeout=180s
kubectl -n seraph-staging rollout history deployment/seraph-api
```

수동 set image로 검증한 뒤 Git에 선언한 이미지 값과 일치시킨다. 그렇지 않으면 다음 apply가 이전 버전을 덮어쓸 수 있다. 장기적으로 선언 파일 변경→승격 흐름을 표준으로 정한다.

## 8. Android·iOS 자동화

Android는 09의 맥북 수동 릴리스가 성공한 뒤 맥북 측 runner로 옮긴다. iOS도 10의 맥북 수동 Archive 성공 후 자동화한다. 처음부터 서명 문제와 CI 문제를 동시에 디버깅하지 않는다.

스토어 업로드 키는 해당 플랫폼 runner에만 둔다. 앱 artifact는 일반 빌드 로그보다 접근·보관 정책을 강화한다. 자동 테스트 배포와 스토어 공개 승격은 별도 단계로 둔다.

## 9. 복구 테스트

- Gitea가 멈춰도 현재 서비스는 계속 응답해야 함.
- Registry 장애 중 기존 Pod는 동작할 수 있지만 새 pull은 실패할 수 있음.
- 마지막 정상 이미지를 Registry 복구 없이 import해 staging을 복구하는 연습.
- Git 저장소와 package/Registry 파일을 DB와 일관된 시점으로 복원.
- runner token 폐기·재등록과 CI secret 교체 연습.

## 완료 조건

- [ ] 자체 Git clone/push 성공
- [ ] 자체 runner에서 검사·이미지 push 성공
- [ ] K3s가 인증된 Registry에서 pull 성공
- [ ] 운영 admin kubeconfig가 빌드 runner에 없음
- [ ] immutable 이미지 staging→prod 승격
- [ ] 실패 배포·이미지 롤백 재현
- [ ] Git·Registry 복구 방법 확보

참고: [Gitea Actions](https://docs.gitea.com/usage/actions/overview/), [Gitea Container Registry](https://docs.gitea.com/usage/packages/container/).
