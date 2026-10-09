import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const owner = readFileSync(new URL('../app/control-center/OwnerToolV4.tsx', import.meta.url), 'utf8');
const overview = readFileSync(new URL('../app/control-center/owner-v4/Overview.tsx', import.meta.url), 'utf8');
const entity = readFileSync(new URL('../app/control-center/owner-v4/EntityManager.tsx', import.meta.url), 'utf8');
test('Owner Tool delegates to separate overview and entity editor modules', () => {
  assert.match(owner, /import \{ Overview \}/);
  assert.match(owner, /import \{ EntityManager \}/);
  assert.doesNotMatch(owner, /function Overview\(/);
  assert.doesNotMatch(owner, /function EntityManager\(/);
  assert.match(overview, /export function Overview\(/);
  assert.match(entity, /export function EntityManager\(/);
});
