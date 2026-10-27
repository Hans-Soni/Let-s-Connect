/**
 * secretGenerator.test.js
 *
 * Unit tests for hasRunLongerThan and generateSecret.
 * Run with:  node --test backend/src/lib/secretGenerator.test.js
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { hasRunLongerThan, generateSecret, CHARSETS } from './secretGenerator.js';

// ── hasRunLongerThan ────────────────────────────────────────────────────────

test('hasRunLongerThan: empty string returns false', () => {
  assert.equal(hasRunLongerThan('', 4), false);
});

test('hasRunLongerThan: single character returns false', () => {
  assert.equal(hasRunLongerThan('a', 4), false);
});

test('hasRunLongerThan: run of exactly maxRun (4) returns false', () => {
  assert.equal(hasRunLongerThan('aaaab', 4), false);
  assert.equal(hasRunLongerThan('baaaa', 4), false);
  assert.equal(hasRunLongerThan('xaaaax', 4), false);
});

test('hasRunLongerThan: run of maxRun+1 (5) returns true', () => {
  assert.equal(hasRunLongerThan('aaaaab', 4), true);
  assert.equal(hasRunLongerThan('baaaaab', 4), true);
});

test('hasRunLongerThan: mixed runs, none exceeding maxRun', () => {
  assert.equal(hasRunLongerThan('aaabbbcccd', 4), false);
});

test('hasRunLongerThan: run of 5 in the middle', () => {
  assert.equal(hasRunLongerThan('abcaaaaabcd', 4), true);
});

test('hasRunLongerThan: maxRun=1 rejects any two adjacent identical chars', () => {
  assert.equal(hasRunLongerThan('ab', 1), false);
  assert.equal(hasRunLongerThan('aab', 1), true);
});

test('hasRunLongerThan: works with symbols', () => {
  assert.equal(hasRunLongerThan('!!!', 4), false);  // run of 3, maxRun=4
  assert.equal(hasRunLongerThan('!!!!!', 4), true); // run of 5
});

// ── generateSecret ──────────────────────────────────────────────────────────

test('generateSecret: default output is exactly 26 characters', () => {
  const s = generateSecret();
  assert.equal(s.length, 26);
});

test('generateSecret: default charset is alnum (no symbols)', () => {
  const alnum = /^[0-9a-zA-Z]+$/;
  for (let i = 0; i < 50; i++) {
    assert.match(generateSecret(), alnum, 'Default secret must only contain alphanumeric characters');
  }
});

test('generateSecret: ascii charset includes symbols', () => {
  // Generate enough samples to be confident a symbol appears.
  let sawSymbol = false;
  const symbolPattern = /[^0-9a-zA-Z]/;
  for (let i = 0; i < 200; i++) {
    if (symbolPattern.test(generateSecret({ charset: CHARSETS.ascii }))) {
      sawSymbol = true;
      break;
    }
  }
  assert.ok(sawSymbol, 'At least one secret from 200 ascii-charset secrets should contain a symbol');
});

test('generateSecret: no run longer than 4 in 1000 samples', () => {
  for (let i = 0; i < 1000; i++) {
    const s = generateSecret();
    assert.equal(
      hasRunLongerThan(s, 4),
      false,
      `Secret "${s}" has a run longer than 4`
    );
  }
});

test('generateSecret: custom length', () => {
  assert.equal(generateSecret({ length: 10 }).length, 10);
  assert.equal(generateSecret({ length: 40 }).length, 40);
});

test('generateSecret: secrets are not all identical (randomness check)', () => {
  const set = new Set(Array.from({ length: 20 }, () => generateSecret()));
  assert.ok(set.size > 1, 'All 20 generated secrets are identical — randomness broken');
});

// ── Pairwise-distinctness of the three key roles ─────────────────────────────
// Uses the same charsets and length as CONFIG in keyRotation.js so the tests
// cover the exact production parameters.

const KEY_LENGTH = 26;
const ASCII_CHARSET  = CHARSETS.ascii;   // used by jwtCharset and encryptionCharset
const ALNUM_CHARSET  = CHARSETS.alnum;   // used by apiKeyCharset
const ITERATIONS     = 500;

test('distinctness: jwtSecret and encryptionKey are never equal across 500 draws', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    const jwtSecret     = generateSecret({ length: KEY_LENGTH, charset: ASCII_CHARSET });
    const encryptionKey = generateSecret({ length: KEY_LENGTH, charset: ASCII_CHARSET });
    assert.notEqual(jwtSecret, encryptionKey,
      `Draw ${i}: jwtSecret and encryptionKey collided: "${jwtSecret}"`);
  }
});

test('distinctness: jwtSecret and senderApiKey are never equal across 500 draws', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    const jwtSecret    = generateSecret({ length: KEY_LENGTH, charset: ASCII_CHARSET });
    const senderApiKey = generateSecret({ length: KEY_LENGTH, charset: ALNUM_CHARSET });
    assert.notEqual(jwtSecret, senderApiKey,
      `Draw ${i}: jwtSecret and senderApiKey collided: "${jwtSecret}"`);
  }
});

test('distinctness: encryptionKey and senderApiKey are never equal across 500 draws', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    const encryptionKey = generateSecret({ length: KEY_LENGTH, charset: ASCII_CHARSET });
    const senderApiKey  = generateSecret({ length: KEY_LENGTH, charset: ALNUM_CHARSET });
    assert.notEqual(encryptionKey, senderApiKey,
      `Draw ${i}: encryptionKey and senderApiKey collided: "${encryptionKey}"`);
  }
});
