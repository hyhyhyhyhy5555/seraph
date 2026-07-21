# Seraph Database

## Core Tables

- `categories`: 최대 3단계 카테고리 트리입니다. 예: `가전 > 세탁기`.
- `manufacturers`: 제조사 정보입니다. 제조사는 카테고리가 아니라 독립 테이블로 둡니다.
- `manuals`: 설명서 메타데이터입니다. 제목, 모델명, 제조사, 원문 링크, PDF 링크, 권리 상태를 저장합니다.
- `manual_pages`: PDF에서 추출한 페이지별 텍스트입니다.
- `manual_chunks`: RAG 검색용 청크입니다. `embedding double precision[]`을 저장합니다.
- `chat_sessions`, `chat_messages`: 설명서 채팅 기록입니다.
- `contact_requests`: 문의하기 요청입니다.
- `manual_requests`: 사용자가 찾지 못한 설명서 요청입니다.
- `source_sites`: Manuall 같은 외부 데이터 출처와 권리/수집 정책입니다. 권한 문서나 라이선스 URL도 여기에 남깁니다.
- `source_categories`: 외부 사이트에서 발견한 카테고리 후보입니다. `category_kind`로 대분류, 제품군, 제조사형 노드를 구분합니다.
- `category_source_mappings`: 외부 카테고리와 세라프 내부 카테고리의 매핑입니다.
- `manual_import_candidates`: 외부 사이트에서 발견한 설명서 후보 메타데이터입니다.
- `import_jobs`: 카테고리 발견, 설명서 후보 발견, PDF 텍스트 수집 같은 작업 이력입니다.

## Why Manufacturer Is Separate

제조사는 하나의 제품군에만 속하지 않습니다. 예를 들어 삼성은 세탁기, 스마트폰, TV에 모두 등장합니다. 그래서 제조사를 세부분류 카테고리로 고정하지 않고 `manufacturers` 테이블로 분리하고, `manuals.manufacturer_id`로 연결합니다.

## RAG Flow

1. PDF 또는 텍스트를 `manuals`에 등록합니다.
2. 페이지별 원문을 `manual_pages`에 저장합니다.
3. 검색 가능한 단위로 쪼갠 텍스트를 `manual_chunks.content`에 저장합니다.
4. 임베딩을 생성해 `manual_chunks.embedding`에 배열로 저장합니다.
5. `match_manual_chunks(query_embedding, match_count, manual_filter)` 함수로 유사 청크를 찾습니다.

현재 로컬 구성은 표준 PostgreSQL만으로 바로 실행되도록 배열 기반 cosine similarity를 사용합니다. 운영 단계에서 대량 벡터 검색 성능이 필요해지면 `pgvector` 컬럼과 HNSW 인덱스로 별도 마이그레이션을 추가하면 됩니다.

## External Source Policy

Manuall 같은 제3자 사이트는 기본적으로 `metadata_only`로 취급합니다. 카테고리 후보, 설명서 제목, 원문 URL, PDF URL 같은 메타데이터를 후보로 관리할 수는 있지만, PDF 파일 다운로드, 텍스트 추출, RAG 청크 저장은 `rights_status`가 `allowed` 또는 `licensed`로 확인된 뒤에만 진행합니다.

권리 상태 기준:

- `needs_permission`: 기본값. 아직 수집/저장 권한이 확인되지 않았습니다.
- `allowed`: 공식적으로 허용된 공개/공식 소스입니다.
- `licensed`: 제휴나 계약으로 허가된 소스입니다.
- `blocked`: 수집하면 안 되는 소스입니다.

현재 `Manuall KR`은 `metadata_only` 및 `needs_permission`으로 시드됩니다.

직접 접근이 Cloudflare challenge 또는 403으로 막히면 해당 수집은 실패가 아니라 `blocked` 작업으로 기록합니다. 이 상태에서는 우회 수집 대신 권한 있는 데이터 제공 방식, 제휴, 공식 API, 또는 사용자가 직접 제공한 파일 업로드 흐름으로 넘어가야 합니다.

## Import Modes

- `metadata_only`: 제목, 제조사, 모델명, 원문 URL, PDF URL 같은 후보 메타데이터만 저장합니다.
- `full_text`: PDF 저장, 페이지 텍스트 추출, RAG 청크 생성을 진행할 수 있는 상태입니다. 출처 권한이 `allowed` 또는 `licensed`로 확인된 뒤에만 사용합니다.

허가받은 파일 export는 `manual_import_candidates`에 먼저 넣고, 이후 별도 PDF/text ingestion 단계에서 `manuals`, `manual_pages`, `manual_chunks`로 승격합니다.
