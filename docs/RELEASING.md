# Releasing the SUSE Localization Pack

This extension is released the same way as every other Rancher UI extension: publishing a GitHub
release with a specific tag name triggers two reusable workflows in `rancher/dashboard`, one
building a Helm chart on this repository's `gh-pages` branch and one a catalog image on `ghcr.io`.

The one-time setup below has been done; it stays here for reference.

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

4. **Check the release and pull request settings.** Release immutability can be on: nothing is
   attached to a release after it is published. `bump-shell` opens its pull requests with the
   workflow token unless a `SHELL_BUMP_TOKEN` secret is set, and the workflow token needs **Allow
   GitHub Actions to create and approve pull requests** (Settings → Actions → General).

## Cutting a release

1. **Bump the version in both files, in a pull request, and merge it.** They have to match.

   - `pkg/locales/package.json` - the extension version, used for the chart
   - `package.json` (root) - used for the catalog image tag

   Merging publishes nothing.

2. **Publish a release on `main` tagged `locales-<version>`.** In **Releases → Draft a new
   release**, type the tag under **Choose a tag** and create it, set **Target** to `main`, choose
   the previous release's tag under **Previous tag**, click **Generate release notes**, then
   **Publish release**. Or:

   ```sh
   gh release create locales-<version> --repo rancher/ui-locales --target main --generate-notes
   ```

3. **The release starts both workflows.** `build-extension-charts` builds the chart, commits it to
   `gh-pages` and checks a bundle landed; `build-extension-catalog` pushes the catalog image to
   `ghcr.io`.

The tag must be exactly `locales-<version>`. The chart workflow checks it against
`pkg/locales/package.json` and the catalog workflow against the root `package.json`; both are named
`locales`, so one tag satisfies both while the versions match. If the versions drift apart, a tag
can match only one of them: that half publishes, and the other run fails or cancels itself, which is
easy to miss.

Both workflows trigger on `release: [released]`, so a **draft** or a **pre-release** publishes
nothing.

With release immutability on, a release can't change once published: the title and notes can still
be edited, but the tag can't be moved and its name can't be used again. Check the tag and the target
before publishing.

### The first release in this flow

0.1.2 and 0.1.3 were published before this flow, and their releases are tagged on `gh-pages` build
commits, which share no history with `main`. For the next release, choose **`locales-0.1.3-main`**
as the previous tag (with `gh`, add `--notes-start-tag locales-0.1.3-main`) - it marks the `main`
commit 0.1.3 was built from - or the generated notes list every pull request since the start.

Those versions also can't be rebuilt from their release tags, because a `gh-pages` commit has no
workflows to run: a fix to one of them goes out as a new version.

### Re-publishing something that built wrong

Run **Build and Release Extension Charts** by hand from that version's release tag (**Run workflow →
Use workflow from → Tags**). It rebuilds the version and overwrites its chart, its extension files
and its entry in the root `index.yaml`, and chart-releaser skips the existing release. A run from a
branch stops before building: publishing always needs a release tag. A manual run of **Build and
Release Extension Catalog** from the same tag rebuilds the image.

## Verifying a release

1. Both workflow runs are green in Actions, including **A bundle exists for this version**.
2. `index.yaml` at the root of `gh-pages` lists the new version, with a URL under `assets/`.
3. The package is visible at `https://github.com/orgs/rancher/packages?repo_name=ui-locales`.
4. In a Rancher 2.10+ install, add `https://rancher.github.io/ui-locales/` under
   **Extensions → Manage Repositories**, then confirm **SUSE Localization Pack** appears in the
   Extensions list at the new version and that the new languages show up in the user-preferences
   language picker after installing it.

## Notes

- The extension is annotated `prime-only`, so it is only offered on Rancher Prime.
- `catalog.cattle.io/rancher-version` is `>= 2.10.0-0`. The `-0` suffix matters: without it, Helm's
  semver matching excludes every prerelease, and the extension would be hidden on Rancher RC builds.
