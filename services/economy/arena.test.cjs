'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {spin,wheel,hit,startBattle,turn,weekKey,sanitizeQuiz,validate}=require('./arena.cjs');
const {cards}=require('./domain.cjs');
test('wheel exact8 labels/rewards paid fee then floor; free spin consumes first',()=>{
 assert.deepEqual(wheel.map(v=>v[1]),[0,40,10,100,-20,50,60,0]);
 for(let i=0;i<8;i++){const r=spin({xp:100,freeSpins:0},i);assert.equal(r.patch.xp,Math.max(0,80+wheel[i][1]));assert.equal(r.patch.freeSpins,i===7?1:0);assert.equal(r.result.index,i);}
 assert.deepEqual(spin({xp:0,freeSpins:1},4).patch,{xp:0,freeSpins:0});assert.deepEqual(spin({xp:5,freeSpins:1},7).patch,{xp:5,freeSpins:1});
 assert.throws(()=>spin({xp:19,freeSpins:0},0),e=>e.code==='insufficient-xp');
});
test('battle mirrors full chosen rarity distribution; no fixed3 maximum or story bonuses',()=>{
 const inventoryCards=cards.slice(0,5).map((c,i)=>({...c,instanceId:`owned_${i}`}));const b=startBattle({inventoryCards,flatBonusAtk:999999},inventoryCards.map(c=>c.instanceId),'battle',()=>0);
 assert.equal(b.player.cards.length,5);assert.deepEqual(b.enemy.cards.map(c=>c.rarity),b.player.cards.map(c=>c.rarity));assert.equal(b.player.hp,inventoryCards.reduce((n,c)=>n+c.hp*2,0));assert.equal(b.player.cards[0].atk,inventoryCards[0].atk);assert.equal(b.first,'player');
});
test('shield splits damage with no overflow transfer and never below0',()=>{
 const target={hp:100,def:1};hit(target,30);assert.deepEqual(target,{hp:80,def:0});hit(target,30);assert.deepEqual(target,{hp:50,def:0});hit(target,1000);assert.equal(target.hp,0);
});
test('card cannot attack twice; depleted decks compare absolute HP, tie to player',()=>{
 const base={id:'b',status:'active',first:'player',log:[],player:{hp:100,def:0,cards:[{name:'P',instanceId:'p',atk:0,used:false}]},enemy:{hp:100,def:0,cards:[{name:'E',instanceId:'e',atk:0,used:false}]}};
 const result=turn(base,'p');assert.equal(result.status,'finished');assert.equal(result.outcome,'win');assert.equal(base.player.cards[0].used,false);assert.throws(()=>turn(result,'p'),e=>e.code==='battle-ended');
});
test('server command schemas reject client rewards, duplicate cards and stale question metadata',()=>{
 for(const c of [{type:'wheelSpin',xp:9000},{type:'weeklyClaim',rank:1},{type:'battleStart',instanceIds:['a','a','b']},{type:'quizAnswer',quizId:'q',answer:'a',skip:false,questionIndex:6}])assert.throws(()=>validate(c));
 validate({type:'quizAnswer',quizId:'q',answer:'',skip:true,questionIndex:0});
});
test('quiz status never returns answers or future questions; explicit Dhaka Sunday week boundary',()=>{
 const q=sanitizeQuiz({id:'q',title:'Anime',index:0,correct:0,wrong:0,skipped:0,status:'active',questions:[{question:'Who?',answer:'PRIVATE',hint:'A hint'},{question:'Future',answer:'SECRET'}]});
 assert.equal(JSON.stringify(q).includes('PRIVATE'),false);assert.equal(JSON.stringify(q).includes('Future'),false);
 assert.equal(weekKey(new Date('2026-11-07T17:59:59Z')),'2026-11-01');assert.equal(weekKey(new Date('2026-11-07T18:00:00Z')),'2026-11-08');
});
test('enemy-first lethal opening ends immediately; no dead-player attack',()=>{
 const inventoryCards=cards.slice(0,3).map((c,i)=>({...c,hp:1,atk:1,def:1,instanceId:`tiny_${i}`}));let calls=0;
 const b=startBattle({inventoryCards},inventoryCards.map(c=>c.instanceId),'opening',max=>++calls===4?1:0);
 assert.equal(b.first,'enemy');assert.equal(b.status,'finished');assert.equal(b.outcome,'lose');assert.throws(()=>turn(b,'tiny_0'),e=>e.code==='battle-ended');
});
test('public featured projection whitelists six slots and canonical display fields only',()=>{
 const {publicFeatured}=require('./arena.cjs');
 const projected=publicFeatured({email:'PRIVATE',inventoryCards:[{secret:'PRIVATE'}],equippedSlots:{'legendary-1':{id:'gojo',instanceId:'PRIVATE',name:'Forged name',hp:123,atk:456,def:789,secret:'PRIVATE',email:'PRIVATE'},'common-1':{id:'legacy-shadow',name:'Legacy'},'admin-secret':{id:'sukuna'}}});
 assert.deepEqual(Object.keys(projected),['legendary-1','common-1']);assert.equal(projected['legendary-1'].name,'Gojo Satoru');assert.equal(projected['legendary-1'].hp,123);assert.equal(projected['legendary-1'].atk,456);assert.equal(projected['legendary-1'].def,789);
 assert.equal(JSON.stringify(projected).includes('PRIVATE'),false);assert.equal('instanceId' in projected['legendary-1'],false);assert.equal(projected['common-1'].rarity,'unknown');assert.equal('hp' in projected['common-1'],false);
});
