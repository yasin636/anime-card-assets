'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {cards}=require('./domain.cjs');
const {chapters}=require('../../apps/mobile/src/story/catalog.json');
const source=require('../../docs/react-native-blueprint/reference/catalog.json');
const {validate,power,eligible,start,damage,step,rewards,lines}=require('./story.cjs');
const profile={xp:100,inventoryCards:cards.slice(0,3),username:'Hunter'};
const fight=(enemyId='baran')=>({...start(profile,enemyId,'session',0,0),phase:'fight'});
const cmd=(s,type,more={})=>({type,sessionId:s.id,version:s.version,...more});
test('exact five chapters / eleven enemies / boss Bengali dialogues retained',()=>{
 assert.deepEqual(chapters,source.STORY_CHAPTERS);assert.equal(chapters.length,5);assert.equal(chapters.flatMap(c=>c.enemies).length,11);
 for(const ch of chapters)for(const enemy of ch.enemies)for(const type of ['intro','mid','victory','defeat']){assert(lines(enemy,type).length);if(enemy.isBoss)assert.deepEqual(lines(enemy,type),source.BOSS_DIALOGUES[enemy.id][type]);}
});
test('entry XP100 means level3 and three instances; all chapters unlocked, no fee',()=>{
 assert(eligible(profile));assert(!eligible({...profile,xp:99}));assert(!eligible({...profile,inventoryCards:cards.slice(0,2)}));
 assert.throws(()=>start({...profile,xp:99},'goblin','s',0,0),e=>e.code==='story-entry-requirement');
 for(const ch of chapters)for(const e of ch.enemies){const s=start(profile,e.id,'s',.5,0);assert.equal(s.phase,'coin');assert.equal(s.first,'enemy');assert.equal(s.ariseUsed,false);assert.deepEqual(s.shadowIds,[]);assert.equal(s.notBefore,2500);}
});
test('all inventory copies count, percentage before flat, no XP multiplier, canonical stats',()=>{
 const p={...profile,inventoryCards:[cards[0],cards[0],{...cards[1],hp:1}],permBonusHp:5,flatBonusHp:19};
 assert.equal(power(p).hp,Math.round((cards[0].hp*2+cards[1].hp)*1.05)+19);assert.deepEqual(power({...p,xp:1e7}),power(p));
 assert.throws(()=>power({...p,permBonusHp:Infinity}));
});
test('damage shield/no-overflow and actual display HP loss (D18)',()=>{
 const a={hp:1000,def:1};assert.deepEqual(damage(1000,a),{damage:20,shieldDamage:1,shieldBreak:true});assert.deepEqual(a,{hp:980,def:0});
 const b={hp:30,def:0};assert.equal(damage(1000,b).damage,30);assert.equal(b.hp,0);
});
test('coin timer/dialogue/first enemy delay authoritative and repeat stale version rejected',()=>{
 let s=start(profile,'goblin','s',.7,0);assert.throws(()=>step(s,cmd(s,'storyAdvance'),{now:2499}),e=>e.code==='story-too-early');
 s=step(s,cmd(s,'storyAdvance'),{now:2500});assert.equal(s.phase,'dialogue');
 s=step(s,cmd(s,'storyAdvance'),{now:2500});s=step(s,cmd(s,'storyAdvance'),{now:2500});assert.equal(s.phase,'enemy');
 assert.throws(()=>step(s,cmd(s,'storyAdvance'),{now:2999}));s=step(s,cmd(s,'storyAdvance'),{now:3000,roll:.5});assert.equal(s.phase,'fight');assert.equal(s.turn,1);
 assert.throws(()=>step(s,{...cmd(s,'storyAction',{action:'strike'}),version:s.version-1}),e=>e.code==='story-version-changed');
});
test('heavy3 cooldown only non-heavy attacks; guard halves next attack without cooldown decrement',()=>{
 let s=fight();s=step(s,cmd(s,'storyAction',{action:'heavy'}),{now:0,roll:0});assert.equal(s.heavyCooldown,3);
 assert.throws(()=>step(s,cmd(s,'storyAction',{action:'strike'})),e=>e.code==='story-invalid-phase');
 s=step(s,cmd(s,'storyAdvance'),{now:1000,roll:0});
 assert.throws(()=>step(s,cmd(s,'storyAction',{action:'heavy'})),e=>e.code==='heavy-cooldown');
 s=step(s,cmd(s,'storyAction',{action:'guard'}),{now:1000});assert.equal(s.heavyCooldown,3);const hp=s.player.hp;
 s=step(s,cmd(s,'storyAdvance'),{now:2000,roll:.5});assert.equal(s.player.hp,hp-Math.max(1,Math.round(s.enemy.atk*.5*.02)));assert.equal(s.guard,false);
 s=step(s,cmd(s,'storyAction',{action:'strike'}),{roll:0});assert.equal(s.heavyCooldown,2);
});
test('miss/crit thresholds, heavy multiplier before crit',()=>{
 for(const [roll,miss,crit]of [[.049,true,false],[.05,false,true],[.149,false,true],[.15,false,false]]){
  const s=fight();const after=step(s,cmd(s,'storyAction',{action:'heavy'}),{roll});assert.equal(after.events[0].miss,miss);assert.equal(after.events[0].crit,crit);
  if(!miss)assert.equal(after.events[0].damage,Math.min(s.enemy.hp,Math.max(1,Math.round(Math.round(s.player.atk*1.5)*(crit?2:1)*.02))));
 }
});
test('boss mid once/enrage at20%; lethal takes priority and dead enemy never attacks (D19)',()=>{
 let s=fight();s.enemy.hp=1;s=step(s,cmd(s,'storyAction',{action:'strike'}),{roll:.5});assert.equal(s.outcome,'win');assert.equal(s.dialogueKind,'victory');assert.equal(s.enraged,false);
 assert.throws(()=>step(s,cmd(s,'storyAction',{action:'strike'})),e=>e.code==='story-invalid-phase');
 s=fight();s.enemy.hp=s.enemy.maxHp*.2;s=step(s,cmd(s,'storyAction',{action:'strike'}),{roll:0});assert(s.enraged);assert(s.midDone);assert.equal(s.enemy.atk,27000);assert.equal(s.dialogueKind,'mid');
});
test('ARISE Ch2+, unique owned selection, half per shadow, once/fight, no enemy turn',()=>{
 let s=fight('goblin');assert.throws(()=>step(s,cmd(s,'storyArise',{shadowIds:['goblin']}),{shadows:[{id:'goblin'}]}),e=>e.code==='arise-chapter-locked');
 s=fight();assert.throws(()=>step(s,cmd(s,'storyArise',{shadowIds:['beru']})),e=>e.code==='shadow-not-owned');
 const before=structuredClone(s);s=step(s,cmd(s,'storyArise',{shadowIds:['goblin','wolf']}),{shadows:[{id:'goblin'},{id:'wolf'}]});
 assert.equal(s.player.hp,before.player.hp+85+145);assert.equal(s.player.atk,before.player.atk+175+275);assert.equal(s.turn,before.turn);assert.equal(s.phase,'fight');
 assert.throws(()=>step(s,cmd(s,'storyArise',{shadowIds:['goblin']}),{shadows:[{id:'goblin'}]}),e=>e.code==='arise-already-used');
 const fresh=fight();assert.equal(fresh.ariseUsed,false);assert.deepEqual(fresh.ariseBonus,{hp:0,atk:0,def:0});
});
test('first clear/repeat every enemy exact rewards, no repeat gold/gems/bonuses',()=>{
 for(const ch of chapters)for(const e of ch.enemies){const a=rewards(e.id,true),b=rewards(e.id,false);assert.equal(a.xp,e.isBoss?ch.reward.xp:Math.max(1,Math.round(ch.reward.xp*.05)));assert.equal(b.xp,e.isBoss?Math.round(ch.reward.xp*.3):Math.max(1,Math.round(ch.reward.xp*.05*.3)));assert.equal(b.gold+b.gems+b.permAtk+b.permHp+b.permDef,0);}
});
test('strict command schema rejects rewards/winner/stat injection, duplicates/empty shadow IDs',()=>{
 for(const c of [{type:'storyStart',enemyId:'goblin',winner:true},{type:'storyClaim',sessionId:'s',version:0,gold:1e7},{type:'storyArise',sessionId:'s',version:0,shadowIds:[]},{type:'storyArise',sessionId:'s',version:0,shadowIds:['goblin','goblin']}])assert.throws(()=>validate(c));
 validate({type:'storyStart',enemyId:'beru'});
});
