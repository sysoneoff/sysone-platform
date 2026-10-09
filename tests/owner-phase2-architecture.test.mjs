import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Owner Tool connects dashboard, orders and customers without public routes',()=>{
  const owner=read('app/control-center/OwnerToolV4.tsx');
  for(const name of ['OrdersManager','CustomersManager','Overview'])assert.ok(owner.includes(`<${name}/>`));
  const page=read('app/control-center/page.tsx');assert.match(page,/\.\/owner-v4\/phase2\.css/);
});
test('new owner APIs require admin authentication',()=>{
  for(const path of ['analytics/route.ts','orders/route.ts','orders/[id]/route.ts','customers/route.ts','customers/[id]/route.ts']){
    const source=read('app/api/admin/v4/'+path);assert.match(source,/isAdminAuthenticated\(\)/,path);
    assert.match(source,/Cache-Control/,path);
  }
});
test('pending cancellation cannot mark orders paid or grant entitlements',()=>{
  const route=read('app/api/admin/v4/orders/[id]/route.ts');
  const store=read('lib/server/owner-phase2.ts');
  assert.match(route,/isSafeAdminMutation\(request\)/);
  assert.match(route,/CANCEL_PENDING/);
  assert.match(store,/OWNER_CANCEL_PENDING_SQL/);
  const query=read('lib/owner-phase2-query.ts');
  assert.match(query,/NOT EXISTS \(SELECT 1 FROM entitlements/);
  assert.doesNotMatch(store,/INSERT INTO entitlements|SET status='PAID'/);
});
