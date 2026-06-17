# Fix Translation Error

Fix a specific translation error in a locale file.

**Usage**: `/fix-translation <locale-code> "<wrong text>" "<correct text>"`
**Example**: `/fix-translation pt-br "Salvar" "Guardar"`

**Arguments**: $ARGUMENTS

## Instructions

1. Parse the arguments to extract the locale code, the wrong text, and the correct replacement.

2. Read `.github/workflows/shared/translation-rules.md` for the canonical translation rules. Follow them throughout.

3. Read `pkg/ui-locales/l10n/<locale-code>.yaml`.

4. Find the exact line(s) containing the wrong text and replace with the correct translation.

5. Check for similar issues — other occurrences of the same mistake or similar mistranslation patterns in the file. If found, fix them too and report what was found.

6. Validate the file after fixes: confirm valid YAML, no duplicate keys, no structural breakage, all placeholders intact. Fix any issues.

7. Commit the changes on the current branch.

8. Report: which keys were fixed, what was changed, and whether similar issues were found. Note that `/verify-translation <locale-code>` can be run for a full quality report.
