# 🪒 Shaving Him (그 남자의 수염을 깎아라) Wiki - v1.13.0

> **위키 퀵 내비게이션**: [🏠 Wiki 홈](Home) | [🎮 라이브 게임 플레이](https://clarusiubar.github.io/shaving_him/) | [📋 기획서 (PRD)](기획서) | [📁 시스템 설계서](설계서) | [🏛️ ADR 명세서](ADR) | [📂 소스모듈 명세서](프로젝트_디렉토리_및_모듈_구조_명세서) | [⚡ 세부 기술 명세서](명세서) | [📊 수식/퍼징 검증서](스코어링_이론계산_실측값_검증) | [🧪 테스트 체계서](테스트_체계_및_TDD_명세서) | [📜 변경 이력](CHANGELOG)

---

<div align="center">

[![Live Play](https://img.shields.io/badge/🎮%20Play%20Game-Live%20Web%20App-ff4081?style=for-the-badge&logo=google-chrome&logoColor=white)](https://clarusiubar.github.io/shaving_him/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/ClarusIubar/shaving_him)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**[👉 🌐 브라우저에서 바로 실시간 게임 플레이하기 (Live Game Play)](https://clarusiubar.github.io/shaving_him/)**

</div>

---

1장 단일 사진(1-Photo)으로부터 실시간 아스키 아트 및 피부/수염 델타 마스크를 생성하고, 브라우저 Canvas 위에서 60fps로 매끄럽게 면도(Shaving)하며 피부를 복원해 나가는 **순수 자바스크립트 클린 아키텍처 아케이드 게임 시스템**의 통합 기술 지식 위키입니다.

> [!TIP]
> 외부 오디오/이미지 런타임 파일 의존성 제로(0B Asset Dependency), Web Audio API 기반의 100% 절차적 면도마찰음/콤보 화음/승리 팡파레 실시간 합성, 1D `Uint8Array` 기반 O(1) 0B 메모리 할당 비트맵 연산, 브레젠험 8-연결 연속 선분 래스터라이저, 5계층 Ports & Adapters 클린 아키텍처 및 엄격한 Red-Green-Refactor(RGR) TDD로 구현되었습니다.

---

## 📊 핵심 아키텍처 및 품질 지표 (Key Metrics)

| 품질 영역 | 지표 / 사양 | 엔지니어링 의의 |
| :--- | :---: | :--- |
| **코드 커버리지** | **Line 100.00% · Func 100.00% · Branch 98.17%** | Node.js 내장 테스트 러너 기반 139개 전수 검증 통과 |
| **소프트웨어 아키텍처** | **5-Layer Clean Architecture & Ports/Adapters** | Core ➔ Ports ➔ App ➔ Adapters ➔ UI 단방향 의존성 계층 분리 |
| **SOLID 객체지향 설계** | **5계층 분리 및 점진적 리팩토링 진행 (잔여 부채 관리)** | `InputManager`, `ImageFileLoader`, `ParticleSystem` DI 주입 적용 (ScoreStrategy/HUD ISP 개선 과제 식별) |
| **SDD (Schema-Driven)** | **TypeScript `.d.ts` & `validateSnapshot`** | 컴파일 타임 DTO 명세 및 런타임 스키마 무결성 검증 |
| **메모리 및 연산 효율** | **1D `Uint8Array` (0B Allocation during Shave)** | GC 프레임 드랍(Stuttering) 방지, O(1) 비트 인덱싱 |
| **오디오 합성 엔진** | **100% Web Audio API 절차적 합성 (0B MP3/WAV)** | 대역통과 필터 화이트 노이즈 & 사인파 가변 피치 콤보음 |
| **렌더링 성능** | **60fps GPU 가속 (`translate3d`) & rAF 배치** | DOM Reflow/Layout Thrashing 방지, High-DPI 정규화 |

---

## 🌳 프로젝트 전체 디렉토리 및 모듈 구조 조감도 (Tree View)

```bash
d:\Code305\shaving_him\
├── 📄 index.html                       # HTML5 메인 마크업 및 게임 UI 컨테이너
├── 📄 package.json                     # 테스트 및 커버리지 게이트 CLI 스크립트 (node --test)
├── 📂 css/                             # UI 스타일시트
│   └── 📄 style.css                    # 레트로 터미널 다크 테마 및 반응형 레이아웃 스타일
├── 📂 types/                           # SDD 정적 타입 정의 (TypeScript)
│   └── 📄 index.d.ts                   # StageDataDTO, SessionSnapshotDTO, GameConfigDTO 명세
│
├── 📂 src/                             # 클라이언트 5계층 클린 아키텍처 소스 코드
│   ├── 📄 main.js                      # Application Entry Point & Auto-Bootstrap
│   │
│   ├── 📂 domain/                      # 1. Pure Domain Core Layer (순수 비즈니스 모델 - 0% DOM/Canvas)
│   │   ├── 📄 hair-grid.js             # 1D Uint8Array 기반 수염 비트맵 매트릭스 (O(1) Shave, 0B GC)
│   │   ├── 📄 shave-session.js         # 게임 세션 수명주기, 타이머 카운트다운, 스냅샷 관리자
│   │   ├── 📄 score-calculator.js      # 연속 콤보 가산, 시간 보너스, 올클리어 보너스 연산 엔진
│   │   ├── 📄 grid-geometry.js         # 불변(Immutable) 그리드 기하 값 객체 (Value Object)
│   │   ├── 📄 line-rasterizer.js       # 브레젠험(Bresenham) 8-방향 연속 선분 래스터라이저 (퍼징 입증)
│   │   ├── 📄 schema-validator.js      # StageDataDTO & SessionSnapshotDTO 런타임 스키마 검증기
│   │   └── 📄 game-policy.js           # 승리 판정 및 클리어 비율 도메인 정책
│   │
│   ├── 📂 ports/                       # 2. Ports Layer (DIP 추상 인터페이스 계약)
│   │   ├── 📄 stage-source.port.js     # 스테이지 소스 로딩 추상 포트
│   │   ├── 📄 image-processor.port.js  # 이미지 리사이징 및 픽셀 추출 추상 포트
│   │   ├── 📄 ascii-converter.port.js  # 밝기 기반 아스키 글리프 변환 추상 포트
│   │   └── 📄 diff-engine.port.js      # 피부-수염 델타 차분 추출 추상 포트
│   │
│   ├── 📂 app/                         # 3. Application Layer (유스케이스 오케스트레이션)
│   │   ├── 📄 composition-root.js      # IoC 의존성 조립 및 인스턴스 팩토리 (Composition Root)
│   │   ├── 📄 game-orchestrator.js     # 게임 루프 클록, 상태 머신 전환, UI 커맨드 디스패처
│   │   ├── 📄 stage-pipeline.js        # 4단계 비동기 1-Photo 아스키 생성 파이프라인
│   │   └── 📄 stage-source-handlers.js # 소스 핸들러 레지스트리 (JSON, Image, Preset)
│   │
│   ├── 📂 adapters/                     # 4. Secondary Driven Adapters Layer (인프라 및 캔버스 구현체)
│   │   ├── 📄 static-json-stage.js      # JSON 프리셋 및 EMBEDDED_GAME_DATA 폴백 어댑터
│   │   ├── 📄 canvas-image-processor.js # Canvas 2D 기반 이미지 디코딩/리사이징 어댑터
│   │   ├── 📄 canvas-ascii-converter.js # 램프 테이블 기반 아스키 텍스트 그리드 변환 어댑터
│   │   ├── 📄 delta-diff-engine.js      # 피부색 분리와 수염 마스크 추출 델타 디프 어댑터
│   │   └── 📂 helpers/                  # 어댑터 보조 헬퍼
│   │       └── 📄 image-file-loader.js  # FileReader & Image 비동기 디코딩 전담 헬퍼 (SRP)
│   │
│   └── 📂 ui/                                 # 5. Interface & Presentation Layer (수동적 뷰 & 입력 제어기)
│       ├── 📄 input-manager.js                # DOM/키보드 이벤트 바인딩 전담 관리자 (이벤트 바인딩 분리)
│       ├── 📄 brush-controller.js             # 레이저 마우스/터치 드래그 및 GPU translate3d 커서 컨트롤러
│       ├── 📄 canvas-renderer.js              # 2D 아스키 캔버스 렌더러 (ParticleSystem DI 주입 지원)
│       ├── 📄 particle-system.js              # 면도 파편 비산 물리 파티클 시스템
│       ├── 📄 sound-effects.js                # 100% Web Audio API 절차적 오디오 합성 엔진 (0B 에셋)
│       ├── 📄 hud.js                          # 하위 4대 서브뷰를 통합 관리하는 UI 퍼사드 (Facade)
│       └── 📂 views/                          # 개별 Passive UI 서브뷰 컴포넌트
│           ├── 📄 stats-hud-view.js           # 점수, 타이머, 게이지, 콤보 뱃지 서브뷰
│           ├── 📄 stage-select-modal-view.js  # 시작 모달, 프리셋 카드, 파일 드롭존 서브뷰
│           ├── 📄 loading-overlay-view.js     # 4단계 파이프라인 로딩 프로그레스 오버레이
│           └── 📄 game-over-overlay-view.js   # 게임 오버 / 승리 점수 오버레이
│
├── 📂 tests/                          # 6대 계층 RGR TDD 테스트 스위트 (139 tests 100% PASS)
│   ├── 📂 domain/                     # 도메인 모델, 기하 퍼징, 스키마 검증기 단위 테스트
│   ├── 📂 ports/                      # LSP 인터페이스 시그니처 및 예외 계약 검증 테스트
│   ├── 📂 adapters/                   # 어댑터 동작, 이미지 로더, 브랜치 부스터 테스트
│   ├── 📂 app/                        # 파이프라인, 오케스트레이터, 메인 진입점 테스트
│   ├── 📂 ui/                         # 브러시, 캔버스, HUD, 서브뷰, 사운드, 입력 매니저 테스트
│   ├── 📂 e2e/                        # 전 과정 유저 저니(E2E) 통합 테스트
│   └── 📂 helpers/                    # Node.js용 DOM/Window/Canvas Mock Harness
│
├── 📂 tools/                          # 개발 및 에셋 전처리 스크립트
└── 📂 docs/                           # 태스크 원장 및 거버넌스 문서
```

---

## 📚 위키 공식 기술 문서 목차 (Wiki Table of Contents)

위키 문서는 표준적인 클린 아키텍처 및 게임 엔지니어링 규격에 따라 체계화되어 있습니다:

* 📋 **[1. 게임 기획 요구사항 정의서 (PRD)](기획서)**
  * 1-Photo 아스키 아트 생성 및 면도 인터랙션 게임 컨셉
  * 0B 에셋 제로 런타임 의존성 및 반응형 브라우저 실행 사양
  * 코어 게임 루프, 콤보 스트릭, 승리/패배 판정 기준
  * 키보드 단축키(1~4, R) 및 모바일 터치 드래그 지원 기획

* 📁 **[2. 시스템 아키텍처 설계서 (Architecture)](설계서)**
  * 5계층 클린 아키텍처 (Domain Core ➔ Ports ➔ App ➔ Adapters ➔ UI)
  * SOLID 5대 원칙 적용 현황 및 잔여 아키텍처 기술 부채 분석
  * `InputManager` 분리를 통한 진입점 경량화 및 이벤트 제어 구조
  * `CanvasRenderer`의 `ParticleSystem` DI 주입 및 `ImageFileLoader` 분리 설계
  * 데이터 생명주기 및 시퀀스 다이어그램 (부트스트랩, 드래그 면도, 1-Photo 파이프라인, 게임 오버)
  * 🏛️ **[아키텍처 의사결정록 (ADR)](ADR)**: ADR-001 ~ ADR-013 기술 의사결정 맥락과 근거

* 📂 **[3. 소스코드 전체 디렉토리 및 모듈 전수 명세서](프로젝트_디렉토리_및_모듈_구조_명세서)**
  * 도메인, 포트, 애플리케이션, 어댑터, UI, 뷰 컴포넌트 전 모듈 1:1 상세 명세
  * 공개 메서드 시그니처, 파라미터, 반환값 타입, 예외 처리 규칙 전수 정리

* ⚡ **[4. 세부 기술 명세서 (Technical Specification)](명세서)**
  * 1D `Uint8Array` 비트맵 메모리 모델 및 O(1) 0B 메모리 할당 연산
  * 1-Photo 4단계 아스키 파이프라인 (그레이스케일, 휘도 임계, 델타 차분, 글리프 매핑)
  * 브레젠험(Bresenham) 8-방향 선분 래스터라이징 알고리즘
  * High-DPI(레티나) 뷰포트 좌표 정규화 및 GPU `translate3d` 가속
  * Web Audio API 실시간 음향 합성 사양 (면도 마찰음, 가변 피치 콤보 화음, 팡파레)

* 📊 **[5. 점수 수식 및 기하 퍼징 검증서 (Math & Fuzzing)](스코어링_이론계산_실측값_검증)**
  * 점수 연산 수식 (기본 점수, 콤보 승수 가산, 잔여 시간 보너스, 올클리어 보너스)
  * 이론 계산치 vs 단위 테스트 실측치 비교 검증 매트릭스
  * 1,000회 무작위 브레젠험 벡터 Fuzzing 연속성 증명 및 500회 기하 스케일링 퍼징 결과

* 🧪 **[6. 테스트 체계 및 TDD 명세서 (Test & Quality)](테스트_체계_및_TDD_명세서)**
  * 엄격한 Red-Green-Refactor(RGR) TDD 워크플로우 표준
  * 6대 테스트 계층 (단위, 계약, 통합, E2E, Fuzzing, 회귀) 구조
  * Node.js 환경용 `dom-mock-harness.js` 아키텍처
  * 100% Line / 100% Func / 98.17% Branch 품질 게이트 실측치

* 📜 **[7. 버전별 변경 이력 (CHANGELOG)](CHANGELOG)**
  * TSK-001부터 TSK-013(v1.13.0)까지의 기능 릴리즈 및 리팩토링 전수 기록

* 📂 **[8. 초기 구상 및 원본 스펙 아카이브 (Archive)](Archive)**
  * 레거시 단일 파일 시절의 원본 프로토타입 및 아키텍처 변천사 아카이브
