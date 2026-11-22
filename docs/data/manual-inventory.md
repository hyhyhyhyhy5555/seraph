# 등록 매뉴얼 카테고리 인벤토리

> 기준: 2026-11-22 개발 DB 조회 결과
>
> 이 문서는 현재 DB의 `categories`, `manuals`, `manual_revisions`, `manual_chunks`를 기준으로 작성했다. 원본 PDF 후보 전체 목록이 아니라 **DB에 등록된 매뉴얼 목록**이다.

## 상태 표기

- `실제 PDF`: 사용자 제공 PDF에서 페이지·청크를 생성하고 임베딩까지 완료한 매뉴얼
- `사용자 제공 샘플`: 테스트용 텍스트 또는 PDF를 적재한 매뉴얼
- `샘플`: 제품 UI와 RAG 동작 확인을 위한 짧은 샘플 데이터
- `대기`: 메타데이터만 등록됐으며 페이지·청크·임베딩이 없는 항목

## 고유 카테고리 번호

카테고리 번호는 세라프 프로젝트 내부에서 사용하는 고유 식별자다. 앞으로 카테고리를 지칭할 때 이름과 함께 `1.2 세탁기`처럼 사용한다.

| 고유 번호 | 카테고리 | DB 경로 |
| --- | --- | --- |
| `1` | 가전 | `appliances` |
| `1.1` | 가습기 | `appliances/humidifier` |
| `1.2` | 세탁기 | `appliances/washer` |
| `1.3` | 에어컨 | `appliances/air-conditioner` |
| `1.4` | 정수기 | `appliances/water-purifier` |
| `1.5` | 진공 청소기 | `appliances/vacuum` |
| `1.6` | 감염 제거 캐비닛 | `appliances/disinfection-cabinet` |
| `1.7` | 공기 청정기 | `appliances/air-purifier` |
| `1.8` | 김치냉장고 | `appliances/kimchi-fridge` |
| `1.9` | 냉동고 | `appliances/freezer` |
| `1.10` | 냉장고 | `appliances/refrigerator` |
| `1.11` | 다리미 | `appliances/iron` |
| `1.12` | 다림질 시스템 | `appliances/ironing-system` |
| `1.13` | 레인지 | `appliances/range` |
| `1.14` | 선풍기 | `appliances/fan` |
| `1.15` | 세탁기 겸 건조기 | `appliances/washer-dryer` |
| `1.16` | 소다 제조기 | `appliances/soda-maker` |
| `1.17` | 스태킹 키트 | `appliances/stacking-kit` |
| `1.18` | 스탠딩오븐 | `appliances/freestanding-oven` |
| `1.19` | 스팀 청소기 | `appliances/steam-cleaner` |
| `1.20` | 식기 건조기 | `appliances/dish-dryer` |
| `1.21` | 식기 세척기 | `appliances/dishwasher` |
| `1.22` | 양문형 냉장고 | `appliances/side-by-side-refrigerator` |
| `1.23` | 에스프레소 머신 | `appliances/espresso-machine` |
| `1.24` | 의류 건조기 | `appliances/dryer` |
| `1.25` | 오븐 | `appliances/oven` |
| `1.26` | 와인 캐비닛 | `appliances/wine-cabinet` |
| `1.27` | 워밍 드로워 | `appliances/warming-drawer` |
| `1.28` | 워터 디스펜서 | `appliances/water-dispenser` |
| `1.29` | 의료용 스팀기 | `appliances/medical-steamer` |
| `1.30` | 전자렌지 | `appliances/microwave` |
| `1.31` | 제빵기 | `appliances/bread-maker` |
| `1.32` | 제습기 | `appliances/dehumidifier` |
| `1.33` | 주전자 | `appliances/kettle` |
| `1.34` | 창 클리너 | `appliances/window-cleaner` |
| `1.35` | 커피 머신 | `appliances/coffee-machine` |
| `1.36` | 쿠커 후드 | `appliances/cooker-hood` |
| `1.37` | 토스터 | `appliances/toaster` |
| `1.38` | 튀김기 | `appliances/deep-fryer` |
| `1.39` | 티 머신 | `appliances/tea-machine` |
| `1.40` | 휴대용 진공청소기 | `appliances/handheld-vacuum` |
| `1.41` | 히터 | `appliances/heater` |
| `2` | 디지털/모바일 | `digital-mobile` |
| `2.1` | 스마트폰 | `digital-mobile/smartphone` |
| `2.2` | 태블릿 | `digital-mobile/tablet` |
| `2.3` | 카메라 | `digital-mobile/camera` |
| `3` | 컴퓨터/주변기기 | `computer` |
| `3.1` | 노트북 | `computer/laptop` |
| `3.2` | 프린터 | `computer/printer` |
| `4` | TV/음향 | `tv-audio` |
| `4.1` | TV | `tv-audio/tv` |
| `4.2` | 사운드바 | `tv-audio/soundbar` |

## 전체 현황

| 구분 | 수량 |
| --- | ---: |
| 등록 매뉴얼 | 185개 |
| 관리 대상 대분류 | 4개 |
| 관리 대상 제품군 | 48개 |
| 검색·RAG 준비 완료 | 184개 |
| 적재 대기 | 1개 |
| 전체 청크 | 10,253개 |
| 임베딩 완료 청크 | 10,253개 |

프론트에서 취급하는 전체 48개 제품군을 관리 대상으로 포함한다. 현재 등록 제품은 2단계 카테고리까지 연결돼 있으며, 3단계 카테고리에 직접 연결된 제품은 없다. 2026-11-22에 Apple 준비 완료 매니페스트 142개 중 기존 PDF 4개를 제외한 신규 PDF 138개를 적재하고 신규 청크 6,431개를 임베딩했다. 같은 날 LG 가전 PDF 34개를 12개 제품군에 추가 적재하고 신규 청크 2,305개를 임베딩했다.

# 1. 가전

## 1.1 가습기

- `샘플` **Boneco U350 가습기 사용 설명서**
  - 모델: `U350`
  - 상태: 검색·임베딩 완료
  - 청크: 2개

## 1.2 세탁기

