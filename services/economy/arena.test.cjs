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
