---
description: |
  This workflow is triggered when a GitHub issue with [ADD] in the title requests
  a new language translation. It reads the en-us.yaml file, translates all values
  into the requested language, and opens a Pull Request with the new locale file.

on:
  issues:
    types: [opened, reopened]

if: startsWith(github.event.issue.title, '[ADD]')

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
  create-pull-request:
    title-prefix: "feat: "
    labels: [translations, new-language, automated]
  add-comment: {}
---

# Add New Language Translation

When a GitHub issue requests a new language to be added to the UI locales extension, translate the entire `en-us.yaml` file into the requested language and open a Pull Request.

## Shared rules

**Before doing anything else**, read the file `.github/workflows/shared/translation-rules.md` from this repository. It contains the canonical scripting constraints, translation rules, YAML validation procedures, bash size limits, chunking strategy, and learnings instructions that you MUST follow throughout this workflow.

## Trigger condition

Only act if the issue title starts with `[ADD]` and the body clearly requests a new language translation mentioning a specific language name (e.g. "Portuguese", "Japanese", "French") and/or a locale code (e.g. `pt-br`, `ja-jp`, `fr-fr`).

If the issue does not meet these criteria, call the `noop` tool and stop.

## What to do

1. **Identify the language** requested in the issue — extract both the language name and the correct BCP 47 locale code (e.g. Portuguese Brazil → `pt-br`, Japanese → `ja-jp`, Simplified Chinese → `zh-hans`, French → `fr-fr`).

2. **Check if the locale file already exists** by looking for `pkg/ui-locales/l10n/<locale-code>.yaml` in the repository. If it already exists, add a comment to the issue saying the language is already supported, suggest using `[UPDATE]` instead, and call the `noop` tool to end the workflow. Do NOT proceed further.

3. **Read the full contents** of `pkg/ui-locales/l10n/en-us.yaml` from this repository.

4. **Translate all string values** in chunks following the translation rules, chunking strategy, and bash script size limits from the shared rules file.

   **Critical for new files**: Since you are building the file from scratch, start by copying `en-us.yaml` to the new locale file path, then translate in-place using the chunking approach (patch values using `sed`/`awk`/Node.js, max ~50 keys per bash call). Do NOT try to generate the entire translated file in one shot — it will exceed tool call size limits and fail silently.

   **Stop after translating 1000 strings total** if the file has more. Open the PR with what you have — `/improve-translation` can be run on the PR to continue.

5. **Self-validate before opening the PR** using the YAML validation procedure from the shared rules file. If any issues are found, follow the YAML parse error fix procedure and re-validate until clean.

6. **Open a Pull Request** that:
   - Creates the new file at `pkg/ui-locales/l10n/<locale-code>.yaml` with the translated content
   - Has the title: `feat: add <Language Name> (<locale-code>) translation`
   - Has a body that mentions the issue number, the language added, and a note that the translation was AI-generated and should be reviewed by a native speaker
   - Includes the validation results (total keys, any issues found and fixed)
   - References and closes the original issue

7. **Add a comment** to the original issue letting the requester know a PR has been opened with the translation, linking to it, noting it needs native speaker review before merging, and that `/verify-translation` can be run on the PR for additional structural checks.

## Update learnings

After completing the work (or after hitting any significant obstacle), update the learnings file following the instructions in the shared rules file.

## Style

- Be thorough — translate every string value, no skipping
- Be accurate with locale codes — use the correct BCP 47 standard code for the language
- Flag in the PR description if any strings were uncertain or left in English due to technical constraints
