# Shared Translation Rules

This file contains the canonical rules that ALL translation workflows in this repository must follow. Each workflow reads this file at the start and applies these rules throughout its work.

## Scripting constraint

Do **NOT** use Python or pip in any scripts. The runner does not have access to `pypi.org` and package installs will fail. Use **Node.js** or **pure bash** (with tools like `awk`, `sed`, `grep`, `sort`, `diff`) for all scripting needs including YAML parsing and validation.

## Translation rules

When translating or modifying locale YAML files, these rules are non-negotiable:

- **Mirror the source exactly**: the output file must have the exact same keys, in the exact same order, at the exact same nesting depth as `en-us.yaml` — only leaf values change
- **Do NOT invent keys**: never add keys that do not exist in `en-us.yaml`
- **Do NOT skip keys**: every key in `en-us.yaml` must appear in the output
- **Do NOT duplicate keys**: every key must appear exactly once at its nesting level — YAML forbids duplicate keys and parsers will reject the file
- Preserve all placeholders as-is: `{variableName}`, `{count, plural, ...}`, `&hellip;`, HTML tags like `<b>`, `<a href=...>`, `<code>`, etc.
- Preserve all ICU message format syntax (plurals, selects) — only translate the human-readable text portions inside them
- Do not translate YAML comments (lines starting with `#`) — preserve them in the same positions
- Empty values must remain empty; special values like `'—'` must be preserved exactly
- If a key's value is a mapping (has children) in `en-us.yaml`, it must also be a mapping in the output — never flatten a nested structure into a scalar
- Values that are URLs or pure technical identifiers must not be translated

## YAML validation procedure

After any translation work, validate the output file using bash/Node.js:

1. The file is valid YAML (no parse errors, no duplicate keys)
2. Every key in `en-us.yaml` exists in the output and vice-versa (exact key parity)
3. Key order matches `en-us.yaml`
4. All placeholders (`{...}`, `&hellip;`, HTML tags) from `en-us.yaml` are present in the corresponding translated values
5. If any issues are found, fix them and re-validate until the file is clean

## Fixing YAML parse errors

If a generated or modified file has YAML parse errors, follow this procedure:

1. **Identify the broken key(s)** from the YAML parser error output (it will report the line number and error type).
2. **Look up the same key in `en-us.yaml`** to get the original English value and its exact YAML formatting (quoting style, indentation, multiline format).
3. **Re-translate that value** from the English source into the target language, preserving the exact same YAML formatting (single quotes, double quotes, block scalars `|`, folded scalars `>`, etc.) as `en-us.yaml`.
4. **Replace the broken line(s)** in the locale file with the corrected translation.
5. **Re-run the YAML parser** to confirm the error is fixed. Repeat until the file parses cleanly.

Common causes of YAML parse errors in translations:
- **Unescaped special characters**: colons (`:`), hash (`#`), quotes inside quoted strings — the translation may introduce characters that need quoting
- **Broken quoting**: the source uses single quotes but the translation dropped them or switched styles incorrectly
- **Multiline string issues**: `|` or `>` block scalars where the translation changed the indentation
- **ICU/placeholder corruption**: `{count, plural, ...}` syntax got mangled during translation

**Always mirror the quoting and formatting style of `en-us.yaml`** for the corresponding key. If `en-us.yaml` uses `'single quotes'`, the translation must too. If it uses `|` block scalar, keep that format.

## Bash script size limit

Each individual bash tool call must be **small**. Never try to write all translations in a single script.

- **Maximum ~50 key-value pairs per bash call** — split into multiple calls if needed
- Do not embed thousands of lines of YAML in one heredoc
- If a script would be longer than ~100 lines, split it into smaller scripts
- Large tool call payloads will be silently rejected — you will see repeated `bash` validation errors if this happens. **Stop immediately**, make the scripts smaller, and retry.
- Never try to output the entire translated file in a single tool call — always build it incrementally

## Chunking strategy

