import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntityChanges } from '../lib/server/admin-entity-validation.ts';

const fields = { name: 'text', role: 'text', progress: 'number', enabled: 'boolean', config_json: 'nullableText', status: 'text', slug: 'text', paid_at:'nullableText' };

test('validates and normalizes typed changes', () => {
  assert.deepEqual(validateEntityChanges('projects', fields, { name: ' Alpha ', progress: '75', enabled: true }), { name: 'Alpha', progress: 75, enabled: 1 });
});
test('rejects prototype keys and unknown fields', () => {
  assert.throws(() => validateEntityChanges('projects', fields, JSON.parse('{"__proto__":"bad"}')), /invalid_field/);
  assert.throws(() => validateEntityChanges('projects', fields, { inaccessible: true }), /invalid_field/);
});
test('blocks privileged fields in generic editor', () => {
  assert.throws(() => validateEntityChanges('users', fields, { role: 'OWNER' }), /invalid_field_role/);
  assert.throws(() => validateEntityChanges('orders', fields, { paid_at: '2026-10-01' }), /invalid_field_paid_at/);
});
test('rejects malformed JSON and invalid numeric bounds', () => {
  assert.throws(() => validateEntityChanges('flags', fields, { config_json: '{bad' }), /invalid_config_json/);
  assert.throws(() => validateEntityChanges('projects', fields, { progress: 150 }), /invalid_progress/);
  assert.throws(() => validateEntityChanges('projects', fields, { progress: 'Infinity' }), /invalid_progress/);
});
test('rejects malformed shapes, coercion, status and slugs', () => {
  assert.throws(() => validateEntityChanges('projects', fields, []), /invalid_changes/);
  assert.throws(() => validateEntityChanges('projects', fields, {}), /invalid_changes/);
  assert.throws(() => validateEntityChanges('flags', fields, { enabled: 'yes' }), /invalid_enabled/);
  assert.throws(() => validateEntityChanges('orders', fields, { status: 'PAID\nDROP' }), /invalid_status/);
  assert.throws(() => validateEntityChanges('organizations', fields, { slug: '../oops' }), /invalid_slug/);
});
