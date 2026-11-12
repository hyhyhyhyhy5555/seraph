# Seraph Backend

PostgreSQL 기반 세라프 API 서버입니다.

## Local Database

```bash
npm run db:start
```

기본 접속 정보:

- database: `seraph`
- user: `seraph`
- password: `seraph`
- host: `localhost`
- port: `5432`

`docker-compose.yml`은 PostgreSQL 17과 pgvector가 포함된 이미지를 사용합니다. RAG 검색을 위해 `manual_chunks.embedding vector(1024)`, cosine HNSW 인덱스와 `match_manual_chunks` 함수를 포함합니다.

기존 볼륨에 새 마이그레이션을 적용할 때:

```bash
docker compose exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U seraph -d seraph \
  < db/migrations/009_manual_revisions_and_vector_search.sql
```

## API Server

```bash
npm run backend:dev
```

기본 URL은 `http://localhost:4000`입니다.

## Main Endpoints

- `GET /health`
- `GET /api/categories`
- `GET /api/manufacturers`
- `GET /api/source-sites`
- `GET /api/source-sites/:id/categories`
- `GET /api/source-sites/:id/rights-events`
- `PATCH /api/source-sites/:id/rights`
- `GET /api/import-jobs`
- `GET /api/manual-import-candidates`
- `GET /api/manuals?q=삼성`
- `GET /api/manuals/:id`
- `POST /api/rag/search`
- `POST /api/contact-requests`
- `POST /api/manual-requests`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:id/messages`
- `POST /api/chat/sessions/:id/messages`
- `POST /api/chat/ask`

## Current RAG Behavior

현재 `/api/chat/ask`는 검색된 설명서 청크만 컨텍스트로 Gemini 답변을 생성하며, 키가 없거나 생성 호출이 실패하면 검색 근거 원문 응답으로 폴백합니다.

1. `GEMINI_API_KEY`가 있으면 질문을 같은 Gemini 모델/차원으로 임베딩합니다.
2. pgvector cosine 검색과 키워드 검색을 각각 수행합니다.
3. Reciprocal Rank Fusion으로 두 결과를 결합합니다.
4. `manualId` 또는 `revisionId`가 전달되면 해당 설명서 버전으로 제한합니다.
5. 출처는 설명서 revision, 제조사, 페이지, PDF 링크 형태로 반환합니다.

API 키가 없거나 임베딩 호출이 실패하면 기존 키워드 검색으로 폴백합니다. 답변 생성 모델을 추가할 때는 `retrieveRagEvidence` 결과를 context로 넘기면 됩니다.

## Manuall Importer

```bash
npm run import:manuall:categories:dry
npm run import:manuall:categories
```

이 importer는 기본적으로 Manuall의 PDF나 설명서 본문을 저장하지 않습니다. `source_categories`에 카테고리 후보 메타데이터만 넣습니다. 필요하면 특정 범위를 지정할 수 있습니다.

```bash
npm run import:manuall:categories -- --url=https://manuall.kr/household-appliances/
```

PDF 링크, PDF 파일, PDF 텍스트 저장은 별도 단계입니다. `source_sites.rights_status`가 `allowed` 또는 `licensed`로 확인되기 전에는 `manual_pages`와 `manual_chunks`에 Manuall 원문을 넣지 않습니다.

현재 확인 결과, `https://manuall.kr/`은 서버 측 dry-run fetch에 `403` 또는 Cloudflare challenge를 반환할 수 있습니다. 이 경우 importer는 `import_jobs.status = 'blocked'`로 기록합니다.

## Manual Candidate Import

권한을 받은 데이터 export나 제조사 공식 데이터 파일은 JSON 배열 또는 JSONL로 후보 테이블에 넣을 수 있습니다.

```bash
npm run import:manual-candidates -- \
  --source="Manuall KR" \
  --file=/absolute/path/to/candidates.json
```

입력 예시:

```json
[
  {
    "title": "삼성 WW90T3000KW 세탁기 사용 설명서",
    "manufacturerName": "삼성",
    "modelName": "WW90T3000KW",
    "sourceManualUrl": "https://example.com/manuals/samsung-ww90t3000kw",
    "sourcePdfUrl": "https://example.com/manuals/samsung-ww90t3000kw.pdf",
    "sourceCategorySlugPath": "household-appliances/washing-machines",
    "categoryPath": ["가전", "세탁기", "삼성"],
    "rightsStatus": "needs_permission",
    "importMode": "metadata_only"
  }
]
```

`importMode = full_text`는 해당 `source_sites.rights_status`가 `allowed` 또는 `licensed`일 때만 허용됩니다.

## Manual Candidate Promotion

후보로 발견한 설명서는 `manuals`에 메타데이터만 먼저 올릴 수 있습니다. 이 단계는 제목, 제조사, 모델명, 원문 URL, PDF 링크, 내부 카테고리를 등록하고 `manuals.ingestion_status = 'pending'`으로 둡니다.

```bash
npm run import:manual-candidates:promote -- \
  --source="Manuall KR" \
  --limit=100
```

