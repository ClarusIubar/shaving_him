# 📜 [Version History & Release Notes] Shaving Him 변경 이력 (CHANGELOG) - v1.13.0

> **위키 퀵 내비게이션**: [🏠 Wiki 홈](Home) | [📋 기획서 (PRD)](기획서) | [📁 시스템 설계서](설계서) | [🏛️ ADR 명세서](ADR) | [📂 소스모듈 명세서](프로젝트_디렉토리_및_모듈_구조_명세서) | [⚡ 세부 기술 명세서](명세서) | [📊 수식/퍼징 검증서](스코어링_이론계산_실측값_검증) | [🧪 테스트 체계서](테스트_체계_및_TDD_명세서) | [📜 변경 이력](CHANGELOG)

---

## 📌 릴리즈 히스토리 요약 (Milestones Overview)

| 버전 (Version) | 태스크 ID | 릴리즈 일자 | 핵심 변경 사항 |
| :---: | :---: | :---: | :--- |
| **v1.13.0** | **TSK-013-00** | 2026-08-18 | `InputManager` 분리, `ParticleSystem` DI 주입, SDD 타입 명세, E2E/퍼징 구축, 98.17% 커버리지 |
| **v1.12.0** | **TSK-012-00** | 2026-08-18 | UI Passive Views 서브컴포넌트 4대 분리 및 Fail-Fast DOM 격리 |
| **v1.11.0** | **TSK-011-00** | 2026-08-18 | 100% Web Audio API 절차적 음향 합성기 (`SoundEffects`) 도입 (0B 에셋) |
| **v1.10.0** | **TSK-010-00** | 2026-08-18 | `ParticleSystem` 면도 파편 비산 물리 엔진 및 rAF 렌더링 루프 |
| **v1.09.0** | **TSK-009-00** | 2026-08-18 | GPU `translate3d` 커서 컴포지팅 및 `BrushController` 고속 드래그 최적화 |
| **v1.08.0** | **TSK-008-00** | 2026-08-18 | `CompositionRoot` 생성자 주입 표준화 및 Service Locator 제거 |
| **v1.07.0** | **TSK-007-00** | 2026-08-18 | 4단계 인브라우저 1-Photo 아스키 변환 파이프라인 (`StagePipeline`) |
| **v1.06.0** | **TSK-006-00** | 2026-08-18 | `CanvasRenderer` Dirty Cell 부분 렌더링 및 High-DPI 정규화 |
| **v1.05.0** | **TSK-005-00** | 2026-08-18 | `GameOrchestrator` 상태 머신 및 1초 타이머 클록 통제기 |
| **v1.04.0** | **TSK-004-00** | 2026-08-18 | 8-연결 브레젠험 `LineRasterizer` 및 `GridGeometry` 불변 값 객체 |
| **v1.03.0** | **TSK-003-00** | 2026-08-18 | `ScoreCalculator` 콤보 누적 가산 및 보너스 산출 엔진 |
| **v1.02.0** | **TSK-002-00** | 2026-08-18 | 1D `Uint8Array` `HairGrid` 0B 메모리 할당 비트맵 모델 |
| **v1.01.0** | **TSK-001-00** | 2026-08-18 | 5계층 클린 아키텍처 및 포트/어댑터 기초 구조 확립 |

---

## 📜 세부 버전별 변경 기록

### 🚀 [v1.13.0] - 2026-08-18 (Parent: #112)
- **`[TSK-013-01]` `InputManager` 분리 (#113, PR #118)**:
  - `src/ui/input-manager.js`를 신설하여 `main.js`의 DOM 키보드 단축키(1~4, R), 브러시 크기 버튼, 사운드 토글 리스너를 온전히 캡슐화하고 SRP 완수.
- **`[TSK-013-02]` `CanvasRenderer` DI 주입 & `ImageFileLoader` 분리 (#114, PR #119)**:
  - `CanvasRenderer` 생성자에 `particleSystem` 주입 인터페이스 개방.
  - `src/adapters/helpers/image-file-loader.js` 신설로 비동기 `FileReader` 분리.
- **`[TSK-013-03]` TypeScript `.d.ts` & `validateSnapshot` SDD 표준 (#115, PR #120)**:
  - `types/index.d.ts`에 `StageDataDTO`, `SessionSnapshotDTO` 타입 명세.
  - `src/domain/schema-validator.js`에 `validateSnapshot` 런타임 스키마 검증기 추가.
- **`[TSK-013-04]` E2E 통합 테스트 & 기하 Fuzzing 퍼징 구축 (#116, PR #121)**:
  - `tests/e2e/gameplay-journey.e2e.test.js`: 부트스트랩부터 승리 및 리스타트까지 단일 E2E 통합 테스트.
  - `tests/domain/grid-geometry-fuzzing.test.js`: 1,000회 무작위 브레젠험 벡터 및 500회 뷰포트 좌표 스케일링 퍼징 검증.
- **`[TSK-013-05]` 브랜치 커버리지 사각지대 해소 및 98%+ 달성 (#117, PR #122)**:
  - `tests/adapters/branch-coverage-booster.test.js`로 잔여 에러/폴백 브랜치 전수 검증.
  - 전체 커버리지: **Line 100.00% · Function 100.00% · Branch 98.17%** 달성.

---

### 🚀 [v1.12.0] - 2026-08-18 (Parent: #105)
- **UI Passive Views 컴포넌트 4대 분리**:
  - `src/ui/views/stats-hud-view.js` (점수/타이머)
  - `src/ui/views/stage-select-modal-view.js` (시작 모달/드롭존)
  - `src/ui/views/loading-overlay-view.js` (파이프라인 로딩)
  - `src/ui/views/game-over-overlay-view.js` (승리/패배)
- `HUD` 클래스를 하위 서브뷰들을 총괄하는 UI 퍼사드(Facade)로 정돈.

---

### 🚀 [v1.11.0] - 2026-08-18 (Parent: #100)
- **100% 절차적 Web Audio API 합성 엔진 (`SoundEffects`) 구축**:
  - 면도 시 2200Hz 대역통과 필터 화이트 노이즈 마찰음.
  - 콤보 누적 시 C5 기준 가변 피치 시프트 사인파 차임벨.
  - 승리 시 C5-E5-G5-C6 트라이앵글 4중 팡파레.
  - 외부 오디오 파일 0B 에셋 의존성 달성.

---

### 🚀 [v1.10.0] - 2026-08-18 (Parent: #95)
- **면도 파편 비산 물리 파티클 엔진 (`ParticleSystem`) 구현**:
  - 수염 셀 제거 시 주변으로 튕겨나가는 텍스트 글리프 파티클 생성.
  - 수명 감쇄, 속도 벡터, 중력 시뮬레이션 및 `requestAnimationFrame` 자동 수면 처리.

---

### 🚀 [v1.09.0] - 2026-08-18 (Parent: #90)
- **GPU 가속 `BrushController` 최적화**:
  - 커서 이동 시 `style.left/top` 대신 `transform: translate3d(...)` GPU 컴포지팅 적용.
  - `getBoundingClientRect` 윈도우 리사이즈/스크롤 캐싱으로 Layout Thrashing 제거 (60fps 보장).

---

### 🚀 [v1.08.0] - 2026-08-18 (Parent: #85)
- **`CompositionRoot` 및 생성자 의존성 주입**:
  - 단일 진입점에서 모든 객체를 인스턴스화하고 의존성 주입.
  - Service Locator 제거 및 테스트 모킹 용이성 확보.
