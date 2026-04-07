---
description: |
  This workflow performs a read-only verification of translation files in pull
  requests on-demand via the '/verify-translation' slash command. It compares the
  target locale YAML against en-us.yaml and produces a detailed report covering
  structural integrity, translation coverage, placeholder preservation, and key
  ordering. It does NOT modify any files — it only reports findings. When issues
  are found it recommends running '/improve-translation' to apply fixes.

on:
  slash_command:
    name: verify-translation
  reaction: "eyes"

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

timeout-minutes: 60

tools:
  github:
    lockdown: false
  repo-memory:
    branch-name: memory/default
    max-file-size: 32768
    file-glob: ["memory/default/**/*.md"]
  bash: true

safe-outputs:
  max-patch-size: 1024
  add-comment:
    hide-older-comments: true
  add-labels:
  submit-pull-request-review:
    target: ${{ github.event.issue.number }}
    footer: "if-body"

---

# Verify Translation

You are an AI assistant specialized in auditing translation YAML files for the Rancher UI locales project. Your job is to **verify** the translated locale file in pull request #${{ github.event.issue.number }} of ${{ github.repository }} and produce a detailed quality report. You do **NOT** modify or fix any files — you only analyze and report.

## Shared rules

**Before doing anything else**, read the file `.github/workflows/shared/translation-rules.md` from this repository. It contains the canonical scripting constraints, translation rules, YAML validation procedures, bash size limits, chunking strategy, and learnings instructions that you MUST follow throughout this workflow.

## Important: read-only workflow

This workflow is strictly read-only. You must **never** push changes, edit files, or modify the PR branch. All findings are reported as a PR comment. If issues are found, recommend that the user runs `/improve-translation` to apply fixes.

## 1. Read the PR and previous comments

Read pull request #${{ github.event.issue.number }} — its description, all comments, and the list of changed files.

- If there are previous `/verify-translation` comments from earlier runs, read them to understand what was already reported and whether issues have been addressed since.
- Take heed of any additional instructions in the slash command: "${{ steps.sanitized.outputs.text }}"
- Identify which locale file is being added or modified (e.g. `pkg/ui-locales/l10n/pt-br.yaml`).

## 2. Check out the PR branch

Check out the branch for pull request #${{ github.event.issue.number }} and set up the environment.

## 3. Structural validation

The translated file **must be a mirror** of `en-us.yaml` with only the values changed. Perform ALL of the following checks and collect the results for the final report.

### 3a. Valid YAML

Parse the locale file with a YAML parser. Report whether it parses successfully. If it fails, report the error details. Common causes:
- **Duplicate keys** at the same nesting level (YAML spec forbids this)
- Incorrect indentation
- Unescaped special characters in values
- Missing quotes around values that need them

### 3b. Exact key parity

Extract every fully-qualified key path (e.g. `generic.actions.activate`) from both `en-us.yaml` and the locale file. Then report:
- **Missing keys**: keys in `en-us.yaml` that are absent from the locale file (list up to 30 examples)
- **Extra/invented keys**: keys in the locale file that do NOT exist in `en-us.yaml` (list up to 30 examples)
- Total missing key count and total extra key count

### 3c. Key ordering

Check whether keys within each nesting level appear in the **same order** as in `en-us.yaml`. Report:
- Number of out-of-order keys
- Up to 20 examples of misordered keys

### 3d. Structure parity

For every key, verify the type matches:
- If a key is a **mapping** (has children) in `en-us.yaml`, it must also be a mapping in the locale file
- If a key is a **scalar** (leaf value) in `en-us.yaml`, it must also be a scalar in the locale file
- The nesting depth of every key must be identical

Report any structural mismatches found.

### 3e. Preserved placeholders

For every leaf value, verify that all placeholders from `en-us.yaml` are present in the translated value:
- ICU message format: `{variableName}`, `{count, plural, ...}`, `{count, select, ...}`
- HTML entities: `&hellip;`, `&nbsp;`, etc.
- HTML tags: `<b>`, `<a href="...">`, `<code>`, `<br/>`, etc.
- Template expressions: anything inside `{` and `}`

Report any keys where placeholders are missing or altered (list up to 30 examples).

### 3f. Empty and special values

- If a value is empty in `en-us.yaml`, verify it is also empty in the locale file
- Values that are `'—'` or similar special characters should be preserved exactly
- YAML comments (lines starting with `#`) in `en-us.yaml` should be preserved in the same positions

Report any mismatches.

## 4. Translation coverage

Use bash to write and run a script that calculates translation coverage:

1. Parse both YAML files and extract every leaf key-value pair (fully-qualified key path → value).
2. Classify every leaf key into one of four categories:
   - **Translated**: value in the locale file **differs** from the English value.
   - **Kept in English**: value is **identical** to English but is **correct to keep as-is**. This includes:
     - Brand names and proper nouns (e.g. `Rancher`, `Kubernetes`, `Docker`, `Helm`, `Longhorn`, `Harvester`, `Prometheus`, `Grafana`, `Istio`, `Fleet`, `Epinio`, `NeuVector`, `RKE2`, `K3s`, `Linux`, `Windows`, `Azure`, `AWS`, `GKE`, `EKS`, `AKS`)
     - Technical terms, CLI commands, and identifiers (e.g. `kubectl`, `etcd`, `nginx`, `containerd`, `CronJob`, `DaemonSet`, `StatefulSet`, `ConfigMap`, `PersistentVolume`)
     - Acronyms and abbreviations (e.g. `CPU`, `GPU`, `RAM`, `DNS`, `API`, `HTTP`, `HTTPS`, `SSH`, `TCP`, `UDP`, `CIDR`, `RBAC`, `OIDC`, `LDAP`, `SAML`, `PVC`, `CSI`)
     - File extensions, formats, and protocols (e.g. `.yaml`, `.json`, `base64`, `PEM`, `PKCS`)
     - Values that are a single word that is also a universal technical term in IT (commonly left in English even in fully translated software)
   - **Skipped**: values that are inherently non-translatable — empty strings, pure numbers, single characters, URLs, variable-only values like `{name}`, special values like `'—'`, HTML-only values
   - **Untranslated**: value is identical to English and does **not** fit in "Kept in English" or "Skipped" — these genuinely need translation.
