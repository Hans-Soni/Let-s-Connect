'use strict';
/**
 * secretGenerator.js
 * Pure Node.js (no npm dependencies).
 *
 * Generates random secrets using the OS CSPRNG (crypto.randomInt), NOT Math.random().
 * Math.random() is predictable and must never be used for keys.
 */
import crypto from 'crypto';

const DIGITS = '0123456789';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Printable ASCII symbols (space excluded, it is a bad idea in headers/env files)
const SYMBOLS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

export const CHARSETS = {
  alnum: DIGITS + LOWER + UPPER,            // 62 chars  -> ~155 bits for 26 chars
  ascii: DIGITS + LOWER + UPPER + SYMBOLS,  // 94 chars  -> ~170 bits for 26 chars
};

/**
 * True if any single character repeats more than `maxRun` times side by side.
 * hasRunLongerThan('aaaab', 4) -> false   (4 in a row is allowed)
 * hasRunLongerThan('aaaaab', 4) -> true   (5 in a row is rejected)
 */
export function hasRunLongerThan(str, maxRun = 4) {
  let run = 1;
  for (let i = 1; i < str.length; i++) {
    run = str[i] === str[i - 1] ? run + 1 : 1;
    if (run > maxRun) return true;
  }
  return false;
}

function randomString(length, charset) {
  let out = '';
  for (let i = 0; i < length; i++) {
    // randomInt is unbiased (no modulo bias)
    out += charset[crypto.randomInt(charset.length)];
  }
  return out;
}

/**
 * Generate one secret. Candidates with a run longer than `maxRun` are thrown away
 * and a fresh random candidate is drawn (rejection sampling keeps it uniform).\
 */
export function generateSecret({ length = 26, charset = CHARSETS.alnum, maxRun = 4 } = {}) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = randomString(length, charset);
    if (!hasRunLongerThan(candidate, maxRun)) return candidate;
  }
  throw new Error('Could not generate a valid secret'); // practically unreachable
}
