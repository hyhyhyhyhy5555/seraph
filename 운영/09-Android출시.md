# 09. Android 자체 빌드와 Google Play 출시

## 목표와 전제

서명된 Android App Bundle(AAB)을 자체 장비에서 만들고 Google Play 테스트를 거쳐 공개한다. 사용자 확정에 따라 아래 명령은 보유 MacBook 터미널 기준이다. 그램에는 Android SDK·빌드 VM을 설치하지 않는다. 최초는 수동으로 성공시키고 이후 Gitea runner로 옮긴다. EAS cloud build는 필수 경로로 사용하지 않는다.

계정 유형·계정 생성일·Android 테스트 기기·앱 package는 미정이다. Play 정책·target SDK 요구는 제출 시점의 Play Console에서 다시 확인한다.

## 1. 앱 식별자와 버전 확정

현재 `app.json`에는 Android package가 없다. 실제로 사용할 역도메인 형태 ID를 정한 뒤 추가한다. 아래는 형태 예시이며 실제 값이 아니다.

```json
{
  "expo": {
    "version": "<PUBLIC_VERSION>",
    "android": {
      "package": "<ANDROID_PACKAGE>",
      "versionCode": 1
    }
  }
}
```

기존 name·slug·plugins·다른 설정을 지우지 않고 필요한 필드를 병합한다. package는 최초 공개 후 다른 앱으로 취급되는 중요한 값이다. 임시 개인 도메인 예시를 그대로 확정하지 않는다.

- version: 사용자에게 보이는 버전.
- versionCode: 업로드마다 증가하는 내부 정수.
- 현재 eas.json의 remote version 정책은 로컬 Gradle 빌드의 버전을 자동 증가시키지 않는다.
- 개발/테스트용 앱을 나란히 설치하려면 별도 package suffix와 app config를 설계한다.

## 2. MacBook Android 빌드 환경

1. Node·npm을 저장소와 맞춘다.
2. Expo가 생성한 Gradle/Android Gradle Plugin과 호환되는 JDK를 설치한다.
3. Android SDK command-line tools, platform-tools, 요구 platform/build-tools를 설치한다.
4. ANDROID_HOME, PATH를 빌드 사용자 환경에 설정한다.
5. SDK license를 확인·승인한다.
6. 도구 버전·다운로드 출처를 기록한다.

```bash
node --version
npm --version
java -version
adb version
npm ci
npm run check
```

JDK·SDK 버전은 무조건 최신으로 설치하지 않는다. 생성한 Android 프로젝트 요구를 기준으로 고정한다. MacBook에서 Android 앱 빌드에 에뮬레이터는 필수가 아니다. 실제 Android폰으로 테스트할 수 있다.

## 3. Expo prebuild 정책

현재 저장소에는 Android 네이티브 프로젝트가 없다. prebuild로 생성한다.

```bash
npx expo prebuild --platform android
```

작업 전 `git status`를 확인하고 생성·변경 파일을 리뷰한다. native 폴더를 버전 관리할지, 매번 재생성할지 결정한다. 생성된 Gradle 파일에 수동 서명 설정을 추가했다면 다음 prebuild에서 보존되는지 확인한다. 장기적으로 config plugin 또는 명시적 native 관리로 재현한다.

`prebuild --clean`은 네이티브 폴더의 수동 수정을 제거할 수 있다. 해결 방법으로 무작정 실행하지 않는다.

## 4. upload key 생성·보관

Google Play App Signing을 사용하면 upload key와 사용자가 설치하는 앱의 signing key 역할이 구분된다. 최초 앱 등록 시 Play Console의 실제 설정을 확인한다.

keystore는 저장소 밖의 보호된 디렉터리에 생성한다. 비밀번호를 CLI 인자로 쓰지 말고 interactive 입력으로 처리한다.

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore <PRIVATE_KEYSTORE_PATH> \
  -alias <UPLOAD_ALIAS> \
  -keyalg RSA -keysize 2048 -validity 10000
