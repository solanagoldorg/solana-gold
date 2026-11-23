import test from 'node:test';
import assert from 'node:assert/strict';
import { admitAttempt, assertPage, assertExistingReceipt } from './verifier.mjs';
const id = '00000000-0000-4000-8000-000000000015';
const env = { RAILWAY_SERVICE_ID: '00000000-0000-4000-8000-000000000012' };
test('fixed worker and fresh bounded UUID, never canonical operation modes', () => {
  assert.equal(admitAttempt(id, env).root, '/data/gold-recovery/' + id);
  for (const other of [{...env, RAILWAY_SERVICE_ID:'00000000-0000-4000-8000-000000000001'}, {...env,SG_OPERATION:'cold-restore'}, {...env,SG_MIGRATION_MODE:'canonical-testnet'}]) assert.throws(()=>admitAttempt(id,other));
  assert.throws(()=>admitAttempt('../escape',env));
});
test('617 rows supported, incomplete bounds/duplicate cursor/overshoot refused', () => {
  assert.doesNotThrow(()=>assertPage({entries:Array(50),nextCursor:'550'},500,500,617));
  assert.throws(()=>assertPage({entries:Array(50),nextCursor:'500'},500,500,617));
  assert.throws(()=>assertPage({entries:Array(50),nextCursor:'551'},500,500,617));
  assert.throws(()=>assertPage({entries:Array(18),nextCursor:null},600,600,617));
  assert.throws(()=>assertPage({entries:[],nextCursor:null},0,0,10001));
});
test('archived receipt exact identity and no-new-grant required', () => {
  const expected={request_id:id,signature:'existing',state:'confirmed'};
  const good={created:false,receipt:{requestId:id,signature:'existing',state:'confirmed',lamports:1000000000}};
  assertExistingReceipt(good,expected);
  for(const bad of [{...good,created:true},{...good,receipt:{...good.receipt,signature:'replacement'}},{...good,receipt:{...good.receipt,requestId:'replacement'}},{...good,receipt:{...good.receipt,lamports:2000000000}}])assert.throws(()=>assertExistingReceipt(bad,expected));
});