- `실제 PDF` **통돌이 스마트 인버터/표준형 16kg 사용 설명서**
  - 제조사/모델: `LG` / `TR16DV6`
  - 판본: `MFL71831233 Rev.00`
  - 원본 파일: `WM_KOR_MFL71831233_00_250422_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 48페이지 / 72개
- `실제 PDF` **통돌이 오브제컬렉션/블랙라벨 20~22kg 사용 설명서**
  - 제조사/모델: `LG` / `T20WT`
  - 판본: `MFL71831204 Rev.02`
  - 원본 파일: `WM_KOR_MFL71831204_02_240612_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 56페이지 / 82개
- `실제 PDF` **트롬 오브제컬렉션 드럼세탁기 25kg 사용 설명서**
  - 제조사/모델: `LG` / `FX25EA`
  - 판본: `MFL71792812 Rev.08`
  - 원본 파일: `WM_KOR_MFL71792812_08_250904_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 69페이지 / 107개
- `실제 PDF` **트롬 오브제컬렉션 미니워시 4kg 사용 설명서**
  - 제조사/모델: `LG` / `FX4VC`
  - 판본: `MFL71836006 Rev.02`
  - 원본 파일: `MW_KOR_MFL71836006_02_240607_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 48페이지 / 75개
- `실제 PDF` **트롬 인공지능 DD 드럼세탁기 24kg/21kg 사용 설명서**
  - 제조사/모델: `LG` / `FX24EN`
  - 판본: `MFL71792818 Rev.10`
  - 원본 파일: `WM_KOR_MFL71792818_10_251204_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 65페이지 / 100개

- `사용자 제공 샘플` **권한 제공 샘플 세탁기 설명서**
  - 모델: `SW-1000`
  - 형식: 텍스트 샘플
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 2페이지 / 2개
- `사용자 제공 샘플` **권한 제공 샘플 PDF 세탁기 설명서**
  - 모델: `SW-2000`
  - 형식: `sample-authorized-washer.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 1페이지 / 1개
- `샘플` **삼성 Bespoke 세탁기 사용자 매뉴얼**
  - 모델: `Bespoke Washer`
  - 상태: 검색·임베딩 완료
  - 청크: 3개
- `대기` **삼성 WW90T3000KW 세탁기 사용 설명서**
  - 모델: `WW90T3000KW`
  - 상태: 메타데이터만 등록, 권리 확인·본문 적재·임베딩 대기
  - 청크: 0개

## 1.3 에어컨

- `샘플` **LG 휘센 에어컨 기본 사용 설명서**
  - 모델: `WHISEN`
  - 상태: 검색·임베딩 완료
  - 청크: 2개

## 1.4 정수기

- `실제 PDF` **퓨리케어 오브제컬렉션 얼음정수기 사용 설명서**
  - 제조사/모델: `LG` / `WD721RE`
  - 판본: `MFL72129601 Rev.03`
  - 원본 파일: `WP_KOR_MFL72129601_03_250217_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 36페이지 / 50개
- `실제 PDF` **퓨리케어 오브제컬렉션 맞춤출수 냉온정수기 사용 설명서**
  - 제조사/모델: `LG` / `WD520MC`
  - 판본: `MFL71928104 Rev.00`
  - 원본 파일: `WP_KOR_MFL71928104_00_260731_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 32페이지 / 44개
- `실제 PDF` **퓨리케어 오브제컬렉션 라이트온 정수전용/냉정 사용 설명서**
  - 제조사/모델: `LG` / `WD120MCB`
  - 판본: `MFL72092301 Rev.04`
  - 원본 파일: `WP_KOR_MFL72092301_04_260514_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 28페이지 / 41개
- `실제 PDF` **퓨리케어 듀얼 빌트인 정수기 사용 설명서**
  - 제조사/모델: `LG` / `WU923ACB`
  - 판본: `MFL71729103 Rev.02`
  - 원본 파일: `WP_KOR_MFL71729103_02_240416_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 32페이지 / 50개

- `샘플` **쿠쿠 정수기 설치 및 사용 설명서**
  - 모델: `CP Series`
  - 상태: 검색·임베딩 완료
  - 청크: 2개

## 1.5 진공 청소기

- `실제 PDF` **LG 싸이킹 청소기 사용 설명서**
  - 제조사/모델: `LG` / `V-C716AJ`
  - 판본: `PDF 71e50f0622d5`
  - 원본 파일: `lg싸이킹청소기.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 16페이지 / 20개
- `실제 PDF` **코드제로 R5 로봇청소기 사용 설명서**
  - 제조사/모델: `LG` / `R585WKA`
  - 판본: `MFL71751912 Rev.06`
  - 원본 파일: `VC_KOR_MFL71751912_06_260310_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 36페이지 / 40개

- `샘플` **다이슨 무선 진공 청소기 사용 설명서**
  - 모델: `V Series`
  - 상태: 검색·임베딩 완료
  - 청크: 2개

## 1.6 감염 제거 캐비닛

- 등록 제품 없음

## 1.7 공기 청정기

- `실제 PDF` **퓨리케어 오브제컬렉션 에어로부스터 사용 설명서**
  - 제조사/모델: `LG` / `AS155GWDL`
  - 판본: `MFL71891993 Rev.01`
  - 원본 파일: `GP1_KOR_MFL71891993_01_250319_01_WEB_________________.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 42페이지 / 49개
- `실제 PDF` **퓨리케어 오브제컬렉션 에어로퍼니처 사용 설명서**
  - 제조사/모델: `LG` / `AS065PWHA`
  - 판본: `MFL71953018 Rev.00`
  - 원본 파일: `____MFL71953018_00_250306_03.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 38페이지 / 51개
- `실제 PDF` **퓨리케어 오브제컬렉션 에어로타워 사용 설명서**
  - 제조사/모델: `LG` / `FS062PZGA`
  - 판본: `MFL71825201 Rev.08`
  - 원본 파일: `MFL71825201_08_220701_03_PRINT(CROP).pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 48페이지 / 57개
- `실제 PDF` **퓨리케어 360° 공기청정기 히트/플러스 사용 설명서**
  - 제조사/모델: `LG` / `AS183HWWA`
  - 판본: `MFL72146412 Rev.00`
  - 원본 파일: `360Hit_KOR_MFL72146412_00_241016_00_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 34페이지 / 40개

## 1.8 김치냉장고

