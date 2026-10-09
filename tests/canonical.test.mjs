import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, CANONICAL_ORIGIN } from '../lib/seo/canonical.ts';

test('canonical URLs are absolute and use production origin', () => {
  assert.equal(CANONICAL_ORIGIN, 'https://sysone.top');
  assert.equal(canonicalUrl('/'), 'https://sysone.top/');
  assert.equal(canonicalUrl('/games/'), 'https://sysone.top/games');
  assert.equal(canonicalUrl('/products/sample'), 'https://sysone.top/products/sample');
});
test('canonical URLs reject protocol-relative URLs, queries, anchors and traversal', () => {
  for (const path of ['//evil.com', 'https://evil.com', '/?x=1', '/x#y', '/a/../b', '/x\\y']) {
    assert.throws(() => canonicalUrl(path), /invalid_canonical_path/);
  }
});
