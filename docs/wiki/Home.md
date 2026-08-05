# 🪒 `shaving_him` 깃허브 공식 위키 (Official Wiki)

<div align="center">

![Version](https://img.shields.io/badge/version-v1.0.6--hardened-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Coverage](https://img.shields.io/badge/coverage-100%25%20Line%20%7C%20100%25%20Func-success?style=for-the-badge)
![Branch Coverage](https://img.shields.io/badge/branch-90.72%25-green?style=for-the-badge)

**사진 1장으로 즐기는 브라우저 실시간 아스키(ASCII) 면도 게임**  
[🌐 라이브 웹 앱 플레이](https://clarusiubar.github.io/shaving_him/) • [📦 GitHub 저장소](https://github.com/ClarusIubar/shaving_him) • [📋 패치노트](Release-Patch-Notes)

</div>

---

## 📚 위키 내비게이션 (Wiki Navigation)

| 위키 문서 | 주요 설명 | 바로가기 |
| :--- | :--- | :---: |
| 📋 **공식 패치노트** | 버전별 패치 내역, 버그 수정 및 GitHub 이슈 링킹 | **[Release Patch Notes](Release-Patch-Notes)** |
| 📐 **구현된 아키텍처 의사결정 명세서** | 패턴 선택/배제 마트릭스, 모듈 책임 및 상호작용 통제 | **[Architecture Decision Matrix](Implemented-Architecture-Decision-Matrix)** |
| 🏛️ **아키텍처 명세서** | 5계층 모듈 구조, 시퀀스 흐름, 레이어 마트릭스 및 검증 게이트 | **[Architecture Specification](Architecture-Specification)** |
| ⚡ **성능 최적화 명세서** | 1D TypedArray, Dirty Region 부분 렌더링, GPU 합성 60 FPS 최적화 | **[Performance Architecture](Performance-Optimization-Architecture)** |

---

## 🌟 주요 시스템 특장점 (Key Features)

### 1. 🖼️ 1-Photo 브라우저 실시간 파이프라인 & 4단계 실시간 피드백
- 털 사진 1장(PNG, JPG, WEBP)만 업로드하면 **서버 없이 브라우저 단에서 1초 이내**에 피부 톤 동적 추출, 털 영역 감지, 아스키 아트 스테이지를 실시간 생성합니다.
- **4단계 프로그레스 바 UI(`0%➔25%➔50%➔75%➔95%➔100%`)** 및 **16ms Thread Yielding**으로 무단 멈춤 없는 쾌적한 UX를 보장합니다.

### 2. 🏛️ 순수 5계층 클린 아키텍처 (Clean 5-Layer Modular Architecture)
- 게임 핵심 도메인(`HairGrid`, `ScoreCalculator`, `ShaveSession`, `GridGeometry`, `GamePolicy`)과 브라우저 DOM/Canvas API 간 **결합도 0%**를 유지하여 Node.js 환경에서 100% 독립 테스트가 가능합니다.
- **Composition Root + Strategy Handler**: 어댑터 조립을 `composition-root.js` 한 곳으로 모으고(DIP), 스테이지 소스는 `StageSourceRegistry` 확장으로 대응합니다(OCP).
- **Fail-Closed 배선**: 협력자가 누락되면 조용한 폴백 대신 즉시 실패하여 설정 오류가 정상 동작으로 위장되지 않습니다.

### 3. ⚡ 60 FPS 고성능 반응성, 파티클 FX & Web Audio 0B 사운드
- **1D Uint8Array 평탄화**: $O(1)$ 고속 접근 및 0B 가비지 컬렉션(GC) 부하 차단.
- **모바일 터치 궤적 보간**: Bresenham 알고리즘 적용 및 화면 터치 제스처 예방.
- **Web Audio 0B 사운드 엔진**: 별도 음원 파일 수신 없이 실시간 면도 소리, 콤보 chime, 승리 펜파레 지원.
- **60 FPS 파티클 FX & 📸 PNG 저장**: 털 조각 흩날림 물리 효과 및 완상 아스키 아트 이미지 소장 다운로드.

---

## 🧪 품질 및 자동화 테스트 현황 (Strict RGR TDD & 100% Coverage)

- **Node.js 공식 테스트 통과율**: **100% (64 / 64 Cases PASS)**
- **라인 커버리지 (Line %)**: **100.00%** (18개 전체 소스 파일)
- **함수 커버리지 (Funcs %)**: **100.00%** (18개 전체 소스 파일)
- **브랜치 커버리지 (Branch %)**: **90.72%** (도메인/어댑터/포트/UI 전 계층 통과)
- **품질 게이트**: AGENTS.md 규정(Line 100% / Func 100% / Branch >= 90%) **전 항목 충족**

```text
✔ StaticJsonStageAdapter - parses raw JSON into StageDataDTO
✔ DeltaDiffEngineAdapter - extracts dark hair positions
✔ CanvasAsciiConverterAdapter - maps color matrix to ASCII grid
✔ StagePipeline - computes dynamic average skin tone and loads custom HTMLImageElement source
✔ StagePipeline - ignores transparent pixels (alpha < 128) in skin tone calculation
✔ CanvasImageProcessorAdapter - rejects zero dimension or invalid image sources
✔ CanvasRenderer - provides exportPng method for PNG snapshot download
✔ StaticJsonStageAdapter - handles fetch status non-ok and falls back to window.EMBEDDED_GAME_DATA
✔ CanvasRenderer - renders full grid and partial dirty region with particles
✔ Abstract Ports - throw unfulfilled contract errors
✔ CanvasImageProcessorAdapter - tests skin smoothing and image loading error guards
✔ StaticJsonStageAdapter - window.EMBEDDED_GAME_DATA priority 1 line 19 execution and error branches
✔ CanvasImageProcessorAdapter - tests FileReader onerror, Image onerror, and Image undefined fallback
✔ CanvasRenderer - tests resize setupCanvas, empty cell background fill, particle decay limit, and exportPng exception handling
✔ CanvasImageProcessorAdapter - tests FileReader undefined error
✔ StagePipeline - loads stage DTO cleanly
✔ GameOrchestrator - loadAndStartStage, shave, and callbacks
✔ BrushController - notifies onRadiusChange callback when setRadius is called
✔ BrushController - interpolates line coordinates during drag movement
✔ GameOrchestrator - ignores shave() when session status is not RUNNING
✔ GameOrchestrator - pause, resume, and startTimer interval callback execution
✔ HUD - manages drag-over class on dragover and dragleave events
✔ HUD - updates combo streak badge display based on snapshot.comboCount
✔ SoundEffects - initializes and toggles enable state correctly
✔ HUD - modal visibility methods showStartModal, hideStartModal, showGameOver, hideOverlay, updateSoundUI, showLoading, hideLoading
✔ BrushController - tests all mouse, touch, wheel, and window events for 100% UI coverage
✔ HUD - tests URL.revokeObjectURL in handleFileSelected
✔ HUD - tests initStartModalEvents, drop zone file upload, updateBrushSizeUI, and null guards
✔ HairGrid - initializes and shaves correctly
✔ ScoreCalculator - calculates streak and bonuses
✔ ShaveSession - state transitions and timer ticks
✔ HairGrid - out of bounds coordinates and cleared percentage
✔ ScoreCalculator - addShave zero count resets streak
✔ ShaveSession - pause, resume, tick timeout, and uninitialized start error
```
