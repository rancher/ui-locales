# Improve Translation Coverage

Find and translate untranslated strings in an existing locale file.

**Usage**: `/improve-translation <locale-code>`
**Example**: `/improve-translation pt-br`

**Arguments**: $ARGUMENTS

## Instructions

1. Parse the argument to extract the locale code.

2. Read `.github/workflows/shared/translation-rules.md` for the canonical translation rules, chunking strategy, and bash size limits. Follow them throughout.

3. Read both files:
   - `reference/en-us.yaml`
   - `pkg/ui-locales/l10n/<locale-code>.yaml`

4. **Identify untranslated strings** — write and run a bash script that compares both files:
   - A string is untranslated if its value is identical to en-us.yaml
   - Skip non-translatable values: empty strings, numbers, single characters, URLs, CSS classes, HTML markup, variable-only values like `{name}`, special values like `'—'`
   - Output: total leaf keys, already translated, untranslated, skipped, current coverage percentage
   - Break down untranslated counts by top-level section

5. **Translate in priority order**, following the shared translation rules and chunking strategy:
   - User-facing UI text first (buttons, labels, messages, descriptions, tooltips, error messages)
   - Long-form text next (paragraphs, help text)
   - Technical/edge-case strings last
   - Max ~50 keys per bash call
   - Stop after 500 strings — this command can be run again to continue

6. **Validate** the file using the YAML validation procedure. Fix any issues.

7. **Calculate final coverage** — re-run the coverage script to get updated numbers.

8. Commit the changes on the current branch.

9. Report: coverage before and after, strings translated in this run, strings remaining, per-section breakdown. Note that `/verify-translation <locale-code>` can be run for a full quality report, and this command can be run again if coverage is still below 100%.
