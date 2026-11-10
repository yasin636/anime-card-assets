'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const adminRequire=createRequire(require('node:path').resolve('../../services/economy/package.json'));
const {initializeApp,deleteApp}=adminRequire('firebase-admin/app');
const {getFirestore}=adminRequire('firebase-admin/firestore');
const {execute}=require('../../services/economy/transaction.cjs');
let app,db;
before(()=>{
 if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required; production access prohibited');
 app=initializeApp({projectId:'demo-anime-meta-hub'},'transaction-tests');db=getFirestore(app);
});
after(async()=>{await deleteApp(app);});
const base=()=>({gold:10000,xp:2840,gems:318,username:'Existing',Bio:'Keep',inventoryCards:[],equippedSlots:{},inventory:{themes:[],legacy:['keep']},unknown:{preserve:true}});
async function seed(uid,gold=10000){await db.collection('user_meta').doc(uid).set({...base(),gold});}
const run=(uid,id,command={type:'summon'})=>execute({db,verifiedUid:uid,operationId:id,command});
const state=async uid=>(await db.collection('user_meta').doc(uid).get()).data();
test('concurrent retries of one operation spend once and return identical receipt',async()=>{
 const uid='tx-replay';await seed(uid);
 const id='operation_replay_1234567890';const results=await Promise.all(Array.from({length:4},()=>run(uid,id)));
 for(const r of results)assert.deepEqual(r,results[0]);
 const s=await state(uid);assert.equal(s.gold,9500);assert.equal(s.inventoryCards.length,1);
 assert.equal(s.xp,2840);assert.equal(s.gems,318);assert.deepEqual(s.unknown,{preserve:true});
 const receipts=await db.collection('user_meta').doc(uid).collection('economy_receipts').get();assert.equal(receipts.size,1);
 assert.deepEqual(await run(uid,id),results[0]);assert.equal((await state(uid)).gold,9500);
});
test('distinct concurrent spends cannot overdraw and failed command has no receipt',async()=>{
 const uid='tx-overdraw';await seed(uid,500);
 const ids=['operation_spend_a_123456789','operation_spend_b_123456789'];
 const results=await Promise.allSettled(ids.map(id=>run(uid,id)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const index=results.findIndex(r=>r.status==='rejected');assert.equal(results[index].reason.code,'insufficient-gold');
 const s=await state(uid);assert.equal(s.gold,0);assert.equal(s.inventoryCards.length,1);
 assert.equal((await db.collection('user_meta').doc(uid).collection('economy_receipts').doc(ids[index]).get()).exists,false);
});
test('operation-ID reuse with different payload fails atomically',async()=>{
 const uid='tx-conflict';await seed(uid);const id='operation_conflict_123456789';await run(uid,id);
 await assert.rejects(run(uid,id,{type:'prepare'}),e=>e.code==='operation-id-conflict');assert.equal((await state(uid)).gold,9500);
});
test('same id for different verified users is isolated',async()=>{
 const id='operation_isolated_123456789';await seed('tx-owner-a');await seed('tx-owner-b');
 await Promise.all([run('tx-owner-a',id),run('tx-owner-b',id)]);
 assert.equal((await state('tx-owner-a')).gold,9500);assert.equal((await state('tx-owner-b')).gold,9500);
});
