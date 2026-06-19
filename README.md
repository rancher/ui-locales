# Rancher Prime UI Locales

This repository contains a UI Extension that provides additional locales (translations) for the [Rancher Dashboard UI](https://github.com/rancher/dashboard).

Translations are maintained on a best-effort basis using AI-powered automation with human review.

## Repository Structure

```
ui-locales/
├── reference/
│   └── en-us.yaml              # Source English file (synced from rancher/dashboard)
├── pkg/locales/l10n/
│   ├── es-es.yaml               # Spanish (Spain)
│   ├── fr-fr.yaml               # French (France)
│   ├── pt-br.yaml               # Portuguese (Brazil)
│   └── zh-hant.yaml             # Chinese (Traditional)
└── .github/workflows/
    ├── sync-locales.md           # Syncs en-us.yaml from rancher/dashboard weekly
    └── shared/
        └── translation-rules.md  # Shared rules for all translation workflows
```

## How It Works

### Source of Truth

The English source file (`reference/en-us.yaml`) is synced weekly from [`rancher/dashboard`](https://github.com/rancher/dashboard) master branch. Translation files live in `pkg/locales/l10n/` and must mirror the exact same keys, order, and nesting depth as the source.

### Provenance Tracking

Every file includes a provenance comment block at the top that tracks its sync state:

- **`reference/en-us.yaml`** records the upstream source, sync commit hash, and the PR that brought it in
- **Translation files** record which `en-us` commit they are synced against and when they were last updated

This makes it easy to detect drift — compare `synced-against-en-us-commit` in a translation file against `synced-commit` in `en-us.yaml`. If they differ, the translation needs updating.

### Automated Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **sync-locales** | Weekly schedule / manual | Fetches the latest `en-us.yaml` from `rancher/dashboard` and opens a PR if changes are found |

### Translation Rules

All translation work follows the shared rules defined in [`.github/workflows/shared/translation-rules.md`](.github/workflows/shared/translation-rules.md). Key constraints:

- Mirror source keys exactly — same keys, same order, same nesting depth
- Preserve all placeholders (`{variableName}`, ICU plurals, HTML tags)
- No Python — use Node.js or bash only
- Chunk large operations (max ~50 keys per script call)
- Validate YAML after every change (parse, key parity, placeholder check)

## Available Languages

| Locale | Language | Status |
|--------|----------|--------|
| `en-us` | English (US) | Source — synced from rancher/dashboard |
| `es-es` | Spanish (Spain) | Translated |
| `fr-fr` | French (France) | Translated |
| `pt-br` | Portuguese (Brazil) | Translated |
| `zh-hant` | Chinese (Traditional) | Translated (partial) |

## Contributing

1. Translations are managed through GitHub Issues and PRs
2. All translation PRs go through automated verification before merge
3. Human review is required — AI-generated translations are a starting point

License
=======
Copyright (c) 2014-2026 [SUSE](https://www.suse.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
