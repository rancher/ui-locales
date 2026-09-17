# Add New Language Translation

Add a new language translation to the UI locales extension.

**Usage**: `/add-language <Language Name> <locale-code>`
**Example**: `/add-language Japanese ja-jp`

**Arguments**: $ARGUMENTS

## Instructions

1. Parse the arguments to extract the language name and BCP 47 locale code (e.g. `Portuguese Brazil pt-br`, `Japanese ja-jp`, `Simplified Chinese zh-hans`).

2. Check if `pkg/locales/l10n/<locale-code>.yaml` already exists. If it does, stop and tell the user — suggest using `/update-language` instead.

3. Read `.github/workflows/shared/translation-rules.md` for the canonical translation rules, YAML validation procedures, bash size limits, and chunking strategy. Follow them throughout.

4. Copy `reference/en-us.yaml` to `pkg/locales/l10n/<locale-code>.yaml`.

5. Translate all string values in the new file, working in chunks:
   - Work by top-level YAML section
   - Max ~50 key-value pairs per bash call
   - Use `sed`, `awk`, or a small Node.js script to patch values in-place
   - Do NOT regenerate the entire file — patch incrementally
   - Prioritize: user-facing UI text first, long-form text next, technical/edge-case last
   - Stop after 1000 strings if the file has more — `/improve-translation` can continue

6. Validate with `yarn validate-locales <locale-code>` — do not write your own validation script. It also fails if the new locale is missing from `plugin.addLocale()` in `pkg/locales/index.ts`, which step 7 must add. Fix everything it reports and re-run until it exits clean.

7. Create a new git branch `add-<locale-code>-translation` and commit the new file.

8. Report: total keys, how many translated, coverage percentage. Note that `/verify-translation <locale-code>` can be run for a full quality report, and `/improve-translation <locale-code>` can continue translating remaining strings.
