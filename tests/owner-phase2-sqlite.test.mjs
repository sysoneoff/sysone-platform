import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { OWNER_CANCEL_PENDING_SQL } from '../lib/owner-phase2-query.ts';

test('actual SQLite cancellation only changes unpaid, unfulfilled orders',()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec(`CREATE TABLE orders(id TEXT PRIMARY KEY,status TEXT,paid_at TEXT,payment_reference TEXT);
      CREATE TABLE entitlements(id TEXT PRIMARY KEY,order_id TEXT);
      INSERT INTO orders VALUES('pending','PENDING',NULL,NULL),
        ('paid','PAID','2026-10-08',NULL),
        ('processed','PENDING','2026-10-08',NULL),
        ('referenced','PENDING',NULL,'psp_123'),
        ('fulfilled','PENDING',NULL,NULL),
        ('cancelled','CANCELLED',NULL,NULL);
      INSERT INTO entitlements VALUES('ent-1','fulfilled');`);
    const change=(id)=>db.prepare(OWNER_CANCEL_PENDING_SQL).run(id).changes;
    assert.equal(change('pending'),1);
    assert.equal(change('pending'),0);
    for(const id of ['paid','processed','referenced','fulfilled','cancelled'])
      assert.equal(change(id),0,id);
    assert.equal(db.prepare(`SELECT status FROM orders WHERE id='pending'`).get().status,'CANCELLED');
    assert.equal(db.prepare(`SELECT status FROM orders WHERE id='fulfilled'`).get().status,'PENDING');
  }finally{db.close()}
});
