# Rancher UI Locales

This repository contains a UI Extension that contains additional locales (translations) for the [Rancher Dashboard UI](https://github.com/rancher/dashboard).

The locales in this repository are maintained on a best-effort basis.

## Agentic Workflows

This repository uses [GitHub Agentic Workflows](https://docs.github.com/en/copilot/github-copilot-in-github/using-github-copilot-agentic-workflows) to automate common maintenance tasks — adding, updating, and verifying translations, syncing the source file from upstream, and keeping documentation up to date. All workflows are AI-powered; results should be reviewed by a human before merging.

> **Note:** The `[README]` issue workflow and the `/verify-readme` and `/update-readme` slash commands require `admin` or `maintainer` role. All other workflows (`[ADD]`, `[UPDATE]`, `[FIX]`, `/verify-translation`, `/improve-translation`) have no role restriction.

---

### Add Language

**Trigger:** Open a GitHub issue with `[ADD]` in the title and a body that names the language (e.g. "Add Portuguese Brazil translation").

**Description:** Translates the entire `en-us.yaml` source file into the requested language and opens a Pull Request with the new locale file at `pkg/ui-locales/l10n/<locale-code>.yaml`.

**Key behaviors:**
- Checks whether the locale file already exists; if so, comments on the issue and stops.
- Translates in chunks (up to 1000 strings per run); the PR can be continued via `/improve-translation`.
- Validates the generated YAML before opening the PR.
- Adds the labels `translations`, `new-language`, `automated` to the PR.
- Comments on the issue with a link to the PR and a reminder that native speaker review is required.

**Usage:** Create an issue with the title `[ADD] Add <Language Name> translation`.

---

### Update Language

**Trigger:** Open a GitHub issue with `[UPDATE]` in the title and a body that names the language or locale code to update.

**Description:** Brings an existing locale file up to date with the current `en-us.yaml`. Finds new keys, removed keys, changed source values, and key ordering issues, applies translations, and opens a Pull Request.

**Key behaviors:**
- Checks whether the locale file exists; if not, comments suggesting `[ADD]` instead.
- Reports a diff summary (keys added, removed, re-translated, reordered).
- Validates the updated YAML before opening the PR.
- Adds the labels `translations`, `update-language`, `automated` to the PR.
- Comments on the issue with a link to the PR.

**Usage:** Create an issue with the title `[UPDATE] Update <Language Name> translation`.

---

### Fix Translation

**Trigger:** Open a GitHub issue with `[FIX]` in the title and a body that describes the wrong word or phrase, the language affected, and the correct replacement.

**Description:** Fixes specific translation errors in a locale file and optionally finds and fixes similar issues in the same file, opening separate Pull Requests for each.

**Key behaviors:**
- PR #1 fixes the exact reported error.
- PR #2 (if applicable) fixes similar patterns found in the same file.
- Only modifies the language file identified in the issue — does not touch other language files.
- Validates YAML after each fix and preserves all placeholders.
- Adds the labels `translations`, `fix`, `automated` to each PR.

**Usage:** Create an issue with the title `[FIX] Wrong translation in <Language Name>` and describe the error in the body.

---

### Sync Locales

**Trigger:** Runs automatically on a **daily schedule**, or can be triggered manually via `workflow_dispatch`.

**Description:** Fetches the latest `en-us.yaml` from the upstream [`rancher/dashboard`](https://github.com/rancher/dashboard) repository and opens a Pull Request with the updated source file when changes are detected.

**Key behaviors:**
- Only updates `en-us.yaml` — does not modify any other language files.
- Skips PR creation if an existing open sync PR already covers the upstream changes.
- Summarizes added, removed, and modified keys in the PR body.
- Adds the labels `translations`, `sync`, `automated` to the PR.
- After merging, open an `[UPDATE]` issue per language to bring individual files up to date.

**Usage:** Runs automatically. To trigger manually, use the GitHub Actions "Run workflow" button.

---

### Verify Translation

**Trigger:** Comment `/verify-translation` on a translation Pull Request.

**Description:** Performs a read-only structural audit of the locale file in the PR. Produces a detailed report covering YAML validity, key parity, key ordering, structure parity, placeholder preservation, and translation coverage. Does **not** modify any files.

**Key behaviors:**
- Reports missing keys, extra keys, out-of-order keys, type mismatches, and missing placeholders.
- Calculates per-section translation coverage (translated vs. kept-in-English vs. untranslated).
- If all checks pass and coverage is 100%, adds the label `ready-to-merge` and submits an approving PR review.
- If issues are found, recommends running `/improve-translation` to apply fixes.

**Usage:** Comment `/verify-translation` on a translation PR.

---

### Improve Translation

**Trigger:** Comment `/improve-translation` on a translation Pull Request.

**Description:** Finds all untranslated strings in the PR's locale file, translates them in chunks (up to 1000 per run), pushes the improved file back to the PR branch, and reports progress.

**Key behaviors:**
- Identifies strings still identical to `en-us.yaml` and translates them.
- Can be run repeatedly until 100% coverage is reached.
- Validates the updated YAML before pushing.
- Posts a progress report showing coverage before/after, strings translated per section, and remaining count.

**Usage:** Comment `/improve-translation` on a translation PR. Can be re-run as many times as needed.

---

### Update README

**Trigger:** Open a GitHub issue with `[README]` in the title.

**Description:** Reads all workflow `.md` files in `.github/workflows/`, generates documentation for each workflow, and opens a Pull Request that updates `README.md` with an `## Agentic Workflows` section.

**Key behaviors:**
- Inserts the workflows section before the License section (or replaces an existing `## Agentic Workflows` section).
- Preserves all existing README content.
- Validates the updated Markdown before opening the PR.
- Adds the labels `documentation`, `automated` to the PR.

**Usage:** Create an issue with `[README]` in the title to request a documentation refresh.

---

### Update README — Revision

**Trigger:** Comment `/update-readme` on a documentation Pull Request (typically posted automatically by the Verify README workflow).

**Description:** Reads feedback from the most recent Verify README comment, applies the requested improvements to `README.md` on the PR branch, pushes the changes, and posts a summary comment.

**Key behaviors:**
- Addresses every item listed in the verify-readme feedback.
- Reads review history from repo memory to avoid re-introducing already-fixed issues.
- Adds a comment summarising what was changed.

**Usage:** Comment `/update-readme` on a README PR, or let the Verify README workflow trigger it automatically.

---

### Verify README

**Trigger:** Comment `/verify-readme` on a documentation Pull Request.

**Description:** Validates that the README accurately and completely documents all agentic workflows in the repository. Checks completeness, accuracy, formatting quality, and usability of the documentation.

**Key behaviors:**
- Verifies every workflow `.md` file in `.github/workflows/` is documented.
- Checks that trigger instructions, descriptions, and usage examples are accurate.
- If all checks pass, adds the label `ready-to-merge`.
- If issues are found, posts structured feedback and requests improvements via `/update-readme`.
- Limited to 5 verification rounds per PR to prevent loops.

**Usage:** Comment `/verify-readme` on a README documentation PR.

---

License
=======
Copyright (c) 2014-2025 [SUSE](https://www.suse.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
