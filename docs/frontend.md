# 프론트엔드 구조 (Frontend Architecture)

본 문서는 프로젝트의 프론트엔드 아키텍처 및 폴더 구조, 공통 UI 컴포넌트, 주요 기능(Feature) 모듈에 대해 설명합니다.

## 1. 앱 라우팅 구조 (App Routing)
Expo Router 기반의 파일 시스템 라우팅을 사용하고 있습니다.

- **`app/_layout.tsx`**: 루트 Stack 레이아웃입니다. StatusBar(`dark-content`), 헤더 숨김 처리, `GestureHandlerRootView`가 적용되어 있습니다.
- **`app/(tabs)/_layout.tsx`**: 하단 3개의 탭(검색, AI 채팅, 메뉴)을 관리합니다.
  - **`app/(tabs)/index.tsx`** → `SearchScreen` (검색 화면)
  - **`app/(tabs)/chat.tsx`** → `ChatScreen` (AI 채팅 화면)
  - **`app/(tabs)/menu.tsx`** → `MenuScreen` (메뉴 화면)

## 2. 디자인 시스템 및 테마 (Theme)
`src/theme/` 디렉터리에 전역 디자인 토큰 및 색상 팔레트가 정의되어 있습니다.

- **Colors (`colors.ts`)**
  - Background: `#F3F6FA`
  - Surface: `#FFFFFF`
  - Primary: `#1D5F99`
  - Text: `#142536`
  - 기타: TextSecondary, Border, Success, Danger, Warning 등
- **Tokens (`tokens.ts`)**
  - **Spacing**: `xxs` ~ `xxxl`
  - **Radii**: `xxs` ~ `pill`
  - **Typography**: `display` ~ `caption`
  - **Sizes**: `touchTarget` (44px), `contentMaxWidth` (760px)
  - **Shadows**: 플랫폼별(iOS, Android) 그림자 스타일링 적용

## 3. 공통 UI 컴포넌트 (UI Components)
`src/components/ui/`에 위치한 앱 전역에서 재사용되는 컴포넌트입니다.

### 3.1. Text
- **역할**: 앱 전역 타이포그래피 적용
- **Props**: `variant` ('display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption')
- **사용 예시**:
  ```tsx
  <Text variant="title">화면 제목</Text>
  <Text variant="body">일반 텍스트 본문입니다.</Text>
  ```

### 3.2. Button
- **역할**: 공통 동작 버튼
- **Props**: `variant` ('primary' | 'secondary' | 'ghost' | 'link'), `size` ('sm' | 'md' | 'lg'), `loading` (boolean)
- **사용 예시**:
  ```tsx
  <Button variant="primary" size="lg" onPress={onSubmit} loading={isLoading}>
    제출하기
  </Button>
  ```

### 3.3. IconButton
- **역할**: 아이콘 터치 전용 버튼 (접근성 라벨 필수)
- **Props**: `icon`, `variant` ('plain' | 'soft' | 'primary'), `accessibilityLabel`
- **사용 예시**:
  ```tsx
  <IconButton icon="close" variant="plain" accessibilityLabel="닫기" onPress={onClose} />
  ```

### 3.4. Card
- **역할**: 컨테이너 목적의 카드 뷰
- **Props**: `variant` ('outlined' | 'elevated' | 'tinted')
- **사용 예시**:
  ```tsx
  <Card variant="elevated">
    <Text>카드 내용</Text>
  </Card>
  ```

### 3.5. Chip
- **역할**: 필터 또는 브레드크럼(경로)용 칩
- **Props**: `label`, `active` (boolean)
- **사용 예시**:
  ```tsx
  <Chip label="삼성전자" active={true} onPress={onSelect} />
  ```

### 3.6. Badge
- **역할**: 상태 태그 및 뱃지
- **Props**: `label`, `tone` ('accent' | 'neutral' | 'success' | 'warning')
- **사용 예시**:
  ```tsx
  <Badge label="업데이트 완료" tone="success" />
  ```

