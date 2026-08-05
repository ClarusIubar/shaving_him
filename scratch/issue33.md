# [TSK-006-04] 전체 모듈 100% Line, 100% Function, 91.32% Branch Coverage 및 34개 테스트 수트

Task ID: TSK-006-04
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Branch: main
Scope-ID: TSK-006-04

## Core Classification

Core: TSK-006-00
Issue kind: executable-child
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Rationale: Expand Node.js test runner suite to achieve 100% line, 100% function, and >90% branch coverage across all 16 source files
Misroute blocked: true
Child Issue: https://github.com/ClarusIubar/shaving_him/issues/33
GovernanceLevel: L1
Layer 3 ceremony: standard

## Governance Level Policy

- Runtime contract: canonical-child-issue-specification.v1.
- Layer 1 and Layer 2 remain required regardless of ceremony density.
- Layer 3 ceremony level: l1.
- GovernanceLevel cannot force or suppress a Layer 2 substrate use decision.

## Problem

Incomplete test coverage leaves uncovered edge cases in window event handlers, sound synthesis, and UI modals.

## Goal

Achieve 100.00% Line Coverage, 100.00% Function Coverage, and 91.32% Branch Coverage across all 16 source files with 34 passing tests.

## Key Changes

- Add global.window mock and event callback tests in tests/app/app.test.js
- Add StaticJsonStageAdapter and SoundEffects error branch tests in tests/adapters/adapters.test.js and tests/app/app.test.js

## Scope

- Branch: main
- In Scope: tests/domain/domain.test.js, tests/adapters/adapters.test.js, tests/app/app.test.js
- Scope: tests/

## Out Of Scope

- Out of scope: External 3rd party libraries

## Plan

Runtime canonical reference: canonical-child-issue-specification.v1
- Cover all unreached functions and branches in Node.js test runner using mock context injection.

## Spec

Public behavior: Running node --test --experimental-test-coverage shows 100% line, 100% func, and 91.32% branch coverage.
Interface or data flow: Node.js V8 coverage reporter output.
Failure modes:
- Line coverage falls below 100%.
Validation target: node --test --experimental-test-coverage

## Test Plan

Test gate: unit
Validation commands:
- node --test --experimental-test-coverage tests/domain/*.test.js tests/adapters/*.test.js tests/app/*.test.js

## Verification Contract

- Required commands: node --test --experimental-test-coverage tests/domain/*.test.js tests/adapters/*.test.js tests/app/*.test.js
- Source-of-truth readback: gh issue view 33 --json body
- Required evidence: 100% line, 100% function, 91.32% branch coverage report
- Fail-closed failure modes: coverage under 100% line/func or under 90% branch

## Architecture Boundary Gate

- Durability: durable
- Architecture profile: suite (tests/app/app.test.js, tests/adapters/adapters.test.js)
- Responsibility map: Test suite validates all 5 layers of architecture.
- Dependency direction: Tests -> App -> Domain -> Adapters -> Ports
- External dependency boundary: Node.js Test Runner
- Validation seam: Node.js V8 test coverage.
- Scope map: tests/
- Architecture risk: minimal
- Single-file exception: Full suite coverage expansion

## Skill / Policy Sources

- policies/UNIFIED_AGENT_CONSTITUTION.md
- policies/PARENT_CHILD_CHECKLIST_LABEL_GOVERNANCE.md

## Context Substrate Contract

Vocabulary schema: runtime-substrate-vocabulary.v1
Vocabulary classification: default
Vocabulary route: standard
Selection policy: standard
qmd mode: off
Graphify mode: off
Hermes mode: off
Typed reason: standard
Required phases: none
Authority: Layer 2 context-substrate-readback-only; never Layer 1 completion authority.

## Checklist

- [x] Expand unit tests to reach 100.00% Line Coverage across 16 source files
- [x] Expand unit tests to reach 100.00% Function Coverage across 16 source files
- [x] Expand unit tests to reach 91.32% Branch Coverage across 16 source files
- [x] Verify all 34 tests pass cleanly in node --test runner
