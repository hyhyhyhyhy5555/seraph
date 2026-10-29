# 10. iOS 자체 빌드와 App Store 출시

## 가장 먼저 확인할 제약

iOS 서명·Archive에는 지원되는 macOS와 Xcode 환경이 필요하다. Windows의 Linux VM이 이를 대체하지 않는다. 사용자가 MacBook을 보유하며 여기서 소스코드를 작성한다고 확인했다. 추가 Mac 구매를 전제로 하지 않는다. 보유 MacBook의 기종·macOS·Xcode 지원 상태를 확인한 뒤 빌드 환경을 준비한다. Windows 위에 임의 macOS VM을 설치하는 방식을 기본 경로로 삼지 않는다.

목표는 EAS cloud build 없이 Mac에서 빌드하고 App Store Connect/TestFlight로 배포하는 것이다. App Store Connect·Apple 인증 서비스는 스토어 출시를 위한 외부 의존성이다.

## 1. 보유 MacBook의 빌드 환경 확인

- Mac 모델·CPU·RAM·SSD 여유 공간
- macOS 버전과 설치 가능한 Xcode 버전
- Expo/React Native·제출 SDK 요구와 Xcode 호환성
- Apple Developer Program 계정·Team ID·계정 권한
- 실제 iPhone 모델·OS·USB 연결 가능 여부
- Git/Registry/API의 LAN DNS·HTTPS 신뢰 여부

보유 MacBook이 현재 제출에 필요한 Xcode를 지원하는지 먼저 확인한다. 모델을 확인하기 전 업그레이드나 신규 구매를 결정하지 않는다. 개발은 맥북, 상시 API·DB 운영은 Windows VM으로 역할을 나눈다.

## 2. Mac 개발 환경

1. 지원되는 Xcode 설치 및 최초 실행.
2. 라이선스·추가 플랫폼 구성요소 설치.
3. Command Line Tools가 실제 Xcode 경로를 가리키는지 확인.
4. 저장소와 같은 Node/npm 설치.
5. 프로젝트 요구에 맞는 Ruby/CocoaPods 환경 준비.
6. Git에서 특정 commit checkout, npm ci.
7. Apple 계정 로그인·Team 접근 확인.

macOS terminal:

```bash
xcodebuild -version
xcode-select -p
node --version
npm --version
pod --version
npm ci
npm run check
```

toolchain 버전을 기록한다. 원인을 모른 채 Ruby·Pods를 전역 최신 버전으로 교체하지 않는다. 권한 문제 때문에 sudo pod install을 반복하지 않는다.

## 3. 앱 식별자와 버전

현재 app.json에는 ios.bundleIdentifier가 없다. 실제 값을 확정한 뒤 기존 설정에 병합한다.

```json
{
  "expo": {
    "version": "<PUBLIC_VERSION>",
    "ios": {
      "bundleIdentifier": "<IOS_BUNDLE_ID>",
      "buildNumber": "1"
    }
  }
}
```

bundle ID·Team·App Store Connect 앱이 서로 일치해야 한다. 공개 버전과 내부 buildNumber를 구분하며 업로드 이력과 충돌하지 않게 증가시킨다. eas.json의 autoIncrement가 로컬 Xcode Archive의 버전을 관리한다고 가정하지 않는다.

## 4. 네이티브 프로젝트 생성

API URL을 실제 HTTPS 주소로 설정한 뒤 생성한다.

```bash
export EXPO_PUBLIC_API_URL='https://<API_HOST>'
npx expo prebuild --platform ios
```

생성된 `.xcworkspace` 이름을 확인한다. CocoaPods 프로젝트라면 `.xcodeproj` 대신 workspace를 연다. 필요하면 ios 디렉터리에서 프로젝트에 맞는 pod install 절차를 수행한다.

Android와 마찬가지로 generated native 관리 정책을 정한다. prebuild --clean으로 수동 signing·entitlement 수정이 사라질 수 있다. 재현 가능한 app config/plugin 또는 native 버전 관리를 선택한다.

## 5. Signing 준비

처음에는 Xcode의 Signing & Capabilities에서 실제 Team으로 수동 확인한다.

- bundle identifier 일치
- 필요한 capability만 활성화
- 개발 실기기용 서명과 App Store 배포용 서명 구분
- 인증서·private key·provisioning profile 관계 확인
- profile 만료일·인증서 만료일 기록
- 자동 서명 사용 여부와 나중의 CI 인증 방식 기록

인증서 파일만 있고 private key가 없으면 다른 Mac에서 서명할 수 없다. 배포 인증서/private key export와 복구 사본을 보호한다. Apple ID 암호를 문서나 CI YAML에 적지 않는다. API key를 사용할 경우 Team 권한과 필요 최소 역할을 확인한다.

## 6. 실기기 개발 테스트

1. iPhone 연결·기기 신뢰·필요한 Developer Mode 설정.
2. Xcode에서 해당 기기를 선택해 실행.
3. 개발 모드에서 API·검색·채팅·링크 확인.
4. 앱 권한 요청이 실제 기능과 맞는지 확인.
5. 릴리스 테스트는 별도로 수행한다.

iOS simulator 성공만으로 실기기·서명·스토어 준비가 끝나지 않는다.