승격 조건:

- `manual_import_candidates.candidate_status = 'discovered'`
- 후보가 연결된 `source_category_id`에 대해 `category_source_mappings.mapping_status = 'confirmed'`
- 후보 권한 상태가 `blocked`가 아님

권한이 `needs_permission`인 후보는 `manuals.rights_status = 'unknown'`으로 들어갑니다. 이 상태에서는 `manual_pages`, `manual_chunks`가 생성되지 않으므로 RAG 답변 근거로 사용되지 않습니다.

## Manual Text Import

권한이 확인된 PDF 텍스트 export나 사용자 제공 텍스트는 실제 RAG 테이블로 적재할 수 있습니다.

```bash
npm run import:manual-text -- \
  --file=/Users/hy/Desktop/seraph_rn/backend/examples/manual-text.sample.json
```

이 명령은 다음 테이블을 갱신합니다.

- `manuals`: 설명서 메타데이터, 원문 URL, PDF URL, 권리 상태
- `manual_pages`: 페이지별 텍스트
- `manual_chunks`: RAG 검색용 청크

Manuall 같은 제3자 출처를 `--source="Manuall KR"`로 지정해 넣으려면 먼저 `source_sites.rights_status`가 `allowed` 또는 `licensed`여야 합니다. 현재 기본값은 `needs_permission`이라 본문 적재가 차단됩니다.

## Manual PDF Import

로컬에 확보한 PDF 파일은 `pdftotext`를 사용해 페이지 텍스트를 추출한 뒤 같은 RAG 테이블로 적재합니다.

PDF importer는 다음을 함께 처리합니다.

- 파일 SHA-256, 크기, PDF 메타데이터 기록
- `manuals`와 `manual_revisions` 분리
- 목차 기반 `manual_sections` 생성
- 표지/목차를 제외한 페이지별 원문 저장
- 절차, 경고, 참고, 문제해결 유형을 보존한 의미 기반 청킹
- 문서/소프트웨어/절 경로가 포함된 임베딩 전용 텍스트 생성

```bash
npm run import:manual-pdf -- \
  --file=/Users/hy/Desktop/seraph_rn/backend/examples/manual-pdf.sample.json
```

입력 예시:

```json
[
  {
    "title": "권한 제공 샘플 PDF 세탁기 설명서",
    "categorySlugPath": "appliances/washer",
    "manufacturerName": "샘플전자",
    "modelName": "SW-2000",
    "sourceUrl": "https://example.com/authorized/manuals/sample-washer-pdf",
    "pdfUrl": "https://example.com/authorized/manuals/sample-washer-pdf.pdf",
    "pdfPath": "/absolute/path/to/manual.pdf",
    "sourceType": "user_upload",
    "rightsStatus": "user_provided"
  }
]
```

전제 조건:

- 로컬에 `pdftotext`가 설치되어 있어야 합니다.
- 원격 PDF URL을 직접 다운로드하지 않습니다. 먼저 권한 있는 방식으로 PDF 파일을 확보한 뒤 `pdfPath`로 넣습니다.
- 제3자 출처를 `--source`로 지정하면 `manual-text`와 같은 권한 게이트를 거칩니다.
- `sourceType = user_upload`, `rightsStatus = user_provided`이면 `sourceUrl` 없이 파일 해시로 중복을 확인할 수 있습니다.

## Embedding Worker

대기 작업 확인:

```bash
npm run embed:manual-chunks -- --dry-run
```

실제 임베딩:

```bash
npm run embed:manual-chunks
```

특정 범위만 처리할 수도 있습니다.

```bash
npm run embed:manual-chunks -- --revision-id={revisionId}
npm run embed:manual-chunks -- --manual-id={manualId} --batch-size=64
```

환경 변수:

- `GEMINI_API_KEY`
- `GEMINI_EMBEDDING_MODEL` (기본값 `gemini-embedding-001`)
- `GEMINI_EMBEDDING_DIMENSIONS` (현재 스키마는 `1024`)
- `GEMINI_GENERATION_MODEL` (기본값 `gemini-3.8-flash`)
- `GEMINI_REQUEST_TIMEOUT_MS` (기본값 `30000`)
- `GEMINI_MAX_OUTPUT_TOKENS` (기본값 `1200`)

## Source Rights Review

제3자 출처의 full text 적재를 열 때는 API로 근거를 남깁니다.

```bash
curl -X PATCH http://localhost:4000/api/source-sites/{sourceSiteId}/rights \
  -H 'Content-Type: application/json' \
  -d '{
    "rightsStatus": "licensed",
    "permissionDocumentUrl": "https://example.com/contracts/manuall-license",
    "permissionCheckedBy": "hy",
    "reason": "Written permission confirmed for PDF text ingestion."
  }'
```

`rightsStatus = allowed` 또는 `licensed`는 `licenseUrl`이나 `permissionDocumentUrl` 없이는 저장되지 않습니다. 변경 이력은 `GET /api/source-sites/:id/rights-events`로 확인합니다.
