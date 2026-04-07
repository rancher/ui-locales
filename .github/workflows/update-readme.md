---
description: |
  This workflow is triggered when a GitHub issue with [README] in the title
  requests documentation updates. It reads all workflow .md files in the repo,
  generates clear documentation describing each workflow, updates the README.md
  with that documentation, and opens a Pull Request. A separate lightweight
  workflow (trigger-verify-readme) handles posting the /verify-readme comment.

on:
  issues:
    types: [opened, reopened]
  roles: [admin, maintainer]
  reaction: "eyes"

if: contains(github.event.issue.title, '[README]')

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

timeout-minutes: 60

tools:
  github:
    lockdown: false
  bash: true

safe-outputs:
  max-patch-size: 32
  create-pull-request:
    title-prefix: "docs: "
    labels: [documentation, automated]

---

# Update README with Workflow Documentation

You are an AI assistant that updates the README.md file for the Rancher UI locales project. Your job is to document all the agentic workflows available in this repository so that contributors understand what automation is available and how to use it.

## Scripting constraint

Do **NOT** use Python or pip in any scripts. The runner does not have access to `pypi.org` and package installs will fail. Use **Node.js** or **pure bash** (with tools like `awk`, `sed`, `grep`, `sort`, `diff`) for all scripting needs.

## 1. Read the issue

Read issue #${{ github.event.issue.number }} — its title and body. Confirm it contains `[README]` in the title and is requesting documentation updates. If it does not meet these criteria, do nothing and stop.

## 2. Read all workflow files

Read every `.md` file in `.github/workflows/` (excluding `.lock.yml` files). For each workflow, extract:

- **Name**: derived from the filename (e.g. `add-language.md` → "Add Language")
- **Trigger**: how it is activated (issue title prefix, slash command, schedule, etc.)
- **Description**: what it does (from the `description` field in the frontmatter and the prompt body)
- **Usage**: how a user would invoke it (e.g. "Create an issue with `[ADD]` in the title", "Comment `/verify-translation` on a PR")
- **Key behaviors**: important details like labels added, PR creation, validation steps

## 3. Generate the documentation

Create a well-structured documentation section that covers all workflows. The section should:

- Have a clear heading like `## Agentic Workflows`
- Include a brief overview explaining that the repo uses GitHub Agentic Workflows for automation
- List each workflow with its name, trigger, description, and usage instructions
- Use a consistent format for each workflow entry
- Be written in clear, concise English suitable for a project README
- Include a note that these workflows are AI-powered and results should be reviewed

## 4. Update the README

Read the current `README.md` and modify it to include the generated documentation:

- **Preserve** all existing content (title, description, license, etc.)
- **Insert** the workflow documentation section **before** the License section
- If a previous `## Agentic Workflows` section already exists, **replace it entirely** with the updated version
- Ensure proper Markdown formatting with no broken links or syntax issues

## 5. Validate the README

Use bash to verify:
- The file is valid Markdown (no unclosed tags, proper heading hierarchy)
- All workflow names mentioned actually exist as `.md` files in `.github/workflows/`
- The License section is still present and intact at the end

## 6. Open a Pull Request

Open a Pull Request that:
- Creates or updates the `README.md` file with the workflow documentation
- Has the title: `docs: update README with agentic workflow documentation`
- Has a body that references the issue number and lists which workflows were documented
- References and closes the original issue