## 7. Release Archive

1. 실제 API URL로 빌드 환경변수 설정이 반영되는지 확인한다.
2. Xcode Scheme의 Archive 구성이 Release인지 확인한다.
3. 앱 version/buildNumber와 release notes를 확정한다.
4. 시뮬레이터가 아닌 배포용 device destination 선택.
5. Product → Archive 실행.
6. Organizer에서 validation·서명·bundle ID 확인.
7. Distribute App → App Store Connect 흐름으로 업로드.
8. 처리 완료 후 App Store Connect에서 build를 확인한다.

터미널 환경변수가 GUI에서 실행된 Xcode에 자동 전달되지 않을 수 있다. Archive build script가 보는 EXPO_PUBLIC_API_URL을 별도로 설정하고 최종 앱의 실제 요청 주소를 검증한다. 비밀값은 앱 bundle에 넣지 않는다.

향후 CLI 자동화 형태 예시:

```bash
xcodebuild \
  -workspace <IOS_WORKSPACE_PATH> \
  -scheme <IOS_SCHEME> \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath <PRIVATE_ARCHIVE_PATH> \
  archive
```

workspace·scheme은 생성된 프로젝트에서 확인한다. exportArchive에 필요한 ExportOptions.plist·signing 방식은 실제 Xcode 버전에 맞춰 작성한다. 예시 명령 하나가 업로드까지 자동 처리하는 것은 아니다.

## 8. TestFlight

- App Store Connect 앱에 빌드를 연결.
- 수출 규정·암호화 질문에 실제 기능 기준으로 답변.
- 내부 테스터부터 설치.
- 외부 테스트가 필요하면 해당 심사 절차 진행.
- Metro를 끄고 TestFlight 설치본에서 LTE/와이파이 검증.
- API 중단·TLS 오류·빈 검색·업데이트·백그라운드 복귀 테스트.
- crash와 feedback을 수집하고 수정 build 업로드.

실기기가 없으면 실기기 항목은 미완료로 남긴다. simulator 결과로 대체 체크하지 않는다.

## 9. 스토어 정보와 심사

준비할 것:

- 앱 이름·부제·설명·키워드·카테고리
- 지원 URL·개인정보처리방침 URL
- 요구되는 기기 크기의 실제 스크린샷·앱 아이콘
- 연령 등급·콘텐츠 권리·배포 국가
- App Privacy: 실제 수집·연결·추적 여부
- 사용 SDK의 privacy manifest·required reason API 적용 여부
- 로그인 필요 시 심사용 계정과 접근 설명
- 계정 생성 기능이 있다면 삭제 기능 등 관련 심사 요구 검토
- 심사 노트: 설명서 검색·출처·질문 경로와 필요한 테스트 안내

이 항목은 준비 체크리스트이며 현재 법적 고지나 정책 준수 완료를 선언하는 문서가 아니다. 제출 직전 Apple 공식 요구와 App Store Connect 표시를 확인한다. 집 서버는 심사 기간에도 켜두고 외부 접속을 유지한다.

## 10. Mac CI runner로 이전

수동 Archive·업로드가 성공한 뒤 다음을 진행한다.

1. 전용 macOS 사용자·러너 label 등록.
2. checkout·Node·Pods·Xcode 버전 고정.
3. 작업용 임시 keychain 생성·필요 인증서만 주입.
4. provisioning profile·업로드 키 최소 권한 주입.
5. Archive→검증→업로드→결과 보관.
6. 작업 종료 후 임시 keychain·profile·민감 파일 정리.
7. 서명 secret이 있는 runner에 신뢰되지 않는 코드 실행 금지.

자동 서명인지 수동 profile 관리인지 정해 한 경로로 재현한다. CI 실패 원인을 해결한다고 인증서 검증·서명 검사를 끄지 않는다.

## 문제 해결

| 증상 | 확인 |
| --- | --- |
| Signing 실패 | Team·bundle ID·certificate private key·profile |
| Archive destination 없음 | Xcode 플랫폼 설치·device 대상 |
| Pods build 실패 | Expo native 호환·lockfile·Xcode·Ruby |
| TestFlight API 실패 | Archive 환경변수·TLS 체인·API 공개 상태 |
| 업로드 거부 | build 중복·SDK 요구·심볼·서명 오류 |
| 심사 중 접속 실패 | Windows 절전·공인 IP 변경·인증서·백엔드 |

## 완료 조건

- [x] MacBook 보유 확인
- [ ] 보유 MacBook의 macOS·Xcode 호환성 확인 및 설치
- [ ] 자체 장비 Release Archive·서명 성공
- [ ] 서명 자산 복구 가능
- [ ] TestFlight 실기기·Metro 없는 실행 성공
- [ ] 실제 동작에 맞는 privacy·스토어 정보
- [ ] 심사·공개 후 설치본 확인
- [ ] 같은 Mac CI에서 다음 버전 재현

참고: [Expo 로컬 릴리스 빌드](https://docs.expo.dev/guides/local-app-production/), [Apple 빌드 업로드](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/), [App Privacy](https://developer.apple.com/app-store/app-privacy-details/), [제출 예정 요구 사항](https://developer.apple.com/news/upcoming-requirements/).