- `실제 PDF` **디오스 김치톡톡 뚜껑형 소형 128~131L급 사용 설명서**
  - 제조사/모델: `LG` / `K131LW121`
  - 판본: `PDF 26ccaf14872f`
  - 원본 파일: `REF_KOR_EBAX00124H_00_250926_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 32페이지 / 51개
- `실제 PDF` **디오스 김치톡톡 뚜껑형 2도어 217~220L급 사용 설명서**
  - 제조사/모델: `LG` / `K223LW121`
  - 판본: `MFL70960302 Rev.10`
  - 원본 파일: `REF_KOR_MFL70960302_10_240911_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 32페이지 / 54개

## 1.9 냉동고

- 등록 제품 없음

## 1.10 냉장고

- 등록 제품 없음

## 1.11 다리미

- 등록 제품 없음

## 1.12 다림질 시스템

- 등록 제품 없음

## 1.13 레인지

- `실제 PDF` **디오스 오브제컬렉션 올인덕션 3구 사용 설명서**
  - 제조사/모델: `LG` / `BEI3QEBLOE`
  - 판본: `MFL71922911 Rev.07`
  - 원본 파일: `CK_KOR_MFL71922911_07_260629_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 36페이지 / 57개
- `실제 PDF` **디오스 오브제컬렉션 인덕션 3구 와이드존 사용 설명서**
  - 제조사/모델: `LG` / `BEF3ANBLE`
  - 판본: `MFL71922903 Rev.06`
  - 원본 파일: `CK_KOR_MFL71922903_06_260626_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 36페이지 / 58개

## 1.14 선풍기

- 등록 제품 없음

## 1.15 세탁기 겸 건조기

- `실제 PDF` **트롬 오브제컬렉션 워시타워 컴팩트 사용 설명서**
  - 제조사/모델: `LG` / `W10BHN`
  - 판본: `MFL71831423 Rev.07`
  - 원본 파일: `WM_KOR_MFL71831423_07_260320_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 72페이지 / 114개
- `실제 PDF` **트롬 오브제컬렉션 워시콤보 25kg 사용 설명서**
  - 제조사/모델: `LG` / `FH25EA`
  - 판본: `MFL71792827 Rev.06`
  - 원본 파일: `WM_KOR_MFLR71792827_06_251204_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 80페이지 / 122개

## 1.16 소다 제조기

- 등록 제품 없음

## 1.17 스태킹 키트

- 등록 제품 없음

## 1.18 스탠딩오븐

- 등록 제품 없음

## 1.19 스팀 청소기

- 등록 제품 없음

## 1.20 식기 건조기

- 등록 제품 없음

## 1.21 식기 세척기

- `실제 PDF` **디오스 오브제컬렉션 식기세척기 12인용 빌트인 사용 설명서**
  - 제조사/모델: `LG` / `DUE2BGE`
  - 판본: `MFL71959119 Rev.06`
  - 원본 파일: `DW_KOR_MFL71959119_06_260319_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 56페이지 / 77개
- `실제 PDF` **디오스 오브제컬렉션 식기세척기 14인용 빌트인 사용 설명서**
  - 제조사/모델: `LG` / `DUE6BGL2`
  - 판본: `MFL71959103 Rev.05`
  - 원본 파일: `DW_KOR_MFL71959103_05_240329_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 60페이지 / 81개
- `실제 PDF` **디오스 오브제컬렉션 식기세척기 6인용 카운터탑 사용 설명서**
  - 제조사/모델: `LG` / `D0633WFA`
  - 판본: `MFL47377727 Rev.10`
  - 원본 파일: `DW_KOR_MFL47377727_10_240814_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 36페이지 / 48개

## 1.22 양문형 냉장고

- 등록 제품 없음

## 1.23 에스프레소 머신

- 등록 제품 없음

## 1.24 의류 건조기

- `실제 PDF` **트롬 건조기 10kg 컴팩트 사용 설명서**
  - 제조사/모델: `LG` / `RH10WTW`
  - 판본: `MFL71887497 Rev.01`
  - 원본 파일: `DR_KOR_MFL71887497_01_240220_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 48페이지 / 73개
- `실제 PDF` **트롬 오브제컬렉션 건조기 21kg 사용 설명서**
  - 제조사/모델: `LG` / `RD21GN`
  - 판본: `MFL71831424 Rev.06`
  - 원본 파일: `DR_KOR_MFL71831424_06_250627_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 56페이지 / 82개
- `실제 PDF` **트롬 오브제컬렉션 건조기 22kg 사용 설명서**
  - 제조사/모델: `LG` / `RD22KS`
  - 판본: `MFL71831442 Rev.04`
  - 원본 파일: `DR_KOR_MFL71831442_04_260826_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 60페이지 / 91개

## 1.25 오븐

- `실제 PDF` **디오스 오브제컬렉션 광파오븐 32L 스팀 사용 설명서**
  - 제조사/모델: `LG` / `MLJ32ERS`
  - 판본: `MFL68822527 Rev.02`
  - 원본 파일: `CK_KOR_MFL68822527_02_260904_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 64페이지 / 104개
- `실제 PDF` **디오스 광파오븐 32L/39L 스탠다드 사용 설명서**
  - 제조사/모델: `LG` / `ML32EW1`
  - 판본: `MFL68822502 Rev.25`
  - 원본 파일: `MWO_KOR_MFL68822502_25_250904_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 60페이지 / 99개
- `실제 PDF` **디오스 오브제컬렉션 광파오븐 39L 대용량 사용 설명서**
  - 제조사/모델: `LG` / `MLJ39ER`
  - 판본: `MFL69641709 Rev.01`
  - 원본 파일: `CK_KOR_MFL69641709_01_260904_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 56페이지 / 80개

## 1.26 와인 캐비닛

- 등록 제품 없음

## 1.27 워밍 드로워

- 등록 제품 없음

## 1.28 워터 디스펜서

- 등록 제품 없음

## 1.29 의료용 스팀기

- 등록 제품 없음

## 1.30 전자렌지

- `실제 PDF` **오브제컬렉션 전자레인지 23L 터치식 사용 설명서**
  - 제조사/모델: `LG` / `MWJ23EI`
  - 판본: `MFL68822538 Rev.00`
  - 원본 파일: `CK_KOR_MFL68822538_00_251209_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 40페이지 / 62개
