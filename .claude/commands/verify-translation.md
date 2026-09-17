# Verify Translation

Perform a read-only verification of a translation file. Does NOT modify any files — only analyzes and reports.

**Usage**: `/verify-translation <locale-code>`
**Example**: `/verify-translation pt-br`

**Arguments**: $ARGUMENTS

## Instructions

1. Parse the argument to extract the locale code.

2. Read `.github/workflows/shared/translation-rules.md` for the canonical rules.

3. Read both files:
   - `reference/en-us.yaml`
   - `pkg/locales/l10n/<locale-code>.yaml` (the translated file)

4. **Structural validation** — run the repository's validator rather than re-implementing it:

   ```sh
   ADVISORIES=1 yarn validate-locales <locale-code>
   ```

   It covers valid YAML and duplicate keys, key parity, key ordering, structure parity (mappings vs
   scalars), placeholder and markup integrity, the provenance header, and `addLocale()`
   registration. Report its errors and advisories as-is — they are already specific about which key
   is at fault.

   Then check by hand the two things it deliberately does not judge:

   - **Empty/special values**: empty values stay empty, special values like `'—'` are preserved
   - **Comments**: YAML comments are in the same positions as in en-us.yaml

5. **Translation coverage** — write and run a bash script that:
   - Extracts every leaf key-value pair from both files
   - Classifies each into: **Translated** (value differs from English), **Kept in English** (correctly identical — brand names, technical terms, acronyms), **Skipped** (non-translatable — empty, numbers, URLs, CSS, HTML markup, variable-only), **Untranslated** (identical to English and genuinely needs translation)
   - Calculates overall coverage: (translated + kept in English) / (total - skipped)
   - Breaks down coverage by top-level YAML section

6. **Agent review**: manually review strings classified as "untranslated" by the script. Reclassify product names, Kubernetes resource types, CLI commands, protocols, acronyms, etc. as "kept in English". Only strings with actual human-readable English that should be localized remain as "untranslated".

7. **Report results** using this format:
   - Each structural check: pass/fail with details
   - Coverage: overall percentage, per-section breakdown table
   - Counts: translated, kept in English, skipped, untranslated
   - Recommended actions (run `/improve-translation` if coverage < 100%, run `/fix-translation` for specific errors)
