# AGENTS Rules & Standards

## Mandatory Development Workflow: Strict Red-Green-Refactor (RGR) TDD

Every feature, enhancement, and bug fix MUST strictly adhere to the **Red-Green-Refactor (RGR)** TDD lifecycle:

1. 🔴 **RED**: Always write failing unit/integration/E2E test cases FIRST before touching production code. Execute `node --test` and confirm test failure.
2. 🟢 **GREEN**: Write minimal production code necessary to pass the test. Confirm test passes.
3. 🔵 **REFACTOR**: Clean up production and test code while maintaining **100% Line Coverage**, **100% Function Coverage**, and **>=90% Branch Coverage**.

**Writing implementation code first and patching tests later ("땜빵 방식") is strictly prohibited.**
