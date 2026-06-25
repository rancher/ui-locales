# UI Locales

Rancher UI Locales extension — manages translation YAML files for the Rancher Dashboard UI.

## Structure

- `reference/en-us.yaml` — English source file (synced from `rancher/dashboard`, not bundled with the extension)
- `pkg/locales/l10n/<locale-code>.yaml` — translated locale files (e.g. `pt-br.yaml`, `fr-fr.yaml`, `es-es.yaml`)
- `.github/workflows/shared/translation-rules.md` — canonical translation rules, YAML validation, chunking strategy

## Translation commands

| Command | Purpose |
|---------|---------|
| `/add-language <Name> <code>` | Create a new language translation from scratch |
| `/update-language <code>` | Sync existing translation with current en-us.yaml |
| `/fix-translation <code> "wrong" "correct"` | Fix a specific translation error |
| `/verify-translation <code>` | Read-only quality report (structural + coverage) |
| `/improve-translation <code>` | Translate remaining untranslated strings |

## Rules

- Use Node.js or pure bash for scripting (no Python/pip)
- Max ~50 key-value pairs per bash call when modifying locale files
- Locale files must mirror en-us.yaml exactly: same keys, same order, same nesting — only leaf values change
- Preserve all placeholders: `{var}`, ICU format, HTML tags, entities
