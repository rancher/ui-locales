---
description: |
  This workflow is triggered when a GitHub issue with [UPDATE] in the title
  requests that an existing language file be brought up to date with the current
  en-us.yaml. It compares the locale file against en-us.yaml to find new,
  removed, and changed keys, applies the necessary translations, and opens a
  Pull Request with the updated file. Useful after a sync-locales PR is merged.

on:
  issues:
    types: [opened, reopened]

if: startsWith(github.event.issue.title, '[UPDATE]')

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

timeout-minutes: 120

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
  create-pull-request:
    title-prefix: "feat: "
    labels: [translations, update-language, automated]
  add-comment: {}
---

# Update Existing Language Translation

When a GitHub issue requests that an existing language file be updated to match the current `en-us.yaml`, find all differences (new keys, removed keys, changed source values), apply the necessary translations, and open a Pull Request.

## Shared rules

**Before doing anything else**, read the file `.github/workflows/shared/translation-rules.md` from this repository. It contains the canonical scripting constraints, translation rules, YAML validation procedures, bash size limits, chunking strategy, and learnings instructions that you MUST follow throughout this workflow.

## Trigger condition

Only act if the issue title starts with `[UPDATE]` and the body specifies a language name and/or locale code (e.g. "Portuguese", "pt-br", "Japanese", "ja-jp").

If the issue does not meet these criteria, do nothing and stop.

## What to do

1. **Identify the language** from the issue — extract the language name and BCP 47 locale code (e.g. Portuguese Brazil → `pt-br`).

2. **Check the locale file exists** at `pkg/ui-locales/l10n/<locale-code>.yaml`. If it does NOT exist, add a comment to the issue suggesting to use `[ADD]` instead, and stop.

3. **Read both files**:
   - `pkg/ui-locales/l10n/en-us.yaml` (the source of truth)
   - `pkg/ui-locales/l10n/<locale-code>.yaml` (the file to update)

4. **Analyze the delta** using bash. Write and run a script that compares the two files and reports:
   - **New keys**: keys present in `en-us.yaml` but missing from the locale file
   - **Removed keys**: keys present in the locale file but missing from `en-us.yaml`
   - **Changed source values**: keys where the English value in `en-us.yaml` differs from what it was when the locale file was last translated (detect by comparing the locale value against both old and new English — if the locale value is identical to the new English value, it was likely never translated for the change)
   - **Key ordering issues**: keys that exist in both but are in a different order
   - Total counts for each category

   If there are **no differences** (the locale file is already fully in sync), add a comment to the issue saying the language is already up to date and stop.

5. **Apply updates** following the translation rules from the shared rules file:

   a. **New keys**: translate each new English value into the target language and insert it at the exact same position in the YAML structure as in `en-us.yaml`.

   b. **Removed keys**: delete them from the locale file.

   c. **Changed source values**: re-translate the updated English value and replace the old translation.

   d. **Key ordering**: reorder keys to match `en-us.yaml` exactly.

   Work in chunks following the chunking strategy from the shared rules file. Respect the bash script size limit.

6. **Validate the updated file** using the YAML validation procedure from the shared rules file. If there are parse errors, follow the fix procedure. Re-validate until clean.

7. **Open a Pull Request** that:
   - Updates `pkg/ui-locales/l10n/<locale-code>.yaml`
   - Title: `feat: update <Language Name> (<locale-code>) translation`
   - Body includes:
     - Reference to the issue number
     - Summary of changes: how many keys added, removed, re-translated, reordered
     - Validation results
     - Note that translations are AI-generated and should be reviewed by a native speaker
     - Mention that `/verify-translation` can be run on the PR for structural checks
   - References and closes the original issue

8. **Add a comment** to the issue confirming the PR was opened, with a link, and noting it needs native speaker review.

## Update learnings

After completing the work (or after hitting any significant obstacle), update the learnings file following the instructions in the shared rules file.

## Style

- Be thorough — translate every new/changed string, no skipping
- Be surgical — do not re-translate strings that haven't changed in `en-us.yaml`
- Be accurate with locale codes — use the correct BCP 47 standard code
- Flag in the PR description if any strings were uncertain or left in English
