---
description: |
  This workflow improves translation coverage in pull requests. It finds all
  untranslated strings (values still identical to en-us.yaml) in the locale file,
  translates them in chunks, saves a patch to repo-memory, and dispatches the
  apply-translation-patch workflow to push changes. Can be run repeatedly until
  100% coverage is reached.

on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: "PR number to improve translations for"
        required: true
        type: string
      attempt:
        description: "Current attempt number (loop counter)"
        required: false
        type: string
        default: "1"

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
    max-file-size: 102400
    max-patch-size: 102400
    file-glob: ["**/*.md", "*.patch"]
  bash: true

safe-outputs:
  max-patch-size: 1024
  add-comment:
    hide-older-comments: true
  dispatch-workflow: [apply-translation-patch]
  noop:

---

# Improve Translation

You are an AI assistant that improves translation coverage for locale files in the Rancher UI locales project. Your job is to find all untranslated strings in the locale file on pull request #${{ github.event.inputs.pr_number }} of ${{ github.repository }}, translate them, save a patch, and dispatch the apply workflow to push changes.

## Loop Guard

Before doing any work, check the attempt counter: `${{ github.event.inputs.attempt }}`.

If the attempt number is greater than 5:
1. Post a comment on PR #${{ github.event.inputs.pr_number }} explaining that the automated verify→improve loop has reached its maximum of 5 iterations and requires manual intervention.
2. Use `noop` and stop — do NOT continue with translation.

Otherwise, proceed normally.

## Shared rules

**Before doing anything else**, read the file `.github/workflows/shared/translation-rules.md` from this repository. It contains the canonical scripting constraints, translation rules, YAML validation procedures, bash size limits, chunking strategy, and learnings instructions that you MUST follow throughout this workflow.

## 1. Read the PR and previous comments

Read pull request #${{ github.event.inputs.pr_number }} — its description, all comments, and the list of changed files.

- **Check for a previous verification report.** If one exists, read it carefully — it contains structural issues found, translation coverage by section, placeholder errors, and the list of untranslated strings. Use this to:
  - **Fix structural issues first** (duplicate keys, missing placeholders, key ordering problems) before translating new strings.
  - **Prioritise sections** with the lowest coverage.
  - **Avoid re-checking** things the verification already confirmed as clean.
- If there are previous improve-translation comments from earlier runs, read them to understand what was already translated and what coverage was achieved.
- Identify the locale file (e.g. `pkg/ui-locales/l10n/pt-br.yaml`) and the target language.

## 2. Check out the PR branch

Check out the branch for pull request #${{ github.event.inputs.pr_number }} and set up the environment.

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

- **Stop after translating 500 strings total** — then proceed immediately to steps 5–7. The workflow can be re-triggered to continue where it left off. This limit ensures the resulting patch stays under the 100 KB repo-memory size limit.

## 5. Validate after translation

Run the YAML validation procedure from the shared rules file. If there are parse errors, follow the fix procedure described there.

## 6. Calculate final coverage

Re-run the coverage script from step 3 to get updated numbers:
- New coverage percentage
- How many strings were translated in this run
- How many untranslated strings remain

## 7. Save patch and dispatch apply workflow

Instead of pushing directly, save the changes as a patch and dispatch the apply workflow:

1. Find the locale file that was modified:
   ```bash
   LOCALE_FILE=$(git diff --name-only)
   ```

2. Commit the changes locally and generate a patch:
   ```bash
   git add "$LOCALE_FILE"
   git commit -m "improve: translate strings for $LOCALE - attempt ${{ github.event.inputs.attempt }}"
   git diff HEAD~1 -- "$LOCALE_FILE" > /tmp/gh-aw/repo-memory/default/translation-pr-${{ github.event.inputs.pr_number }}.patch
   ```

3. Verify the patch starts with `diff --git` (not `---` with timestamps):
   ```bash
   head -3 /tmp/gh-aw/repo-memory/default/translation-pr-${{ github.event.inputs.pr_number }}.patch
   ```
   If the first line does NOT start with `diff --git`, delete it and regenerate.

4. **IMPORTANT**: The patch file MUST be placed directly at:
   `/tmp/gh-aw/repo-memory/default/translation-pr-<PR_NUMBER>.patch`
   Do NOT create any subdirectories — the sandbox blocks mkdir inside repo-memory.

5. After saving, call the push_repo_memory tool to validate the size is within limits.

6. Dispatch the `apply-translation-patch` workflow using `dispatch-workflow` with inputs:
   - `pr_number`: `${{ github.event.inputs.pr_number }}`
   - `attempt`: `${{ github.event.inputs.attempt }}`

7. Add a **detailed comment** to PR #${{ github.event.inputs.pr_number }}:
   - Summary header: "🌐 **Improve Translation — Progress Report**"
   - Coverage before this run → coverage after this run
   - Number of strings translated in this run
   - Breakdown by top-level section (how many translated per section)
   - Number of untranslated strings remaining
   - If coverage is 100%: "✅ All strings are now translated! Ready for native speaker review."
   - If coverage < 100%: "The verify-translation workflow will be triggered automatically after changes are applied to continue the improvement cycle."
   - Always note that translations are AI-generated and need native speaker review

## 8. Update learnings

After completing the work, update the learnings file following the instructions in the shared rules file.