When translating large files, use chunking to stay within output limits:

### How to chunk

- Work by **top-level YAML section** (e.g. `generic`, `nav`, `cluster`, `workload`, etc.)
- Within each section, translate all leaf values that need translation
- **Maximum ~50 key-value pairs per chunk** — if a top-level section has more, split it into sub-chunks
- After each chunk, write the updated content **directly to the locale file in the repo working tree** (e.g. `pkg/ui-locales/l10n/pt-br.yaml`) — **NOT** to a temp file, JSON file, or variable
- Verify each chunk was written by running `git diff --stat` — you must see changes to the locale file
- Track progress: log how many strings were translated per chunk

### How to write translations to the file

Use `sed`, `awk`, or a small Node.js script to **patch individual values in-place** in the YAML file. Do NOT:
- Regenerate the entire file from scratch
- Write the whole file content in a heredoc
- Use a temp file and then move it

Instead:
- For each key-value pair, use `sed` or a targeted script to find the exact line and replace the value
- Or use a small Node.js script that reads the file, updates specific keys, and writes it back
- Process one chunk at a time (max ~50 keys per bash call)

### Priority order

When translating, prioritize:
1. **User-facing UI text first**: buttons, labels, messages, descriptions, tooltips, error messages
2. **Long-form text next**: paragraphs, help text, descriptions
3. **Technical/edge-case strings last**: rarely-seen messages, debug text

### Maximizing coverage

- **Do NOT skip strings** because they seem hard — attempt every string
- **Do NOT leave placeholder English translations** — make your best attempt and note uncertainty
- If running low on time, prioritize the sections with the most untranslated strings
- Use chunking sizes and strategies noted in the learnings file (if available)

## Learnings (repo-memory)

The repo-memory directory is at `/tmp/gh-aw/repo-memory/default/memory/default/`. Translation workflows use a structured layout under `translations/`:

```
memory/default/
  translations/
    learnings.md        ← cross-language learnings (shared by all languages)
    pt-br.md            ← per-language notes for Portuguese (Brazil)
    zh-hans.md          ← per-language notes for Simplified Chinese
    ...                 ← one file per locale code
```

### 1. Read learnings before starting

Read **both** files if they exist:
- `/tmp/gh-aw/repo-memory/default/memory/default/translations/learnings.md` — cross-language learnings
- `/tmp/gh-aw/repo-memory/default/memory/default/translations/<locale-code>.md` — language-specific notes

Apply all knowledge from these files throughout your work.

### 2. Update learnings after completing work

After completing work (or hitting a significant obstacle), update the relevant file(s) by **merging** new observations into the existing content. Create the file if it does not exist.

**Cross-language learnings** (`translations/learnings.md`) — things that apply regardless of language:
- Scripting environment: what tools work (Node.js, bash, awk) and what doesn't (Python/pip)
- YAML parsing pitfalls: special characters, block scalars, duplicate key gotchas
- Chunking strategy: optimal chunk sizes, what worked, what caused timeouts
- Output size limits: any limits hit and workarounds
- Placeholder/ICU patterns that cause false positives in validation
- Performance tips: what made runs faster or more reliable

**Per-language learnings** (`translations/<locale-code>.md`) — things specific to one language:
- Coverage stats: keys total, translated, untranslated, coverage % (with date)
- Language-specific translation notes: tricky terms, false cognates, gender agreement patterns
- Keys that are correctly "kept in English" for this language (brand names, tech terms the community keeps untranslated)
- Known problematic keys: keys that repeatedly cause issues in this language
- Any reviewer feedback incorporated from previous PRs

### File format

Use this structure for each file:

```markdown
# <Title>
Last updated: YYYY-MM-DD

## Key facts
- Bullet list of the most important things to know

## Details
Additional context, organised by topic with ### headings as needed
```

Keep each file **concise and actionable** — max ~50 lines. Remove outdated information when updating. Files auto-commit to the `memory/default` branch when the workflow finishes.
