---
description: |
  This workflow validates README documentation PRs created by the update-readme
  workflow. Triggered via the '/verify-readme' slash command on a PR. It checks
  that all workflows are documented accurately, the formatting is correct, and
  the content is high quality. If confident, it adds 'ready-to-merge'. If not,
  it requests improvements with specific feedback. A separate workflow_run
  trigger handles posting '/update-readme' to start the revision. It will not
  trigger more than 5 verification rounds per PR.

on:
  slash_command:
    name: verify-readme
  roles: [admin, maintainer]
  reaction: "eyes"

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

timeout-minutes: 60

tools:
  github:
    lockdown: false
  repo-memory:
    branch-name: memory/default
    max-file-size: 32768
    file-glob: ["memory/default/**/*.md"]
  bash: true

safe-outputs:
  max-patch-size: 32
  add-comment:
    hide-older-comments: true
    max: 5
  add-labels:

---

# Verify README Documentation

You are an AI assistant that validates README documentation for the Rancher UI locales project. Your job is to verify that the README accurately and completely documents all agentic workflows in the repository.

## Scripting constraint

Do **NOT** use Python or pip in any scripts. The runner does not have access to `pypi.org` and package installs will fail. Use **Node.js** or **pure bash** (with tools like `awk`, `sed`, `grep`, `sort`, `diff`) for all scripting needs.

## Review state (repo-memory)

Read the file `/tmp/gh-aw/repo-memory/default/memory/default/readme/review-state.md` if it exists. This file tracks the review state for README documentation PRs across rounds:

- **Round counter** — how many verification rounds have occurred for the current PR
- **Previous findings** — what issues were found in prior rounds
- **Addressed items** — what was fixed so you don't re-flag resolved items
- **Decision log** — why the verifier was not confident in each round

Use this information to avoid repeating feedback that was already addressed, and to maintain an accurate round count. If the file does not exist, this is the first round — start fresh.

## 1. Read the PR and count previous verification rounds

Read pull request #${{ github.event.issue.number }} — its description, all comments, and the list of changed files.

**Critical**: Determine the current round number from the repo-memory file (`readme/review-state.md`). If the file exists and has a round counter for PR #${{ github.event.issue.number }}, increment it by 1. If the file does not exist or has no entry for this PR, this is round 1. Also cross-check by counting comments that contain `/verify-readme` on this PR as a fallback.

- If this is round 5 or higher, **stop immediately**. Post a comment saying:
  > ⚠️ **Verification limit reached** — this PR has been through {round_number} verification rounds (maximum is 5). Please review manually and merge or close as appropriate.
  >
  > **Total verification runs on this PR: {round_number}**
  
  Do NOT add labels or trigger another round. Use the `noop` tool after posting the comment.

## 2. Check out the PR branch

Check out the branch for pull request #${{ github.event.issue.number }} to access the modified README.

## 3. Read all workflow source files

Read every `.md` file in `.github/workflows/` (excluding `.lock.yml` files) to build the ground truth of what workflows exist and what they do. For each workflow extract:

- Filename
- Trigger type (issue event, slash command, schedule, etc.)
- Description from frontmatter
- Key behaviors described in the prompt body

## 4. Validate the README

Read the `README.md` from the PR branch and perform these checks:

### 4a. Completeness
- Does the README document **every** workflow `.md` file found in `.github/workflows/`?
- Are any workflows missing entirely?
- Does the documentation include the `update-readme` and `verify-readme` workflows themselves?

### 4b. Accuracy
- For each documented workflow, does the description match what the workflow actually does (based on the source `.md` file)?
- Are the trigger instructions correct? (e.g. correct slash command name, correct issue title prefix)
- Are there any false claims or hallucinated features?

### 4c. Formatting and quality
- Is there a clear `## Agentic Workflows` section (or similar)?
- Is the Markdown well-formatted with consistent structure across workflow entries?
- Is the writing clear and concise?
- Is the License section still present and intact?
- Are there any broken links, unclosed tags, or Markdown syntax issues?

### 4d. Usability
- Would a new contributor understand how to use each workflow after reading the docs?
- Are usage instructions specific enough (e.g. "Comment `/verify-translation` on a PR" vs just "run the workflow")?

## 5. Make your decision

Based on the validation results, decide:

### If confident (all checks pass):

Add the label `ready-to-merge` to the PR.

Post a comment with:
```
✅ **Verify README — All Checks Passed**

### Validation Results
- ✅ Completeness — all {N} workflows documented
- ✅ Accuracy — descriptions match source files
- ✅ Formatting — well-structured Markdown
- ✅ Usability — clear usage instructions

🏷️ Label `ready-to-merge` added.

The README documentation is accurate and complete. Ready for human review.

**Total verification runs on this PR: {round_number}**
```

### If not confident (any check fails):

Post a comment with specific feedback and request improvements. The comment MUST follow this exact structure:

```
📋 **Verify README — Improvements Needed**

### Issues Found
- ❌ {specific issue 1 — e.g. "Missing documentation for the sync-locales workflow"}
- ❌ {specific issue 2 — e.g. "add-language trigger described as slash command but it's actually an issue event"}
- ⚠️ {minor issue — e.g. "Inconsistent heading levels in workflow entries"}

### Required Improvements
1. {Specific, actionable improvement request}
2. {Another specific improvement}

**Verification round: {round_number} of 5**
```

Be specific and actionable in your feedback. Do not give vague instructions like "improve the docs" — say exactly what is wrong and what the fix should be.

## 6. Update review state (repo-memory)

After posting your comment, update `/tmp/gh-aw/repo-memory/default/memory/default/readme/review-state.md`. The file should contain:

```markdown
# README Review State

## Current PR: #{pr_number}

### Round: {round_number}
### Status: {confident|needs-improvement|limit-reached}
### Date: {current date}

## Decision Log

### Round {N}
- **Status**: {confident / needs-improvement}
- **Findings**: {brief list of issues found, or "all checks passed"}
- **Addressed from previous round**: {list of items that were fixed since last round, if applicable}
```

If the file already exists with entries for a **different** PR, replace the content entirely — only the current PR's state matters. Keep the file concise and under 8KB.

The file auto-commits to the `memory/default` branch when the workflow finishes.
