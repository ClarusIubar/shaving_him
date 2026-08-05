# AGENTS Rules & Standards

## Mandatory Development Workflow: Strict Red-Green-Refactor (RGR) TDD

Every feature, enhancement, and bug fix MUST strictly adhere to the **Red-Green-Refactor (RGR)** TDD lifecycle:

1. 🔴 **RED**: Always write failing unit/integration/E2E test cases FIRST before touching production code. Execute `node --test` and confirm test failure.
2. 🟢 **GREEN**: Write minimal production code necessary to pass the test. Confirm test passes.
3. 🔵 **REFACTOR**: Clean up production and test code while maintaining **100% Line Coverage**, **100% Function Coverage**, and **>=90% Branch Coverage**.

**Writing implementation code first and patching tests later ("땜빵 방식") is strictly prohibited.**

## Mandatory Git Branching & PR Workflow: Strict Worktree/Branch & Pull Request Enforced

1. 🚫 **Direct Push to `main`/`origin/main` Strictly Forbidden**: NEVER perform `git push origin main` or commit directly on `main` branch.
2. 🌿 **Worktree / Issue Branch Creation**: For every feature, bug fix, or issue task, ALWAYS create a separate worktree or topic branch off `origin/main` (e.g., `feature/issue-<ID>` or `fix/tsk-<ID>`).
3. 🔀 **PR Creation & Merge**: Push topic branches to `origin` and execute Pull Request creation and merging (`gh pr create` / `gh pr merge`) after user review and automated test passing.

