# 프로젝트 이름: 세라프 (Seraph)

## 프로젝트 요약
- 대한민국 전자기기 설명서(매뉴얼)를 수집·정리하고, RAG(Retrieval-Augmented Generation) 기반 AI 채팅으로 사용자 질문에 답하는 서비스
- Expo React Native 모바일/웹 프론트엔드 + Express 백엔드 + PostgreSQL(pgvector)

## 1. 프로젝트 소개
세라프는 대한민국 전자기기(가전, 디지털 기기 등)의 사용 설명서를 체계적으로 수집·관리하고, RAG 기반 AI 채팅을 통해 사용자가 자연어로 질문하면 설명서 근거와 함께 답변을 제공하는 서비스입니다.

## 2. 주요 기능
- 📱 **설명서 검색**: 대분류 > 소분류 > 제조사 계층형 카테고리 탐색, 키워드 검색
- 💬 **AI 채팅 (RAG)**: 설명서 기반 자연어 질문-답변, 근거 페이지 및 PDF 원문 링크 제공
- 📋 **서비스 메뉴**: 알림 설정, 문의하기, 이용약관
- 🗄️ **데이터 수집 파이프라인**: 외부 소스(Manuall 등) 카테고리·설명서 후보 수집, PDF 텍스트 추출, 시맨틱 청킹, 임베딩 생성
- 🔍 **하이브리드 검색**: pgvector 벡터 유사도 + PostgreSQL 전문 검색 → RRF 통합 랭킹
- 📊 **데이터 거버넌스**: 외부 소스별 권한 관리, 수집 이력 추적

## 3. 기술 스택
| 구분 | 기술 |
| --- | --- |
| 프론트엔드 | Expo (SDK 57), React Native 0.86, Expo Router, TypeScript |
| 백엔드 | Express 5, TypeScript 6, Node.js 22 |
| 데이터베이스 | PostgreSQL 17, pgvector (HNSW), pg_trgm |
| AI/ML | OpenAI text-embedding-3-large (1024차원), GPT-4o-mini |
| 인프라 | Docker, Docker Compose, GitHub Actions, EAS |
| 주요 라이브러리 | Zod, js-tiktoken, pg, react-native-reanimated |

## 4. 프로젝트 구조
```
seraph_rn/
├── app/                  # Expo Router 페이지 (파일 기반 라우팅)
│   ├── _layout.tsx       # 루트 Stack 레이아웃
│   └── (tabs)/           # 하단 탭 네비게이터
│       ├── _layout.tsx   # 탭 레이아웃 (검색, AI 채팅, 메뉴)
│       ├── index.tsx     # 검색 탭
│       ├── chat.tsx      # AI 채팅 탭
│       └── menu.tsx      # 메뉴 탭
├── src/                  # 프론트엔드 소스
│   ├── components/ui/    # 공통 UI 컴포넌트 (Text, Button, Card 등 11개)
│   ├── features/         # 기능 모듈 (search, chat, menu)
│   ├── lib/              # API 클라이언트
│   ├── theme/            # 디자인 토큰 (colors, tokens)
│   └── data/             # 정적 카탈로그 데이터
├── backend/              # Express 백엔드
│   └── src/
│       ├── server.ts     # 엔트리포인트
│       ├── routes/       # API 라우트
│       ├── services/     # 비즈니스 로직 (RAG, 임베딩, 검색)
│       └── importers/    # 데이터 수집 스크립트
├── db/                   # 데이터베이스
│   └── migrations/       # SQL 마이그레이션 (001~009)
├── docs/                 # 프로젝트 문서
├── .github/              # CI/CD 워크플로우
└── docker-compose.yml    # 로컬 개발 환경
```

## 5. 문서 목록
- [아키텍처](./architecture.md) - 시스템 아키텍처 및 데이터 흐름
- [프론트엔드](./frontend.md) - 프론트엔드 구조 및 컴포넌트
- [백엔드 API](./backend-api.md) - API 엔드포인트 레퍼런스
- [데이터베이스](./database.md) - 스키마, 마이그레이션, 인덱스
- [RAG 파이프라인](./rag-pipeline.md) - RAG 검색 및 답변 생성 흐름
- [데이터 수집](./data-ingestion.md) - 데이터 수집 파이프라인 및 거버넌스
- [배포](./deployment.md) - 배포 환경 및 CI/CD (기존 문서)

## 6. 빠른 시작 (Quick Start)
```bash
# 의존성 설치
npm install

# DB 시작 (Docker)
npm run db:start

# 백엔드 실행
npm run backend:dev

# 앱 실행
npm run start
```

## 7. 환경 변수
세부 설정은 `.env.example` 파일을 참조하세요.
