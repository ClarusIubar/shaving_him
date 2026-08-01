# 📋 릴리스 패치노트 (Release Patch Notes)

> **프로젝트**: `shaving_him`  
> **웹 애플리케이션**: [https://clarusiubar.github.io/shaving_him/](https://clarusiubar.github.io/shaving_him/)  
> **최신 버전**: `v1.0.2-enhanced` (2026-08-01)  

---

## 🚀 버전별 패치노트 요약 (Version History)

- **[v1.0.2-enhanced](#v102-enhanced-2026-08-01)**: UX 브러시 휠 동기화, PNG/WEBP 알파 채널 가드, 캔버스 fillStyle 렌더링 최적화, 게임 세션 상태 얼리 리턴 가드
- **[v1.0.1-refactored](#v101-refactored-2026-07-30)**: 게임 리스타트 털 복원, ObjectURL 메모리 누수 방지, Port-Adapter 시그니처 표준화, 동적 피부 톤 추출
- **[v1.0.0-modular](#v100-modular-2026-07-27)**: 모놀리식 코드 5계층 클린 아키텍처 리팩토링 및 브라우저 실시간 1-Photo 파이프라인 탑재

---

## 💎 v1.0.2-enhanced (2026-08-01)

### 📌 개요
2차 정밀 코드 리뷰 결과 도출된 마우스 휠 조절 시 HUD 브러시 버튼 비동기화 현상을 해결하고, 투명 PNG/WEBP 업로드 시 알파 채널 예외 처리, CanvasRenderer 2D fillStyle 재지정 병목 제거 및 게임 오버 상태 조작 차단을 완료했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **UX 개선** | **[#15](https://github.com/ClarusIubar/shaving_him/issues/15)** | 마우스 휠 조절 시 커서 크기는 변경되나 HUD 버튼 active 스타일 미동기화 | `BrushController`에 `onRadiusChange` 콜백을 탑재하여 `HUD.updateBrushSizeUI()` 연동 완료 | `app.test.js` |
| **알파 가드** | **[#16](https://github.com/ClarusIubar/shaving_him/issues/16)** | 투명 PNG/WEBP 알파 채널 피셀(a=0)이 피부 톤 추출 시 어두운 털로 오인됨 | `StagePipeline.calculateAverageSkinTone` 및 Processor에 `a >= 128` 불투명 조건 가드 추가 | `adapters.test.js` |
| **성능 최적화**| **[#17](https://github.com/ClarusIubar/shaving_him/issues/17)** | `CanvasRenderer.renderSingleCell` 내 매 셀마다 불필요한 `fillStyle` 재할당 병목 | 셀 백그라운드 Rect 채우기와 텍스트 `fillText` 렌더링 fillStyle 설정 분리 | 12개 수트 PASS (78ms) |
| **안정성 강화**| **[#18](https://github.com/ClarusIubar/shaving_him/issues/18)** | 게임 종료(WON/TIMEOUT) 상태 후 드래그 시 `shave` 로직 불필요 진입 | `GameOrchestrator.shave` 상단에 `SessionStatus.RUNNING` 얼리 리턴 가드 추가 | `app.test.js` |

> **Parent Issue**: [#14](https://github.com/ClarusIubar/shaving_him/issues/14) `[TSK-003-00] v1.0.1 2차 코드 리뷰 결과 기반 UX 동기화, 알파 채널 가드 및 렌더링 최적화` (CLOSED)

---

## 🌟 v1.0.1-refactored (2026-07-30)

### 📌 개요
1차 코드 리뷰 중 도출된 올클리어 후 게임 재시작 버그, 사진 업로드 시 브라우저 Blob URL 메모리 누수, Port 인터페이스 메서드 파라미터 불일치, 하드코딩된 피부 톤 RGB 처리 문제를 해결했습니다.

### 🛠️ 세부 변경 내역

| 구분 | 관련 이슈 | 버그 원인 및 이슈 내용 | 구현된 해결책 (Solution) | 테스트 및 검증 |
| :--- | :---: | :--- | :--- | :---: |
| **로직 수정** | **[#10](https://github.com/ClarusIubar/shaving_him/issues/10)** | WON(올클리어) 후 `restart()` 시 이미 비워진 `hairGrid.data`를 참조하여 털이 0개로 시작됨 | `GameOrchestrator`에 `currentStageData`를 보관하고 리스타트 시 재사용 | `app.test.js` |
| **메모리 방지**| **[#11](https://github.com/ClarusIubar/shaving_him/issues/11)** | 사진 반복 업로드 시 `URL.createObjectURL`로 생성된 Blob이 해제되지 않음 | `HUD` 내 `previewUrl` 상태를 관리하고 생성 전 `URL.revokeObjectURL()` 호출 | 수동 업로드 검증 |
| **시그니처** | **[#12](https://github.com/ClarusIubar/shaving_him/issues/12)** | Port 인터페이스의 메서드 파라미터가 Adapter 구현체와 불일치함 | `diff-engine.port.js` 및 `image-processor.port.js` 메서드 시그니처 표준화 | `adapters.test.js` |
| **동적 샘플링**| **[#13](https://github.com/ClarusIubar/shaving_him/issues/13)** | 피부 톤 평탄화 시 RGB `[210, 180, 150]` 고정값 사용 | `StagePipeline`에 `calculateAverageSkinTone(colors)` 동적 샘플링 구현 | `adapters.test.js` |

> **Parent Issue**: [#9](https://github.com/ClarusIubar/shaving_him/issues/9) `[TSK-002-00] v1.0 코드 리뷰 결과 기반 버그 수정 및 아키텍처 리팩토링` (CLOSED)

---

## 🏛️ v1.0.0-modular (2026-07-27)

### 📌 개요
단일 모놀리식 `index.html` (1.8MB) 코드베이스를 순수 5계층 클린 아키텍처(Interface, Application, Domain, Ports, Adapters)로 전면 리팩토링하고, 사진 1장으로 브라우저 실시간 스테이지를 생성하는 1-Photo 파이프라인을 구축했습니다.

### 🛠️ 세부 변경 내역
- **[#1](https://github.com/ClarusIubar/shaving_him/issues/1)** Roadmap: Modular Architecture Refactoring & In-Browser 1-Photo Pipeline
- **[#2](https://github.com/ClarusIubar/shaving_him/issues/2)** Core Domain Layer Implementation (`HairGrid`, `ScoreCalculator`, `ShaveSession`)
- **[#3](https://github.com/ClarusIubar/shaving_him/issues/3)** Ports & Adapters Layer Implementation (`DiffEngine`, `ImageProcessor`, `AsciiConverter`)
- **[#4](https://github.com/ClarusIubar/shaving_him/issues/4)** Application Orchestrator & Stage Pipeline (`GameOrchestrator`, `StagePipeline`)
- **[#5](https://github.com/ClarusIubar/shaving_him/issues/5)** Interface Layer & Modern UI Shell (`CanvasRenderer`, `BrushController`, `HUD`)
- **[#7](https://github.com/ClarusIubar/shaving_him/issues/7)** Real-Time Responsiveness & 60FPS Performance Optimization
- **[#8](https://github.com/ClarusIubar/shaving_him/issues/8)** E2E Performance Refactoring: Eliminating Layout Thrashing & GPU Compositing