3. Calculate:
   - **Total leaf keys** in `en-us.yaml`
   - **Translated** (count and percentage of translatable)
   - **Kept in English** (count — correctly identical to English)
   - **Skipped** (count — non-translatable)
   - **Untranslated** (count and percentage of translatable — genuinely need translation)
   - **Overall coverage**: (translated + kept in English) / (total - skipped) as a percentage
4. Break down coverage by **top-level YAML section** (e.g. `generic`, `nav`, `cluster`, `workload`, etc.) — for each section report translated, kept-in-english, and untranslated counts.

### 4a. Agent review of untranslated strings

The bash script cannot perfectly distinguish technical terms from genuinely untranslated strings. After the script runs, **you must manually review** every string the script classified as "untranslated":

- For each "untranslated" value, check whether it is a product name, Kubernetes resource type, provider name, CLI command, protocol, acronym, storage driver, authentication provider, cloud service, icon identifier, or any other term that is universally kept in English in localized software.
- **Reclassify** any such terms from "untranslated" to "kept in English" in the final counts.
- Only strings that contain **actual human-readable English words or phrases that should be localized** (e.g. button labels like "Save", "Delete", descriptions, error messages, help text) should remain as "untranslated".
- Update the coverage calculation accordingly: coverage = (translated + kept in English) / (total - skipped).

This agent review step is critical — the script's known-terms list will never be exhaustive. You are the final arbiter of whether a string genuinely needs translation.

## 5. Post the report as a PR comment

Add a single, detailed comment to the PR with the full verification report. Use this structure:

### If all checks passed and coverage is 100%:

```
✅ **Verify Translation — All Checks Passed**

**Locale file**: `pkg/ui-locales/l10n/<locale>.yaml`
**Language**: <Language Name>

### Structural Integrity
- ✅ Valid YAML — no parse errors
- ✅ Key parity — all {N} keys present, no extra keys
- ✅ Key ordering — matches en-us.yaml
- ✅ Structure parity — all types match
- ✅ Placeholders — all preserved
- ✅ Empty/special values — all preserved

### Translation Coverage
- **Overall**: {percentage}% ({translated}/{translatable} translatable strings)
- **Translated**: {translated} strings
- **Kept in English**: {kept} strings (brand names, technical terms, acronyms)
- **Skipped**: {skipped} non-translatable values

🏷️ Label `ready-to-merge` added.

The file is structurally sound and fully translated. Ready for native speaker review of translation quality.
```

### If issues were found or coverage is incomplete:

```
📋 **Verify Translation — Report**

**Locale file**: `pkg/ui-locales/l10n/<locale>.yaml`
**Language**: <Language Name>

### Structural Integrity
- {✅ or ❌} Valid YAML — {details}
- {✅ or ⚠️} Key parity — {N} missing keys, {N} extra keys
- {✅ or ⚠️} Key ordering — {N} out-of-order keys
- {✅ or ⚠️} Structure parity — {N} type mismatches
- {✅ or ⚠️} Placeholders — {N} keys with missing placeholders
- {✅ or ⚠️} Empty/special values — {N} mismatches

{If there are structural issues, list them here with details}

### Translation Coverage
- **Overall**: {percentage}% ({translated + kept}/{translatable} translatable strings)
- **Translated**: {translated} strings
- **Kept in English**: {kept} strings (brand names, technical terms, acronyms)
- **Untranslated**: {untranslated} strings still need translation
- **Skipped**: {skipped} non-translatable values

#### Coverage by Section
| Section | Translated | Kept in English | Untranslated | Coverage |
|---------|-----------|----------------|-------------|----------|
| generic | X         | Y              | Z           | NN%      |
| nav     | X         | Y              | Z           | NN%      |
| ...     | ...       | ...            | ...         | ...      |

### Recommended Actions
Run `/improve-translation` to fix structural issues and translate remaining strings.
```

## 6. Label and approve on 100% coverage

If **all** structural checks passed (valid YAML, key parity, key ordering, structure parity, placeholders, empty/special values) **and** overall translation coverage is **100%** after the agent review (i.e. zero genuinely untranslated strings), then:

1. Add the label `ready-to-merge` to pull request #${{ github.event.issue.number }}.
2. Submit an **approving PR review** using `submit_pull_request_review` with event `APPROVE` and a body like:
   > ✅ AI verification passed — all structural checks clean, 100% translation coverage. Ready for native speaker review of translation quality.

If the coverage is below 100% or any structural check failed, do **not** add the label or approve the PR.

## 7. Update learnings

After completing the verification and labeling, update the learnings file following the instructions in the shared rules file.
