# Seraph 백엔드 API 레퍼런스

이 문서는 Seraph 백엔드 시스템의 API 엔드포인트에 대한 레퍼런스를 제공합니다.

## 시스템 구성
- **엔트리포인트**: `backend/src/server.ts`
- **환경**: Express 5 + TypeScript, 포트 4000
- **미들웨어**: `express.json` (최대 1MB), CORS, trust proxy
- **에러 핸들링**: 
  - Zod 검증 에러: `400 Bad Request`
  - 일반 서버 에러: `500 Internal Server Error`
- **Graceful Shutdown**: `SIGINT` / `SIGTERM` 수신 시 10초 타임아웃 적용 및 DB 커넥션 풀 정리

---

## 1. 시스템 (System)

### Liveness 체크
서버의 구동 여부를 확인합니다.
- **메서드/경로**: `GET /live`
- **응답 예시**:
  ```json
  {
    "ok": true,
    "service": "seraph-backend"
  }
  ```

### 헬스체크
서버 및 데이터베이스 연결 상태를 확인합니다.
- **메서드/경로**: `GET /health`
- **응답 예시**:
  ```json
  {
    "ok": true,
    "service": "seraph-backend",
    "db": "connected",
    "latencyMs": 15
  }
  ```

---

## 2. 카테고리 (Categories)

### 카테고리 목록 조회
계층적 카테고리 트리와 각 카테고리별 설명서 개수를 조회합니다.
- **메서드/경로**: `GET /api/categories`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "cat_123",
        "name": "가전제품",
        "depth": 1,
        "manualCount": 150,
        "children": [
          {
            "id": "cat_456",
            "name": "TV",
            "depth": 2,
            "manualCount": 50,
            "children": []
          }
        ]
      }
    ]
  }
  ```

---

## 3. 제조사 (Manufacturers)

### 제조사 목록 조회
제조사 목록과 각 제조사별 설명서 개수를 조회합니다.
- **메서드/경로**: `GET /api/manufacturers`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "mfg_123",
        "name": "삼성전자",
        "slug": "samsung",
        "countryCode": "KR",
        "websiteUrl": "https://www.samsung.com",
        "manualCount": 300
      }
    ]
  }
  ```

---

## 4. 설명서 (Manuals)

### 설명서 목록 조회
전문 검색 및 필터링(카테고리, 제조사)을 통해 설명서 목록을 조회합니다.
- **메서드/경로**: `GET /api/manuals`
- **쿼리 파라미터**:
  - `q`: 검색어 (선택)
  - `categoryId`: 카테고리 ID (재귀적 검색, 선택)
  - `manufacturerId`: 제조사 ID (선택)
  - `limit`: 응답 개수 제한 (선택)
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "man_123",
        "title": "스마트 TV 사용 설명서",
        "manufacturerId": "mfg_123",
        "categoryId": "cat_456"
      }
    ]
  }
  ```

### 설명서 상세 조회
특정 설명서의 메타데이터, 버전(리비전), 페이지, RAG 청크 정보를 조회합니다.
- **메서드/경로**: `GET /api/manuals/:id`
- **응답 예시**:
  ```json
  {
    "data": {
      "id": "man_123",
      "title": "스마트 TV 사용 설명서",
      "revisions": [
        { "id": "rev_1", "version": "1.0" }
      ],
      "pages": [
        { "pageNumber": 1, "content": "..." }
      ],
      "chunks": [
        { "id": "chk_1", "content": "..." }
      ]
    }
  }
  ```

---

## 5. 외부 소스 (External Sources)

### 소스 사이트 목록 조회
소스 사이트 목록과 최근 작업 상태 등을 조회합니다.
- **메서드/경로**: `GET /api/source-sites`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "src_123",
        "name": "매뉴얼라이브러리",
        "categoryCount": 10,
        "candidateCount": 500,
        "lastSyncStatus": "success"
      }
    ]
  }
  ```

### 소스 사이트 카테고리 트리 조회
특정 소스 사이트의 카테고리 트리와 내부 매핑 상태를 조회합니다.
- **메서드/경로**: `GET /api/source-sites/:id/categories`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "scat_123",
        "name": "Home Appliances",
        "mappedCategoryId": "cat_123",
        "children": []
      }
    ]
  }
  ```

### 권한 변경 이력 조회
소스 사이트의 권한 변경 이력을 조회합니다.
- **메서드/경로**: `GET /api/source-sites/:id/rights-events`
- **쿼리 파라미터**: `limit` (기본값 50)
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "evt_123",
        "type": "rights_updated",
        "createdAt": "2026-08-11T17:00:00Z"
      }
    ]
  }
  ```

