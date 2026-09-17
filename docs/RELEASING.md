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

**Bump the version in both files — they have to match.**

- `pkg/locales/package.json` — the extension version, used for the chart
- `package.json` (root) — used for the catalog image tag

The two release workflows validate the release tag differently: the chart matches it against
`pkg/<name>-<version>` and the catalog matches it against the root `name-version`. If the versions
drift apart, no tag can satisfy both and the catalog job cancels itself rather than failing.

Then pick a path.

### Publishing the chart only — merge the bump

`build-extension-charts` runs on any push to `main` that touches `pkg/locales/package.json`, so
merging the version bump is the whole of publishing the chart. Bumping the number *is* the release.

It refuses to republish: before building, it reads `index.yaml` from `gh-pages` and stops if that
version is already there. That guard matters because the trigger fires on any edit to the file — a
change to the catalog annotations alone must not republish the same version with different contents
inside it.

This path does **not** build the catalog image. If air-gapped installs need this version, cut a
release instead.

### Publishing both — cut a GitHub release

Publish a release on `main` tagged `locales-<version>`:

```sh
gh release create locales-0.1.2 --repo rancher/ui-locales \
  --title "locales-0.1.2" --generate-notes
```

The tag must be exactly `<pkg-name>-<version>` — `pkg-name` is `locales`, the directory under
`pkg/`. A mismatch cancels the run rather than failing it, which is easy to miss.

Both workflows trigger on `release: [released]`, so a **draft** release publishes nothing. Publish it.

### Re-publishing something that built wrong

Both workflows can be run by hand from the Actions tab. A manual run passes no tag, so it builds
whatever version `package.json` currently names. For the chart, delete that version from `gh-pages`
first or the version check will decline to rebuild it.

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
