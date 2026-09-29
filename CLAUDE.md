# UI Locales

Rancher UI Locales extension — manages translation YAML files for the Rancher Dashboard UI.

## Structure

- `reference/en-us.yaml` — English source file (synced from `rancher/dashboard`, not bundled with the extension)
- `pkg/locales/l10n/<locale-code>.yaml` — translated locale files (e.g. `pt-br.yaml`, `fr-fr.yaml`, `es-es.yaml`)
- `pkg/locales/index.ts` — registers each locale with `plugin.addLocale()`; a locale file without a
  registration here is built but never offered in the UI
- `scripts/validate-locales.mjs` — the structural validator (`yarn validate-locales`)
- `.github/workflows/shared/translation-rules.md` — canonical translation rules, YAML validation, chunking strategy

## Translation commands

| Command | Purpose |
|---------|---------|
| `/add-language <Name> <code>` | Create a new language translation from scratch |
| `/update-language <code>` | Sync existing translation with current en-us.yaml |
| `/fix-translation <code> "wrong" "correct"` | Fix a specific translation error |
| `/verify-translation <code>` | Read-only quality report (structural + coverage) |
| `/improve-translation <code>` | Translate remaining untranslated strings |

## Validating

Always validate with the repository's own script rather than writing a new one:

```sh
yarn validate-locales            # every locale
yarn validate-locales pt-br      # one locale
ADVISORIES=1 yarn validate-locales   # include the advisory list
```

It is the executable form of the translation rules — key parity and order, duplicate keys,
placeholder and markup invariants, provenance header, `addLocale()` registration — and the same
check runs on every PR.

Parity with `reference/en-us.yaml` is absolute: once en-us changes, every locale fails until
`/update-language` realigns it, and every PR fails with them. The only exempt change is one that
touches `reference/en-us.yaml` and no locale file.

## Releasing

Bump the version in **both** `package.json` and `pkg/locales/package.json`, then publish a release
tagged `locales-<version>`. See `docs/RELEASING.md`.

## Rules

- Use Node.js or pure bash for scripting (no Python/pip)
- Max ~50 key-value pairs per bash call when modifying locale files
- Locale files must mirror en-us.yaml exactly: same keys, same order, same nesting — only leaf values change
- Preserve all placeholders: `{var}`, ICU format, HTML tags, entities
