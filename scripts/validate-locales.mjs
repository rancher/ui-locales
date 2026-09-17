#!/usr/bin/env node
/**
 * Validates every locale file in pkg/locales/l10n against reference/en-us.yaml.
 *
 * This is the executable form of the rules in
 * .github/workflows/shared/translation-rules.md — translation workflows and CI
 * both run it so that "is this translation structurally sound?" has one answer.
 *
 * Usage:
 *   node scripts/validate-locales.mjs            # validate every locale
 *   node scripts/validate-locales.mjs pt-br      # validate one locale
 *
 * Exits non-zero if any error is found. Warnings never fail the run.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REFERENCE = path.join(ROOT, 'reference/en-us.yaml');
const L10N_DIR = path.join(ROOT, 'pkg/locales/l10n');
const INDEX_TS = path.join(ROOT, 'pkg/locales/index.ts');

const errors = [];
const warnings = [];

const error = (locale, msg) => errors.push(`${ locale }: ${ msg }`);
const warn = (locale, msg) => warnings.push(`${ locale }: ${ msg }`);

// Per-key advisories are counted per locale and summarised, so a long tail of
// style differences cannot bury the warnings that matter.
const soft = new Map();
const softWarn = (locale, msg) => {
  if (!soft.has(locale)) {
    soft.set(locale, []);
  }

  soft.get(locale).push(msg);
};

/** Parse a locale file, surfacing duplicate keys and syntax errors as errors. */
function parse(file, locale) {
  try {
    // js-yaml throws on duplicate mapping keys, which YAML forbids and which
    // silently drops translations when a parser is more lenient.
    return yaml.load(fs.readFileSync(file, 'utf8'), { filename: file });
  } catch (e) {
    error(locale, `does not parse — ${ e.message.split('\n')[0] }`);

    return null;
  }
}

/** Flatten to an ordered list of [dottedKey, value] so order can be compared. */
function flatten(node, prefix = '', out = []) {
  for (const [k, v] of Object.entries(node ?? {})) {
    const key = prefix ? `${ prefix }.${ k }` : k;

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.push([key, v]);
    }
  }

  return out;
}

/** Every key path, including intermediate mappings, with its kind. */
function kinds(node, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(node ?? {})) {
    const key = prefix ? `${ prefix }.${ k }` : k;
    const isMap = v && typeof v === 'object' && !Array.isArray(v);

    out.set(key, isMap ? 'mapping' : 'scalar');

    if (isMap) {
      kinds(v, key, out);
    }
  }

  return out;
}

/**
 * Splits an ICU message into its structural parts.
 *
 * Rancher messages mix three things that all use braces:
 *
 *   {name}                                  a plain placeholder
 *   {count, plural, =1 {core} other {cores}} an ICU argument with branches
 *   <Binary Data: {n, number} bytes>        angle brackets used as plain text
 *
 * Only the argument names are invariant — the text inside plural/select
 * branches is meant to be translated, so it must not be compared. Comparing
 * raw brace groups would flag every correctly translated plural.
 *
 * Returns { names, structure }: the argument names, which must survive
 * translation intact, and the ICU types and branch selectors around them,
 * which some languages legitimately simplify.
 */
