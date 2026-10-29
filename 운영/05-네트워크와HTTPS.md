# 05. 집 네트워크, 도메인, HTTPS

## 목표와 공개 시점

휴대폰 LTE/5G에서 실제 도메인의 HTTPS로 접근한다. 이 문서의 네트워크 준비는 먼저 할 수 있지만 WAN 공개는 08 보안 점검 후 한다. 공유기 접근 권한만으로 외부 공개 가능성이 확정되는 것은 아니다.

## 1. 연결 경로 조사

다음을 기록한다. 비밀번호는 적지 않는다.

- 공유기 모델, 관리자 주소, WAN IPv4
- Windows LAN IP, 서비스 VM IP, VM 네트워크가 bridge인지 NAT인지
- 모뎀/상위 공유기 존재 여부
- 외부에서 관찰되는 IPv4와 공유기 WAN 주소가 같은지
- 공인 IP가 바뀌는지, 통신사 인바운드 제한 여부

WAN 주소가 사설 대역 또는 100.64.0.0/10이면 상위 NAT/CGNAT 가능성을 조사한다. 주소가 같아도 방화벽·통신사 제한 때문에 인바운드가 막힐 수 있으므로 실제 외부 테스트가 필요하다.

## 2. 분기 결정

| 상태 | 조치 |
| --- | --- |
| 공인 IPv4, 인바운드 가능 | 도메인 A 레코드·포트 전달 |
| 집에 공유기 두 대 | 상위 장비 bridge 또는 양쪽 전달 설계 |
| CGNAT | 통신사 공인 IP 제공 옵션 확인, 해당 단계 보류 |
| IPv6만 가능 | 기기·통신망 IPv6 지원과 방화벽 확인, IPv4 사용자 접근 검토 |
| 외부 터널 필요 | 자체 운영 목표와의 변경 사항을 기록한 후 사용자 결정 |

임의로 외부 클라우드 터널을 추가해 전체 자체 운영이라는 요구를 바꾸지 않는다. 해결 전까지 LAN 실습과 빌드를 계속한다.

## 3. 도메인 계획

도메인은 미정. 아래 호스트 역할만 예약한다.

| 이름 | 용도 | 공개 범위 |
| --- | --- | --- |
| `<API_HOST>` | 앱 API | 일반 사용자 |
| `<WEB_HOST>` | 개인정보처리방침·지원·웹 앱 | 일반 사용자 |
| `<GIT_HOST>` | 자체 Git | 관리 LAN/VPN 우선 |
| `<REGISTRY_HOST>` | 이미지 저장소 | 노드·빌드 장비만 |
| 모니터링 호스트 | Grafana 등 | 관리 LAN/VPN만 |

공개 API 호스트만 공인 IP로 연결한다. 내부 Git·Registry는 사설 DNS와 내부 인증서 또는 LAN 전용 접근을 사용할 수 있다. 같은 도메인을 내외부에서 쓸 경우 split DNS 정책을 기록한다.

동적 IP라면 DDNS 갱신 작업을 자체 VM에서 실행하고 DNS 공급자 API token은 해당 레코드 수정 권한만 부여한다. TTL을 낮추는 것은 DNS 캐시 갱신 보장이나 무중단을 뜻하지 않는다.

Windows 확인:

```powershell
Resolve-DnsName <API_HOST>
Test-NetConnection <SERVICE_VM_IP> -Port 443
```

AAAA 레코드는 실제 IPv6 공개가 검증된 경우에만 둔다. 잘못된 AAAA 때문에 일부 사용자만 접속 실패할 수 있다.

## 4. 공유기 포트 전달

브리지 VM 기준:

- WAN TCP 80 → `<SERVICE_VM_IP>` TCP 80: HTTP-01 인증서 발급과 HTTPS redirect
- WAN TCP 443 → `<SERVICE_VM_IP>` TCP 443: 앱 API
- 5432, 6443, 10250, 8472, CI UI, Registry, SSH는 WAN에 전달하지 않는다.

