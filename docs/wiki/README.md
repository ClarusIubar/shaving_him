# 🪒 Shaving Him (면도 게임) v1.0

> **1-Photo Dynamic ASCII Shaving Game** with 5-Layer Clean Architecture & Client-Side Image Processing.  
> 🌐 **Live Demo**: [https://clarusiubar.github.io/shaving_him/](https://clarusiubar.github.io/shaving_him/)

---

## 📌 Overview (개요)

`shaving_him`은 사용자가 업로드한 털 사진 한 장을 브라우저 메모리(Offscreen Canvas) 내에서 실시간 분석하여 **피부 톤 평탄화 + 털 좌표 차이 추출 + 아스키 아트 그리드 및 RGB 색상 맵**으로 자동 변환하고, 마우스 드래그 및 터치로 면도 게임을 즐기는 100% 클라이언트 사이드 웹 애플리케이션입니다.

---

## ✨ Key Features (주요 기능)

1. **📷 1-Photo 실시간 커스텀 스테이지 생성**:
   - `PNG`, `JPG`, `WEBP` 사진 업로드 지원.
   - 외부 서버 전송 없이 **100% 브라우저 클라이언트 사이드**에서 1초 내 피부 톤과 털 영역을 자동 분리하여 아스키 아트 스테이지 생성.
2. **🎮 기본 아스키 데모 스테이지**:
   - 기본 제공되는 아스키 데이터(`game_data.json`)로 즉시 게임 플레이 가능.
3. **🪒 동적 면도날 조작 & 터치 지원**:
   - 면도날 크기 동적 변경 (`3x3`, `7x7`, `11x11`, `15x15` 버튼 선택 또는 마우스 휠 스크롤).
   - 마우스 드래그 및 모바일 터치 면도 지원.
4. **📊 HUD & 진행 상황 모니터링**:
   - 60초 제한시간 타이머, 실시간 제거 점수, 남은 털 개수 및 진행률 프로그레스 바.
   - 완료 후 보너스 점수 산출 및 결과 오버레이 제공.

---

## 🏛️ 5-Layer Clean Architecture (아키텍처)

```
Interface Layer [src/ui/]          ── (Events) ──> Application Layer [src/app/]
    ├── CanvasRenderer                                 ├── StagePipeline
    ├── BrushController                                └── GameOrchestrator
    └── HUD                                                   │
                                                              ▼
Ports & Adapters [src/ports/, src/adapters/] ──> Core Domain Layer [src/domain/]
    ├── CanvasImageProcessorAdapter                    ├── HairGrid
    ├── DeltaDiffEngineAdapter                         ├── ScoreCalculator
    ├── CanvasAsciiConverterAdapter                    └── ShaveSession
    └── StaticJsonStageAdapter
```

- **Core Domain (`src/domain/`)**: DOM/Canvas 의존성이 전혀 없는 순수 도메인 비즈니스 로직.
- **Ports & Adapters (`src/ports/`, `src/adapters/`)**: 이미지 처리 및 아스키 변환 추상화 인터페이스 및 Canvas 구현체.
- **Application (`src/app/`)**: 스테이지 생성 파이프라인 및 게임 루프 클락/상태 디스패처.
- **Interface (`src/ui/`)**: 캔버스 렌더러, 마우스/터치 브러시 컨트롤러 및 HUD.

---

## 🚀 Local Running (로컬 실행 방법)

별도의 Node.js 웹서버나 `localhost` 실행이 필요 없습니다.

1. **저장소 클론**:
   ```bash
   git clone https://github.com/ClarusIubar/shaving_him.git
   cd shaving_him
   ```
2. **브라우저로 직접 열기**:
   - `index.html` 파일을 더블클릭(`file:///...`)하여 바로 구동합니다.

---

## 🧪 Testing (자동화 테스트)

Node.js 내장 테스트 러너로 순수 도메인, 어댑터 DTO 및 파이프라인 통합 테스트를 수행합니다.

```bash
node --test tests/domain/*.test.js tests/adapters/*.test.js tests/app/*.test.js
```

---

## 🌐 GitHub Pages Deployment (배포 방법)

이 프로젝트는 백엔드 서버가 없는 순수 HTML5/ES Module 앱이므로 GitHub Pages로 바로 배포할 수 있습니다.

1. **GitHub Pages 설정**:
   - GitHub 저장소 `Settings` -> `Pages` 이동.
   - **Source**: `Deploy from a branch` 선택.
   - **Branch**: `main` / `/ (root)` 선택 후 `Save`.
2. **배포 URL**:
   - `https://clarusiubar.github.io/shaving_him/`

---

## 📄 License

MIT License
