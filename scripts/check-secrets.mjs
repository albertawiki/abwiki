#!/usr/bin/env node
/**
 * Refuse to commit things that should not be in a public repository.
 *
 * This exists because an AWS account id sat in `docs/DEPLOYMENT.md` through
 * twenty-four commits and was only noticed after the repository was made
 * public. Removing it meant rewriting history, and history rewriting stops
 * being cheap the moment somebody clones you.
 *
 * Two modes:
 *   --staged   what is about to be committed (the pre-commit hook)
 *   (default)  every tracked file (CI, so `--no-verify` cannot get past it)
 *
 * A local hook is a convenience, not a control: anyone can skip it. The CI
 * run is the control.
 *
 * Deliberately absent: any list of the specific names or addresses previously
 * scrubbed from this repository. A scanner that spells out what it is hiding
 * publishes the thing it was written to remove. The rules below are shapes,
 * not names.
 */

import { execFileSync } from 'node:child_process';

/** Addresses that legitimately appear in tracked files. */
const ALLOWED_EMAILS = new Set([
  'albertawiki@gmail.com',
  '41898282+github-actions[bot]@users.noreply.github.com',
  'noreply@github.com',
  'noreply@anthropic.com',
]);

/**
 * Twelve-digit numbers that are not somebody's AWS account.
 * 123456789012 is the account id AWS uses throughout its own documentation.
 */
const ALLOWED_NUMBERS = new Set(['123456789012']);

/** Files whose contents are not ours to police. */
const SKIP = [
  /^package-lock\.json$/,
  /^e2e\/__screenshots__\//,
  /^public\/.*\.(png|svg|ico)$/,
];

const RULES = [
  [/\bAKIA[0-9A-Z]{16}\b/g, 'an AWS access key id'],
  [/\bASIA[0-9A-Z]{16}\b/g, 'an AWS temporary access key id'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, 'a GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, 'a GitHub fine-grained token'],
  [/-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----/g, 'a private key'],
  [/\baws_secret_access_key\s*[=:]/gi, 'an AWS secret access key'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, 'a Slack token'],
  [/claude\.ai\/code\/session[_-][A-Za-z0-9]+/g, 'an assistant session link'],
];

// An email local part may contain brackets: the GitHub Actions bot address is
// `41898282+github-actions[bot]@users.noreply.github.com`. A pattern that
// stops at `[` misses it, which is how the first version of this check missed
// the only address actually in the repository.
const EMAIL = /[A-Za-z0-9._%+[\]-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const TWELVE_DIGITS = /(?<![\d.])\d{12}(?![\d.])/g;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const skipped = (file) => SKIP.some((pattern) => pattern.test(file));

/** Every finding in one file's text, as printable lines. */
function scan(file, text) {
  const findings = [];
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    const at = (what) => findings.push(`${file}:${i + 1}: ${what}`);

    RULES.forEach(([pattern, what]) => {
      if (new RegExp(pattern.source, pattern.flags).test(line)) at(`looks like ${what}`);
    });

    for (const match of line.matchAll(EMAIL)) {
      if (!ALLOWED_EMAILS.has(match[0])) at(`email address "${match[0]}" is not on the allow list`);
    }

    for (const match of line.matchAll(TWELVE_DIGITS)) {
      if (!ALLOWED_NUMBERS.has(match[0])) at('a twelve-digit number, which is the shape of an AWS account id');
    }
  });

  return findings;
}

function stagedFindings() {
  const files = git('diff', '--cached', '--name-only', '--diff-filter=ACMR')
    .split('\n').filter(Boolean).filter((f) => !skipped(f));

  return files.flatMap((file) => {
    let text;
    try {
      // The staged version, which is not always what is on disk.
      text = git('show', `:${file}`);
    } catch {
      return [];
    }
    return text.includes('\0') ? [] : scan(file, text);
  });
}

function trackedFindings() {
  const files = git('ls-files').split('\n').filter(Boolean).filter((f) => !skipped(f));
  return files.flatMap((file) => {
    let text;
    try {
      text = git('show', `HEAD:${file}`);
    } catch {
      return [];
    }
    return text.includes('\0') ? [] : scan(file, text);
  });
}

const staged = process.argv.includes('--staged');
const findings = staged ? stagedFindings() : trackedFindings();

if (findings.length === 0) {
  console.log(staged ? 'Staged changes carry nothing that looks secret.' : 'No tracked file carries anything that looks secret.');
  process.exit(0);
}

console.error('\nThis change carries something that should not be in a public repository:\n');
findings.forEach((f) => console.error(`  ${f}`));
console.error(`
Fix the file rather than bypassing this. If a finding is a false positive, add
it to the allow list at the top of scripts/check-secrets.mjs in the same commit,
so the exception is reviewable.

Once a value has been pushed, removing it means rewriting history, and that is
only cheap while nobody has cloned the repository.
`);
process.exit(1);