### 3.7. TextField
- **역할**: 텍스트 입력 폼
- **Props**: focus/error/disabled 상태 지원, `multiline`, `endAdornment`
- **사용 예시**:
  ```tsx
  <TextField placeholder="질문을 입력하세요" multiline />
  ```

### 3.8. Screen
- **역할**: 화면 최상위 컨테이너 (`SafeAreaView` 기반, max-width 760px)
- **Props**: `scroll` (boolean)
- **사용 예시**:
  ```tsx
  <Screen scroll>
    {/* 화면 내용 */}
  </Screen>
  ```

### 3.9. ScreenHeader
- **역할**: 화면 상단 헤더
- **Props**: `eyebrow`, `title`, `description`, `icon`, `action`
- **사용 예시**:
  ```tsx
  <ScreenHeader title="설정" description="앱 환경을 설정합니다." />
  ```

### 3.10. SectionHeader
- **역할**: 섹션 구분용 헤더
- **Props**: `title`, `count` (Badge로 표시됨), `action`
- **사용 예시**:
  ```tsx
  <SectionHeader title="검색 결과" count={12} />
  ```

### 3.11. EmptyState
- **역할**: 데이터가 없을 때 보여주는 빈 상태 뷰 (점선 아웃라인 스타일)
- **Props**: `icon`, `title`, `description`
- **사용 예시**:
  ```tsx
  <EmptyState icon="search-outline" title="결과 없음" description="다른 검색어를 입력해보세요." />
  ```

### 3.12. Icon
- **역할**: `Ionicons` 래퍼 (디자인 토큰 컬러/크기 매핑)
- **Props**: `name`, `size`, `color`
- **사용 예시**:
  ```tsx
  <Icon name="home" size={24} color="primary" />
  ```

---

## 4. 도메인별 기능 모듈 (Features)

### 4.1. Search (`src/features/search/`)
- **`CategoryGrid.tsx`**: 대/중/소분류를 표시하는 2열 그리드 카테고리 카드 리스트입니다.
- **`SearchPath.tsx`**: 검색 탐색 경로를 나타내는 브레드크럼 (Chip과 화살표 조합).
- **`ManualList.tsx`**: 설명서 목록 카드. (카테고리 경로, 제품명, 제조사 뱃지, PDF 링크 포함)

### 4.2. Chat (`src/features/chat/`)
- **`types.ts`**: `ChatMessage` 타입 정의 (`id`, `role`, `text`, `citations`).
- **`ChatComposer.tsx`**: 하단 질문 입력 영역. (Multiline `TextInput` + 전송 버튼)
- **`ChatMessageList.tsx`**: 메시지 버블 리스트. 사용자/AI 스타일 분리, 출처 카드 및 PDF 링크 기능 포함.

### 4.3. Menu (`src/features/menu/`)
- **`MenuComponents.tsx`**:
  - `AppSummaryCard`: 서비스 버전 및 상태 정보 표시.
  - `MenuList`: 설정, 문의, 약관 등 하위 메뉴 리스트를 렌더링.

---

## 5. 라이브러리 및 데이터 (Lib & Data)

### 5.1. API 클라이언트 (`src/lib/api.ts`)
- `EXPO_PUBLIC_API_URL` 환경변수를 기반으로 한 API 클라이언트.
- 주요 기능: `askManualQuestion()` 메서드를 통해 `POST /api/chat/ask` API를 호출.

### 5.2. 정적 데이터 카탈로그 (`src/data/manualCatalog.ts`)
- 타입 정의: `Manual`, `DetailCategory`, `SubCategory`, `MajorCategory`
- 정적 카탈로그 데이터: 4대 대분류 (가전/디지털/TV음향/컴퓨터) 데이터를 제공.
- 유틸리티 함수: `findManualById()`, `searchManuals()` 등을 통해 로컬 데이터 검색 지원.
