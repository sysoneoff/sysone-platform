import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOwnerQuery, assertOwnerRecordId, safeCsvCell, toCsv } from '../lib/owner-phase2-query.ts';
const q=(s,collection='orders')=>parseOwnerQuery(new URLSearchParams(s),collection);
test('defaults and offset pagination are bounded',()=>{
  assert.deepEqual(q('').page,1);assert.equal(q('page=3&size=15').offset,30);
  for(const v of ['page=0','page=-1','page=3.4','size=51','size=0','page=10001'])assert.throws(()=>q(v),/invalid_pagination/);
});
test('status allowlist and sort restriction',()=>{
  assert.equal(q('status=pending').status,'PENDING');
  assert.equal(q('sort=oldest').sort,'oldest');
  assert.throws(()=>q('sort=random'),/invalid_sort/);
  assert.throws(()=>q('status=PAID%27%20OR%201=1'),/invalid_status/);
  assert.throws(()=>q('status=PAID','customers'),/invalid_status/);
});
test('search and record ids reject controls or oversized values',()=>{
  assert.equal(q('q=%20Asal%20').q,'Asal');
  assert.throws(()=>q('q='+encodeURIComponent('X'.repeat(101))),/invalid_search/);
  assert.throws(()=>q('q=a%0Ab'),/invalid_search/);
  assert.throws(()=>assertOwnerRecordId(''),/invalid_id/);
  assert.throws(()=>assertOwnerRecordId('a\nb'),/invalid_id/);
});
test('csv escaping protects against formula injection and quoting',()=>{
  for(const prefix of ['=','+','-','@','\t'])assert.ok(safeCsvCell(prefix+'SUM(1)').includes("'"+prefix));
  assert.equal(safeCsvCell('a"b'), '"a""b"');
  assert.ok(toCsv(['Name'],[['=2+3']]).startsWith('\uFEFF'));
});
