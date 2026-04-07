---
description: |
  This workflow improves translation coverage in pull requests on-demand via the
  '/improve-translation' slash command. It finds all untranslated strings (values
  still identical to en-us.yaml) in the locale file, translates them in chunks,
  pushes the improved file, and reports progress. Can be run repeatedly until
  100% coverage is reached.

on:
  slash_command:
    name: improve-translation
  reaction: "eyes"

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
  max-patch-size: 1024
  push-to-pull-request-branch:
  add-comment:
    hide-older-comments: true

---

# Improve Translation

You are an AI assistant that improves translation coverage for locale files in the Rancher UI locales project. Your job is to find all untranslated strings in the locale file on pull request #${{ github.event.issue.number }} of ${{ github.repository }}, translate them, and push the improved file back.

## Shared rules

**Before doing anything else**, read the file `.github/workflows/shared/translation-rules.md` from this repository. It contains the canonical scripting constraints, translation rules, YAML validation procedures, bash size limits, chunking strategy, and learnings instructions that you MUST follow throughout this workflow.

## 1. Read the PR and previous comments

Read pull request #${{ github.event.issue.number }} — its description, all comments, and the list of changed files.

- **Check for a previous `/verify-translation` report.** If one exists, read it carefully — it contains structural issues found, translation coverage by section, placeholder errors, and the list of untranslated strings. Use this to:
  - **Fix structural issues first** (duplicate keys, missing placeholders, key ordering problems) before translating new strings.
  - **Prioritise sections** with the lowest coverage.
  - **Avoid re-checking** things the verification already confirmed as clean.
- If there are previous `/improve-translation` comments from earlier runs, read them to understand what was already translated and what coverage was achieved.
- Take heed of any additional instructions in the slash command: "${{ steps.sanitized.outputs.text }}"
- Identify the locale file (e.g. `pkg/ui-locales/l10n/pt-br.yaml`) and the target language.

## 2. Check out the PR branch

Check out the branch for pull request #${{ github.event.issue.number }} and set up the environment.

## 3. Identify untranslated strings

Use bash to write and run a script that compares the locale file against `en-us.yaml`:

1. Parse both YAML files and extract every leaf key-value pair (fully-qualified key path → value).
2. A string is **untranslated** if its value in the locale file is **identical** to the value in `en-us.yaml`. Exception: values that should NOT be translated (placeholders like `'—'`, empty strings, pure numbers, single characters, URLs, technical identifiers, variable-only values like `{name}`) — skip those.
3. Output a report:
   - Total leaf keys
   - Already translated (value differs from English)
   - Untranslated (value still identical to English)
   - Skipped (non-translatable values)
   - Current coverage percentage

## 4. Translate in priority order

Translate the untranslated strings following the translation rules, priority order, chunking strategy, bash script size limits, and maximizing coverage guidance from the shared rules file.

Additionally for this workflow:

- **Stop after translating 1000 strings total** — then proceed immediately to steps 5–7. The workflow can be re-triggered to continue where it left off.

## 5. Validate after translation

Run the YAML validation procedure from the shared rules file. If there are parse errors, follow the fix procedure described there.

## 6. Calculate final coverage

Re-run the coverage script from step 3 to get updated numbers:
- New coverage percentage
- How many strings were translated in this run
- How many untranslated strings remain

## 7. Push and comment

Push the improved file and add a **detailed comment** to the PR:

- Summary header: "🌐 **Improve Translation — Progress Report**"
- Coverage before this run → coverage after this run
- Number of strings translated in this run
- Breakdown by top-level section (how many translated per section)
- Number of untranslated strings remaining
- If coverage is 100%: "✅ All strings are now translated! Ready for native speaker review."
- If coverage < 100%: "Run `/improve-translation` again to continue translating the remaining {N} strings."
- Always note that translations are AI-generated and need native speaker review

## 8. Update learnings

After completing the work, update the learnings file following the instructions in the shared rules file.
