# [TSK-006-03] 엄격 Red-Green-Refactor (RGR) TDD 워크플로우 가버넌스 구축

Task ID: TSK-006-03
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Branch: main
Scope-ID: TSK-006-03

## Core Classification

Core: TSK-006-00
Issue kind: executable-child
Parent Issue: https://github.com/ClarusIubar/shaving_him/issues/29
Rationale: Establish permanent workspace and global AGENTS.md rules enforcing strict Red-Green-Refactor TDD cycle
Misroute blocked: true
Child Issue: https://github.com/ClarusIubar/shaving_him/issues/32
GovernanceLevel: L1
Layer 3 ceremony: standard

## Governance Level Policy

- Runtime contract: canonical-child-issue-specification.v1.
- Layer 1 and Layer 2 remain required regardless of ceremony density.
- Layer 3 ceremony level: l1.
- GovernanceLevel cannot force or suppress a Layer 2 substrate use decision.

## Problem

Ad-hoc code implementation without prior failing tests risks regressing quality and violating strict TDD principles.

## Goal

Create AGENTS.md and .agents/rules/tdd-rgr.md rules mandating RED test assertion failure before writing any production code.

## Key Changes

- Write AGENTS.md and .agents/rules/tdd-rgr.md in workspace root
- Register global Antigravity rule in C:\Users\PC\.gemini\config\AGENTS.md

## Scope

- Branch: main
- In Scope: AGENTS.md, .agents/rules/tdd-rgr.md
- Scope: .agents/

## Out Of Scope

- Out of scope: Application source code

## Plan

Runtime canonical reference: canonical-child-issue-specification.v1
- Document 3-step RGR workflow (RED -> GREEN -> REFACTOR) and enforce zero-exception standard.

## Spec

Public behavior: Agent assistant always writes failing unit tests first and verifies node --test failure before implementation.
Interface or data flow: AI Agent system prompt customization rules.
Failure modes:
- Rule bypassed during rapid coding.
Validation target: AGENTS.md

## Test Plan

Test gate: unit
Validation commands:
- node --test tests/**/*.test.js

## Verification Contract

- Required commands: node --test tests/**/*.test.js
- Source-of-truth readback: gh issue view 32 --json body
- Required evidence: presence of AGENTS.md and passing test suite
- Fail-closed failure modes: missing governance rule

## Architecture Boundary Gate

- Durability: durable
- Architecture profile: governance (AGENTS.md)
- Responsibility map: AGENTS.md defines agent coding behavior and TDD governance.
- Dependency direction: System -> Agent
- External dependency boundary: Antigravity IDE Engine
- Validation seam: Local filesystem rules.
- Scope map: AGENTS.md, .agents/rules/tdd-rgr.md
- Architecture risk: minimal
- Single-file exception: Governance specification

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

- [x] Create workspace AGENTS.md and .agents/rules/tdd-rgr.md
- [x] Register global rule in C:\Users\PC\.gemini\config\AGENTS.md
