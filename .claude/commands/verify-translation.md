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
   - `pkg/ui-locales/l10n/<locale-code>.yaml` (the translated file)

4. **Structural validation** — perform ALL checks:

   - **Valid YAML**: parse with Node.js or bash. Report any parse errors, duplicate keys, indentation issues.
   - **Key parity**: extract all fully-qualified key paths from both files. Report missing keys (in en-us but not locale) and extra keys (in locale but not en-us), up to 30 examples each.
   - **Key ordering**: check keys appear in the same order as en-us.yaml. Report count and up to 20 examples.
   - **Structure parity**: verify types match (mappings vs scalars) and nesting depth is identical.
   - **Placeholders**: verify all `{variableName}`, ICU format, HTML entities, HTML tags, and template expressions from en-us.yaml are preserved in translations. Report up to 30 examples of missing placeholders.
   - **Empty/special values**: verify empty values stay empty, special values like `'—'` are preserved, YAML comments are in the same positions.

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