```

보관할 것:

- keystore 파일과 upload alias
- store password·key password: 비밀 저장소에 별도 보관
- 인증서 fingerprint·만료일
- 생성 시각·담당자·복구 사본 위치

Gradle에는 환경변수 또는 저장소 밖 사용자 Gradle properties로 주입한다. 파일 경로와 properties 이름을 문서화하되 실제 암호를 기록하지 않는다. `android/app/build.gradle` signingConfigs.release와 buildTypes.release가 upload key를 참조하게 구성한다. debug key로 서명된 AAB를 출시용으로 취급하지 않는다.

## 5. API 주소를 넣어 서명 빌드

API는 LTE에서 접근 가능한 신뢰된 HTTPS여야 한다. EXPO_PUBLIC 변수에는 URL만 넣고 비밀값은 넣지 않는다. 값은 bundle 생성 시 반영되므로 서버 환경변수만 바꾸어 기존 앱 주소를 바꿀 수 없다.

MacBook 터미널, 저장소 루트:

```bash
export EXPO_PUBLIC_API_URL='https://<API_HOST>'
npm ci
npm run check
cd android
./gradlew :app:bundleRelease
```

결과 기본 경로는 `android/app/build/outputs/bundle/release/app-release.aab`다. flavor를 추가하면 달라질 수 있다. 빌드 로그·파일 hash·source commit·versionCode·API 주소·JDK/SDK 버전을 기록한다.

개발용 debug나 `npx expo run:android --variant release` 성공만으로 Play 서명·AAB 준비 완료를 선언하지 않는다. 실제 signing config와 artifact를 확인한다.

## 6. 실기기 테스트

로컬 설치용 APK를 별도로 만들거나 AAB를 Play internal testing으로 전달한다. AAB 파일은 일반 APK처럼 바로 설치할 수 없다.

```bash
./gradlew :app:assembleRelease
```

release APK는 `android/app/build/outputs/apk/release/`를 확인한다. 테스트용 Android폰을 맥북에 연결하고 맥북 adb로 설치한다. 그램에는 테스트·빌드 환경을 추가하지 않는다.

검증 시나리오:

1. Metro·Expo 개발 서버를 종료한다.
2. 새 설치 후 검색·분류·설명서·질문·출처 링크 확인.
3. 와이파이와 LTE 양쪽에서 확인.
4. API 중단 시 무한 로딩·앱 종료 없이 오류 표시와 재시도 확인.
5. 없는 질문·긴 입력·빈 입력·키보드·뒤로가기 확인.
6. 이전 버전 위에 업데이트 설치해 데이터·설정 유지 확인.
7. 서버는 구버전 앱 요청도 처리하는지 확인.
8. 실제 앱에 localhost·example.invalid·관리 키가 남지 않았는지 확인.

## 7. Play Console 준비

순서:

1. 개발자 계정 등록·본인/조직 확인·연락처 검증.
2. 앱 생성, 기본 언어·앱 이름·무료/유료·배포 국가 결정.
3. package와 서명 정책 확인.
4. 개인정보처리방침·지원 URL 준비. 앱과 웹에서 접근 가능하게 함.
5. 아이콘·스크린샷·짧은/전체 설명·카테고리 입력.
6. 콘텐츠 등급·광고 여부·대상 연령·앱 접근 안내 작성.
7. Data safety는 실제 수집·전송·보관 동작 기준으로 작성.
8. 로그인 기능이 있으면 심사용 접근 수단 준비.
9. AAB를 internal testing에 업로드해 배포본 설치 확인.

채팅·문의 데이터가 서버에 저장된다면 이를 '아무 데이터도 수집하지 않음'으로 적지 않는다. 정확한 개인정보·법적 고지 내용은 실제 기능과 운영 주체가 정해진 뒤 작성한다.

## 8. 테스트 요구와 공개

2026-10-29 확인한 공식 안내에서는 2023-11-13 이후 생성한 개인 계정에 대해 최소 12명이 연속 14일 참여하는 closed testing 후 production access 신청을 요구한다. 계정별 실제 Console 안내와 제출 시점 정책을 다시 확인한다. internal testing만으로 이 조건이 충족된다고 가정하지 않는다.

- 테스터 모집·참여 안내·피드백 수집 계획 수립.
- 실제 사용 시나리오와 발견한 문제·수정 기록 보관.
- 조건 충족 후 production access 질문에 실제 결과로 답변.
- 심사·승인 후 공개 범위와 rollout 방식 선택.
- 첫 공개 후 스토어 설치본에서 다시 API 테스트.

심사 시간과 승인 여부는 일정에 확정값으로 넣지 않는다.

## 9. CI 이전

수동 빌드 성공 환경을 전용 runner에 복제한다. 서명키는 작업 시에만 주입하고 로그·artifact에서 제외한다. 공개 PR이 keystore·업로드 키에 접근하지 못하게 한다. Play 자동 업로드를 추가하면 계정에 필요한 최소 권한만 부여한다.

## 문제 해결

| 증상 | 확인 |
| --- | --- |
| Gradle JDK 오류 | JAVA_HOME·AGP/Gradle/JDK 호환성 |
| SDK missing | ANDROID_HOME·platform/build-tools·license |
| 서명 불일치 | package·upload key·Play App Signing 설정 |
| versionCode 중복 | 로컬 버전·생성 native 값·업로드 이력 |
| 설치 후 API 실패 | 빌드 시 URL·TLS·LTE·서버·HTTP 차단 |
| debug는 되는데 release 실패 | bundle·환경변수·난독화·native 설정 |

## 완료 조건

- [ ] package·versionCode 정책 확정
- [ ] 서명키·복구 사본 확보
- [ ] 자체 장비의 signed AAB 생성
- [ ] Metro 없이 실기기 동작
- [ ] Play 테스트·계정별 요구 충족
- [ ] 스토어 정보와 실제 데이터 수집 일치
- [ ] 공개 설치본·다음 업데이트 검증

참고: [Expo 로컬 릴리스 빌드](https://docs.expo.dev/guides/local-app-production/), [Google Play 개인 계정 테스트 요구](https://support.google.com/googleplay/android-developer/answer/14151465?hl=ko).
