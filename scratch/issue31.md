# [TSK-006-02] 4단계 실시간 사진 변환 프로그레스 바 및 16ms Thread Yielding

Task ID: TSK-006-02
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Branch: main
Scope-ID: TSK-006-02

## Core Classification

Core: TSK-006-00
Issue kind: executable-child
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Rationale: Provide 4-stage loading progress bar and micro-frame thread yielding during photo processing pipeline
Misroute blocked: true
Child Issue: https://github.com/ClarusIubar/shaving_him/issues/31
GovernanceLevel: L1
Layer 3 ceremony: standard

## Governance Level Policy

- Runtime contract: canonical-child-issue-specification.v1.
- Layer 1 and Layer 2 remain required regardless of ceremony density.
- Layer 3 ceremony level: l1.
- GovernanceLevel cannot force or suppress a Layer 2 substrate use decision.

## Problem

Processing uploaded images in single heavy synchronous block locks up main thread, leaving user UI frozen without progress feedback.

## Goal

Implement 4-stage progress updates (25% decoding, 50% skin tone, 75% diff, 95% ASCII) and yield thread using setTimeout(16ms) in StagePipeline.

## Key Changes

- Add `yieldThread()` helper in StagePipeline
- Update HUD loading progress bar and message text sequentially

## Scope

- Branch: main
- In Scope: src/app/stage-pipeline.js, src/ui/hud.js
- Scope: src/app/

## Out Of Scope

- Out of scope: Backend server processing

## Plan

Runtime canonical reference: canonical-child-issue-specification.v1
- Interleave async yields between pipeline processing steps and dispatch progress callbacks.

## Spec

Public behavior: Uploading custom photo shows animated progress bar advancing through 25%, 50%, 75%, 95%, 100% cleanly.
Interface or data flow: StagePipeline emits onProgress(percentage, text) to HUD.
Failure modes:
- Progress bar stuck at 25%.
Validation target: tests/app/*.test.js

## Test Plan

Test gate: unit
Validation commands:
- node --test tests/app/*.test.js

## Verification Contract

- Required commands: node --test tests/app/*.test.js
- Source-of-truth readback: gh issue view 31 --json body
- Required evidence: passing unit test output
- Fail-closed failure modes: failing unit test

## Architecture Boundary Gate

- Durability: durable
- Architecture profile: class (src/app/stage-pipeline.js)
- Responsibility map: StagePipeline coordinates image decoding, skin tone, diff, and ASCII generation.
- Dependency direction: App -> Ports -> Adapters
- External dependency boundary: Canvas / Image API
- Validation seam: Node.js test runner suite.
- Scope map: src/app/stage-pipeline.js, src/ui/hud.js
- Architecture risk: minimal
- Single-file exception: Pipeline progress UX

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

- [x] Implement 4-step progress reporting in StagePipeline
- [x] Add thread yielding between pipeline steps for smooth DOM rendering
- [x] Verify HUD updates loading progress bar correctly in tests/app/app.test.js