- `실제 PDF` **네오셰프 인버터 전자레인지 23L 버튼식 사용 설명서**
  - 제조사/모델: `LG` / `MW23GD`
  - 판본: `MFL68822520 Rev.22`
  - 원본 파일: `MWO_KOR_MFL68822520_22_250905_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 44페이지 / 64개
- `실제 PDF` **오브제컬렉션/네오셰프 전자레인지 25L 사용 설명서**
  - 제조사/모델: `LG` / `MWJ25E`
  - 판본: `MFL68822525 Rev.07`
  - 원본 파일: `MWO_KOR_MFL68822525_07_250905_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 44페이지 / 64개

## 1.31 제빵기

- 등록 제품 없음

## 1.32 제습기

- `실제 PDF` **휘센 오브제컬렉션 제습기 대용량 20~21L 사용 설명서**
  - 제조사/모델: `LG` / `DQ214MWGA`
  - 판본: `MFL71891994 Rev.03`
  - 원본 파일: `KOR_MFL71891994_03_250325_00_OM_WEB.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 38페이지 / 46개

## 1.33 주전자

- 등록 제품 없음

## 1.34 창 클리너

- 등록 제품 없음

## 1.35 커피 머신

- 등록 제품 없음

## 1.36 쿠커 후드

- 등록 제품 없음

## 1.37 토스터

- 등록 제품 없음

## 1.38 튀김기

- 등록 제품 없음

## 1.39 티 머신

- 등록 제품 없음

## 1.40 휴대용 진공청소기

- 등록 제품 없음

## 1.41 히터

- 등록 제품 없음

# 2. 디지털/모바일

## 2.1 스마트폰

- `실제 PDF` **iPhone 사용 설명서**
  - 모델/판본: `iPhone` / `iPhone OS 3.1 한국어판`
  - 원본 파일: `Apple iPhone (iOS 3.1) Mobile Phone.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 209페이지 / 474개
- `실제 PDF` **iPhone 사용 설명서 (iOS 7.1 소프트웨어용)**
  - 모델/판본: `iPhone 4` / `iOS 7.1`
  - 원본 파일: `apple-ma1681-iphone-ios7-user-guide.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 158페이지 / 468개
- `샘플` **삼성 Galaxy 스마트폰 빠른 시작 설명서**
  - 모델: `Galaxy`
  - 상태: 검색·임베딩 완료
  - 청크: 2개

## 2.2 태블릿

- `실제 PDF` **iPad 사용 설명서 iOS 7.1용(2013년 10월)**
  - 모델/판본: `iPad 2` / `iOS 7.1`
  - 원본 파일: `apple-ma1683-ipad-ios7-user-guide.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 136페이지 / 402개

## 2.3 카메라

- 등록 제품 없음

# 3. 컴퓨터/주변기기

## 3.1 노트북

- `실제 PDF` **MacBook Pro (15-형) - 사용 설명서**
  - 모델: `MacBook Pro`
  - 원본 파일: `apple-ma144-macbook-pro-users-guide.pdf`
  - 상태: 검색·임베딩 완료
  - 페이지/청크: 135페이지 / 157개

## 3.2 프린터

- 등록 제품 없음

# 4. TV/음향

## 4.1 TV

- 등록 제품 없음

## 4.2 사운드바

- 등록 제품 없음

# PDF 매니페스트 등록 제품

아래 142개는 `.local/manuals/manifest.json` 기준 제품이다. 이 중 기존 4개와 신규 138개가 현재 DB에 등록되어 있으며, 모든 PDF 청크의 임베딩이 완료됐다.

## PDF 매니페스트: computer/laptop (57개)