### 권한 및 수집 정책 변경
소스 사이트의 권한 상태 및 수집 정책을 업데이트합니다. (`allowed` 또는 `licensed` 상태 변경 시 증빙 URL 필수)
- **메서드/경로**: `PATCH /api/source-sites/:id/rights`
- **요청 바디 예시**:
  ```json
  {
    "rightsStatus": "allowed",
    "importPolicy": "auto",
    "licenseUrl": "https://example.com/license",
    "permissionDocumentUrl": "https://example.com/doc",
    "permissionCheckedBy": "admin_1",
    "notes": "이메일로 허가 받음",
    "reason": "신규 권한 취득"
  }
  ```
- **응답 예시**:
  ```json
  {
    "ok": true
  }
  ```

---

## 6. 수집 작업 (Import Jobs)

### 수집 작업 이력 조회
- **메서드/경로**: `GET /api/import-jobs`
- **쿼리 파라미터**: `sourceSiteId`, `status`, `jobType`, `limit`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "job_123",
        "sourceSiteId": "src_123",
        "jobType": "sync",
        "status": "completed",
        "createdAt": "2026-08-11T12:00:00Z"
      }
    ]
  }
  ```

### 설명서 후보 목록 조회 및 검색
- **메서드/경로**: `GET /api/manual-import-candidates`
- **쿼리 파라미터**: `sourceSiteId`, `status`, `q`, `limit`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "cand_123",
        "sourceSiteId": "src_123",
        "title": "세탁기 설명서 PDF",
        "status": "pending"
      }
    ]
  }
  ```

---

## 7. 사용자 요청 (User Requests)

### 문의사항 등록
- **메서드/경로**: `POST /api/contact-requests`
- **요청 바디 예시**:
  ```json
  {
    "email": "user@example.com",
    "subject": "서비스 문의",
    "message": "로그인이 안 됩니다."
  }
  ```
- **응답 (201 Created)**:
  ```json
  {
    "ok": true,
    "id": "req_123"
  }
  ```

### 설명서 요청
- **메서드/경로**: `POST /api/manual-requests`
- **요청 바디 예시**:
  ```json
  {
    "productName": "에어컨 모델 X",
    "manufacturerName": "삼성전자",
    "modelName": "AX-1000",
    "requesterEmail": "user@example.com",
    "note": "영문 버전도 괜찮습니다."
  }
  ```
- **응답 (201 Created)**:
  ```json
  {
    "ok": true,
    "id": "mreq_123"
  }
  ```

---

## 8. 채팅 및 RAG (Chat & RAG)

### 채팅 세션 생성
- **메서드/경로**: `POST /api/chat/sessions`
- **요청 바디 예시**:
  ```json
  {
    "title": "세탁기 고장 문의",
    "clientId": "client_123"
  }
  ```
- **응답 (201 Created)**:
  ```json
  {
    "ok": true,
    "id": "sess_123"
  }
  ```

### 세션 메시지 이력 조회
- **메서드/경로**: `GET /api/chat/sessions/:id/messages`
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "전원이 안 켜져요."
      },
      {
        "id": "msg_2",
        "role": "assistant",
        "content": "플러그를 확인해주세요.",
        "citations": []
      }
    ]
  }
  ```

### 메시지 수동 추가
- **메서드/경로**: `POST /api/chat/sessions/:id/messages`
- **요청 바디 예시**:
  ```json
  {
    "role": "user",
    "content": "버튼이 안 눌려요.",
    "citations": []
  }
  ```
- **응답 (201 Created)**:
  ```json
  {
    "ok": true,
    "id": "msg_3"
  }
  ```

### RAG 청크 검색
- **메서드/경로**: `POST /api/rag/search`
- **요청 바디 예시**:
  ```json
  {
    "question": "에러 코드 E2 의미가 뭐야?",
    "limit": 5,
    "manualId": "man_123",
    "revisionId": "rev_1"
  }
  ```
- **응답 예시**:
  ```json
  {
    "data": [
      {
        "chunkId": "chk_1",
        "content": "E2 에러는 배수 펌프 이상을 의미합니다.",
        "score": 0.89
      }
    ]
  }
  ```

### RAG 질문-답변 (Chat API)
세션 자동 생성, 근거 검색, 답변 생성 및 메시지 저장을 통합 처리합니다.
- **메서드/경로**: `POST /api/chat/ask`
- **요청 바디 예시**:
  ```json
  {
    "sessionId": "sess_123", 
    "question": "필터 청소는 어떻게 하나요?",
    "clientId": "client_123",
    "manualId": "man_123",
    "revisionId": "rev_1"
  }
  ```
- **응답 예시**:
  ```json
  {
    "answer": "필터는 물로 씻어서 그늘에 말려주세요.",
    "sessionId": "sess_123",
    "citations": [
      {
        "chunkId": "chk_2",
        "content": "필터 청소 방법: 물로 세척 후 그늘 건조"
      }
    ]
  }
  ```
