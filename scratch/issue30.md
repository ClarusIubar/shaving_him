# [TSK-006-01] main.js document.readyState 점검 및 시작 버튼 즉시 바인딩

Task ID: TSK-006-01
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Branch: main
Scope-ID: TSK-006-01

## Core Classification

Core: TSK-006-00
Issue kind: executable-child
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Rationale: Inspect document.readyState on module load to guarantee start button click event listener is bound immediately
Misroute blocked: true
Child Issue: https://github.com/ClarusIubar/shaving_him/issues/30
GovernanceLevel: L1
Layer 3 ceremony: standard

## Governance Level Policy

- Runtime contract: canonical-child-issue-specification.v1.
- Layer 1 and Layer 2 remain required regardless of ceremony density.
- Layer 3 ceremony level: l1.
- GovernanceLevel cannot force or suppress a Layer 2 substrate use decision.

## Problem

`<script type="module">` is evaluated after HTML DOM parsing finishes, causing `DOMContentLoaded` event listener to miss execution and render start button unresponsive.

## Goal

Check `document.readyState` synchronously in `src/main.js` and invoke `bootstrap()` immediately when DOM is interactive or complete.

## Key Changes

- Add `if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bootstrap); } else { bootstrap(); }` in `src/main.js`

## Scope

- Branch: main
- In Scope: src/main.js
- Scope: src/

## Out Of Scope

- Out of scope: DOM HTML layout

## Plan

Runtime canonical reference: canonical-child-issue-specification.v1
- Bind bootstrap listener conditionally based on initial document.readyState.

## Spec

Public behavior: Clicking start button initializes default stage without any missing event listeners or non-responsiveness.
Interface or data flow: DOM load event triggers main orchestrator initialization.
Failure modes:
- Event listener bound twice.
Validation target: tests/app/*.test.js

## Test Plan

Test gate: unit
Validation commands:
- node --test tests/app/*.test.js

## Verification Contract

- Required commands: node --test tests/app/*.test.js
- Source-of-truth readback: gh issue view 30 --json body
- Required evidence: passing unit test output
- Fail-closed failure modes: failing unit test

## Architecture Boundary Gate

- Durability: durable
- Architecture profile: bootstrap (src/main.js)
- Responsibility map: main.js serves as browser application entry point.
- Dependency direction: Bootstrap -> UI -> App
- External dependency boundary: DOM Window / Document
- Validation seam: Node.js test runner suite.
- Scope map: src/main.js
- Architecture risk: minimal
- Single-file exception: Main entry point event listener binding

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

- [x] Add document.readyState check in src/main.js for immediate bootstrap binding
- [x] Verify start button responds cleanly on page load
