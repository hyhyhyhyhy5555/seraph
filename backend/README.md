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

`docker-compose.yml`은 로컬에 바로 실행 가능한 `postgres:17` 이미지를 사용합니다. RAG 검색을 위해 `manual_chunks.embedding double precision[]` 컬럼과 `match_manual_chunks` 함수를 포함합니다.

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

현재 `/api/chat/ask`는 LLM 없이 동작하는 1차 RAG입니다.

1. 질문에서 검색어를 추출합니다.
2. `manual_chunks.content`, 설명서 제목, 모델명, 제조사, 카테고리를 키워드로 점수화합니다.
3. 가장 관련 높은 청크를 답변 본문으로 사용합니다.
4. 출처는 `citations`에 설명서, 제조사, 페이지, PDF 링크 형태로 반환합니다.

OpenAI 임베딩/답변 생성을 붙일 때는 `retrieveRagEvidence` 결과를 LLM context로 넘기면 됩니다.

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
