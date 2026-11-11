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
 app=initializeApp({projectId:'demo-anime-meta-hub-transactions'},'transaction-tests');db=getFirestore(app);
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

const {cards,themes,slots}=require('../../services/economy/domain.cjs');
for(const theme of themes){
 test(`theme ${theme.id}: concurrent purchase once, replay, ownership and toggle persistence`,async()=>{
  const uid=`theme-${theme.id}`;await seed(uid);
  const results=await Promise.allSettled([run(uid,`purchase_first_${theme.id}_1234567890`,{type:'buyTheme',themeId:theme.id}),run(uid,`purchase_other_${theme.id}_1234567890`,{type:'buyTheme',themeId:theme.id})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.find(r=>r.status==='rejected').reason.code,'theme-already-owned');
  const s=await state(uid);assert.equal(s.gold,10000-theme.price);assert.deepEqual(s.inventory.themes,[theme.id]);assert.deepEqual(s.inventory.legacy,['keep']);
  const id=`theme_toggle_${theme.id}_1234567890`;
  await run(uid,id,{type:'equipTheme',themeId:theme.id});await run(uid,id,{type:'equipTheme',themeId:theme.id});
  assert.equal((await state(uid)).equippedTheme,theme.id);
  await run(uid,`theme_remove_${theme.id}_1234567890`,{type:'equipTheme',themeId:theme.id});
  assert.equal((await state(uid)).equippedTheme,'');assert.equal((await state(uid)).gold,10000-theme.price);
 });
}
for(const rarity of ['common','rare','legendary']){
 test(`${rarity} duplicate recycle: raw stat bonus once, all matching slot references cleared`,async()=>{
  const uid=`recycle-${rarity}`,card=cards.find(c=>c.rarity===rarity);
  const first={...card,instanceId:'first',hp:901,atk:302,def:203},other={...card,instanceId:'other'};
  const equipped=Object.fromEntries(slots.filter(s=>s.startsWith(rarity)).map(slot=>[slot,first]));
  await db.collection('user_meta').doc(uid).set({...base(),inventoryCards:[first,other],equippedSlots:equipped,flatBonusHp:7,flatBonusAtk:8,flatBonusDef:9});
  const id=`recycle_request_${rarity}_1234567890`,command={type:'recycle',instanceId:'first'};
  const results=await Promise.all([run(uid,id,command),run(uid,id,command)]);assert.deepEqual(results[0],results[1]);assert.equal(results[0].duplicate,true);
  const s=await state(uid),rewards={common:[100,50],rare:[300,150],legendary:[600,300]}[rarity];
  assert.equal(s.gold,10000+rewards[0]);assert.equal(s.xp,2840+rewards[1]);assert.equal(s.flatBonusHp,908);assert.equal(s.flatBonusAtk,310);assert.equal(s.flatBonusDef,212);
  assert.deepEqual(s.inventoryCards,[other]);assert.deepEqual(s.equippedSlots,{});assert.equal(s.gems,318);
  await assert.rejects(run(uid,`recycle_again_${rarity}_1234567890`,command),e=>e.code==='instance-not-unique-or-owned');
  assert.deepEqual(await state(uid),s);
 });
}
test('six slot equip and unequip persist independently without spending/removing cards',async()=>{
 const uid='six-slots';const inventoryCards=['legendary','rare','common'].map(rarity=>({...cards.find(c=>c.rarity===rarity),instanceId:`owned-${rarity}`}));
 await db.collection('user_meta').doc(uid).set({...base(),inventoryCards});
 for(const slot of slots)await run(uid,`equip_${slot}_123456789012345`,{type:'equip',slot,instanceId:`owned-${slot.split('-')[0]}`});
 assert.deepEqual(Object.keys((await state(uid)).equippedSlots).sort(),[...slots].sort());
 for(const slot of slots)await run(uid,`unequip_${slot}_123456789012345`,{type:'unequip',slot});
 const s=await state(uid);assert.deepEqual(s.equippedSlots,{});assert.deepEqual(s.inventoryCards,inventoryCards);assert.equal(s.gold,10000);
});
test('invalid theme purchase, insufficient funds and unknown card fail without writes',async()=>{
 const uid='rejected-commands';await seed(uid,0);const before=await state(uid);
 await assert.rejects(run(uid,'insufficient_theme_1234567890',{type:'buyTheme',themeId:themes[0].id}),e=>e.code==='insufficient-gold');
 await assert.rejects(run(uid,'unowned_theme_12345678901234',{type:'equipTheme',themeId:themes[0].id}),e=>e.code==='theme-not-owned');
 await assert.rejects(run(uid,'unknown_theme_12345678901234',{type:'buyTheme',themeId:'fake'}),e=>e.code==='unknown-theme');
 assert.deepEqual(await state(uid),before);
});
