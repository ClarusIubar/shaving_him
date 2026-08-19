# 🏛️ [Architecture Decision Records] Shaving Him ADR 명세서 - v1.14.0

> **위키 퀵 내비게이션**: [🏠 Wiki 홈](Home) | [🎮 라이브 게임 플레이](https://clarusiubar.github.io/shaving_him/) | [📋 기획서 (PRD)](기획서) | [📁 시스템 설계서](설계서) | [🏛️ ADR 명세서](ADR) | [📂 소스모듈 명세서](프로젝트_디렉토리_및_모듈_구조_명세서) | [⚡ 세부 기술 명세서](명세서) | [📊 수식/퍼징 검증서](스코어링_이론계산_실측값_검증) | [🧪 테스트 체계서](테스트_체계_및_TDD_명세서) | [📜 변경 이력](CHANGELOG)

---

## 📌 아키텍처 의사결정 색인표 (ADR Index)

| ID | 의사결정 제목 (Title) | 결정 상태 | 핵심 변경 및 도입 배경 |
| :---: | :--- | :---: | :--- |
| **ADR-001** | 5계층 클린 아키텍처 및 의존성 규칙 채택 | **Accepted** | DOM 종속성 분리 및 도메인 코어 순수성 확보 |
| **ADR-002** | 1D `Uint8Array` 수염 비트맵 메모리 모델 채택 | **Accepted** | $r \times \text{cols} + c$ O(1) 인덱싱 및 0B 가비지 컬렉션(GC) 달성 |
| **ADR-003** | 8-연결 브레젠험 선분 래스터라이저 도입 | **Accepted** | 고속 드래그 시 좌표 끊김 현상 제거 및 연속 면도 보장 |
| **ADR-004** | 1-Photo 인브라우저 아스키 & 델타 파이프라인 | **Accepted** | 외부 에셋 없이 사용자 사진 1장으로 아스키 스테이지 실시간 생성 |
| **ADR-005** | 100% 절차적 Web Audio API 실시간 음향 합성 | **Accepted** | 0B 오디오 에셋 의존성 및 지연 없는 동적 콤보/팡파레 합성 |
| **ADR-006** | Passive View 패턴 및 HUD 퍼사드 구조 도입 | **Accepted** | UI 컴포넌트 간 독립성 확보 및 단일 뷰 업데이트 계약 |
| **ADR-007** | Composition Root 및 생성자 의존성 주입 표준화 | **Accepted** | Service Locator 안티패턴 제거 및 테스트 용이성 극대화 |
| **ADR-008** | GPU `translate3d` 커서 렌더링 도입 | **Accepted** | Layout Thrashing 방지 및 초당 60fps 마우스 추적 보장 |
| **ADR-009** | Fail-Fast DOM 격리 및 Mock Harness 구축 | **Accepted** | 브라우저 없이 Node.js 내장 테스트 러너에서 100% 검증 |
| **ADR-010** | `InputManager` 분리를 통한 DOM/키보드 바인딩 캡슐화 | **Accepted** | `main.js` 비대화 해소 및 이벤트 바인딩 라이프사이클 분리 |
| **ADR-011** | `CanvasRenderer`의 `ParticleSystem` DI 및 `ImageFileLoader` 분리 | **Accepted** | 구체 클래스 하드코딩 완화(DI 주입) 및 비동기 디코딩 전담화 |
| **ADR-012** | TypeScript `.d.ts` 타입 정의 및 `validateSnapshot` SDD 표준 | **Accepted** | 스키마 주도 개발(SDD) 및 세션 런타임 데이터 무결성 검증 |
| **ADR-013** | 전 과정 유저 저니 E2E 및 기하 연산 Fuzzing 테스트 구축 | **Accepted** | 실사용자 시나리오 전수 검증 및 1,000회 기하 불변성 검증 |
| **ADR-014** | `CursorView` 분리를 통한 `BrushController` SRP 단일 책임 강화 | **Accepted** | 면도기 커서 DOM 조작을 전담 분리하여 `BrushController` 순수 좌표계 집중 |
| **ADR-015** | `SessionTimer` (GameClock) 서비스 분리를 통한 오케스트레이터 결합도 해소 | **Accepted** | 1초 클록 제어 및 `setInterval` 수명주기를 순수 도메인 서비스로 캡슐화 |
| **ADR-016** | `ScoreCalculator`의 `IScoringStrategy` 전략 패턴 도입 (OCP) | **Accepted** | 점수 배율 및 보너스 산출 정책을 주입 가능한 전략으로 확장 개방 |
| **ADR-017** | `InputManager`의 세분화된 뷰 직접 주입 지원 (ISP) | **Accepted** | 거대 `HUD` 대신 필요한 `statsView`, `modalView`만 선별 주입 가능 |
| **ADR-018** | `StaticJsonStageAdapter`의 `StageSourcePort` 상속 및 LSP 확립 | **Accepted** | `StageSourcePort` 다형성 보장 및 통일된 로딩 시그니처 확립 |

---

## 🏛️ 세부 아키텍처 의사결정록 (ADR Entries)

---

### 📄 ADR-001: 5계층 클린 아키텍처 및 의존성 규칙 채택

- **상태**: `Accepted` (TSK-001)
- **컨텍스트 (Context)**: 레거시 단일 파일 `index.html` 내부에 DOM 조작, 비트맵 연산, 아스키 변환, 타이머가 뒤엉켜 있어 단위 테스트가 불가능하고 유지보수성이 극도로 저하됨.
- **결정 (Decision)**:
  - **Domain Core (`src/domain/`)**: 순수 비즈니스 엔티티 및 값 객체 (DOM/Canvas 의존성 0%).
  - **Ports (`src/ports/`)**: DIP 인터페이스 추상 계약 정의.
  - **Application (`src/app/`)**: 게임 루프 및 유스케이스 오케스트레이션.
  - **Adapters (`src/adapters/`)**: 캔버스 2D, 이미지 프로세서, JSON 로더 등 인프라 어댑터.
  - **UI Presentation (`src/ui/`)**: Passive Views, Facade, InputManager.
- **결과 및 영향 (Consequences)**: 도메인 계층이 100% 순수 자바스크립트로 격리되어 Node.js 환경에서 브라우저 없이 초고속 단위 테스트 가능.

---

### 📄 ADR-002: 1D `Uint8Array` 수염 비트맵 메모리 모델 채택

- **상태**: `Accepted` (TSK-002)
- **컨텍스트 (Context)**: 2차원 자바스크립트 객체 배열(`Array<Array<Cell>>`)은 객체 헤더 오버헤드와 잦은 GC Pause(화면 버벅임)를 유발함.
- **결정 (Decision)**:
  - 1차원 연속 메모리 버퍼인 `Uint8Array(rows * cols)`를 `HairGrid` 내부 저장소로 채택.
  - 좌표 $(r, c)$를 $r \times \text{cols} + c$ 단일 오프셋으로 O(1) 비트 반전 수행.
- **결과 및 영향 (Consequences)**: 면도 중 메모리 할당 **0B (Zero Allocation)** 실현, 가비지 컬렉션으로 인한 프레임 드랍 100% 제거.

---

### 📄 ADR-003: 8-연결 브레젠험(Bresenham) 선분 래스터라이저 도입

- **상태**: `Accepted` (TSK-003)
- **컨텍스트 (Context)**: 마우스를 빠르게 드래그할 때 브라우저 `mousemove` 이벤트의 발생 간격이 벌어져 수염이 듬성듬성 깎이지 않는 점박이 현상 발생.
- **결정 (Decision)**:
  - 이전 좌표 $(r_0, c_0)$와 현재 좌표 $(r_1, c_1)$ 사이에 8-연결 브레젠험 알고리즘을 적용하여 누락 없는 선분 보간 좌표열 생성.
- **결과 및 영향 (Consequences)**: 초고속 드래그 시에도 끊김 없는 면도 궤적 보장 (1,000회 퍼징 테스트로 연속성 검증 완료).

---

### 📄 ADR-004: 1-Photo 인브라우저 아스키 & 델타 파이프라인

- **상태**: `Accepted` (TSK-004)
- **컨텍스트 (Context)**: 서버 없이 클라이언트 브라우저만으로 단 1장의 사진에서 아스키 아트와 수염/피부 마스크를 자동 분리해야 함.
- **결정 (Decision)**:
  - Canvas 2D 픽셀 버퍼 ➔ 그레이스케일($0.299R + 0.587G + 0.114B$) ➔ 10단계 램프(` .:-=+*#%@`) 아스키 매핑 ➔ 피부톤 임계값($Y > 120$) 델타 차분 분리 파이프라인 구축.
- **결과 및 영향 (Consequences)**: 서버 통신 없이 클라이언트 사이드에서 100ms 이내에 즉각적인 스테이지 생성 지원.

---

### 📄 ADR-005: 100% 절차적 Web Audio API 실시간 음향 합성

- **상태**: `Accepted` (TSK-005)
- **컨텍스트 (Context)**: 외부 오디오 파일(`mp3`, `wav`) 로딩은 네트워크 지연 및 CORS 오류를 유발하며 정적 배포 용량을 증가시킴.
- **결정 (Decision)**:
  - **면도 마찰음**: 50ms 화이트 노이즈 버퍼 + 2200Hz 대역통과 필터(Bandpass Filter).
  - **콤보 차임벨**: C5(523Hz) 기준 콤보 스트릭에 따라 $\min(k \times 45, 600)$Hz 사인파(Sine Wave) 피치 시프트.
  - **승리 팡파레**: C5 - E5 - G5 - C6 트라이앵글(Triangle Wave) 4중 화음.
- **결과 및 영향 (Consequences)**: 오디오 에셋 다운로드 0바이트(0B Asset), 레이턴시 0ms의 즉각적인 음향 반응 실현.

---

### 📄 ADR-006: Passive View 패턴 및 HUD 퍼사드 구조 도입

- **상태**: `Accepted` (TSK-006)
- **컨텍스트 (Context)**: 점수, 타이머, 모달, 로딩창, 게임오버 창이 서로의 DOM을 직접 건드려 스파게티 의존성 발생.
- **결정 (Decision)**:
  - 4대 독립 서브뷰(`StatsHUDView`, `StageSelectModalView`, `LoadingOverlayView`, `GameOverOverlayView`)로 쪼개고, `HUD` 퍼사드가 이를 통합 관리.
- **결과 및 영향 (Consequences)**: 뷰 컴포넌트 간 상호 참조 제로화, Non-Nullable 스냅샷 데이터 계약 준수.

---

### 📄 ADR-007: Composition Root 및 생성자 의존성 주입 표준화

- **상태**: `Accepted` (TSK-007)
- **컨텍스트 (Context)**: 전역 싱글톤이나 모듈 내부의 `new Adapter()` 하드코딩은 테스트 시 목(Mock) 교체를 방해함.
- **결정 (Decision)**:
  - `src/app/composition-root.js`를 신설하여 모든 객체를 생성자 주입(Constructor Injection) 방식으로 조립.
- **결과 및 영향 (Consequences)**: Service Locator 안티패턴 완전 제거, 커스텀 어댑터 주입을 통한 100% 격리 테스트 지원.

---

### 📄 ADR-008: GPU `translate3d` 커서 렌더링 도입

- **상태**: `Accepted` (TSK-008)
- **컨텍스트 (Context)**: `style.left` / `style.top`을 이용한 커서 이동은 브라우저 DOM Reflow 및 Layout Thrashing을 유발하여 프레임 드랍 발생.
- **결정 (Decision)**:
  - `cursor.style.transform = translate3d(x, y, 0)`로 GPU 컴포지팅 레이어에서 위치 갱신.
  - `getBoundingClientRect()` 호출을 윈도우 리사이즈/스크롤 시점에만 캐싱하여 렌더 루프 내 DOM 조회 비용 제거.
- **결과 및 영향 (Consequences)**: 마우스 고속 이동 시에도 완전한 60fps 유지.

---

### 📄 ADR-009: Fail-Fast DOM 격리 및 Mock Harness 구축

- **상태**: `Accepted` (TSK-009)
- **컨텍스트 (Context)**: JSDOM 등의 무거운 외부 의존성 없이 Node.js 네이티브 환경에서 DOM/Canvas/Audio 컴포넌트를 테스트해야 함.
- **결정 (Decision)**:
  - `tests/helpers/dom-mock-harness.js`를 구축하여 가벼운 Canvas 2D, AudioContext, DOM Event 위임 지원.
  - 필수 엘리먼트 누락 시 즉시 에러를 던지는 Fail-Fast 수칙 확립.
- **결과 및 영향 (Consequences)**: 0.35초 내에 139개 전체 테스트 스위트가 실행되는 신속한 테스트 환경 구축.

---

### 📄 ADR-010: `InputManager` 분리를 통한 DOM/키보드 바인딩 캡슐화

- **상태**: `Accepted` (TSK-013-01)
- **컨텍스트 (Context)**: `src/main.js` 진입점에 키보드 단축키(1~4, R), 브러시 버튼 클릭, 사운드 토글 리스너가 누적되어 진입점이 비대해짐.
- **결정 (Decision)**:
  - `src/ui/input-manager.js`를 신설하여 모든 DOM 이벤트 등록과 `destroy()` 해제 로직을 전담 분리.
- **결과 및 영향 (Consequences)**: `main.js`의 역할이 슬림화되고, 입력 이벤트의 독립적 단위 테스트 지원.

---

### 📄 ADR-011: `CanvasRenderer`의 `ParticleSystem` DI 및 `ImageFileLoader` 분리

- **상태**: `Accepted` (TSK-013-02)
- **컨텍스트 (Context)**: `CanvasRenderer` 생성자 내부에서 `new ParticleSystem`이 고정 결합되어 있었고, `CanvasImageProcessorAdapter` 내부에 비동기 `FileReader` 코드가 섞여 있었음.
- **결정 (Decision)**:
  - `CanvasRenderer`에 `particleSystem` DI 주입 인터페이스 개방.
  - `src/adapters/helpers/image-file-loader.js`를 신설하여 이미지 비동기 디코딩 전담.
- **결과 및 영향 (Consequences)**: 결합도 완화 및 비동기 파일 디코딩 캡슐화.

---

### 📄 ADR-012: TypeScript `.d.ts` 타입 정의 및 `validateSnapshot` SDD 표준

- **상태**: `Accepted` (TSK-013-03)
- **컨텍스트 (Context)**: 모듈 간에 주고받는 DTO 구조에 대한 정적 타입 명세와 런타임 스키마 검증 장치가 부족하여 인터페이스 불일치 위험 존재.
- **결정 (Decision)**:
  - `types/index.d.ts`에 `StageDataDTO`, `SessionSnapshotDTO`, `GameConfigDTO` 명세.
  - `src/domain/schema-validator.js`에 `validateSnapshot(snapshot)` 런타임 검증기 추가.
- **결과 및 영향 (Consequences)**: 스키마 주도 개발(SDD) 기반 및 세션 런타임 데이터 무결성 검증.

---

### 📄 ADR-013: 전 과정 유저 저니 E2E 및 기하 연산 Fuzzing 테스트 구축

- **상태**: `Accepted` (TSK-013-04 & TSK-013-05)
- **컨텍스트 (Context)**: 단위 테스트의 합이 실제 사용자 플레이 전 과정의 결함 없음을 완전히 보증하지 못하며, 비정상 좌표 입력에 대한 기하 연산의 수학적 증명이 필요함.
- **결정 (Decision)**:
  - `tests/e2e/gameplay-journey.e2e.test.js`: 부트스트랩 ➔ 스테이지 로드 ➔ 드래그 면도 ➔ 콤보/사운드 ➔ 단축키 ➔ 승리 ➔ 리스타트 단일 통합 테스트.
  - `tests/domain/grid-geometry-fuzzing.test.js`: 1,000개 무작위 선분 8-연결 브레젠험 연속성 및 500개 뷰포트 좌표 스케일링 Fuzzing 테스트.
  - `tests/adapters/branch-coverage-booster.test.js`: 잔여 브랜치 사각지대 전수 해소.
- **결과 및 영향 (Consequences)**: Line 100%, Function 100%, Branch 98.17% 달성 및 실사용자 시나리오/기하 불변성 검증 완료.

---

### 📄 ADR-014: `CursorView` 분리를 통한 `BrushController` SRP 단일 책임 강화

- **상태**: `Accepted` (TSK-011-02)
- **컨텍스트 (Context)**: `BrushController`가 마우스/터치 이벤트 수신 및 좌표 연산과 동시에 커서 DOM 엘리먼트의 `translate3d`, `fontSize`, `opacity` 조작을 직접 수행하여 단일 책임 원칙(SRP)에 위배됨.
- **결정 (Decision)**:
  - `src/ui/views/cursor-view.js`를 신설하여 커서 DOM 스타일 제어 전담.
  - `BrushController`는 좌표 변환 및 면도 콜백 발행에만 집중하고 시각적 표시는 `CursorView`로 위임.
- **결과 및 영향 (Consequences)**: SRP 준수 및 커서 렌더링 로직의 독립적 단위 테스트 가능.

---

### 📄 ADR-015: `SessionTimer` (GameClock) 서비스 분리를 통한 오케스트레이터 결합도 해소

- **상태**: `Accepted` (TSK-011-03)
- **컨텍스트 (Context)**: `GameOrchestrator` 내부에 `setInterval` / `clearInterval` 및 Node.js `unref()` 핸들링 코드가 직접 포함되어 있어 타이머 클록 로직 테스트 시 타이머 수명주기가 오케스트레이터와 강하게 결합됨.
- **결정 (Decision)**:
  - `src/domain/session-timer.js`를 신설하여 1초 클록 제어 및 상태(`isRunning`) 캡슐화.
  - `GameOrchestrator` 및 `CompositionRoot`에서 `SessionTimer`를 주입받아 위임.
- **결과 및 영향 (Consequences)**: 타이머 수명주기 캡슐화 및 테스트 시 목(Mock) 타이머 주입 용이성 확보.

---

### 📄 ADR-016: `ScoreCalculator`의 `IScoringStrategy` 전략 패턴 도입 (OCP)

- **상태**: `Accepted` (TSK-011-04)
- **컨텍스트 (Context)**: 점수 배율 공식, 시간 보너스, 올클리어 보너스 계산 규칙이 `ScoreCalculator` 내부에 하드코딩되어 있어, 하드코어 모드나 커스텀 점수 정책 도입 시 기존 코드를 수정해야 하는 OCP 위반 발생.
- **결정 (Decision)**:
  - `DefaultScoringStrategy`를 추출하고 `ScoreCalculator` 생성자에서 전략 객체를 주입받도록 리팩토링.
- **결과 및 영향 (Consequences)**: 개방 폐쇄 원칙(OCP) 준수로 다양한 점수 규칙을 외부에서 손쉽게 확장 가능.

---

### 📄 ADR-017: `InputManager`의 세분화된 뷰 직접 주입 지원 (ISP)

- **상태**: `Accepted` (TSK-011-05)
- **컨텍스트 (Context)**: `InputManager`가 `HUD`라는 거대 인터페이스에 강하게 의존하고 있어, 사운드 토글이나 모달 표시를 위해 불필요한 HUD 전체를 요구하는 ISP 위반 발생.
- **결정 (Decision)**:
  - `InputManager` 생성자 옵션에 `statsView`, `modalView`를 직접 주입받을 수 있도록 인터페이스 분리 지원 (기존 `hud` 호환성 유지).
- **결과 및 영향 (Consequences)**: 인터페이스 분리 원칙(ISP) 달성 및 컴포넌트 간 결합도 완화.

---

### 📄 ADR-018: `StaticJsonStageAdapter`의 `StageSourcePort` 상속 및 LSP 확립

- **상태**: `Accepted` (TSK-011-06)
- **컨텍스트 (Context)**: `StaticJsonStageAdapter`가 `StageSourcePort`를 명시적으로 상속하지 않고 `loadStage` 시그니처 매개변수 순서가 포트와 불일치하여 리스코프 치환 원칙(LSP) 위반 위험 존재.
- **결정 (Decision)**:
  - `StaticJsonStageAdapter extends StageSourcePort` 명시 상속 및 `canHandle(source)` 구현.
  - `loadStage(source, targetCols, targetRows, options, onProgress)` 시그니처 정합.
- **결과 및 영향 (Consequences)**: LSP 준수 및 모든 스테이지 어댑터 간의 완전한 다형성 확보.
