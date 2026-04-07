---
description: |
  This workflow is triggered by the '/update-readme' slash command on a PR. It
  addresses feedback from the verify-readme workflow by reading improvement
  requests, updating the README documentation accordingly, and pushing the
  changes to the PR branch. A separate workflow_run trigger handles re-triggering
  validation.

on:
  slash_command:
    name: update-readme
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
  push-to-pull-request-branch:
  add-comment:
    hide-older-comments: true
    max: 5

---

# Update README — Revision

You are an AI assistant that revises the README.md documentation for the Rancher UI locales project. This workflow is triggered when the verify-readme workflow requests improvements via `/update-readme`. Your job is to read the feedback, fix the issues, push the updated README, and trigger re-validation.

## Scripting constraint

Do **NOT** use Python or pip in any scripts. The runner does not have access to `pypi.org` and package installs will fail. Use **Node.js** or **pure bash** (with tools like `awk`, `sed`, `grep`, `sort`, `diff`) for all scripting needs.

## Review state (repo-memory)

Read the file `/tmp/gh-aw/repo-memory/default/memory/default/readme/review-state.md` if it exists. This file tracks the review state written by the verify-readme workflow:

- **Round counter** — what verification round we're on
- **Previous findings** — what issues were found
- **Decision log** — history of what was flagged and fixed

Use this to understand the full history of feedback, not just the latest comment. If the file does not exist, rely on PR comments instead.

## 1. Read the PR and feedback

Read pull request #${{ github.event.issue.number }} — its description, all comments, and the list of changed files.

- Find the most recent comment from the verify-readme workflow. It will contain an **"Issues Found"** section and a **"Required Improvements"** list. You MUST address **every single item** in that list.
- Also take heed of any additional instructions in the slash command: "${{ steps.sanitized.outputs.text }}"

## 2. Check out the PR branch

Check out the branch for pull request #${{ github.event.issue.number }} and set up the environment.

## 3. Read all workflow files

Read every `.md` file in `.github/workflows/` (excluding `.lock.yml` files). For each workflow, extract:

- **Name**: derived from the filename (e.g. `add-language.md` → "Add Language")
- **Trigger**: how it is activated (issue title prefix, slash command, schedule, etc.)
- **Description**: what it does (from the `description` field in the frontmatter and the prompt body)
- **Usage**: how a user would invoke it (e.g. "Create an issue with `[ADD]` in the title", "Comment `/verify-translation` on a PR")
- **Key behaviors**: important details like labels added, PR creation, validation steps

## 4. Fix the README

Read the current `README.md` from the PR branch. Then apply all requested improvements:

- Address every issue listed in the verify-readme feedback
- If workflows were missing, add them
- If descriptions were inaccurate, correct them based on the actual workflow source files
- If formatting was inconsistent, fix it
- Ensure the `## Agentic Workflows` section (or similar) is complete and accurate
- **Preserve** all existing content outside the workflows section (title, description, license, etc.)
- Ensure the License section is still present and intact at the end

## 5. Validate the README

Use bash to verify:
- The file is valid Markdown (no unclosed tags, proper heading hierarchy)
- All workflow names mentioned actually exist as `.md` files in `.github/workflows/`
- The License section is still present and intact at the end

## 6. Push the changes and comment

Push the updated README.md to the PR branch.

Then add a comment to the PR with a summary of what improvements were made, referencing the specific feedback items addressed.
