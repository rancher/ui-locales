# Update Existing Language Translation

Update an existing language translation file to match the current `en-us.yaml`.

**Usage**: `/update-language <locale-code>`
**Example**: `/update-language pt-br`

**Arguments**: $ARGUMENTS

## Instructions

1. Parse the argument to extract the locale code (e.g. `pt-br`, `fr-fr`, `es-es`).

2. Check that `pkg/locales/l10n/<locale-code>.yaml` exists. If it does NOT, stop and suggest using `/add-language` instead.

3. Read `.github/workflows/shared/translation-rules.md` for the canonical translation rules. Follow them throughout.

4. Read both files:
   - `reference/en-us.yaml` (source of truth)
   - `pkg/locales/l10n/<locale-code>.yaml` (file to update)

5. Analyze the delta using bash — write and run a script that compares both files and reports:
   - **New keys**: present in en-us.yaml but missing from the locale file
   - **Removed keys**: present in locale file but missing from en-us.yaml
   - **Changed source values**: keys where the English value changed since last translation
   - **Key ordering issues**: keys in different order than en-us.yaml
   - Total counts for each category

6. If there are no differences, report that the language is already up to date and stop.

7. Apply updates following the shared translation rules, working in chunks (max ~50 keys per bash call):
   - New keys: translate and insert at the exact same position as in en-us.yaml
   - Removed keys: delete from the locale file
   - Changed values: re-translate
   - Key ordering: reorder to match en-us.yaml

8. Validate the updated file using the YAML validation procedure. Fix any issues and re-validate until clean.

9. Create a new git branch `update-<locale-code>-translation` and commit the changes.

10. Report: summary of changes (keys added, removed, re-translated, reordered). Note that `/verify-translation <locale-code>` can be run for a full quality report.
