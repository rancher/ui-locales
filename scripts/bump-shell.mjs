#!/usr/bin/env node
/**
 * Works out whether @rancher/shell needs bumping and, with --write, makes the edits.
 *
 * The target is the newest stable @rancher/shell release in the major line package.json already
 * uses. Release candidates are skipped, and so is the next major: moving to it means moving
 * catalog.cattle.io/ui-extensions-version in pkg/locales/package.json too, which is a migration
 * to do by hand rather than a bump.
 *
 * The reusable rancher/dashboard workflows are pinned by SHA with the matching creators-pkg tag
 * beside it (see build-extension-charts.yml). They follow the newest creators-pkg tag that is not
 * ahead of the shell being installed. --pin-workflows rewrites them; without it they are only
 * reported, because pushing a change to a workflow file needs a token with the workflow scope.
 *
 * Usage:
 *   node scripts/bump-shell.mjs                    # report only
 *   node scripts/bump-shell.mjs --write            # edit package.json (run yarn afterwards)
 *   node scripts/bump-shell.mjs --write --pin-workflows
 *
 * Reads GH_TOKEN (optional) for the GitHub API. When GITHUB_OUTPUT is set the results are written
 * there as step outputs as well as printed.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const YARN_LOCK = path.join(ROOT, 'yarn.lock');
const WORKFLOWS_DIR = path.join(ROOT, '.github/workflows');

const SHELL = '@rancher/shell';
const DASHBOARD = 'rancher/dashboard';
const PIN = /(uses: rancher\/dashboard\/\.github\/workflows\/[\w.-]+)@([0-9a-f]{40}) # (creators-pkg-v[\w.-]+)/g;

const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const pinWorkflows = args.has('--pin-workflows');

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/;

const parse = (v) => {
  const m = v.match(VERSION);

  return m ? { core: m.slice(1, 4).map(Number), pre: m[4] } : null;
};

/** Semver order, including prereleases: 3.0.12-rc.1 < 3.0.12 < 3.0.13-rc.2 < 3.0.13. */
const compare = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  const core = x.core[0] - y.core[0] || x.core[1] - y.core[1] || x.core[2] - y.core[2];

  if (core || x.pre === y.pre) {
    return core;
  }
  if (!x.pre || !y.pre) {
    return x.pre ? -1 : 1;
  }

  return x.pre.localeCompare(y.pre, 'en', { numeric: true });
};
const isStable = (v) => /^\d+\.\d+\.\d+$/.test(v);

function fail(msg) {
  console.error(`::error::${ msg }`);
  process.exit(1);
}

async function github(endpoint) {
  const headers = { Accept: 'application/vnd.github+json' };

  if (process.env.GH_TOKEN) {
    headers.Authorization = `Bearer ${ process.env.GH_TOKEN }`;
  }

  const res = await fetch(`https://api.github.com/${ endpoint }`, { headers });

  if (!res.ok) {
    fail(`GitHub API ${ endpoint }: ${ res.status } ${ await res.text() }`);
  }

  return res.json();
}

/** The version yarn.lock resolves @rancher/shell to. */
function lockedVersion() {
  const lock = fs.readFileSync(YARN_LOCK, 'utf8');
  const block = lock.match(/^"?@rancher\/shell@[^\n]*:\n\s+version "([^"]+)"/m);

  return block ? block[1] : null;
}

/** The newest creators-pkg tag in the same major that is not ahead of `shell`, with its commit. */
async function creatorsPin(shell) {
  const refs = await github(`repos/${ DASHBOARD }/git/matching-refs/tags/creators-pkg-v`);
  const [major] = parse(shell).core;
  const versions = refs
    .map((r) => r.ref.replace('refs/tags/creators-pkg-v', ''))
    .filter((v) => isStable(v) && parse(v).core[0] === major && compare(v, shell) <= 0)
    .sort(compare);

  if (!versions.length) {
    return null;
  }

  const tag = `creators-pkg-v${ versions.at(-1) }`;
  const commit = await github(`repos/${ DASHBOARD }/commits/${ tag }`);

  return { tag, sha: commit.sha };
}

const manifest = fs.readFileSync(PACKAGE_JSON, 'utf8');
const range = JSON.parse(manifest).dependencies?.[SHELL];
const declared = range?.match(/^([\^~]?)(\d+\.\d+\.\d+(?:-[\w.-]+)?)$/);

if (!declared) {
  fail(`package.json: expected ${ SHELL } as a plain version or ^/~ range, found "${ range }"`);
}

const [, prefix, declaredVersion] = declared;
const current = lockedVersion() || declaredVersion;

if (!parse(current)) {
  fail(`yarn.lock: cannot read the ${ SHELL } version "${ current }"`);
}

const [major] = parse(declaredVersion).core;

const published = JSON.parse(execFileSync('npm', ['view', SHELL, 'versions', 'time', '--json'], { encoding: 'utf8' }));
const target = published.versions
  .filter((v) => isStable(v) && parse(v).core[0] === major)
  .sort(compare)
  .at(-1);

if (!target) {
  fail(`no stable ${ SHELL } ${ major }.x release on npm`);
}

const newRange = `${ prefix }${ target }`;
// Only ever forwards, and only when what actually installs changes: a lockfile already ahead of
// the newest stable (an rc installed by hand) is left alone, and so is a range whose floor is
// behind a lockfile that is already on the newest.
const changed = compare(target, current) > 0;

// The workflow pins, as they are now and as they should be.
const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter((f) => /\.ya?ml$/.test(f));
const pins = workflowFiles.flatMap((f) => [...fs.readFileSync(path.join(WORKFLOWS_DIR, f), 'utf8').matchAll(PIN)]
  .map((m) => ({ file: f, sha: m[2], tag: m[3] })));
const pin = changed && pins.length ? await creatorsPin(target) : null;
const stalePins = pin ? pins.filter((p) => p.sha !== pin.sha) : [];

if (write && changed) {
  const from = `"${ SHELL }": "${ range }"`;

  if (!manifest.includes(from)) {
    fail(`package.json: could not find ${ from } to replace`);
  }
  fs.writeFileSync(PACKAGE_JSON, manifest.replace(from, `"${ SHELL }": "${ newRange }"`));

  if (pinWorkflows && stalePins.length) {
    for (const f of new Set(stalePins.map((p) => p.file))) {
      const file = path.join(WORKFLOWS_DIR, f);

      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(PIN, `$1@${ pin.sha } # ${ pin.tag }`));
    }
  }
}

const outputs = {
  current,
  target,
  changed,
  released:      published.time[target]?.slice(0, 10) || '',
  'pin-tag':     pin?.tag || '',
  'pin-sha':     pin?.sha || '',
  'stale-pins':  [...new Set(stalePins.map((p) => `${ p.file } (${ p.tag })`))].join(', '),
  'pins-edited': write && pinWorkflows && stalePins.length > 0,
};

for (const [k, v] of Object.entries(outputs)) {
  console.log(`${ k }=${ v }`);
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(outputs).map(([k, v]) => `${ k }=${ v }\n`).join(''));
}