function icu(value) {
  const s = String(value);
  const names = [];
  const structure = [];

  // Index of the '}' closing the group that opens at `open`.
  const closeOf = (open) => {
    let depth = 0;

    for (let i = open; i < s.length; i++) {
      if (s[i] === '{') {
        depth++;
      } else if (s[i] === '}' && --depth === 0) {
        return i;
      }
    }

    return -1;
  };

  // Scans a region for argument groups. Branch bodies are scanned too, since
  // they can nest further arguments, but their text is never treated as one.
  const scan = (from, to) => {
    for (let i = from; i < to; i++) {
      if (s[i] !== '{') {
        continue;
      }

      const close = closeOf(i);

      if (close < 0 || close > to) {
        return;
      }

      const head = s.slice(i + 1, close).match(/^\s*([A-Za-z0-9_.$-]+)\s*(?:,\s*([a-zA-Z]+))?/);

      if (head) {
        const [matched, name, type] = head;

        names.push(name);
        structure.push(type ? `${ name }:${ type }` : name);

        if (type && ['plural', 'select', 'selectordinal'].includes(type)) {
          // Branch list: `selector {body} selector {body}`. The selectors are
          // structure; each body is translatable text that may nest arguments.
          let j = i + 1 + matched.length;

          while (j < close) {
            const branch = s.slice(j, close).match(/^\s*(=?[A-Za-z0-9_-]+)\s*\{/);

            if (!branch) {
              break;
            }

            const bodyOpen = j + branch[0].length - 1;
            const bodyClose = closeOf(bodyOpen);

            if (bodyClose < 0) {
              break;
            }

            structure.push(branch[1]);
            scan(bodyOpen + 1, bodyClose);
            j = bodyClose + 1;
          }
        }
      }

      i = close;
    }
  };

  scan(0, s.length);

  return { names: names.sort(), structure: structure.sort() };
}

// Tags that a browser actually renders. Rancher also uses angle brackets as
// plain placeholder text (`<registry-host>`, `<your username>`), which
// translators are free to localise, so only real markup is checked.
const HTML_TAGS = new Set([
  'a', 'abbr', 'b', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'kbd', 'li', 'ol', 'p', 'pre', 'small', 'span', 'strong',
  'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'tt', 'u', 'ul'
]);

/** Real HTML tag names, opening and closing, ignoring attributes. */
function tags(value) {
  return [...String(value).matchAll(/<(\/?)([A-Za-z][A-Za-z0-9]*)\b/g)]
    .filter((m) => HTML_TAGS.has(m[2].toLowerCase()))
    .map((m) => `${ m[1] }${ m[2].toLowerCase() }`)
    .sort();
}

/** HTML entities such as &hellip; and &nbsp;. */
function entities(value) {
  return [...String(value).matchAll(/&[a-zA-Z]+;|&#\d+;/g)].map((m) => m[0]).sort();
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isUrl = (v) => /^https?:\/\/\S+$/.test(String(v).trim());

/** The provenance block every locale file must carry, per translation-rules.md. */
function checkProvenance(file, locale, expectedCommit) {
  const head = fs.readFileSync(file, 'utf8').split('\n').slice(0, 8).join('\n');

  if (!head.startsWith('# ---')) {
    error(locale, 'missing the provenance header block at the top of the file');

    return;
  }

  for (const field of ['locale:', 'source-locale:', 'synced-against-en-us-commit:', 'last-updated:']) {
    if (!head.includes(`# ${ field }`)) {
      error(locale, `provenance header is missing "${ field }"`);
    }
  }

  const against = head.match(/# synced-against-en-us-commit:\s*(\S+)/)?.[1];

  // Drift is expected between a sync landing and the translations catching up,
  // so this is reported but never fails the build.
  if (expectedCommit && against && against !== expectedCommit) {
    warn(locale, `synced against en-us ${ against }, but reference/en-us.yaml is at ${ expectedCommit } — translation may be out of date`);
  }
}

function main() {
  const only = process.argv[2];

  if (!fs.existsSync(REFERENCE)) {
    console.error(`Reference file not found: ${ REFERENCE }`);
    process.exit(1);
  }

  const en = parse(REFERENCE, 'en-us');

  if (!en) {
    console.error('reference/en-us.yaml does not parse — cannot validate anything against it.');
    process.exit(1);
  }

  const enFlat = flatten(en);
  const enKeys = enFlat.map(([k]) => k);
  const enValues = new Map(enFlat);
  const enKinds = kinds(en);
  const enCommit = fs.readFileSync(REFERENCE, 'utf8').match(/# synced-commit:\s*(\S+)/)?.[1];

  const files = fs.readdirSync(L10N_DIR).filter((f) => f.endsWith('.yaml')).sort();
  const locales = files.map((f) => path.basename(f, '.yaml')).filter((l) => !only || l === only);

  if (only && !locales.length) {
    console.error(`No locale file found for "${ only }" in pkg/locales/l10n`);
    process.exit(1);
  }

  // Every locale shipped must also be registered with the extension, or it is
  // built into the bundle but never offered in the language picker.
  const index = fs.existsSync(INDEX_TS) ? fs.readFileSync(INDEX_TS, 'utf8') : '';
  const registered = [...index.matchAll(/addLocale\(\s*'([^']+)'/g)].map((m) => m[1]);

  for (const locale of files.map((f) => path.basename(f, '.yaml'))) {
    if (!registered.includes(locale)) {
      error(locale, `has a locale file but is not registered with plugin.addLocale() in pkg/locales/index.ts`);
    }
  }

  for (const locale of registered) {
    if (!files.includes(`${ locale }.yaml`)) {
      error(locale, `is registered in pkg/locales/index.ts but has no pkg/locales/l10n/${ locale }.yaml`);
    }
  }

  console.log(`Reference: reference/en-us.yaml — ${ enKeys.length } keys${ enCommit ? ` (synced-commit ${ enCommit })` : '' }\n`);

  for (const locale of locales) {
    const file = path.join(L10N_DIR, `${ locale }.yaml`);
    const before = errors.length;

    checkProvenance(file, locale, enCommit);

    const doc = parse(file, locale);

    if (!doc) {
      continue;
    }

    const flat = flatten(doc);
    const keys = flat.map(([k]) => k);
    const values = new Map(flat);
    const keySet = new Set(keys);

    const missing = enKeys.filter((k) => !keySet.has(k));
    const extra = keys.filter((k) => !enValues.has(k));

    if (missing.length) {
      error(locale, `${ missing.length } key(s) missing from en-us: ${ missing.slice(0, 5).join(', ') }${ missing.length > 5 ? ', …' : '' }`);
    }

    if (extra.length) {
      error(locale, `${ extra.length } key(s) not present in en-us: ${ extra.slice(0, 5).join(', ') }${ extra.length > 5 ? ', …' : '' }`);
    }

    // Order only has to agree on the keys both files share; missing/extra keys
    // are already reported above and would otherwise report twice.
    if (!missing.length && !extra.length && !same(keys, enKeys)) {
      const at = keys.findIndex((k, i) => k !== enKeys[i]);

      error(locale, `key order differs from en-us — first difference at position ${ at }: expected "${ enKeys[at] }", found "${ keys[at] }"`);
    }

    const localeKinds = kinds(doc);

    for (const [key, kind] of enKinds) {
      const theirs = localeKinds.get(key);

      if (theirs && theirs !== kind) {
        error(locale, `"${ key }" is a ${ kind } in en-us but a ${ theirs } here`);
      }
    }

    let untranslated = 0;
    const invariant = [];

    for (const [key, enValue] of enFlat) {
      if (!keySet.has(key)) {
        continue;
      }

      const value = values.get(key);

      if (String(enValue ?? '') === String(value ?? '')) {
        if (String(enValue ?? '').trim() !== '') {
          untranslated++;
        }

        continue;
      }

      if (isUrl(enValue)) {
        invariant.push(`"${ key }": URL must not be translated (en-us: ${ enValue })`);
        continue;
      }

      const enIcu = icu(enValue);
      const theirIcu = icu(value);

      // A renamed or dropped argument breaks rendering outright.
      // Compared as sets: repeating a placeholder is a legitimate translation
      // choice, but dropping one loses information and inventing one renders
      // as literal text.
      const dropped = enIcu.names.filter((n) => !theirIcu.names.includes(n));
      const unknown = theirIcu.names.filter((n) => !enIcu.names.includes(n));

      if (dropped.length || unknown.length) {
        const parts = [];

        if (dropped.length) {
          parts.push(`dropped [${ [...new Set(dropped)].join(', ') }]`);
        }

        if (unknown.length) {
          parts.push(`not defined in en-us [${ [...new Set(unknown)].join(', ') }]`);
        }

        invariant.push(`"${ key }": placeholders ${ parts.join('; ') }`);
      } else if (!same(enIcu.structure, theirIcu.structure)) {
        // Collapsing plural branches still renders; some languages have no
        // plural forms, so this is reported without failing the build.
        softWarn(locale, `"${ key }": ICU structure differs — en-us has [${ enIcu.structure.join(', ') }], this file has [${ theirIcu.structure.join(', ') }]`);
      }

      const enTags = tags(enValue);
      const theirTags = tags(value);

      if (!same(enTags, theirTags)) {
        const dropped = enTags.filter((t) => !theirTags.includes(t));

        if (dropped.length) {
          invariant.push(`"${ key }": HTML markup dropped or altered — en-us has [${ enTags.join(', ') }], this file has [${ theirTags.join(', ') }]`);
        } else {
          softWarn(locale, `"${ key }": adds HTML markup not in en-us — [${ theirTags.filter((t) => !enTags.includes(t)).join(', ') }]`);
        }
      }

      if (!same(entities(enValue), entities(value))) {
        softWarn(locale, `"${ key }": HTML entities differ — en-us has [${ entities(enValue).join(', ') }], this file has [${ entities(value).join(', ') }]`);
      }
    }

    for (const line of invariant.slice(0, 20)) {
      error(locale, line);
    }

    if (invariant.length > 20) {
      error(locale, `…and ${ invariant.length - 20 } more invariant violation(s)`);
    }

    const translated = enKeys.length - untranslated;
    const coverage = ((translated / enKeys.length) * 100).toFixed(1);
    const status = errors.length === before ? 'OK  ' : 'FAIL';

    console.log(`${ status } ${ locale.padEnd(8) } ${ String(keys.length).padStart(5) } keys  ${ String(coverage).padStart(5) }% translated  (${ untranslated } still in English)`);
  }

  for (const [locale, list] of soft) {
    warn(locale, `${ list.length } advisory difference(s) — run with ADVISORIES=1 to list them`);

    if (process.env.ADVISORIES) {
      list.forEach((m) => console.log(`    · ${ locale }: ${ m }`));
    }
  }

  if (warnings.length) {
    console.log(`\nWarnings (${ warnings.length }):`);
    warnings.forEach((w) => console.log(`  ! ${ w }`));
  }

  if (errors.length) {
    console.log(`\nErrors (${ errors.length }):`);
    errors.forEach((e) => console.log(`  ✗ ${ e }`));
    console.log('\nSee .github/workflows/shared/translation-rules.md for the rules these checks enforce.');
    process.exit(1);
  }

  console.log('\nAll locale files are structurally valid.');
}

main();
