# Strict Red-Green-Refactor (RGR) TDD Workflow Rule

## Principle
All feature developments, enhancements, and bug fixes MUST strictly follow the **Red-Green-Refactor (RGR)** TDD methodology. Creating production code first and writing tests afterwards ("땜빵 방식") is strictly forbidden.

---

## RGR Cycle Requirements

### 1. 🔴 RED Phase (Failing Test First)
- Write unit/integration/E2E test cases defining the expected behavior **BEFORE** writing any single line of production code.
- Run `node --test` to execute the new test and **VERIFY** that it fails with the exact expected failure reason (AssertionError/TypeError/NotImplemented).

### 2. 🟢 GREEN Phase (Minimal Passing Implementation)
- Write the minimum necessary production code required to satisfy the failing test.
- Run `node --test` to verify that all tests pass cleanly.

### 3. 🔵 REFACTOR Phase (Clean Code & Coverage Standard)
- Refactor the code for clean architecture, low coupling, high cohesion, and zero code smell.
- Re-run `node --test --experimental-test-coverage` to ensure:
  - **100.00% Line Coverage**
  - **100.00% Function Coverage**
  - **>= 90.00% Branch Coverage**
  - All tests continue to pass (**100% PASS**).

---

## Zero Exception Standard
- No pull request, commit, or patch shall be considered complete without a verified RED test artifact in its commit history.
