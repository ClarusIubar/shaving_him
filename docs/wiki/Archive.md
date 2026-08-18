# 📂 [Archive] Shaving Him 초기 구상 및 원본 스펙 아카이브

> **위키 퀵 내비게이션**: [🏠 Wiki 홈](Home) | [📋 기획서 (PRD)](기획서) | [📁 시스템 설계서](설계서) | [🏛️ ADR 명세서](ADR) | [📂 소스모듈 명세서](프로젝트_디렉토리_및_모듈_구조_명세서) | [⚡ 세부 기술 명세서](명세서) | [📊 수식/퍼징 검증서](스코어링_이론계산_실측값_검증) | [🧪 테스트 체계서](테스트_체계_및_TDD_명세서) | [📜 변경 이력](CHANGELOG)

---

## 📌 아카이브 개요 (Archive Overview)

본 문서는 `Shaving Him` 프로젝트가 5계층 클린 아키텍처 및 엄격한 RGR TDD 체계로 리팩토링되기 전, 초기 프로토타입 시절의 단일 파일 구조 및 아키텍처 변천사를 보존하기 위한 역사적 아카이브입니다.

---

## 🏛️ 아키텍처 진화 역사 (Evolution Timeline)

### 1. Phase 0: 단일 파일 모놀리식 프로토타입 (`before.html`)
- **형태**: 단 하나의 HTML 파일 안에 인라인 CSS, 캔버스 조작, 비트맵 연산, 타이머, 오디오 재생 코드가 뒤섞인 형태.
- **한계점**:
  - 도메인 비즈니스 로직과 브라우저 DOM API가 강결합되어 단위 테스트 실행 불가.
  - 전역 스코프 오염 및 모듈 재사용성 결여.

### 2. Phase 1: 포트 및 어댑터 기반 5계층 분리 (`v1.01 ~ v1.08`)
- **개선**:
  - `src/domain/` (순수 비즈니스 로직)과 `src/adapters/` (Canvas/DOM) 분리.
  - 1D `Uint8Array` 비트맵 메모리 모델 채택 (0B GC 할당).
  - 4단계 1-Photo 인브라우저 아스키 생성 파이프라인 정립.
  - `CompositionRoot` 기반 생성자 주입 표준화.

### 3. Phase 2: 시청각 엔지니어링 고도화 (`v1.09 ~ v1.12`)
- **개선**:
  - GPU `translate3d` 컴포지팅으로 Layout Thrashing 제거 (60fps 보장).
  - 100% 절차적 Web Audio API 실시간 음향 합성기(`SoundEffects`) 구축.
  - `ParticleSystem` 비산 파티클 물리 엔진 탑재.
  - UI 4대 서브뷰 분리 및 `HUD` 퍼사드 도입.

### 4. Phase 3: 엔터프라이즈 거버넌스 및 SDD/TDD 도입 (`v1.13.0`)
- **개선**:
  - `InputManager` 분리로 `main.js` 진입점 경량화 및 이벤트 바인딩 캡슐화.
  - `CanvasRenderer`의 `ParticleSystem` DI 주입 및 `ImageFileLoader` 분리.
  - TypeScript `.d.ts` DTO 타입 명세 및 `validateSnapshot` 런타임 스키마 검증.
  - 전 과정 유저 저니 E2E 통합 테스트 및 1,000회 기하 Fuzzing 퍼징 검증.
  - 전체 브랜치 커버리지 **98.17%** 달성.
