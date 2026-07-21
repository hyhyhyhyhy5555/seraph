# 세라프

대한민국 전자기기 설명서를 검색하고, 이후 RAG 기반 채팅으로 질문에 답하는 Expo 앱입니다.

## 실행

```bash
npm install
npm run start
```

## 현재 포함 범위

- 검색 탭: 대분류, 소분류, 세부분류/제조사 탐색 및 샘플 설명서 검색
- 채팅 탭: RAG 연결 전 기본 채팅 UI
- 메뉴 탭: 설정, 문의하기, 약관 항목
- 백엔드: Express API 서버, PostgreSQL 스키마, 샘플 시드, 더미 RAG 검색

## 백엔드 실행

```bash
npm run db:start
npm run backend:dev
```

PostgreSQL 기본 접속 정보는 database/user/password 모두 `seraph`입니다.

더미 RAG 질문 테스트:

```bash
curl -sS -X POST http://localhost:4000/api/chat/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"삼성 세탁기 4C 오류는 어떻게 해결해?"}'
```

## Manuall 데이터 수집 방침

Manuall 전체 PDF/텍스트를 우리 DB에 바로 복제하지 않습니다. 현재는 외부 소스 관리 테이블을 두고 `Manuall KR`을 `metadata_only`, `needs_permission` 상태로 등록합니다.

허가 전 가능:

- 출처 사이트 등록
- 카테고리 후보 저장
- 내부 카테고리와 외부 카테고리 매핑
- 설명서 후보 URL 관리
- 수집 작업 이력 및 차단 사유 기록

허가 후 가능:

- PDF 링크 저장
- PDF 파일 저장
- PDF 텍스트 추출
- RAG 청크/임베딩 생성

현재 Manuall은 `metadata_only`, `needs_permission`으로 관리합니다. 서버 측 직접 접근은 Cloudflare/403으로 막힐 수 있으며, 이 경우 `import_jobs.status = blocked`로 기록합니다.
