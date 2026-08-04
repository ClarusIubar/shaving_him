# 📋 릴리스 패치노트 (Release Patch Notes)

> **프로젝트**: `shaving_him`  
> **웹 애플리케이션**: [https://clarusiubar.github.io/shaving_him/](https://clarusiubar.github.io/shaving_him/)  
> **최신 버전**: `v1.0.3-enhanced` (2026-08-04)  

---

## 🚀 버전별 패치노트 요약 (Version History)

- **[v1.0.3-enhanced](#v103-enhanced-2026-08-04)**: 키보드 단축키 UX, 콤보 디스플레이, High-DPI 렌더링 및 이미지 로드 에러 예외 가드
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
