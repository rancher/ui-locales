---
description: |
  This workflow checks for changes in the en-us.yaml translation file from
  rancher/dashboard and opens a Pull Request in this repository with the updated
  en-us.yaml when changes are found. It only syncs the English source file — it
  does NOT update other language files. Use the [UPDATE] issue workflow to bring
  individual language files up to date after the sync PR is merged.

on:
  schedule: daily
  workflow_dispatch:

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
  create-pull-request:
    title-prefix: "chore: "
    labels: [translations, sync, automated]
  add-comment: {}
---

# Sync en-us.yaml from rancher/dashboard

Keep the `en-us.yaml` translation source file in sync with the upstream `rancher/dashboard` repository. This workflow **only** updates `en-us.yaml` — it does not touch other language files.

## Shared rules

**Before doing anything else**, read the file `.github/workflows/shared/translation-rules.md` from this repository. It contains the canonical scripting constraints and learnings instructions that you MUST follow throughout this workflow.

## What to do

1. Fetch the latest `en-us.yaml` from `rancher/dashboard` master branch at:
   `https://raw.githubusercontent.com/rancher/dashboard/master/shell/assets/translations/en-us.yaml`

2. Compare it with the current contents of `pkg/ui-locales/l10n/en-us.yaml` in this repository (**on the default branch**, not a PR branch).

3. If there are **no changes** to `en-us.yaml` compared to the default branch, do nothing and report that translations are already up to date.

4. **Before creating a PR, check for existing open sync PRs**:

   a. Search for open pull requests in this repository with the label `sync` and title containing `sync en-us.yaml`. Use the GitHub tools to list open PRs.

   b. If an open sync PR exists, check out its branch and compare the upstream `en-us.yaml` you just fetched against the `en-us.yaml` **on that PR branch**.

   c. If the upstream `en-us.yaml` is **identical** to the one already on the PR branch, then the existing PR already covers these changes. Add a comment to the existing PR noting that the sync check ran and no new upstream changes were found. Then **stop** — do not create a new PR.

   d. If the upstream `en-us.yaml` has **additional changes** beyond what the existing PR branch has, proceed to step 5 to create a new PR with the latest changes. Mention in the new PR body that it supersedes the existing PR (reference it by number).

5. If there **are changes** to `en-us.yaml` and no existing PR already covers them:

   a. Identify what changed — keys added, removed, or values modified. Produce a summary.

   b. Open a Pull Request that includes **only** the updated `pkg/ui-locales/l10n/en-us.yaml`:
      - Title: `chore: sync en-us.yaml from rancher/dashboard`
      - Body that summarizes: what changed (keys added, removed, values modified), with counts
      - Include a note: "After merging, open an `[UPDATE] <language>` issue for each language that needs to be brought up to date."
      - Labels: `translations`, `sync`, `automated`

## Style

- Be precise and technical 🔍
- Summarize the diff clearly — highlight added keys, removed keys, and changed values with counts
- Keep the PR body concise and scannable
