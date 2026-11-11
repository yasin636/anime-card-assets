'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const adminRequire=createRequire(require('node:path').resolve('../../services/economy/package.json'));
const {initializeApp,deleteApp}=adminRequire('firebase-admin/app'),{getFirestore}=adminRequire('firebase-admin/firestore');
const {execute}=require('../../services/economy/transaction.cjs'),{cards}=require('../../services/economy/domain.cjs');
let app,db;
before(()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');app=initializeApp({projectId:'demo-anime-meta-hub-arena'},'arena-tests');db=getFirestore(app);});
after(async()=>deleteApp(app));
const ref=uid=>db.collection('user_meta').doc(uid),state=async uid=>(await ref(uid).get()).data();
async function seed(uid,extra={}){await ref(uid).set({username:'Hunter',email:'PRIVATE@example.com',xp:100,gold:5000,gems:0,freeSpins:0,inventoryCards:cards.slice(0,3).map((c,i)=>({...c,instanceId:`card_${i}`})),...extra});}
let requestAI;
const run=(uid,id,command)=>execute({db,verifiedUid:uid,operationId:id,command,ai:requestAI});
test('wheel concurrent same-ID replay charges fee/reward exactly once',async()=>{
 const uid='arena-wheel';await seed(uid);const id='wheel_request_123456789012345';const [a,b]=await Promise.all([run(uid,id,{type:'wheelSpin'}),run(uid,id,{type:'wheelSpin'})]);assert.deepEqual(a,b);assert.equal((await state(uid)).xp,100+a.xpDelta);assert.equal((await state(uid)).gold,5000);
});
test('battle fee, same-ID start/turn retry and completion reward atomic, inventory preserved',async()=>{
 const uid='arena-battle';await seed(uid);const initial=await state(uid),c={type:'battleStart',instanceIds:['card_0','card_1','card_2']},id='battle_start_123456789012345';
 let r=await run(uid,id,c);assert.deepEqual(await run(uid,id,c),r);assert.equal((await state(uid)).gold,4600);
 const battleId=r.battle.id;
 for(let i=0;i<3&&r.battle.status==='active';i++){const op=`battle_turn_${i}_123456789012345`,cmd={type:'battleTurn',battleId,instanceId:`card_${i}`};r=await run(uid,op,cmd);assert.deepEqual(await run(uid,op,cmd),r);}
 assert.equal(r.battle.status,'finished');const s=await state(uid),win=r.battle.outcome==='win';assert.equal(s.gold,4600+(win?800:200));assert.equal(s.xp,100+(win?30:10));assert.deepEqual(s.inventoryCards,initial.inventoryCards);assert.equal(s.activeBattleId,'');
 await assert.rejects(run(uid,'battle_forged_reward_1234567890',{type:'battleTurn',battleId,instanceId:'card_0'}),e=>e.code==='battle-not-active');
});
test('battle ownership and forfeit without refund/reward; resume returns active only',async()=>{
 const uid='arena-leave';await seed(uid);
 await assert.rejects(run(uid,'battle_bad_owner_1234567890',{type:'battleStart',instanceIds:['fake','card_1','card_2']}),e=>e.code==='instance-not-unique-or-owned');
 const r=await run(uid,'battle_valid_start_1234567890',{type:'battleStart',instanceIds:['card_0','card_1','card_2']});
 const view=await run(uid,'battle_resume_123456789012345',{type:'arenaView'});assert.equal(view.battle.id,r.battle.id);assert.equal(view.leaderboard.some(row=>'email' in row),false);
 await run(uid,'battle_forfeit_123456789012345',{type:'battleForfeit',battleId:r.battle.id});assert.equal((await state(uid)).gold,4600);assert.equal((await state(uid)).xp,100);
});
test('weekly rank server query, same-week concurrent claim once, no client rank accepted',async()=>{
 const uid='arena-weekly';await seed(uid,{xp:900000000});
 const results=await Promise.allSettled([run(uid,'weekly_claim_a_123456789012345',{type:'weeklyClaim'}),run(uid,'weekly_claim_b_123456789012345',{type:'weeklyClaim'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1,JSON.stringify(results.map(r=>({status:r.status,code:r.reason?.code,message:r.reason?.message}))));assert.equal(results.find(r=>r.status==='rejected').reason.code,'weekly-already-claimed');
 const s=await state(uid);assert.equal(s.gold,5500);assert.equal(s.xp,900000050);assert.equal(s.gems,30);
 await assert.rejects(run(uid,'weekly_fake_rank_123456789012345',{type:'weeklyClaim',rank:1}),e=>e.code==='invalid-command');
 const publicView=await run(uid,'public_profile_123456789012345',{type:'publicProfile',uid});assert.equal('email' in publicView.publicProfile,false);assert.equal('gold' in publicView.publicProfile,false);
});
test('trusted quiz generation/judgment never exposes answer early; reward per question/finish once',async()=>{
 const uid='arena-quiz';await seed(uid);const original=global.fetch;requestAI={key:'emulator-only-not-a-real-key',model:'gemini-2.5-flash'};let judgments=0;
 global.fetch=async(_,opts)=>{assert.equal(opts.headers['x-goog-api-key'],requestAI.key);const prompt=JSON.parse(opts.body).contents[0].parts[0].text;
 const payload=prompt.startsWith('Generate')?Array.from({length:5},(_,i)=>({question:`Question${i}`,answer:`Answer${i}`,hint:'Hint'})):{correct:++judgments<=5,explanation:'Correct'};
 return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(payload)}]}}]})};};
 try{
 const start=await run(uid,'quiz_start_123456789012345',{type:'quizStart',title:'Naruto'});assert(!JSON.stringify(start).includes('Answer0'));const quizId=start.quiz.id;
 for(let i=0;i<5;i++){const id=`quiz_answer_${i}_123456789012345`,command={type:'quizAnswer',quizId,questionIndex:i,answer:`Answer${i}`,skip:false};const r=await run(uid,id,command);assert.deepEqual(await run(uid,id,command),r);assert.equal(r.feedback.correct,true);}
 const s=await state(uid);assert.equal(s.xp,150);assert.equal(s.gems,10);assert.equal(s.activeQuizId,'');assert.equal(s.missionData.progress.communityActions,1);
 await assert.rejects(run(uid,'quiz_extra_reward_1234567890',{type:'quizAnswer',quizId,questionIndex:4,answer:'Answer4',skip:false}),e=>e.code==='quiz-ended');
 }finally{global.fetch=original;requestAI=undefined;}
});
test('missing server quiz credential fails closed without charging or exposing phone keys',async()=>{
 const uid='arena-no-key';await seed(uid);requestAI=undefined;await assert.rejects(run(uid,'quiz_missing_key_123456789012345',{type:'quizStart',title:'Naruto'}),e=>e.code==='quiz-provider-key-required');assert.equal((await state(uid)).xp,100);
});
test('quiz4correct reward, wrong XP floor, stale answer rejection and close without gems',async()=>{
 const uid='arena-quiz-four';await seed(uid,{xp:0});const original=global.fetch;requestAI={key:'emulator-only-not-a-real-key',model:'gemini-2.5-flash'};let count=0;
 global.fetch=async(_,opts)=>{const prompt=JSON.parse(opts.body).contents[0].parts[0].text;const value=prompt.startsWith('Generate')?Array.from({length:5},()=>({question:'Name?',answer:'Naruto Uzumaki',hint:'Ninja'})):{correct:++count>1,explanation:'Verdict'};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(value)}]}}]})};};
 try{
 const start=await run(uid,'quiz_four_start_123456789012345',{type:'quizStart',title:'Naruto'}),quizId=start.quiz.id;
 for(let i=0;i<5;i++){await run(uid,`quiz_four_answer_${i}_1234567890`,{type:'quizAnswer',quizId,questionIndex:i,answer:'Naruto',skip:false});if(i===0){assert.equal((await state(uid)).xp,0);await assert.rejects(run(uid,'quiz_stale_answer_1234567890123',{type:'quizAnswer',quizId,questionIndex:0,answer:'Naruto',skip:false}),e=>e.code==='quiz-question-changed');}}
 assert.equal((await state(uid)).gems,5);assert.equal((await state(uid)).xp,40);
 const next=await run(uid,'quiz_close_start_123456789012345',{type:'quizStart',title:'Naruto'});
 await run(uid,'quiz_skip_123456789012345',{type:'quizAnswer',quizId:next.quiz.id,questionIndex:0,answer:'',skip:true});assert.equal((await state(uid)).xp,25);
 await run(uid,'quiz_close_123456789012345',{type:'quizClose',quizId:next.quiz.id});assert.equal((await state(uid)).gems,5);assert.equal((await state(uid)).xp,25);assert.equal((await state(uid)).activeQuizId,'');
 }finally{global.fetch=original;requestAI=undefined;}
});
test('public profile shows only selected six slots, not full inventory or private session data',async()=>{
 const uid='arena-showcase';await seed(uid,{Bio:'Public bio',avatar:'https://example.com/avatar.png',equippedTheme:'naruto',equippedSlots:{'rare-1':{id:'deku',instanceId:'private-instance',hp:100,atk:200,def:300,privateSecret:'DO-NOT-RETURN'},'admin':{id:'gojo'}},privateNotes:'DO-NOT-RETURN'});
 const r=await run(uid,'showcase_profile_123456789012345',{type:'publicProfile',uid});const p=r.publicProfile;
 assert.equal(p.Bio,'Public bio');assert.equal(p.avatar,'https://example.com/avatar.png');assert.equal(p.equippedTheme,'naruto');assert.deepEqual(Object.keys(p.featuredSlots),['rare-1']);assert.equal(p.featuredSlots['rare-1'].name,'Izuku Midoriya');assert.equal(p.featuredSlots['rare-1'].atk,200);
 for(const forbidden of ['email','gold','gems','inventoryCards','activeBattleId','privateNotes'])assert.equal(forbidden in p,false);
 assert.equal(JSON.stringify(p).includes('private-instance'),false);assert.equal(JSON.stringify(p).includes('DO-NOT-RETURN'),false);
 const board=await run(uid,'standings_only_123456789012345',{type:'leaderboardView'});assert(Array.isArray(board.leaderboard));assert.equal('battle' in board,false);assert.equal('quiz' in board,false);assert.equal(JSON.stringify(board).includes('DO-NOT-RETURN'),false);
});
test('HTTP per-request provider is authenticated, transient, never persisted, replay works after key removal',async()=>{
 const uid='arena-shared-provider';await seed(uid);const {createServer}=require('../../services/economy/http.cjs');
 const server=createServer({enabled:false,testUids:[uid],auth:{verifyIdToken:async(token,revoked)=>{assert.equal(revoked,true);if(token!=='owner-token')throw Error('reject');return {uid};}},db});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`,original=global.fetch,key='transient-http-test-key';let calls=0;
 global.fetch=async(url,opts)=>{if(String(url).startsWith('https://generativelanguage.googleapis.com/')){calls++;assert.equal(opts.headers['x-goog-api-key'],key);assert(String(url).includes('/gemini-2.5-flash-lite:'));assert(!opts.body.includes(key));return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(Array.from({length:5},(_,i)=>({question:`Q${i}`,answer:`A${i}`,hint:'Hint'})))}]}}]})};}return original(url,opts);};
 const operation={operationId:'http_shared_quiz_1234567890',command:{type:'quizStart',title:'Naruto'}},headers={'Content-Type':'application/json',Authorization:'Bearer owner-token','x-amh-ai-key':key,'x-amh-ai-model':'gemini-2.5-flash-lite'};
 try{
 let r=await original(base+'/v1/economy',{method:'POST',headers:{...headers,Authorization:'Bearer bad'},body:JSON.stringify(operation)});assert.equal(r.status,401);assert.equal(calls,0);
 r=await original(base+'/v1/economy',{method:'POST',headers,body:JSON.stringify(operation)});assert.equal(r.status,200);const saved=await r.json();assert(!JSON.stringify(saved).includes(key));assert.equal(calls,1);
 const replay=await original(base+'/v1/economy',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer owner-token'},body:JSON.stringify(operation)});assert.equal(replay.status,200);assert.deepEqual(await replay.json(),saved);assert.equal(calls,1);
 const docs=[(await state(uid)),...(await ref(uid).collection('arena_sessions').get()).docs.map(d=>d.data()),...(await ref(uid).collection('economy_receipts').get()).docs.map(d=>d.data())];assert(!JSON.stringify(docs).includes(key));assert(!JSON.stringify(docs).includes('x-amh-ai'));
 }finally{global.fetch=original;await new Promise(resolve=>server.close(resolve));}
});

test('Story API entry/start/resume ownership/no fee, authoritative phases and strict payload',async()=>{
 const uid='story-entry';await seed(uid,{xp:99});
 await assert.rejects(run(uid,'story_entry_denied_123456789',{type:'storyStart',enemyId:'beru'}),e=>e.code==='story-entry-requirement');
 await ref(uid).update({xp:100});const before=await state(uid),id='story_start_same_123456789012';
 const [a,b]=await Promise.all([run(uid,id,{type:'storyStart',enemyId:'beru'}),run(uid,id,{type:'storyStart',enemyId:'beru'})]);assert.deepEqual(a,b);assert.equal((await state(uid)).gold,before.gold);assert.deepEqual((await state(uid)).inventoryCards,before.inventoryCards);
 const s=a.story;assert.equal(s.chapterId,5);assert.equal(s.phase,'coin');
 const view=await run(uid,'story_resume_view_1234567890',{type:'storyView'});assert.equal(view.story.id,s.id);assert.equal(view.storyCapability,'story-v1');assert.equal(view.storyEligible,true);
 await assert.rejects(run(uid,'story_extra_start_1234567890',{type:'storyStart',enemyId:'goblin'}),e=>e.code==='story-already-active');
 await assert.rejects(run(uid,'story_early_attack_1234567890',{type:'storyAction',sessionId:s.id,version:s.version,action:'strike'}),e=>e.code==='story-invalid-phase');
 await seed('story-other');await assert.rejects(run('story-other','story_cross_owner_1234567890',{type:'storyForfeit',sessionId:s.id,version:0}),e=>e.code==='story-not-active');
 await assert.rejects(run(uid,'story_forge_reward_1234567890',{type:'storyClaim',sessionId:s.id,version:0,gold:900000}),e=>e.code==='invalid-command');
 const out=await run(uid,'story_forfeit_saved_1234567890',{type:'storyForfeit',sessionId:s.id,version:0});assert.equal(out.story.phase,'forfeited');assert.equal((await state(uid)).activeStoryId,'');assert.equal((await state(uid)).xp,100);
});
test('Story ARISE concurrent once/fight, stale rejection, original stats, receipt replay and reset',async()=>{
 const uid='story-arise';await seed(uid);const shadow={id:'goblin',name:'Goblin Scout',hp:170,atk:350,def:310};await ref(uid).collection('shadows').doc('goblin').set(shadow);
 let s=(await run(uid,'story_arise_start_12345678901',{type:'storyStart',enemyId:'baran'})).story;
 // Fixture skips cosmetic phase; pure tests cover coin/dialogue timing independently.
 await ref(uid).collection('story_sessions').doc(s.id).update({phase:'fight'});s.phase='fight';
 const command={type:'storyArise',sessionId:s.id,version:s.version,shadowIds:['goblin']},op='story_arise_same_12345678901';
 const both=await Promise.all([run(uid,op,command),run(uid,op,command)]);assert.deepEqual(both[0],both[1]);let after=both[0].story;
 assert.equal(after.player.atk,s.player.atk+175);assert.equal(after.player.hp,s.player.hp+85);assert.equal(after.turn,s.turn);
 await assert.rejects(run(uid,'story_arise_stale_1234567890',command),e=>e.code==='story-version-changed');
 await assert.rejects(run(uid,'story_arise_again_1234567890',{...command,version:after.version}),e=>e.code==='arise-already-used');
 await run(uid,'story_arise_exit_12345678901',{type:'storyForfeit',sessionId:s.id,version:after.version});
 s=(await run(uid,'story_arise_restart_1234567890',{type:'storyStart',enemyId:'baran'})).story;assert.equal(s.ariseUsed,false);assert.deepEqual(s.shadowIds,[]);assert.deepEqual(s.ariseBonus,{hp:0,atk:0,def:0});
});
test('Story victory captures unique shadow before atomic claim; concurrent claim once, first/repeat rewards preserved',async()=>{
 const uid='story-reward';await seed(uid,{flatBonusAtk:1000000000,legacyUnknown:'keep'});let counter=0;
 async function win(){let s=(await run(uid,`story_win_start_${++counter}_1234567890`,{type:'storyStart',enemyId:'kasaka'})).story;await ref(uid).collection('story_sessions').doc(s.id).update({phase:'fight',first:'player'});s.phase='fight';
  for(let i=0;i<30&&!s.outcome;i++){
   s=(await run(uid,`story_win_hit_${++counter}_1234567890`,{type:'storyAction',sessionId:s.id,version:s.version,action:'strike'})).story;
   if(s.phase==='enemy'){await ref(uid).collection('story_sessions').doc(s.id).update({notBefore:0});s=(await run(uid,`story_win_enemy_${++counter}_1234567890`,{type:'storyAdvance',sessionId:s.id,version:s.version})).story;}
  }
  assert.equal(s.outcome,'win');assert.equal(s.phase,'dialogue');assert.equal((await ref(uid).collection('shadows').doc('kasaka').get()).exists,true);
  await assert.rejects(run(uid,`story_claim_early_${++counter}_1234567890`,{type:'storyClaim',sessionId:s.id,version:s.version}),e=>e.code==='story-not-victory');
  while(s.phase==='dialogue')s=(await run(uid,`story_dialogue_${++counter}_1234567890`,{type:'storyAdvance',sessionId:s.id,version:s.version})).story;
  assert.equal(s.phase,'victory');return s;
 }
 const before=await state(uid);let s=await win();assert.equal((await state(uid)).xp,before.xp);assert.equal((await ref(uid).collection('story_clears').doc('kasaka').get()).exists,false);
 const failureId='story_reward_failure_1234567890';
 const failingDb={collection:db.collection.bind(db),runTransaction:fn=>db.runTransaction(async tx=>{await fn(tx);throw Error('injected-before-commit');})};
 await assert.rejects(execute({db:failingDb,verifiedUid:uid,operationId:failureId,command:{type:'storyClaim',sessionId:s.id,version:s.version}}),/injected-before-commit/);
 assert.equal((await ref(uid).collection('story_clears').doc('kasaka').get()).exists,false);assert.equal((await state(uid)).xp,before.xp);assert.equal((await ref(uid).collection('economy_receipts').doc(failureId).get()).exists,false);
 const command={type:'storyClaim',sessionId:s.id,version:s.version},op='story_reward_same_1234567890';const both=await Promise.all([run(uid,op,command),run(uid,op,command)]);assert.deepEqual(both[0],both[1]);assert.equal(both[0].firstClear,true);
 let p=await state(uid);assert.equal(p.xp,before.xp+100);assert.equal(p.gold,before.gold+300);assert.equal(p.gems,before.gems+10);assert.equal(p.permBonusAtk,5);assert.equal(p.permBonusHp,5);assert.equal(p.permBonusDef,3);assert.equal(p.dungeonConqueror,true);assert.equal(p.legacyUnknown,'keep');assert.deepEqual(p.inventoryCards,before.inventoryCards);
 await assert.rejects(run(uid,'story_reward_extra_1234567890',command),e=>e.code==='story-not-active');
 s=await win();const claims=await Promise.allSettled([run(uid,'story_reward_repeat_a_123456789',{type:'storyClaim',sessionId:s.id,version:s.version}),run(uid,'story_reward_repeat_b_123456789',{type:'storyClaim',sessionId:s.id,version:s.version})]);assert.equal(claims.filter(r=>r.status==='fulfilled').length,1);assert.equal(claims.find(r=>r.status==='fulfilled').value.firstClear,false);
 p=await state(uid);assert.equal(p.xp,before.xp+130);assert.equal(p.gold,before.gold+300);assert.equal(p.gems,before.gems+10);assert.equal(p.permBonusAtk,5);assert.equal((await ref(uid).collection('shadows').get()).size,1);assert.equal(p.activeStoryId,'');
});
