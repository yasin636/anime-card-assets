'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {plan,cards,themes}=require('./domain.cjs');
const {execute}=require('./transaction.cjs');
const entropy={owner:'uid',rarity:.8,card:0,instanceId:'new-card'};
const base=()=>({gold:10000,xp:2840,gems:318,username:'Old user',Bio:'Keep',inventoryCards:[],equippedSlots:{},inventory:{themes:[],legacy:['keep']},unknown:{preserve:true}});
const apply=(p,c,e=entropy)=>{const {patch,result}=plan(p,c,e);return {state:{...p,...patch},patch,result};};
const rejects=(p,c,code,e=entropy)=>assert.throws(()=>plan(p,c,e),error=>error.code===code);
test('catalog retains sixteen cards and seven exact theme prices',()=>{
 assert.equal(cards.length,16);assert.deepEqual(themes.map(t=>t.price),[5000,4000,3500,2500,2000,1000,1000]);
});
for(const [roll,rarity] of [[0,'legendary'],[.079999,'legendary'],[.08,'rare'],[.299999,'rare'],[.30,'common'],[.999999,'common']]){
 test(`base rarity boundary ${roll}`,()=>assert.equal(apply(base(),{type:'summon'},{...entropy,rarity:roll}).result.card.rarity,rarity));
}
test('rare tenth guarantee, legendary twenty-first precedence and pity resets',()=>{
 let p={...base(),pityRare:9,pityLegendary:19};
 let a=apply(p,{type:'summon'},{...entropy,rarity:0});
 assert.equal(a.result.card.rarity,'rare');assert.equal(a.state.pityRare,0);assert.equal(a.state.pityLegendary,20);
 a=apply({...p,pityLegendary:20},{type:'summon'});
 assert.equal(a.result.card.rarity,'legendary');assert.equal(a.state.pityRare,0);assert.equal(a.state.pityLegendary,0);
 a=apply({...base(),pityRare:3,pityLegendary:7},{type:'summon'});
 assert.equal(a.state.pityRare,4);assert.equal(a.state.pityLegendary,8);
});
test('500 Gold, newest first; XP/Gems/legacy data unchanged and input immutable',()=>{
 const p={...base(),inventoryCards:[{id:'yuji',instanceId:'old'}]};const before=structuredClone(p);
 const a=apply(p,{type:'summon'});assert.equal(a.state.gold,9500);assert.equal(a.state.xp,2840);assert.equal(a.state.gems,318);
 assert.equal(a.state.inventoryCards[0].instanceId,'new-card');assert.equal(a.state.inventoryCards[1].instanceId,'old');assert.deepEqual(p,before);assert.deepEqual(a.state.unknown,p.unknown);
});
test('low balances and forged request fields fail without modifying source',()=>{
 rejects({...base(),gold:499},{type:'summon'},'insufficient-gold');
 rejects(base(),{type:'summon',gold:100000},'unexpected-command-field');
 rejects(base(),{type:'summon',rarity:'legendary'},'unexpected-command-field');
 for(const value of [-1,NaN,Infinity,'1000'])rejects({...base(),gold:value},{type:'summon'},'invalid-profile-number');
 rejects(base(),{type:'summon'},'invalid-server-entropy',{...entropy,rarity:1});
});
test('legacy preparation preserves IDs, all cards and custom fields; repeats are stable',()=>{
 const p={...base(),inventoryCards:[{id:'yuji',custom:'yes'},{id:'gojo',instanceId:'existing'}],equippedSlots:{'common-1':{id:'yuji',name:'Old slot'}}};
 const a=apply(p,{type:'prepare'}).state;
 assert.equal(a.inventoryCards.length,2);assert.equal(a.inventoryCards[0].custom,'yes');assert.equal(a.inventoryCards[1].instanceId,'existing');
 assert.equal(a.equippedSlots['common-1'].instanceId,a.inventoryCards[0].instanceId);
 assert.deepEqual(apply(a,{type:'prepare'}).state,a);
 const twins=apply({...base(),inventoryCards:[{id:'yuji'},{id:'yuji'}],equippedSlots:{'common-1':{id:'yuji'}}},{type:'prepare'}).state;
 assert.notEqual(twins.inventoryCards[0].instanceId,twins.inventoryCards[1].instanceId);
 assert.equal(twins.equippedSlots['common-1'].instanceId,undefined);
});
test('equip ownership/rarity guards; unequip does not destroy cards',()=>{
 const p={...base(),inventoryCards:[{id:'gojo',instanceId:'g'}]};
 rejects(p,{type:'equip',instanceId:'no',slot:'legendary-1'},'instance-not-unique-or-owned');
 rejects(p,{type:'equip',instanceId:'g',slot:'common-1'},'rarity-mismatch');
 rejects(p,{type:'unequip',slot:'other'},'invalid-slot');
 const a=apply(p,{type:'equip',instanceId:'g',slot:'legendary-1'}).state;
 assert.equal(a.equippedSlots['legendary-1'].id,'gojo');
 assert.deepEqual(apply(a,{type:'unequip',slot:'legendary-1'}).state.inventoryCards,p.inventoryCards);
});
for(const [id,gold,xp] of [['yuji',100,50],['denji',300,150],['gojo',600,300]]){
 test(`recycle exact ${id} rewards, remove matching slots, no single-copy bonus`,()=>{
 const card={id,instanceId:'owned'};const p={...base(),inventoryCards:[card],equippedSlots:{'legendary-1':card,'legendary-2':card}};
 const a=apply(p,{type:'recycle',instanceId:'owned'}).state;
 assert.equal(a.gold,10000+gold);assert.equal(a.xp,2840+xp);assert.equal(a.inventoryCards.length,0);assert.deepEqual(a.equippedSlots,{});assert.equal(a.flatBonusAtk,undefined);
 rejects(a,{type:'recycle',instanceId:'owned'},'instance-not-unique-or-owned');
 });
}
test('duplicate recycle adds 100% raw stats once, keeps the other instance',()=>{
 const p={...base(),flatBonusAtk:50,inventoryCards:[{id:'yuji',instanceId:'a',hp:100,atk:200,def:30},{id:'yuji',instanceId:'b'}]};
 const a=apply(p,{type:'recycle',instanceId:'a'});
 assert.equal(a.state.flatBonusAtk,250);assert.equal(a.state.flatBonusHp,100);assert.equal(a.state.flatBonusDef,30);assert.equal(a.result.duplicate,true);assert.equal(a.state.inventoryCards[0].instanceId,'b');
});
test('ambiguous legacy equip and unknown card block recycle rather than data loss',()=>{
 rejects({...base(),inventoryCards:[{id:'yuji',instanceId:'a'},{id:'yuji',instanceId:'b'}],equippedSlots:{'common-1':{id:'yuji'}}},{type:'recycle',instanceId:'a'},'ambiguous-legacy-slot');
 rejects({...base(),inventoryCards:[{id:'unknown',instanceId:'a'}]},{type:'recycle',instanceId:'a'},'unknown-legacy-card');
});
for(const theme of themes)test(`theme ${theme.id} exact price, one purchase, equip toggle`,()=>{
 const p=base();rejects(p,{type:'equipTheme',themeId:theme.id},'theme-not-owned');
 const a=apply(p,{type:'buyTheme',themeId:theme.id}).state;
 assert.equal(a.gold,p.gold-theme.price);assert.deepEqual(a.inventory.legacy,['keep']);
 rejects(a,{type:'buyTheme',themeId:theme.id},'theme-already-owned');
 const b=apply(a,{type:'equipTheme',themeId:theme.id}).state;assert.equal(b.equippedTheme,theme.id);
 assert.equal(apply(b,{type:'equipTheme',themeId:theme.id}).state.equippedTheme,'');
});
test('oversized profiles fail closed, never prune old fields',()=>rejects({...base(),oldText:'x'.repeat(850000)},{type:'summon'},'profile-too-large'));
function fakeDb(initial){
 const store=new Map([['user_meta/uid',structuredClone(initial)]]);
 const ref=path=>({path,collection:name=>({doc:id=>ref(`${path}/${name}/${id}`)})});
 return {store,collection:name=>({doc:id=>ref(`${name}/${id}`)}),runTransaction:async fn=>{
   const pending=[];
   const result=await fn({get:async r=>({exists:store.has(r.path),data:()=>structuredClone(store.get(r.path))}),update:(r,p)=>pending.push(()=>store.set(r.path,{...store.get(r.path),...p})),create:(r,p)=>{if(store.has(r.path))throw Error('duplicate');pending.push(()=>store.set(r.path,p));}});
   pending.forEach(fn=>fn());return result;
 }};
}
test('receipt retry returns the same card, charges only once; changed command rejected',async()=>{
 const db=fakeDb(base()),args={db,verifiedUid:'uid',operationId:'operation_123456789012345',command:{type:'summon'}};
 const first=await execute(args),second=await execute(args);assert.deepEqual(first,second);assert.equal(db.store.get('user_meta/uid').gold,9500);assert.equal(db.store.get('user_meta/uid').inventoryCards.length,1);
 await assert.rejects(execute({...args,command:{type:'prepare'}}),e=>e.code==='operation-id-conflict');
});
test('transaction validation failure writes no receipt or profile mutation',async()=>{
 const db=fakeDb({...base(),gold:0}),before=structuredClone([...db.store]);
 await assert.rejects(execute({db,verifiedUid:'uid',operationId:'operation_123456789012345',command:{type:'summon'}}),e=>e.code==='insufficient-gold');
 assert.deepEqual([...db.store],before);
 await assert.rejects(execute({db,verifiedUid:'',operationId:'operation_123456789012345',command:{type:'summon'}}),e=>e.code==='unauthenticated');
});
