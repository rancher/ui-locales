# Releasing the SUSE Localization Pack

This extension is released the same way as every other Rancher UI extension: publishing a GitHub
release with a specific tag name triggers two reusable workflows in `rancher/dashboard`.

Nothing has been released from this repository yet, so the one-time setup below has to be done
before the first release.

## One-time setup

These need repository admin and only have to be done once.

1. **Create the `gh-pages` branch.** `build-extension-charts` checks this branch out and commits
   the built chart into it. If the branch does not exist, the release job fails at checkout.

   ```sh
   git checkout --orphan gh-pages
   git rm -rf .
   echo "Helm repository for the SUSE Localization Pack." > README.md
   git add README.md && git commit -m "Initialise gh-pages"
   git push origin gh-pages
   git checkout main
   ```

2. **Enable GitHub Pages**, serving from the `gh-pages` branch, root folder. This is what makes the
   Helm repository reachable at `https://rancher.github.io/ui-locales/`, which is the URL users add
   under **Extensions → Manage Repositories** in Rancher.

3. **Check Actions permissions.** Both workflows need `contents: write` and the catalog workflow
   needs `packages: write` to push to `ghcr.io`. They request these themselves, but the repository's
   default workflow permissions must allow it (Settings → Actions → General → Workflow permissions).

## Cutting a release

1. **Bump the version in both files — they have to match.**

   - `pkg/locales/package.json` — the extension version, used for the chart tag
   - `package.json` (root) — used for the catalog image tag

   The two release workflows validate the tag differently: `build-extension-charts` matches it
   against `pkg/<name>-<version>` and `build-extension-catalog` matches it against the root
   `name-version`. If the versions drift apart, no tag can satisfy both and the catalog job cancels
   itself.

2. **Open a PR with the bump and merge it.** `validate-locales` and `build-extensions-test` run on
   the PR; both must be green.

3. **Publish a GitHub release** on `main` with the tag `locales-<version>`, e.g. `locales-0.1.2`.

   ```sh
   gh release create locales-0.1.2 --repo rancher/ui-locales \
     --title "locales-0.1.2" --generate-notes
   ```

   The tag must be exactly `<pkg-name>-<version>`; `pkg-name` is `locales`, the directory name under
   `pkg/`. A mismatch cancels the run rather than failing it, which is easy to miss.

   Both workflows trigger on `release: [released]`, so a **draft** release does not release
   anything. Publish it.

## What runs, and where the output lands

| Workflow | Output |
|----------|--------|
| `build-extension-charts` | Helm chart committed to the `gh-pages` branch and indexed in `index.yaml`, served over GitHub Pages |
| `build-extension-catalog` | Extension catalog image pushed to `ghcr.io/rancher/ui-extension-locales` |

The Helm chart is what users install through **Extensions** in the Rancher UI. The catalog image is
the air-gapped path — it bundles the same extension for clusters that cannot reach GitHub Pages.

## Verifying a release

1. Both workflow runs are green in Actions.
2. `index.yaml` on the `gh-pages` branch lists the new version.
3. The package is visible at `https://github.com/orgs/rancher/packages?repo_name=ui-locales`.
4. In a Rancher 2.10+ install, add `https://rancher.github.io/ui-locales/` under
   **Extensions → Manage Repositories**, then confirm **SUSE Localization Pack** appears in the
   Extensions list at the new version and that the new languages show up in the user-preferences
   language picker after installing it.

## Notes

- The extension is annotated `prime-only`, so it is only offered on Rancher Prime.
- `catalog.cattle.io/rancher-version` is `>= 2.10.0-0`. The `-0` suffix matters: without it, Helm's
  semver matching excludes every prerelease, and the extension would be hidden on Rancher RC builds.
