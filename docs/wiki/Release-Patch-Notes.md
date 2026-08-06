# 📋 릴리스 패치노트 (Release Patch Notes)

> **프로젝트**: `shaving_him`  
> **웹 애플리케이션**: [https://clarusiubar.github.io/shaving_him/](https://clarusiubar.github.io/shaving_him/)  
> **최신 버전**: `v1.0.7-stabilized` (2026-08-06)  

---

## 🚀 버전별 패치노트 요약 (Version History)

- **[v1.0.7-stabilized](#v107-stabilized-2026-08-06)**: HUD 잔여 표시 결함 수정, CI 품질 게이트 자동 강제, package.json 표준화, 옵서버 해지 경로, 파티클 잔상/정지 해소, 모바일 첫 터치 무시 및 브러시 반경 상한 회귀 수정, 저장소 위생 정리
- **[v1.0.6-hardened](#v106-hardened-2026-08-06)**: 코드 리뷰 기반 정합성 결함 수정, GridGeometry 기하 통합, 포트/어댑터 경계 강화(DIP·OCP·SRP·ISP·LSP), Fail-Closed 배선 및 라인/함수 100% (브랜치 90.72%) 커버리지 회복
- **[v1.0.5-quality](#v105-quality-2026-08-05)**: ES 모듈 readyState 바인딩, 4단계 실시간 프로그레스 UI, 엄격 RGR TDD 가버넌스 및 라인/함수 100% (브랜치 91.32%) 커버리지 증명
- **[v1.0.4-enhanced](#v104-enhanced-2026-08-05)**: Web Audio API 사운드 이펙트(면도음, 콤보음, 승리 펜파레), 모바일 터치 궤적 보간, 털 흩날림 파티클 FX 및 PNG 저장
- **[v1.0.3-enhanced](#v103-enhanced-2026-08-04)**: 키보드 단축키 UX, 콤보 디스플레이, High-DPI 렌더링 및 이미지 로드 에러 예외 가드

---

## 💎 v1.0.7-stabilized (2026-08-06)

### 📌 개요
v1.0.6-hardened 머지 후 `origin/main`을 재검증하는 과정에서 발견된 잔여 결함과 인프라 공백을 처리한 라운드입니다. HUD의 남은 털/진행률 표시가 필드명 불일치로 죽어 있던 문제를 고쳤고, 그동안 사람 기억에만 의존하던 AGENTS.md 품질 게이트(Line 100% / Func 100% / Branch >= 90%)를 GitHub Actions CI로 자동 강제하도록 만들었습니다. 파티클 잔상·정지, 모바일 첫 터치 무시, 옵서버 해지 불가, 저장소에 남아있던 기계-로컬 산출물과 5.5MB 아티팩트를 모두 정리했고, 검증 막바지에 GridGeometry 도입 당시 조용히 좁아졌던 브러시 반경 상한(7→5) 회귀도 추가로 발견해 복구했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **HUD 표시 결함** | **[#45](https://github.com/ClarusIubar/shaving_him/issues/45)** | 생성자가 할당하는 `remainEl`/`barFillEl`과 `update()`가 참조하는 `hairCountEl`/`clearedPctEl`이 서로 다른 이름이라, 남은 털 개수와 진행률 바가 갱신되지 않음 | 렌더 메서드가 실제 할당된 필드(`remainEl`, `barFillEl`)를 참조하도록 정정, DOM 반영 회귀 테스트 고정 | 실제 세션 스냅샷 기반 DOM 반영 테스트 PASS |
| **CI 품질 게이트 부재** | **[#46](https://github.com/ClarusIubar/shaving_him/issues/46)** | `.github/workflows` 부재로 `node --test`가 CI에서 한 번도 실행되지 않아, 커버리지 게이트가 사람 기억에만 의존. 직전 라운드가 3개 게이트 모두 미달인 채 머지된 전례 | `.github/workflows/test.yml` 신설, `npm run coverage`가 임계값 미달 시 non-zero 종료하여 PR을 자동 차단 | CI 통과가 모든 후속 PR의 필수 조건으로 강제됨 |
| **표준 실행 명령 부재** | **[#47](https://github.com/ClarusIubar/shaving_him/issues/47)** | `package.json`이 없어 `npm test` 표준 진입점이 없고 검증 명령 표기가 문서마다 갈림 | `package.json` 신설(`type: module`, `test`/`coverage` 스크립트) | `npm test`, `npm run coverage` 통과 |
| **저장소 위생** | **[#48](https://github.com/ClarusIubar/shaving_him/issues/48)** | 기계-로컬 거버넌스 산출물 16개와 `after.html`/`before.html`(각 2.7MB) 등 5.5MB 아티팩트가 추적됨. 위키 저장소 오염 사고의 원인이었던 바로 그 파일들 | `.agent-governance-local/`, `.local/`, `after.html`, `before.html`, `tools/analysis.json` 추적 해제 및 gitignore 등록 | `git ls-files` 대상 0건 확인 |
| **옵서버 해지 불가** | **[#49](https://github.com/ClarusIubar/shaving_him/issues/49)** | `onUpdate`/`onGameOver`가 등록만 가능하고 해지 수단이 없어 향후 재부트스트랩 시 구독 누적 위험 | `GameOrchestrator.offUpdate()`/`offGameOver()` 추가 | 해지 후 미호출 테스트 PASS |
| **파티클 잔상/정지** | **[#50](https://github.com/ClarusIubar/shaving_him/issues/50)** | 파티클 갱신·렌더가 더티 셀 렌더 경로에서만 호출되어, 드래그를 멈추면 애니메이션이 정지하고 이전 위치가 지워지지 않아 잔상이 누적 | 파티클 전용 rAF 루프(`ensureParticleLoop`)로 입력과 무관하게 수명 진행, 셀별 마지막 위치를 기억해 다음 프레임에 복원 | 입력 없는 프레임 진행 시 파티클 소멸 테스트 PASS |
| **main.js 브랜치 커버리지 · 디미터** | **[#51](https://github.com/ClarusIubar/shaving_him/issues/51)** | 부트스트랩 분기 상당수가 미실행(Branch 75.93%)이었고, 사용자 영향 결함 3건이 전부 이 경로에서 유출. `orchestrator.currentStageData`/`.session` 직접 참조 잔존 | DOM 요소 부재 경로별 테스트 보강(Branch 91.94%↑), `notifyUpdate` 페이로드에 stageData/hairGrid 포함시켜 내부 참조 제거 | `main.js` Branch >= 90% 달성 |
| **모바일 첫 터치 무시** | **[#52](https://github.com/ClarusIubar/shaving_him/issues/52)** | 캔버스가 `display:none`일 때 캐시된 `getBoundingClientRect()`가 스테이지 시작 후에도 갱신되지 않아, `touchstart`(mouseenter 미발동)로 시작하는 모바일 첫 면도가 항상 무시됨 | `BrushController.invalidateRect()` 도입, `touchstart`에서도 rect 강제 갱신, `main.js`가 스테이지 시작 시 호출 | 모바일 첫 터치 좌표 해석 테스트 PASS |
| **브러시 반경 상한 회귀** | **[#61](https://github.com/ClarusIubar/shaving_him/issues/61)** | `#37`(GridGeometry 도입)에서 `setRadius()` 상한이 7에서 5로 조용히 좁아짐. "15x15" 버튼과 키보드 `4`는 여전히 반경 7을 요청하나 실제로는 11x11로 clamp | clamp 상한을 7로 복원 | 브라우저 실측: 커서 font-size 72px(반경 7) 확인 |
| **품질 게이트** | **[#44](https://github.com/ClarusIubar/shaving_him/issues/44)** | 직전 라운드 종료 시 Line 100% / Func 100% / Branch 93.25%였으나 CI 미강제로 재발 가능 상태 | 전 항목 CI 자동 강제로 전환 | **88 Tests 100% PASS** |

> **Parent Issues**: [#44](https://github.com/ClarusIubar/shaving_him/issues/44) `[TSK-008-00]`, [#60](https://github.com/ClarusIubar/shaving_him/issues/60) `[TSK-009-00]`

---

## 💎 v1.0.6-hardened (2026-08-06)

### 📌 개요
`origin/main` 기준 아키텍처·SOLID·Interface-Locality·TDD·SDD 5개 축 코드 리뷰 결과를 반영한 라운드입니다. 렌더링 신호 유실과 포인터 경계 이탈 결함을 제거하고, 그리드 기하 정보를 `GridGeometry` 값 객체로 통합했으며, 조용한 폴백(silent fallback)을 Fail-Closed 계약으로 전환했습니다. 후속 검증 과정에서 HUD 점수 표시와 게임 시작 버튼이 동작하지 않던 잠복 결함을 추가로 발견해 수정했고, AGENTS.md 품질 게이트(**Line 100%**, **Func 100%**, **Branch >= 90%**)를 전 항목 충족 상태로 회복했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **렌더링 결함** | **[#38](https://github.com/ClarusIubar/shaving_him/issues/38)** | `pendingDirtyCells`의 `null`을 "미초기화"와 "전체 재그리기" 두 의미로 겸용하여, rAF 발화 전 부분 갱신이 끼어들면 전체 재그리기 신호가 소실 | `needsFullRedraw` 불리언 플래그로 의도를 분리하고 `pendingDirtyCells`는 항상 배열로 유지 | rAF 지연 재현 테스트 PASS |
| **입력 경계 결함** | **[#37](https://github.com/ClarusIubar/shaving_him/issues/37)** | `clientToGrid()`의 `{-1,-1}` 센티널이 Bresenham 보간에 좌표로 유입되어, 캔버스 밖 드래그 시 좌상단까지 대각선 오면도 발생 | `handlePointerMove` 진입부에서 범위 이탈 좌표를 조기 반환하고 마지막 좌표를 리셋 | 경계 이탈 호출 0회 검증 PASS |
| **기하 통합** | **[#37](https://github.com/ClarusIubar/shaving_him/issues/37)** | 그리드 치수·셀 크기가 다수 모듈에 중복 선언되고 일부는 인자 순서가 뒤집혀 무증상 오동작 위험. 이를 특정 값 쌍(219, 280) 자동 보정으로 우회 | `GridGeometry.default()` / `fromStageData()` 정적 팩토리를 단일 진실 공급원으로 삼고, 값 기반 코어션을 제거해 명시적 계약으로 전환 | `grid-geometry` 100% Branch PASS |
| **Fail-Closed 배선** | **[#40](https://github.com/ClarusIubar/shaving_him/issues/40)** | 어댑터 누락 시 빈 스테이지·기본 살색을 반환하는 조용한 폴백으로 인해 배선 오류가 정상 동작으로 위장 | `StagePipeline`, `GameOrchestrator`, `JsonSourceHandler`, `ImageSourceHandler` 생성자에 협력자 검증을 추가하여 즉시 실패 | Fail-Closed 계약 테스트 PASS |
| **SRP 완결** | **[#41](https://github.com/ClarusIubar/shaving_him/issues/41)** | `StagePipeline`에 픽셀 연산 위임 래퍼가 잔존하여 털 판정 책임이 계층에 분산 | `calculateAverageSkinTone` 래퍼를 제거하고 판정 규칙 일체를 `DeltaDiffEngineAdapter`가 단독 소유 | `stage-pipeline` 100% Branch PASS |
| **승리 규칙 단일화** | **[#39](https://github.com/ClarusIubar/shaving_him/issues/39)** | `HUD`가 `GamePolicy`를 주입받지 않아 인라인 복제 규칙만 실행되고 `GamePolicy`는 사실상 미사용 | `HUD` 생성자에 `GamePolicy`를 주입하고 인라인 복제를 제거. 규칙 리터럴 부재를 소스 스캔 테스트로 고정 | 규칙 중복 0건 검증 PASS |
| **HUD 점수 결함** | **[#39](https://github.com/ClarusIubar/shaving_him/issues/39)** | `update(snapshot)`이 중복 정의되어 뒤 정의가 앞 정의를 가림. 살아남은 쪽이 `scoreEl`을 갱신하지 않아 점수 표시가 0에 고정. 죽은 정의에는 미정의 식별자 참조(`enabled`) 잠복 | 두 정의를 단일 메서드로 병합하고 점수 갱신을 복원. 메서드 중복 선언 금지를 테스트로 고정 | 점수 렌더링 회귀 테스트 PASS |
| **시작 버튼 결함** | **[#39](https://github.com/ClarusIubar/shaving_him/issues/39)** | `HUD.initStartModalEvents()`가 인자를 받지 않는데 `main.js`는 콜백 2개를 전달. 프리셋/사진 시작 버튼에 핸들러가 바인딩되지 않아 게임 시작 불가 | `initStartModalEvents(onPresetSelected, onCustomFileSelected)`가 두 버튼을 실제로 바인딩하도록 수정 | 시작 배선 E2E 테스트 PASS |
| **문서 손실 복구** | **[#34](https://github.com/ClarusIubar/shaving_him/issues/34)** | 스테일 템플릿을 내장한 위키 생성 스크립트 재실행으로 v1.0.4·v1.0.5 패치노트 섹션이 2회 소실 | 위키를 정본 상태로 복구하고, 손실 원인인 스냅샷 내장 생성 스크립트를 저장소에서 제거 | 위키 정본 복구 완료 |
| **품질 게이트** | **[#34](https://github.com/ClarusIubar/shaving_him/issues/34)** | 직전 라운드에서 Line 98.25% / Func 97.37% / Branch 87.68%로 3개 게이트 전부 미달 | 계약·경계·회귀 테스트를 보강하여 **Line 100%**, **Func 100%**, **Branch 90.72%** 회복 | **64 Tests 100% PASS** |

> **Parent Issue**: [#34](https://github.com/ClarusIubar/shaving_him/issues/34) `[TSK-007-00] v1.0.6 코드 리뷰 기반 정합성 결함 수정, 그리드 기하 통합 및 포트/어댑터 경계 강화`

---

## 💎 v1.0.5-quality (2026-08-05)

### 📌 개요
v1.0.5 라운드에서는 ES 모듈 부트스트랩 시점 버그 전면 해결, 4단계 실시간 사진 변환 프로그레스 바 UI 구축, 엄격한 Red-Green-Refactor (RGR) TDD 가버넌스 전역 등록, 그리고 16개 전체 모듈 **100.00% 라인 커버리지**, **100.00% 함수 커버리지**, **91.32% 브랜치 커버리지**를 완벽하게 증명했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **초기화 버그** | **[#30](https://github.com/ClarusIubar/shaving_him/issues/30)** | `<script type="module">` 로딩 시 DOM parsing 완료 후 평가되어 `DOMContentLoaded` 이벤트 미발화로 시작 버튼 무반응 | `src/main.js`에 `document.readyState` 동기 점검을 적용하여 0ms 지연 없이 즉시 이벤트 바인딩 완료 | `main.js` Smoke PASS |
| **로딩 UX** | **[#31](https://github.com/ClarusIubar/shaving_him/issues/31)** | 이미지 업로드 시 중간 연산 처리 표현 없이 고정되어 작동 중단 착오 유발 | 4단계 프로그레스 바(`0%➔25%➔50%➔75%➔95%➔100%`) 피드백 메시지 및 `16ms yieldThread` 적용 | `stage-pipeline.js` Integration PASS |
| **TDD 가버넌스** | **[#32](https://github.com/ClarusIubar/shaving_him/issues/32)** | 단순 땜빵식 테스트 추가 방지 및 실패 테스트 선 작성을 의무화하는 가버넌스 수립 | 전역/워크스페이스 규칙 파일([`AGENTS.md`](file:///d:/Code305/shaving_him/AGENTS.md), [`.agents/rules/tdd-rgr.md`](file:///d:/Code305/shaving_him/.agents/rules/tdd-rgr.md), `C:\Users\PC\.gemini\config\AGENTS.md`) 저장 | **Strict RGR Enforced** |
| **품질 커버리지**| **[#33](https://github.com/ClarusIubar/shaving_him/issues/33)** | 단위, 통합, 회귀, 스모크, E2E 전 영역 품질 및 라인/함수/브랜치 커버리지 검증 필요 | 전체 16개 모듈 **Line 100%**, **Func 100%**, **Branch 91.32%** 실측 달성 | **34 Tests 100% PASS (331ms)** |

> **Parent Issue**: [#29](https://github.com/ClarusIubar/shaving_him/issues/29) `[TSK-006-00] v1.0.5 ES 모듈 readyState 바인딩, 4단계 프로그레스 UI, 엄격 RGR TDD 가버넌스 및 100% 커버리지` (CLOSED)

---

## 💎 v1.0.4-enhanced (2026-08-05)

### 📌 개요
v1.0.4 라운드에서는 Web Audio API 기반 순수 자바스크립트 사운드 이펙트(면도 소리, 콤보음, 승리 펜파레) 및 HUD 음소거 토글, 모바일 터치 포인터 궤적 Bresenham 보간 및 새로고침 제스처 차단, CanvasRenderer 60FPS 면도 털 파티클 흩날림 시각 이펙트, 완성된 아스키 아트 캔버스 PNG 저장 기능을 완료했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **사운드 FX** | **[#25](https://github.com/ClarusIubar/shaving_him/issues/25)** | 외부 MP3/WAV 파일 의존 시 로딩 지연 및 CORS 오류 발생 가능 | `SoundEffects` 클래스를 작성하여 `Web Audio API` 기반 0B 무부하 이펙트음 및 HUD 토글 버튼 구현 | `app.test.js` |
| **터치 UX** | **[#26](https://github.com/ClarusIubar/shaving_him/issues/26)** | 모바일 터치 시 빠르게 긁으면 뜸성뜸성 깎이거나 새로고침 제스처 간섭 | `BrushController`에 Bresenham 선 보간 알고리즘 적용 및 `preventDefault()` 제스처 차단 | `app.test.js` |
| **시각 이펙트**| **[#27](https://github.com/ClarusIubar/shaving_him/issues/27)** | 털 제거 시 단순 소멸하여 아케이드 특유의 타격감 부족 | `CanvasRenderer`에 60FPS 아스키 털 파티클(`*`, `.`) 흩날림 및 페이드아웃 시스템 구축 | 18개 수트 PASS (78ms) |
| **결과 저장**| **[#28](https://github.com/ClarusIubar/shaving_him/issues/28)** | 완벽 면도 후 완성된 아스키 아트를 이미지로 소장/공유 수단 부재 | `CanvasRenderer.exportPng` 메서드 및 게임 종료 모달 `📸 이미지 저장` 버튼 연동 완료 | `adapters.test.js` |

> **Parent Issue**: [#24](https://github.com/ClarusIubar/shaving_him/issues/24) `[TSK-005-00] v1.0.4 Web Audio 사운드 이펙트, 모바일 터치 보간, 털 파티클 FX 및 PNG 결과 저장` (CLOSED)
- **[v1.0.2-enhanced](#v102-enhanced-2026-08-01)**: UX 브러시 휠 동기화, PNG/WEBP 알파 채널 가드, 캔버스 fillStyle 렌더링 최적화, 게임 세션 상태 얼리 리턴 가드
- **[v1.0.1-refactored](#v101-refactored-2026-07-30)**: 게임 리스타트 털 복원, ObjectURL 메모리 누수 방지, Port-Adapter 시그니처 표준화, 동적 피부 톤 추출
- **[v1.0.0-modular](#v100-modular-2026-07-27)**: 모놀리식 코드 5계층 클린 아키텍처 리팩토링 및 브라우저 실시간 1-Photo 파이프라인 탑재

---

## 💎 v1.0.3-enhanced (2026-08-04)

### 📌 개요
v1.0.3 라운드에서는 키보드 단축키(1-4 키 브러시 크기 변경, R 키 게임 재시작), 드롭존 호버 UX 개선, HUD 연속 면도 콤보(Combo) 디스플레이, 커스텀 이미지 생성 로딩 스피너, Retina/High-DPI 디스플레이 텍스트 선명도 최적화, 손상된 이미지 load error 예외 가드를 완료했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **UX 개선** | **[#20](https://github.com/ClarusIubar/shaving_him/issues/20)** | 마우스 조작 외 키보드 단축키 미비 및 드롭존 호버 스타일 일관성 부족 | `1-4` 키 브러시 크기 변경, `R` 키 재시작 탑재 및 `.drag-over` 드롭존 스타일 추가 | `app.test.js` |
| **UI 피드백** | **[#21](https://github.com/ClarusIubar/shaving_him/issues/21)** | 연속 면도 콤보 미표시 및 사진 변환 시 로딩 인디케이터 부재 | HUD에 `🔥 Combo!` 배지 연동 및 `showLoading/hideLoading` 스피너 탑재 | `app.test.js` |
| **성능/화질**| **[#22](https://github.com/ClarusIubar/shaving_him/issues/22)** | 고해상도(Retina/4K) 모니터에서 텍스트 픽셀 미세 블러 현상 발생 가능 | `CanvasRenderer` 초기화 시 `window.devicePixelRatio` 스케일링 적용 | 15개 수트 PASS (83ms) |
| **예외 가드**| **[#23](https://github.com/ClarusIubar/shaving_him/issues/23)** | 손상되거나 0px 해상도 이미지 입력 시 미처리 Promise 거부 발생 위험 | `CanvasImageProcessorAdapter`에 `img.onerror` 및 `naturalWidth` 0px 가드 구현 | `adapters.test.js` |

> **Parent Issue**: [#19](https://github.com/ClarusIubar/shaving_him/issues/19) `[TSK-004-00] v1.0.3 키보드 단축키 UX, 콤보 디스플레이, High-DPI 렌더링 및 이미지 예외 처리` (CLOSED)

---

## 🌟 v1.0.2-enhanced (2026-08-01)

### 📌 개요
2차 정밀 코드 리뷰 결과 도출된 마우스 휠 조절 시 HUD 브러시 버튼 비동기화 현상을 해결하고, 투명 PNG/WEBP 업로드 시 알파 채널 예외 처리, CanvasRenderer 2D fillStyle 재지정 병목 제거 및 게임 오버 상태 조작 차단을 완료했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **UX 개선** | **[#15](https://github.com/ClarusIubar/shaving_him/issues/15)** | 마우스 휠 조절 시 커서 크기는 변경되나 HUD 버튼 active 스타일 미동기화 | `BrushController`에 `onRadiusChange` 콜백을 탑재하여 `HUD.updateBrushSizeUI()` 연동 완료 | `app.test.js` |
| **알파 가드** | **[#16](https://github.com/ClarusIubar/shaving_him/issues/16)** | 투명 PNG/WEBP 알파 채널 피셀(a=0)이 피부 톤 추출 시 어두운 털로 오인됨 | `StagePipeline.calculateAverageSkinTone` 및 Processor에 `a >= 128` 불투명 조건 가드 추가 | `adapters.test.js` |
| **성능 최적화**| **[#17](https://github.com/ClarusIubar/shaving_him/issues/17)** | `CanvasRenderer.renderSingleCell` 내 매 셀마다 불필요한 `fillStyle` 재할당 병목 | 셀 백그라운드 Rect 채우기와 텍스트 `fillText` 렌더링 fillStyle 설정 분리 | 15개 수트 PASS (83ms) |
| **안정성 강화**| **[#18](https://github.com/ClarusIubar/shaving_him/issues/18)** | 게임 종료(WON/TIMEOUT) 상태 후 드래그 시 `shave` 로직 불필요 진입 | `GameOrchestrator.shave` 상단에 `SessionStatus.RUNNING` 얼리 리턴 가드 추가 | `app.test.js` |

> **Parent Issue**: [#14](https://github.com/ClarusIubar/shaving_him/issues/14) `[TSK-003-00] v1.0.1 2차 코드 리뷰 결과 기반 UX 동기화, 알파 채널 가드 및 렌더링 최적화` (CLOSED)

---

## 🌟 v1.0.1-refactored (2026-07-30)

### 📌 개요
1차 코드 리뷰 중 도출된 올클리어 후 게임 재시작 버그, 사진 업로드 시 브라우저 Blob URL 메모리 누수, Port 인터페이스 메서드 파라미터 불일치, 하드코딩된 피부 톤 RGB 처리 문제를 해결했습니다.

> **Parent Issue**: [#9](https://github.com/ClarusIubar/shaving_him/issues/9) `[TSK-002-00] v1.0 코드 리뷰 결과 기반 버그 수정 및 아키텍처 리팩토링` (CLOSED)

---

## 🏛️ v1.0.0-modular (2026-07-27)

### 📌 개요
단일 모놀리식 `index.html` (1.8MB) 코드베이스를 순수 5계층 클린 아키텍처로 전면 리팩토링하고 1-Photo 파이프라인을 구축했습니다.