PC IP가 아니라 Ingress가 실행되는 VM IP로 전달한다. NAT형 VM이면 Windows의 추가 전달 경로가 필요하므로 둘을 혼동하지 않는다. 공유기 DMZ 전체 공개와 UPnP 자동 개방은 사용하지 않는 구성을 우선한다.

K3s Traefik·ServiceLB가 80/443을 처리하는지 먼저 확인한다.

```bash
kubectl -n kube-system get svc,pods -o wide
kubectl get ingressclass
```

초기에 단일 노드로 진행하고 MetalLB를 무조건 함께 설치하지 않는다. ServiceLB와 역할·포트 충돌을 먼저 검토한다.

## 5. 인증서 발급 설계

권장: cert-manager와 ACME. cert-manager 버전은 K3s 호환성을 확인한 뒤 고정한다. 설치 방법은 공식 Helm/manifest 중 하나만 선택하고 적용한 버전을 기록한다.

1. cert-manager 설치 후 controller·webhook·cainjector Ready 확인.
2. ACME staging ClusterIssuer를 먼저 작성.
3. 실제 도메인과 Traefik ingressClassName으로 HTTP-01 challenge 구성.
4. staging 인증서는 일반 휴대폰에서 신뢰되지 않는 것이 정상이다. 앱의 TLS 검증을 끄지 않는다.
5. challenge 경로 외부 접근과 발급 성공 확인.
6. production issuer로 전환해 정상 신뢰 인증서 발급.
7. 만료·자동 갱신 경보 설정.

Issuer 예시의 email·이름은 실행 시 채운다.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    email: <OPERATOR_EMAIL>
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-staging-account
    solvers:
      - http01:
          ingress:
            ingressClassName: traefik
```

HTTP-01은 외부 80 접근이 필요하다. 포트 80이 불가하면 DNS-01을 검토한다. DNS-01은 DNS 소유권 검증 방식일 뿐 API를 외부에서 접근 가능하게 만들어 주지 않는다.

## 6. API Ingress

아래는 production Secret·issuer가 준비된 이후의 예시다. API Service는 port 80 → container 4000 구조다.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: seraph-api
  namespace: seraph-prod
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - <API_HOST>
      secretName: seraph-api-tls
  rules:
    - host: <API_HOST>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: seraph-api
                port:
                  number: 80
```

Ingress를 적용하기 전에 관리 API가 같은 호스트로 공개되지 않도록 인증·경로 정책을 구현한다. HTTP→HTTPS redirect는 사용 중인 Traefik 버전에 맞는 middleware/entrypoint 설정으로 추가하고 ACME 경로를 방해하지 않는지 확인한다.

```bash
kubectl -n seraph-prod get ingress,certificate
kubectl -n seraph-prod get certificaterequest,order,challenge
kubectl -n cert-manager logs deployment/cert-manager --tail=100
```

## 7. 공개 검증

1. VM 내부에서 Service 연결 확인.
2. LAN에서 도메인·Host header·HTTPS 확인.
3. 휴대폰 와이파이를 끄고 LTE/5G에서 도메인 접속.
4. 인증서 host·체인·만료일 확인. curl의 `-k`로 통과시킨 것을 성공으로 기록하지 않음.
5. `/live`, 공개 검색, 질문 API 확인.
6. 관리 API와 DB·Kubernetes 관리 포트 접근 차단 확인.
7. 공유기 재부팅·공인 IP 변경 후 DNS 복구 절차 점검.

내부에서만 실패하면 NAT loopback 미지원 또는 split DNS 문제일 수 있다. 외부 LTE 검사와 구분한다. 인증서 발급 중 404는 Ingress host/class·challenge path 충돌을 확인한다.

## 완료 조건

- [ ] 공인 IP·상위 NAT 확인
- [ ] 실제 DNS A/AAAA 정책 기록
- [ ] 필요한 80/443만 포워딩
- [ ] 신뢰되는 production 인증서·갱신 확인
- [ ] LTE/5G 실기기 성공
- [ ] 내부 관리 서비스는 외부 차단

참고: [K3s 네트워크](https://docs.k3s.io/networking/networking-services), [cert-manager HTTP-01](https://cert-manager.io/docs/configuration/acme/http01/), [ACME](https://cert-manager.io/docs/configuration/acme/).