- **PowerBook G4 (15형, Double Layer Super Drive) - 사용 설명서** — 모델: `PowerBook G4 (15-Inch, Double-Layer SD)`, 파일: `apple-ma113-powerbookg4-15in-dbllayersuperdrive.pdf`
- **MacBook Pro (15-형) - 사용 설명서** — 모델: `MacBook Pro`, 파일: `apple-ma144-macbook-pro-users-guide.pdf`
- **MacBook Pro (17-형) - 사용 설명서** — 모델: `MacBook Pro (17 인치)`, 파일: `apple-ma155-macbookpro-17inch-userguide.pdf`
- **MacBook Air (11형, 2012년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Air (11-inch, Mid 2012)`, 파일: `apple-ma1609-macbook-air-11-inch-mid-2012-quick-start-guide.pdf`
- **MacBook Air (13형, 2012년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Air (13-inch, Mid 2012)`, 파일: `apple-ma1610-macbook-air-13-inch-mid-2012-quick-start-guide.pdf`
- **MacBook Pro (13형, 2012년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (13-inch, Mid 2012)`, 파일: `apple-ma1611-macbook-pro-13-mid2012-qs.pdf`
- **MacBook Pro (15형, 2012년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (15-inch, Mid 2012)`, 파일: `apple-ma1612-macbook-pro-15-inch-mid-2012-quick-start-guide.pdf`
- **MacBook Pro(Retina, 2012년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (Retina, Mid 2012)`, 파일: `apple-ma1614-macbook-pro-retina-quickstart.pdf`
- **MacBook Pro (13형, 2012년 중반 모델) - 정보** — 모델: `MacBook Pro (13-inch, Mid 2012)`, 파일: `apple-ma1615-macbook-pro-13-inch-mid-2012-important-product-info.pdf`
- **MacBook Pro (Retina, 13형, 2012년 후반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (Retina, 13-inch, Late 2012)`, 파일: `apple-ma1629-macbook-pro-13-inch-late-2012-quick-start.pdf`
- **MacBook Air (11형, 2013년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Air (11-inch, Mid 2013)`, 파일: `apple-ma1642-macbook-air-11-inch-mid-2013-quick-start.pdf`
- **MacBook Air (13형, 2013년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Air (13-inch, Mid 2013)`, 파일: `apple-ma1643-macbook-air-13-inch-mid-2013-quick-start.pdf`
- **MacBook Pro (Retina, 13형, 2013년 후반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (Retina, 13-inch, Late 2013)`, 파일: `apple-ma1663-macbook-pro-retina-13-inch-late-2013-qs.pdf`
- **MacBook Pro (Retina, 15형, 2013년 후반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (Retina, 15-inch, Late 2013)`, 파일: `apple-ma1664-macbook-pro-retina-15-inch-late-2013-qs.pdf`
- **MacBook Air (2014년 초반 모델) - 정보** — 모델: `MacBook Air (11-inch, Early 2014)`, 파일: `apple-ma1672-macbook-air-early-2014-product-info.pdf`
- **MacBook Pro(Retina, 2014년 중반 모델) - 정보** — 모델: `MacBook Pro (Retina, 13-inch, Mid 2014)`, 파일: `apple-ma1678-macbook-pro-retina-mid-2014-ipig.pdf`
- **MacBook Pro(Retina, 15형, 2014년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (Retina, 15-inch, Mid 2014)`, 파일: `apple-ma1679-macbook-pro-retina-15-inch-mid-2014-qs.pdf`
- **MacBook Pro(Retina, 13형, 2014년 중반 모델) - 빠른 시작 설명서** — 모델: `MacBook Pro (Retina, 13-inch, Mid 2014)`, 파일: `apple-ma1680-macbook-pro-retina-13-inch-mid-2014-qs.pdf`
- **MacBook Pro (Retina, 13형, 2015년 초반 모델) - 정보** — 모델: `MacBook Pro (Retina 13 인치, 2015년 초)`, 파일: `apple-ma1694-macbook-pro-retina-13-inch-early-2015-info.pdf`
- **MacBook (Retina, 12 인치, 2015년 초) - 중요한 제품 정보 설명서** — 모델: `MacBook (Retina, 12-inch, Early 2015)`, 파일: `apple-ma1702-macbook-retina-12-inch-early2015-info.pdf`
- **MacBook Pro (Retina, 15형, 2015년 중반 모델) - 정보** — 모델: `MacBook Pro (Retina, 15-inch, Mid 2015)`, 파일: `apple-ma1716-macbook-pro-retina-15-inch-mid-2015-info.pdf`
- **MacBook(Retina, 12형, 2016년 초반 모델) - 중요한 제품 정보 설명서** — 모델: `MacBook (Retina, 12-inch, Early 2016)`, 파일: `apple-ma1749-macbook-retina-12-inch-early2016-info.pdf`
- **MacBook Pro (13-inch, 2016, Thunderbolt 3 포트 2개) - 정보** — 모델: `MacBook Pro (13-inch, 2016, Thunderbolt 3 포트 2개)`, 파일: `apple-ma1760-macbook-pro-late2016-info.pdf`
- **MacBook (Retina, 12 인치, 2017) - 정보** — 모델: `MacBook (Retina, 12-inch, 2017)`, 파일: `apple-ma1794-macbook-retina-12-inch-mid2017-info.pdf`
- **MacBook Pro (15 인치, 2017) - 정보** — 모델: `MacBook Pro (15-inch, 2017)`, 파일: `apple-ma1795-macbook-pro-15-mid2017-info.pdf`
- **MacBook Pro (13-inch, 2017, Thunderbolt 3 포트 2개)- 정보** — 모델: `MacBook Pro (13-inch, 2017, Two Thunderbolt 3 ports)`, 파일: `apple-ma1796-macbook-pro-13-mid2017-2t3-info.pdf`
- **MacBook Air (Retina, 13형, 2019) - 정보** — 모델: `MacBook Air (Retina, 13-inch, 2019)`, 파일: `apple-ma1884-macbook-air-13-2019-info.pdf`
- **MacBook Air(Retina, 13형, 2020년) - 정보** — 모델: `MacBook Air (Retina, 13-inch, 2020)`, 파일: `apple-ma1930-macbook-air-13-2020-info.pdf`
- **MacBook Pro (13-inch, 2020, Thunderbolt 3 포트 4개) - 정보** — 모델: `MacBook Pro (13-inch, 2020, Thunderbolt 3 포트 4개)`, 파일: `apple-ma1936-macbook-pro-13in-2020-4t3-info.pdf`
- **MacBook Air (M1, 2020) - 정보** — 모델: `MacBook Air (M1, 2020)`, 파일: `apple-ma1970-macbook-air-m1-2020-info.pdf`
- **MacBook Pro(16형, 2021년) - 정보** — 모델: `MacBook Pro (16-inch, 2021)`, 파일: `apple-ma2036-macbook-pro-16inch-2021-info.pdf`
- **MacBook Pro(16형, 2019년) - 정보** — 모델: `MacBook Pro (16-inch, 2019)`, 파일: `apple-ma2043-macbook-pro-16-inch-2019-info.pdf`
- **MacBook Pro (13-inch, M2, 2022) - 정보** — 모델: `MacBook Pro (13-inch, M2, 2022)`, 파일: `apple-ma2077-macbook-pro-13inch-m2-2022-info.pdf`
- **MacBook Air (M2, 2022) - 정보** — 모델: `MacBook Air (M2, 2022)`, 파일: `apple-ma2081-macbook-air-m2-2022-info.pdf`
- **MacBook Pro (14형, 2023년) - 정보** — 모델: `MacBook Pro 14(2023년)`, 파일: `apple-ma2130-macbook-pro-14inch-2023-info.pdf`
- **MacBook Air 15(M2, 2023년) - 정보** — 모델: `MacBook Air 15(M2, 2023년)`, 파일: `apple-ma2139-macbook-air-15inch-m2-2023-info.pdf`
- **MacBook Pro 14(M3, 2023년 11월) - 정보** — 모델: `MacBook Pro (14-inch, M3, Nov 2023)`, 파일: `apple-ma2164-macbook-pro-14inch-m3-nov23b-info.pdf`
- **MacBook Pro 14(M3 Pro 또는 M3 Max, 2023년 11월) - 정보** — 모델: `MacBook Pro (14-inch, M3 Pro or M3 Max, Nov 2023)`, 파일: `apple-ma2166-macbook-pro-14inch-m3pro-m3max-nov23-info.pdf`
- **PowerBook G4 (12형, 1.33GHz) - 시작하기** — 모델: `PowerBook G4 (12-inch, 1.33GHz)`, 파일: `apple-ma564-powerbookg4-12inch1-33ghzgettingstarted.pdf`
- **PowerBook G4 (15형, 1.331.5GHz) - 시작하기** — 모델: `PowerBook G4 (15-inch, 1.5/1.33GHz)`, 파일: `apple-ma565-powerbookg4-15inch1-33-1-5ghzgettingstarted.pdf`
- **PowerBook G4 (17형, 1.5GHz) - 시작하기** — 모델: `PowerBook G4 (17-inch, 1.5GHz)`, 파일: `apple-ma567-powerbookg4-17inch1-5ghzgettingstarted.pdf`
- **PowerBook G4(12형, 1.5GHz) - 사용 설명서** — 모델: `PowerBook G4 (12-inch, 1.5GHz)`, 파일: `apple-ma572-powerbookg4-12inch1-5ghzuserguide.pdf`
- **PowerBook G4(15형, 1.671.5GHz) - 사용 설명서** — 모델: `PowerBook`, 파일: `apple-ma573-powerbookg4-15inch1-67-1-5ghzuserguide.pdf`
- **iBook G4 - 사용 설명서** — 모델: `iBook G4 (12-inch Mid 2005)`, 파일: `apple-ma97-ibook-g4-mid-2005-users-guide.pdf`
- **MacBook Air 13(M3, 2024년) - 정보** — 모델: `MacBook Air 13(M3, 2024년)`, 파일: `macbook-air-13inch-m3-2024-info.pdf`
- **MacBook Air 13(M4, 2025년) - 정보** — 모델: `MacBook Air 13(M4, 2025년)`, 파일: `macbook-air-13inch-m4-2025-info.pdf`
- **MacBook Air 13(M5) - 정보** — 모델: `MacBook Air 13(M5)`, 파일: `macbook-air-13inch-m5-2026-info.pdf`
- **MacBook Air 15(M3, 2024년) - 정보** — 모델: `MacBook Air 15(M3, 2024년)`, 파일: `macbook-air-15inch-m3-2024-info.pdf`
- **MacBook Air 15(M4, 2025년) - 정보** — 모델: `MacBook Air 15(M4, 2025년)`, 파일: `macbook-air-15inch-m4-2025-info.pdf`
- **MacBook Air 15(M5) - 정보** — 모델: `MacBook Air 15(M5)`, 파일: `macbook-air-15inch-m5-2026-info.pdf`
- **MacBook Neo 13(A18 Pro 모델) - 정보** — 모델: `MacBook Neo`, 파일: `macbook-neo-13inch-a18pro-info.pdf`
- **MacBook Pro(14형, M4, 2024년) - 정보** — 모델: `MacBook Pro 14(M4, 2024년)`, 파일: `macbook-pro-14inch-m4-2024-info.pdf`
- **MacBook Pro 14(M4 Pro 또는 M4 Max, 2024년) - 정보** — 모델: `MacBook Pro 14(M4 Pro 또는 M4 Max, 2024년)`, 파일: `macbook-pro-14inch-m4pro-m4max-2024-info.pdf`
- **MacBook Pro 14(M5 모델) - 정보** — 모델: `MacBook Pro 14(M5 모델)`, 파일: `macbook-pro-14inch-m5-2025-info.pdf`
- **MacBook Pro 14(M5 Pro 또는 M5 Max, 2026년 모델) - 정보** — 모델: `MacBook Pro 14(M5 Pro 또는 M5 Max)`, 파일: `macbook-pro-14inch-m5pro-m5max-2026-info.pdf`
- **MacBook Pro 14(M6) - 정보** — 모델: `MacBook Pro 14(M6)`, 파일: `macbook-pro-14inch-m6-info.pdf`
- **MacBook Pro 14(PROLED XDR, M5 Pro 또는 M5 Max) - 정보** — 모델: `MacBook Pro 14(PROLED XDR, M5 Pro 또는 M5 Max)`, 파일: `macbook-pro-14inch-proled-xdr-display-m5pro-m5max-info.pdf`

## PDF 매니페스트: digital-mobile/smartphone (50개)

- **iPhone 16 - 정보** — 모델: `iPhone 16`, 파일: `iphone-16-info.pdf`
- **iPhone 16 Pro - 정보** — 모델: `iPhone 16 Pro`, 파일: `iphone-16-pro-info.pdf`
- **iPhone 16e - 정보** — 모델: `iPhone 16e`, 파일: `iphone-16e-info.pdf`
- **iPhone 17 - 정보** — 모델: `iPhone 17`, 파일: `iphone-17-info.pdf`
- **iPhone 17 Pro - 정보** — 모델: `iPhone 17 Pro`, 파일: `iphone-17-pro-info.pdf`
- **iPhone 17e - 정보** — 모델: `iPhone 17e`, 파일: `iphone-17e-info.pdf`
- **iPhone 18 Pro - 정보** — 모델: `iPhone 18 Pro`, 파일: `iphone-18-pro-info.pdf`
- **iPhone Air - 정보** — 모델: `iPhone Air`, 파일: `iphone-air-info.pdf`
- **iPhone Duo - 정보** — 모델: `iPhone Duo`, 파일: `iphone-duo-info.pdf`
- **iPhone 3GS - 정보** — 모델: `iPhone 3GS`, 파일: `apple-ma1140-iphone-3gs-important-product-information-guide.pdf`
- **iPhone 사용 설명서 (iOS 4.2 및 4.3 소프트웨어용)** — 모델: `iPhone 3G`, 파일: `apple-ma1539-iphone-ios4-user-guide.pdf`
- **iPhone 4 - 정보** — 모델: `iPhone 4`, 파일: `apple-ma1540-iphone-4-important-product-information-guide.pdf`
- **iPhone 4 Finger Tips - 간략한 팁** — 모델: `iPhone 4`, 파일: `apple-ma1546-iphone-4-finger-tips.pdf`
- **iPhone 5s 정보** — 모델: `iPhone 5`, 파일: `apple-ma1620-iphone-se-5s-2016-info.pdf`
- **iPhone 4 정보** — 모델: `iPhone 4`, 파일: `apple-ma1621-iphone-4-4s-info.pdf`
- **iPhone 사용 설명서 (iOS 5.1 소프트웨어용)** — 모델: `iPhone 3GS`, 파일: `apple-ma1622-iphone-ios5-user-guide.pdf`
- **iPhone 사용 설명서 (iOS 6.1 소프트웨어용)** — 모델: `iPhone 3GS`, 파일: `apple-ma1658-iphone-ios6-user-guide.pdf`
- **iPhone 6 정보** — 모델: `iPhone 6`, 파일: `apple-ma1660-iphone-6-2016-info.pdf`
- **iPhone 사용 설명서 (iOS 7.1 소프트웨어용)** — 모델: `iPhone 4`, 파일: `apple-ma1681-iphone-ios7-user-guide.pdf`
- **iPhone 6 Plus 정보** — 모델: `iPhone 6 Plus`, 파일: `apple-ma1705-iphone-6plus-2016-info.pdf`
- **iPhone 5c 정보** — 모델: `iPhone 5`, 파일: `apple-ma1706-iphone-5c-info.pdf`
- **iPhone SE 정보** — 모델: `iPhone SE (1st generation)`, 파일: `apple-ma1745-iphone-se-5s-2016-info.pdf`
- **iPhone 7 8 정보** — 모델: `iPhone 7`, 파일: `apple-ma1759-iphone-7-and-8-ios13-info.pdf`
- **iPhone 6s Plus 정보** — 모델: `iPhone 6s Plus`, 파일: `apple-ma1803-iphone-6splus-ios13-info.pdf`
- **iPhone 7 Plus 8 Plus 정보** — 모델: `iPhone 7 Plus`, 파일: `apple-ma1804-iphone-7plus-and-8plus-ios13-info.pdf`
- **iPhone X 정보** — 모델: `iPhone X`, 파일: `apple-ma1811-iphone-x-info.pdf`
- **iPhone 6s 정보** — 모델: `iPhone 6s`, 파일: `apple-ma1830-iphone-6s-ios13-info.pdf`
- **iPhone XS 정보** — 모델: `iPhone XS`, 파일: `apple-ma1836-iphone-xs-info.pdf`
- **iPhone XS Max 정보** — 모델: `iPhone XS Max`, 파일: `apple-ma1837-iphone-xs-max-info.pdf`
- **iPhone XR 정보** — 모델: `iPhone XR`, 파일: `apple-ma1841-iphone-xr-03405315-info.pdf`
- **iPhone 11 정보** — 모델: `iPhone 11`, 파일: `apple-ma1896-iphone-11-03406014-info.pdf`
- **iPhone 11 Pro Max 정보** — 모델: `iPhone 11 Pro Max`, 파일: `apple-ma1897-iphone-11-pro-max-info.pdf`
- **iPhone 11 Pro 정보** — 모델: `iPhone 11 Pro`, 파일: `apple-ma1898-iphone-11-pro-info.pdf`
- **iPhone SE (2세대) 정보** — 모델: `iPhone SE (2nd generation)`, 파일: `apple-ma1935-iphone-se-2genb-info.pdf`
- **iPhone 12 - 정보** — 모델: `iPhone 12`, 파일: `apple-ma1957-iphone-12-info.pdf`
- **iPhone 12 Pro - 정보** — 모델: `iPhone 12 Pro`, 파일: `apple-ma1958-iphone-12-pro-info.pdf`
- **iPhone 12 mini - 정보** — 모델: `iPhone 12 mini`, 파일: `apple-ma1963-iphone-12-mini-info.pdf`
- **iPhone 12 Pro Max - 정보** — 모델: `iPhone 12 Pro Max`, 파일: `apple-ma1964-iphone-12-pro-max-info.pdf`
- **iPhone 13 Pro - 정보** — 모델: `iPhone 13 Pro`, 파일: `apple-ma2024-iphone-13-pro-info.pdf`
- **iPhone 13 Pro Max - 정보** — 모델: `iPhone 13 Pro Max`, 파일: `apple-ma2025-iphone-13-pro-max-info.pdf`
- **iPhone SE(3세대) - 정보** — 모델: `iPhone SE(3세대)`, 파일: `apple-ma2062-iphone-se-3gen-info.pdf`
- **iPhone 14 Pro - 정보** — 모델: `iPhone 14 Pro`, 파일: `apple-ma2092-iphone-14-pro-info.pdf`
- **iPhone 14 Pro Max - 정보** — 모델: `iPhone 14 Pro Max`, 파일: `apple-ma2093-iphone-14-pro-max-info.pdf`
- **iPhone 14 Plus - 정보** — 모델: `iPhone 14 Plus`, 파일: `apple-ma2106-iphone-14-plus-info.pdf`
- **iPhone 15 - 정보** — 모델: `iPhone 15`, 파일: `apple-ma2155-iphone-15-info.pdf`
- **iPhone 15 Plus - 정보** — 모델: `iPhone 15 Plus`, 파일: `apple-ma2156-iphone-15-plus-info.pdf`
- **iPhone 15 Pro - 정보** — 모델: `iPhone 15 Pro`, 파일: `apple-ma2157-iphone-15-pro-info.pdf`
- **iPhone 15 Pro Max - 정보** — 모델: `iPhone 15 Pro Max`, 파일: `apple-ma2158-iphone-15-pro-max-info.pdf`
- **iPhone - 사용 설명서 (iPhone OS 3.1 소프트웨어용)** — 모델: `iPhone (original)`, 파일: `apple-ma616-iphone-ios3-1-user-guide.pdf`
- **iPhone 3G - 정보** — 모델: `iPhone 3G`, 파일: `apple-ma618-iphone-3g-important-product-information-guide.pdf`

## PDF 매니페스트: digital-mobile/tablet (35개)

- **iPad (A16) - 정보** — 모델: `iPad(A16) Wi-Fi`, 파일: `ipad-a16-info.pdf`
- **iPad Air 11(M2) - 정보** — 모델: `iPad Air 11(M2 모델) Wi-Fi`, 파일: `ipad-air-11inch-m2-info.pdf`
- **iPad Air 13(M4 모델) Wi-Fi + Cellular - 정보** — 모델: `iPad Air 13(M4 모델) Wi-Fi + Cellular`, 파일: `ipad-air-13inch-m4-cellular-info.pdf`
- **iPad mini (A17 Pro) - 정보** — 모델: `iPad mini (A17 Pro) Wi-Fi`, 파일: `ipad-mini-a17pro-info.pdf`
- **iPad mini (A20 Pro) - 정보** — 모델: `iPad mini(A20 Pro) Wi-Fi`, 파일: `ipad-mini-a20-pro-info.pdf`
- **iPad Pro 11(M4) - 정보** — 모델: `iPad Pro 11(M4 모델) Wi-Fi`, 파일: `ipad-pro-11inch-m4-info.pdf`
- **iPad Pro 11(M5 모델) - 정보** — 모델: `iPad Pro 11(M5 모델) Wi-Fi`, 파일: `ipad-pro-11inch-m5-info.pdf`
- **iPad 사용 설명서 (iOS 4.2 소프트웨어용)** — 모델: `iPad`, 파일: `apple-ma1561-ipad-ios4-user-guide.pdf`
- **iPad (iOS 4.2) - 정보** — 모델: `iPad`, 파일: `apple-ma1562-ipad-ios4-important-product-info.pdf`
- **iPad 2 사용 설명서 (iOS 4.3 소프트웨어용)** — 모델: `iPad 2`, 파일: `apple-ma1569-ipad-2-user-guide.pdf`
- **iPad 2 Wi-Fi 3G - 정보** — 모델: `iPad 2 Wi-Fi + 3G`, 파일: `apple-ma1571-ipad-2-att-important-product-info.pdf`
- **iPad (3세대) Wi-Fi - 정보** — 모델: `iPad (3rd generation)`, 파일: `apple-ma1605-ipad-wifi-important-product-info.pdf`
- **iPad (3세대) Wi-Fi Cellular - 정보** — 모델: `iPad (3rd generation) Wi-Fi + Cellular`, 파일: `apple-ma1606-ipad-wificellular-important-product-info.pdf`
- **iPad 사용 설명서 (iOS 5.1 소프트웨어용)** — 모델: `iPad`, 파일: `apple-ma1632-ipad-ios5-user-guide.pdf`
- **iPad (4세대), iPad mini - 정보** — 모델: `iPad (4th generation)`, 파일: `apple-ma1633-ipad-4th-gen-ipad-mini-info.pdf`
- **iPad - iPad mini 사용 설명서 (iOS 6.1 소프트웨어용)** — 모델: `iPad 2`, 파일: `apple-ma1659-ipad-ios6-user-guide.pdf`
- **iPad 사용 설명서 iOS 7.1용(2013년 10월)** — 모델: `iPad 2`, 파일: `apple-ma1683-ipad-ios7-user-guide.pdf`
- **iPad 정보** — 모델: `iPad`, 파일: `apple-ma1691-ipad-2016-info.pdf`
- **iPad 사용 설명서 iOS 8.4용** — 모델: `iPad 2`, 파일: `apple-ma1725-ipad-user-guide.pdf`
- **iPad Pro (9.7 인치) 정보** — 모델: `iPad Pro (9.7-inch)`, 파일: `apple-ma1746-ipad-pro-9-info.pdf`
- **iPad (5세대) 정보** — 모델: `iPad (5th generation)`, 파일: `apple-ma1772-ipad-5gen-info.pdf`
- **iPad Pro 정보** — 모델: `iPad Pro (9.7-inch)`, 파일: `apple-ma1798-ipad-pro-info.pdf`
- **iPad mini 4 정보** — 모델: `iPad mini 4`, 파일: `apple-ma1810-ipad-mini-4-ipados-info.pdf`
- **iPad (6세대) 정보** — 모델: `iPad (6th generation)`, 파일: `apple-ma1822-ipad-6gen-info.pdf`
- **iPad Pro 11 인치 정보** — 모델: `iPad Pro 11-inch Wi-Fi`, 파일: `apple-ma1848-ipad-pro-11inch-info.pdf`
- **iPad Air (3세대) 정보** — 모델: `iPad Air (3rd generation)`, 파일: `apple-ma1866-ipad-air-3gen-info.pdf`
- **iPad mini (5세대) 정보** — 모델: `iPad mini (5th generation)`, 파일: `apple-ma1867-ipad-mini-5gen-info.pdf`
- **iPad (7세대) (Wi-Fi 모델) 정보** — 모델: `iPad (7th generation)`, 파일: `apple-ma1900-ipad-7gen-info.pdf`
- **iPad Air 2 정보** — 모델: `iPad Air 2`, 파일: `apple-ma1903-ipad-air-2-ipados-info.pdf`
- **iPad Air 정보** — 모델: `iPad Air WiFi + Cellular`, 파일: `apple-ma1904-ipad-air-info.pdf`
- **iPad Pro 11 인치 (2세대) 정보** — 모델: `iPad Pro 11-inch (2nd generation) Wi-Fi`, 파일: `apple-ma1933-ipad-pro-11inch-2gen-info.pdf`
- **iPad (8세대) - 정보** — 모델: `iPad (8th generation)`, 파일: `apple-ma1956-ipad-8gen-info.pdf`
- **iPad(9세대) - 정보** — 모델: `iPad (9th generation)`, 파일: `apple-ma2026-ipad-9gen-info.pdf`
- **iPad mini(6세대) - 정보** — 모델: `iPad mini (6th generation)`, 파일: `apple-ma2027-ipad-mini-6gen-info.pdf`
- **11형 iPad Pro(4세대) - 정보** — 모델: `iPad Pro 11(4세대)`, 파일: `apple-ma2109-ipad-pro-11inch-4gen-034-05977-info.pdf`

## 관리 기준

- 고유 카테고리 번호는 한 번 부여하면 이름이나 화면 정렬이 바뀌어도 변경하거나 다른 카테고리에 재사용하지 않는다.
- 새 하위 카테고리는 같은 상위 번호 아래에서 사용하지 않은 다음 번호를 부여한다. 예: 가전의 다음 카테고리는 `1.42`.
- 3단계 카테고리가 생기면 상위 번호를 이어 `1.2.1` 형식으로 부여한다.
- 코드와 DB에서는 `slug_path`를 사용하고, 사람 간 작업 지시와 문서에서는 고유 번호와 이름을 함께 사용한다.
- 이 문서의 제품 목록과 처리 상태는 개발 DB를 기준으로 갱신한다.
- 새 PDF나 텍스트를 적재하면 해당 카테고리 아래에 제품명, 모델, 원본 형식, 페이지·청크 수와 임베딩 상태를 추가한다.
- 권리 상태가 확인되지 않은 항목은 `대기`로 기록하고, 본문이나 임베딩이 존재하는 것으로 표시하지 않는다.
- `.local/manuals/manifest*.json`은 로컬 원본·권리·해시 정보를 관리하고, 이 문서는 DB에 실제 반영된 결과를 관리한다.
