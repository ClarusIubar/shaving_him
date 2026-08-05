# Git Branching & PR Workflow Standard

## Core Rule: Mandatory Worktree / Feature Branch & PR Enforcement

1. **Direct Push Prohibition**:
   - Direct push (`git push origin main`) to `main` branch is strictly prohibited.
   - Committing implementation code directly on `main` is strictly prohibited.

2. **Branch & Worktree Strategy**:
   - Always pull latest `origin/main` (`git fetch origin main`).
   - Create an issue-specific branch or worktree off `origin/main`:
     - Branch Naming Convention: `feature/issue-<ID>`, `fix/tsk-<ID>`, or `refactor/<TSK-ID>`
     - Command: `git checkout -b feature/issue-<ID> origin/main` or `git worktree add ...`

3. **PR Execution & Merge Protocol**:
   - Push topic branch to remote: `git push origin <branch-name>`
   - Open Pull Request via GitHub CLI: `gh pr create --title "<Title>" --body "<Body>"`
   - Merge via PR: `gh pr merge --squash` or `gh pr merge --rebase` after verification.
