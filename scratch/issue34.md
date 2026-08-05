# [Parent] TSK-007-00: v1.0.6 아키텍처/SOLID/Interface-Locality/TDD 코드 리뷰 기반 정합성 결함 수정 및 계층 경계 강화

## Summary

`origin/main`(b21ccab) 기준 `src/` 전체 16개 모듈(1,373 LOC)에 대한 아키텍처, SOLID, Interface-Locality, TDD, SDD 5개 축 코드 리뷰 결과를 기반으로 하는 부모 코어 이슈입니다.

리뷰 결과 34개 테스트 전부 통과 및 100.00% Line / 100.00% Function / 91.32% Branch 커버리지가 재현 확인되었으나, 그 지표가 보증하지 못한 영역에서 3건의 실사용 정합성 결함과 2건의 잠재 결함, 그리고 포트/어댑터 경계가 명목상으로만 성립하는 구조적 부채가 식별되었습니다.

핵심 원인은 세 가지입니다.

1. **커버리지 사각지대**: `src/main.js`(157 LOC)는 테스트가 0개이며 어떤 테스트도 import하지 않아 커버리지 집계 대상에서 제외됩니다. 즉 "전 파일 100%"는 실제로는 "테스트가 import한 16개 파일 100%"이며, 제외된 컴포지션 루트가 키맵·승리 판정·에러 핸들링·이벤트 배선을 보유합니다. 정합성 결함 2건이 이 경로로 유출되었습니다.
2. **계약 미검증**: 테스트가 반환값 계약이 아닌 부수효과만 단언하고, 테스트 더블이 실제 생산자가 존재하지 않는 필드를 창작하여 기능이 죽은 상태를 통과가 은폐합니다.
3. **기하 정보 중복**: 그리드 치수(cols/rows/cellW/cellH)가 6개 모듈에 중복 선언되어 있고 일부는 인자 순서가 뒤집혀 있어, 좌표 변환 버그의 구조적 원인이 되고 있습니다.

## Child Issues Roadmap & Execution Sequence Matrix

| 순서 (Sequence) | 이슈 번호 | 태스크 ID | 작업 명칭 | 선행 조건 (Dependencies) |
| :---: | :---: | :--- | :--- | :--- |
| **Step 1** | **#35** | `TSK-007-01` | shave() 반환 계약 정규화 및 main.js 구조분해 TypeError 해소 | 없음 (독립 착수) |
| **Step 2** | **#36** | `TSK-007-02` | getSnapshot() comboCount 노출을 통한 콤보 배지/사운드/배율 복구 | 없음 (독립 착수) |
| **Step 3** | **#37** | `TSK-007-03` | GridGeometry 값 객체 도입 및 High-DPI 브러시 좌표 변환 결함 해소 | 없음 (독립 착수) |
| **Step 4** | **#38** | `TSK-007-04` | CanvasRenderer pendingDirtyCells null 역참조 및 mouseup 중복 제거 | Step 3 (GridGeometry 연동) |
| **Step 5** | **#39** | `TSK-007-05` | main.js 조립/정책 책임 분리 및 커버리지 사각지대 해소 | Step 1, Step 2 |
| **Step 6** | **#40** | `TSK-007-06` | 어댑터 조립의 컴포지션 루트 이관 및 포트 계약 테스트 스위트 구축 | Step 5 (#39 필수) |
| **Step 7** | **#41** | `TSK-007-07` | 피부 톤 판정 로직의 DiffEngine 이관 및 미사용 포트 메서드 제거 | Step 6 (#40 필수) |

- [ ] #35 [TSK-007-01] GameOrchestrator.shave() 반환 계약 정규화 및 main.js 구조분해 TypeError 해소
- [ ] #36 [TSK-007-02] getSnapshot() comboCount 노출을 통한 콤보 배지/사운드/배율 기능 복구
- [ ] #37 [TSK-007-03] GridGeometry 값 객체 도입 및 High-DPI 브러시 좌표 변환 결함 해소
- [ ] #38 [TSK-007-04] CanvasRenderer pendingDirtyCells null 역참조 및 mouseup 리스너 이중 등록 제거
- [ ] #39 [TSK-007-05] main.js 조립/정책 책임 분리 및 커버리지 사각지대 해소
- [ ] #40 [TSK-007-06] 어댑터 조립의 컴포지션 루트 이관 및 포트 계약 테스트 스위트 구축 (DIP/LSP)
- [ ] #41 [TSK-007-07] 피부 톤 판정 로직의 DiffEngine 이관 및 미사용 포트 메서드 제거 (SRP/ISP)

## Review Findings Traceability

| Finding | 축 | 위치 | 자식 이슈 |
| --- | --- | --- | --- |
| C1 shave() undefined 반환 | 정합성 | `src/app/game-orchestrator.js:84`, `src/main.js:31` | TSK-007-01 |
| C3 comboCount 생산자 부재 | 정합성 / SDD | `src/domain/shave-session.js:109`, `src/main.js:84`, `src/ui/hud.js:139` | TSK-007-02 |
| C2 DPR 좌표 배율 오류 | 정합성 | `src/ui/brush-controller.js:56` | TSK-007-03 |
| A1 그리드 기하 6중 중복 | Interface-Locality | 6개 모듈 | TSK-007-03 |
| M1 pendingDirtyCells null.push | 정합성 | `src/ui/canvas-renderer.js:54` | TSK-007-04 |
| M2 mouseup 리스너 이중 등록 | 정합성 | `src/ui/brush-controller.js:71,87` | TSK-007-04 |
| T1 main.js 테스트 0개 | TDD | `src/main.js` | TSK-007-05 |
| A7 디미터 위반 / 정책 산재 | 아키텍처 | `src/main.js:65,90,96` | TSK-007-05 |
| A4 app 계층 concrete import | SOLID (DIP) | `src/app/stage-pipeline.js:5` | TSK-007-06 |
| A6 포트/어댑터 시그니처 불일치 | SOLID (LSP) | `src/ports/ascii-converter.port.js:12` | TSK-007-06 |
| T2/T3 계약 미검증 테스트 | TDD / SDD | `tests/app/app.test.js:88,204` | TSK-007-01, 02, 06 |
| A2 파이프라인 내 도메인 연산 | SOLID (SRP) | `src/app/stage-pipeline.js:29,87` | TSK-007-07 |
| A5 미사용 포트 메서드 강제 | SOLID (ISP) | `src/ports/image-processor.port.js:21` | TSK-007-07 |
| A3 loadStage 타입 스니핑 분기 | SOLID (OCP) | `src/app/stage-pipeline.js:70` | TSK-007-07 |

## Global Verification Contract

- Required commands: `node --test`
- Coverage command: `node --test --experimental-test-coverage "tests/**/*.test.js"`
- Required evidence: 34개 이상 테스트 통과, 100.00% Line / 100.00% Function / >=90% Branch 유지
- Fail-closed failure modes: 커버리지 기준 미달, 기존 테스트 회귀

## Skill / Policy Sources

- policies/UNIFIED_AGENT_CONSTITUTION.md
- policies/PARENT_CHILD_CHECKLIST_LABEL_GOVERNANCE.md
- AGENTS.md (Mandatory Red-Green-Refactor TDD Workflow)

## Checklist

- [ ] 7개 자식 이슈 전부 RGR 사이클(RED 선행) 준수 완료
- [ ] 100% Line / 100% Function / >=90% Branch 커버리지 유지
- [ ] src/main.js 커버리지 집계 대상 편입
- [ ] docs/wiki/Release-Patch-Notes.md v1.0.6 항목 동기화
