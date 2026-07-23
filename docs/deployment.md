# 배포 환경

## 현재 자동화 범위

### CI

`.github/workflows/ci.yml`은 PR, `main` 푸시, 수동 실행에서 다음을 수행합니다.

1. Node.js 22.13.1과 `npm ci`로 동일한 의존성 환경을 구성합니다.
2. 운영 의존성의 high/critical 보안 이슈를 검사합니다.
3. 앱과 백엔드 TypeScript 검사를 실행합니다.
4. Expo 웹 정적 파일과 백엔드 JavaScript를 빌드합니다.
5. 백엔드 Docker 이미지를 빌드해 Dockerfile의 유효성을 확인합니다.
6. 웹·백엔드 빌드 결과를 7일 동안 GitHub Actions artifact로 보관합니다.

### 배포 산출물

`.github/workflows/release-artifacts.yml`은 `v*` 태그 또는 수동 실행에서 다음 artifact를 30일 동안 보관합니다.

- `seraph-web-*`: 정적 웹 호스팅에 올릴 `dist/web`
- `seraph-backend-*`: Node.js 백엔드 빌드와 DB 마이그레이션
- `seraph-backend-container-*`: `docker load`로 불러올 수 있는 압축 Docker 이미지

GitHub 저장소 변수 `EXPO_PUBLIC_API_URL`을 등록하면 배포용 웹 빌드에 실제 백엔드 주소가 포함됩니다. 등록하지 않으면 안전한 placeholder인 `https://api.example.invalid`을 사용합니다.

## 로컬 배포 형태 검증

```bash
docker compose up --build
```

- 백엔드: `http://localhost:4000`
- 생존 확인: `GET http://localhost:4000/live`
- DB 포함 상태 확인: `GET http://localhost:4000/health`
- PostgreSQL: `localhost:5432`

## 백엔드 운영 환경변수

운영 환경에서는 다음 값을 명시해야 합니다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `NODE_ENV` | 예 | `production` |
| `PORT` | 권장 | 기본값 `4000` |
| `DATABASE_URL` | 예 | PostgreSQL 연결 문자열. 개별 PG 변수로 대체 가능 |
| `CORS_ORIGINS` | 예 | 허용할 웹 origin을 쉼표로 구분 |
| `TRUST_PROXY` | 권장 | ALB, Nginx 등 신뢰 프록시 뒤에서는 `true` |

`DATABASE_URL`을 사용하지 않으면 `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`를 모두 지정해야 합니다. 비밀번호와 연결 문자열은 저장소 파일이 아니라 배포 서비스의 secret manager에 저장합니다.

## 클라우드가 정해진 뒤 추가할 작업

### AWS

1. ECR 저장소와 이미지 푸시용 GitHub OIDC 역할을 만듭니다.
2. RDS PostgreSQL과 보안 그룹을 구성합니다.
3. ECS/Fargate 또는 App Runner에 컨테이너를 연결합니다.
4. `DATABASE_URL`과 기타 비밀값을 Secrets Manager 또는 SSM Parameter Store로 주입합니다.
5. ALB/도메인/HTTPS를 연결하고 `CORS_ORIGINS`, `TRUST_PROXY=true`를 설정합니다.
6. release workflow에 ECR 로그인·푸시·서비스 배포 작업을 추가합니다.

장기 액세스 키를 GitHub secret에 저장하지 않고 GitHub OIDC 방식으로 연결하는 것을 기본으로 합니다.

### Expo EAS

`eas.json`에는 내부 테스트용 `preview`와 스토어용 `production` 프로필을 준비했습니다. 네이티브 자동 빌드는 아래 값이 결정된 뒤 활성화합니다.

- Expo 계정과 EAS `projectId`
- iOS `bundleIdentifier`
- Android `package`
- GitHub Actions secret `EXPO_TOKEN`
- Apple/Google 서명 및 스토어 계정

최초 EAS 빌드는 로컬에서 한 번 실행해 프로젝트와 서명 설정을 확정한 뒤 CI에 `eas build --non-interactive` 단계를 추가합니다.
