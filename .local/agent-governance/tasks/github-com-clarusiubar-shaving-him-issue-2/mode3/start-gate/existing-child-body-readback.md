# [TSK-001-01] Core Domain Layer Implementation

Task ID: TSK-001-01
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/1
Branch: main
Scope-ID: TSK-001-01
Status: status:ready

## Core Classification
Core: TSK-001-00
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/1
Rationale: Implements pure business domain logic without browser DOM or Canvas API dependencies.
Misroute blocked: UI or Canvas rendering code must NOT be placed in src/domain/.

## Problem
Monolithic index.html tightly coupled game scoring, timer logic, and canvas rendering, making domain logic untestable outside a browser DOM environment.

## Goal
Create pure ES module domain components (HairGrid, ScoreCalculator, ShaveSession) that operate strictly on pure JavaScript data structures and value objects.

## Scope
Scope: Implement pure domain business logic (HairGrid, ScoreCalculator, ShaveSession) in src/domain/ with pure Node.js unit tests.

## Out of Scope
Canvas 2D API calls, HTML element manipulation, Mouse/Touch event handlers.

## Public Behavior
Exposes pure ES module classes HairGrid, ScoreCalculator, and ShaveSession with deterministic methods.

## Interface or Data Flow
ShaveSession -> owns HairGrid & ScoreCalculator state. Accepts pure coordinate inputs (row, col, radius) and returns state DTOs.

## Validation Target
Node.js test runner (node --test tests/domain/*.test.js).

## Architecture Boundary Gate
Durability: Durable core domain module.
Architecture profile: Pure Domain Layer.
Responsibility map: HairGrid owns coordinate removal; ScoreCalculator owns scoring rules; ShaveSession owns timer and session state.
Dependency direction: Inward only (0 external dependencies).
Stable contract: Pure ES module domain classes & value objects.
Core behavior owner: ShaveSession and HairGrid.
External dependency boundary: 0% external imports (no DOM, no Canvas, no HTTP).
Validation seam: Executable pure Node.js unit tests.
Scope map: src/domain/ directory.
Architecture risk: High risk of accidental DOM reference — must fail build if imported in src/domain/.
Single-file exception: Not applicable.

## Skill or Policy Sources
- policies/PARENT_CHILD_CHECKLIST_LABEL_GOVERNANCE.md
- policies/UNIFIED_AGENT_CONSTITUTION.md

## Verification Contract
Test gate: Node.js unit test suite.
Validation commands: node --test tests/domain/*.test.js
Required commands: node --test tests/domain/*.test.js
Source-of-truth readback: Node.js test runner exit code 0.
Required evidence: Unit test pass summary demonstrating 100% domain isolation.
Fail-closed failure modes: Fails if HairGrid or ShaveSession dereference any DOM/Canvas object.

## Checklist
- [ ] Implement HairGrid coordinate removal & radius shaving math (src/domain/hair-grid.js)
- [ ] Implement ScoreCalculator scoring & bonus rules (src/domain/score-calculator.js)
- [ ] Implement ShaveSession state machine & timer ticks (src/domain/shave-session.js)
- [ ] Add domain unit test suite (tests/domain/domain.test.js)
- [ ] Pass verification contract in pure Node.js environment
