# LG 가전 사용설명서 수동 수집 도우미 (`tools/manual-helper`)

LG전자 고객지원([매뉴얼/소프트웨어 다운로드](https://www.lge.co.kr/support/product-manuals))의 자동화 접근 제한을 준수하면서, Seraph `1. 가전` 15개 주력 제품군(59개 대표 시리즈)의 한국어 사용설명서 PDF를 가장 빠르고 정확하게 수집하기 위한 로컬 도구입니다.

## 구성 파일

| 경로 | Git 추적 | 역할 |
| --- | :---: | --- |
| `tools/manual-helper/lg-appliance-models.csv` | O | 국내 정식 LG 대표 모델 59건 마스터 리스트 (SSOT, UTF-8 BOM) |
| `tools/manual-helper/lg-manual-helper.html` | O | 서버 없이 브라우저에서 바로 여는 원클릭 복사·진행 추적 도우미 |
| `.local/manuals/lg-inbox/<번호>-<slug>/` | X (`.gitignore`) | 다운로드한 원본 PDF를 이름 변경 없이 보관하는 15개 드롭폴더 |

---

## 빠른 시작

터미널에서 실행하거나 Finder에서 `tools/manual-helper/lg-manual-helper.html`을 더블클릭해 브라우저로 엽니다.

```bash
open tools/manual-helper/lg-manual-helper.html
```

---

## 작업 절차 (4단계)

1. **LG 매뉴얼 페이지 열기**
   - 도우미 우측 상단의 **LG 매뉴얼 다운로드 열기 ↗** 버튼을 눌러 `lge.co.kr` 페이지를 옆 탭(또는 분할 화면)에 둡니다.
2. **카테고리 단위 작업**
   - 도우미 상단 칩에서 작업할 카테고리를 하나 선택합니다. (LG 사이트의 카테고리 `변경` 클릭을 최소화하도록 LG 경로 순으로 묶여 있습니다.)
   - 그룹 헤더의 **📁 폴더 경로 복사** 버튼을 한 번 눌러 둡니다. (`file://`로 연 경우 로컬 절대 경로가 자동 생성됩니다.)
3. **모델명 복사 → 검색 → 다운로드**
   - 각 행의 **주 모델명** 버튼을 클릭하면 마침표(`.`) 앞 순수 모델명이 클립보드에 복사됩니다.
   - `lge.co.kr` 모델명 입력창에 붙여넣고 검색합니다.
   - 검색 결과가 없으면 **대체코드** → **접두어(자동완성 선택)** 순서로 시도합니다.
   - PDF 저장 창이 뜨면 **원본 파일명(`MFL71892301.pdf` 등)을 바꾸지 말고**, macOS 저장 대화상자에서 `Cmd + Shift + G` → 복사해 둔 폴더 경로 붙여넣기(`Cmd + V`) → `Enter` → 저장합니다.
4. **진행 상태 체크 및 백업**
   - 완료된 항목은 **✓ 완료** 버튼(또는 드롭다운에서 `대체코드성공` / `중복PDF` / `미검색`)을 선택합니다.
   - 체크와 메모는 브라우저 `localStorage`에 자동 저장되며, 작업 중간·종료 시 **진행결과 CSV 내보내기**로 파일 백업을 남겨 두세요.

---

## PDF 선택 및 중복 처리 기준

| 구분 | 기준 |
| --- | --- |
| **필수 다운로드** | **한국어 정식 `사용설명서` PDF (본편)** |
| **제외 기본값** | 영문 사용설명서, 간단 사용설명서(본편이 있을 때), 설치설명서 단독 파일, 에너지소비효율등급 라벨, 소프트웨어/펌웨어 |
| **예외 허용** | 본편 없이 통합(설치+사용) 설명서만 제공되는 모델은 해당 한국어 PDF 다운로드 |
| **공용 PDF 중복** | 같은 제품군의 다른 모델에서 이미 받은 `MFL*.pdf`와 파일명(문서번호)이 완전히 같다면 다시 저장하지 않고 도우미에서 **중복PDF**로 표시 |

---

## 15개 카테고리 ↔ 드롭폴더 매핑표

> **원본 파일명 유지 원칙**: LG 원본 파일명(`MFL*.pdf` 등)을 수동으로 바꿀 필요가 없습니다. 아래 지정 폴더에 그대로 넣어 두면 추후 인테이크 스크립트가 폴더명에서 `appliances/<slug>`를 자동 역매핑하고, SHA-256 중복 검사 및 표지 텍스트 파싱으로 적용 모델명을 일괄 추출합니다.

| LG 그룹 순 | Seraph 카테고리 | DB `slug_path` | 드롭폴더 (`.local/manuals/lg-inbox/`) | 목표 수량 |
| ---: | --- | --- | --- | ---: |
| 1 | `1.2` 세탁기 | `appliances/washer` | `1.2-washer/` | 5 |
| 2 | `1.24` 의류 건조기 | `appliances/dryer` | `1.24-dryer/` | 4 |
| 3 | `1.15` 세탁기 겸 건조기 | `appliances/washer-dryer` | `1.15-washer-dryer/` | 4 |
| 4 | `1.10` 냉장고 | `appliances/refrigerator` | `1.10-refrigerator/` | 5 |
| 5 | `1.22` 양문형 냉장고 | `appliances/side-by-side-refrigerator` | `1.22-side-by-side-refrigerator/` | 3 |
| 6 | `1.8` 김치냉장고 | `appliances/kimchi-fridge` | `1.8-kimchi-fridge/` | 4 |
| 7 | `1.21` 식기 세척기 | `appliances/dishwasher` | `1.21-dishwasher/` | 4 |
| 8 | `1.25` 오븐 | `appliances/oven` | `1.25-oven/` | 3 |
| 9 | `1.30` 전자렌지 | `appliances/microwave` | `1.30-microwave/` | 3 |
| 10 | `1.13` 레인지 | `appliances/range` | `1.13-range/` | 3 |
| 11 | `1.4` 정수기 | `appliances/water-purifier` | `1.4-water-purifier/` | 4 |
| 12 | `1.3` 에어컨 | `appliances/air-conditioner` | `1.3-air-conditioner/` | 5 |
| 13 | `1.7` 공기 청정기 | `appliances/air-purifier` | `1.7-air-purifier/` | 5 |
| 14 | `1.32` 제습기 | `appliances/dehumidifier` | `1.32-dehumidifier/` | 3 |
| 15 | `1.5` 진공 청소기 | `appliances/vacuum` | `1.5-vacuum/` | 4 |

*(참고: LG 스타일러/의류관리기는 추후 Seraph DB에 `1.42 의류관리기` 카테고리를 신설할 때 2차로 분리 수집합니다.)*

---

## 다운로드 완료 후 다음 단계 핸드오프

PDF 수집이 끝나면 아래 두 가지를 준비해 인테이크 단계를 진행합니다.
1. `.local/manuals/lg-inbox/` 아래 15개 폴더에 저장된 원본 PDF 파일들
2. 도우미에서 **진행결과 CSV 내보내기**로 저장한 결과 CSV 파일 (미검색/대체성공/중복 메모 확인용)
