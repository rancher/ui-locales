# Rancher Prime UI Locales

This repository contains the **SUSE Localization Pack**, a Rancher UI Extension that adds
extra locales (translations) to the [Rancher Dashboard UI](https://github.com/rancher/dashboard).

Rancher ships with its own built-in languages. Installing this extension adds the languages
below to the language picker, without any change to Rancher itself.

Translations are maintained on a best-effort basis using AI-powered automation with human review.

## Available languages

| Locale | Language | Coverage |
|--------|----------|----------|
| `zh-hant` | Chinese (Traditional) | 93.7% |
| `es-es` | Spanish (Spain) | 91.7% |
| `pt-br` | Portuguese (Brazil) | 90.3% |
| `fr-fr` | French (France) | 87.8% |

`en-us` is the source language and is not shipped by this extension — Rancher already provides it.

Coverage is the share of keys whose value differs from the English source. A handful of keys are
identical on purpose (product names, `OK`, units), so real coverage is slightly higher than shown.
Run `yarn validate-locales` to recompute these numbers.

## Repository structure

```
ui-locales/
├── pkg/locales/                    # the extension package — this is what gets built
│   ├── index.ts                    # registers each locale with plugin.addLocale()
│   ├── package.json                # extension version + catalog annotations
│   ├── icon.svg                    # icon shown in the Extensions catalog
│   ├── README.md                   # description shown in the Extensions catalog
│   └── l10n/                       # the translations themselves
│       ├── es-es.yaml
│       ├── fr-fr.yaml
│       ├── pt-br.yaml
│       └── zh-hant.yaml
├── reference/
│   └── en-us.yaml                  # English source, synced from rancher/dashboard (not shipped)
├── scripts/
│   └── validate-locales.mjs        # structural validation, run in CI and by the workflows
├── .claude/commands/               # translation commands run locally with Claude Code
└── .github/workflows/
    ├── sync-locales.md             # agentic workflow: weekly en-us.yaml sync (compiled to .lock.yml)
    ├── validate-locales.yml        # runs the validator on every PR
    ├── build-extensions-test.yml   # verifies the extension still builds on every PR
    ├── build-extension-charts.yml  # publishes the Helm chart on release
    ├── build-extension-catalog.yml # publishes the extension catalog image on release
    └── shared/translation-rules.md # canonical rules every translation workflow follows
```

Both `l10n/` and `index.ts` matter: a YAML file is bundled by the shell's auto-import, but the
language only appears in the picker if it is also registered with `plugin.addLocale()`. The
validator fails if the two ever disagree.

## How it works

### Source of truth

`reference/en-us.yaml` is synced weekly from [`rancher/dashboard`](https://github.com/rancher/dashboard)
master. Translation files must mirror it exactly: same keys, same order, same nesting depth — only
leaf values change.

### Provenance tracking

Every file carries a provenance comment block at the top that records its sync state:

- `reference/en-us.yaml` records the upstream source, sync commit hash, and the PR that brought it in
- each translation records which `en-us` commit it is synced against, and when it was last updated

Comparing `synced-against-en-us-commit` in a translation with `synced-commit` in `en-us.yaml` shows
whether that translation has fallen behind. `yarn validate-locales` reports the drift for you.

### Validation

```sh
yarn validate-locales            # all locales
yarn validate-locales pt-br      # one locale
ADVISORIES=1 yarn validate-locales   # also list the advisory differences
```

Failures (the build is blocked):

- the file does not parse, or has duplicate keys
- a key exists that `en-us` does not have, keys are out of order, or a mapping became a scalar
- a placeholder in `en-us` was dropped or renamed, or the translation uses one `en-us` never defined
- HTML markup present in `en-us` was dropped or altered
- a URL was translated
- the provenance header is missing or incomplete
- a locale has a YAML file but no `addLocale()` registration, or the reverse

Advisories (reported, never fail the build):

- keys `en-us` has that the translation does not yet — normal in the week after a sync, and
  Rancher falls back to English for them
- plural/select structure simplified — legitimate in languages without plural forms
- markup or HTML entities the translation adds that `en-us` does not have
- the translation is synced against an older `en-us` commit than the current one

### Automated workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **sync-locales** | Weekly / manual | Fetches the latest `en-us.yaml` from `rancher/dashboard` and opens a PR if it changed, closing any sync PR it supersedes |
| **validate-locales** | Every PR | Runs `yarn validate-locales` |
| **build-extensions-test** | Every PR | Verifies the extension still builds |
| **build-extension-charts** | Release published | Publishes the Helm chart to the `gh-pages` branch |
| **build-extension-catalog** | Release published | Publishes the extension catalog image to `ghcr.io` |

`sync-locales` is an [agentic workflow](https://github.com/github/gh-aw). Edit `sync-locales.md`
and run `gh aw compile` — never edit `sync-locales.lock.yml` by hand.

### Translation rules

All translation work follows [`.github/workflows/shared/translation-rules.md`](.github/workflows/shared/translation-rules.md),
and everything mechanically checkable in those rules is enforced by `yarn validate-locales`.

## Developing

Requires Node 24 (see `.nvmrc`) and Yarn 1.

```sh
yarn install
yarn validate-locales            # check the translations
yarn build-pkg locales           # build the extension into dist-pkg/
```

To try it against a running Rancher, serve the built package and load it as a UI extension:

```sh
yarn serve-pkgs
```

## Installing

Once released, install **SUSE Localization Pack** from **Extensions** in the Rancher UI, then pick
the language from the user-preferences menu. The extension is marked `prime-only` and requires
Rancher 2.10 or newer.

## Releasing

See [docs/RELEASING.md](docs/RELEASING.md). In short: bump the version in **both** `package.json`
and `pkg/locales/package.json`, then publish a GitHub release tagged `locales-<version>`.

## Contributing

- Translations are managed through pull requests. GitHub Issues are disabled on this repository.
- Every PR is checked by `validate-locales` and `build-extensions-test` before merge.
- Human review is required — AI-generated translations are a starting point, not the finished work.
- To work on a translation locally, use the Claude Code commands in `.claude/commands`
  (`/update-language`, `/improve-translation`, `/fix-translation`, `/verify-translation`,
  `/add-language`).

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
