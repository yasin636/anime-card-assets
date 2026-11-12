'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const req=createRequire(require('node:path').resolve('../../services/economy/package.json')),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const {executeCommunity}=require('../../services/economy/community.cjs');let app,db,serial=0;
before(()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');app=initializeApp({projectId:'demo-anime-meta-hub-community'},'community-tests');db=getFirestore(app);});after(async()=>deleteApp(app));
const ref=uid=>db.collection('user_meta').doc(uid),state=async uid=>(await ref(uid).get()).data();
const run=(uid,command,now=100000,operationId=`community_operation_${++serial}_1234567890123456`)=>executeCommunity({db,verifiedUid:uid,command,now,operationId,catalog:async()=>({articles:[{id:'news-1',title:'Anime'}]})});
test('concurrent tracker duplicates, receipt replay and mission interoperability',async()=>{
 const uid='tracker';await ref(uid).set({tracker:[{id:'legacy',title:'Old',episode:3}],missionData:{date:'1970-01-01',progress:{socialActions:8,communityActions:2},claimed:{m_posts:true}}});
 const results=await Promise.allSettled([run(uid,{type:'trackerAdd',title:'New'}),run(uid,{type:'trackerAdd',title:'new'})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 let p=await state(uid);assert.equal(p.tracker.length,2);assert.equal(p.tracker[1].id,'legacy');assert.equal(p.missionData.progress.animeAdded,1);assert.equal(p.missionData.progress.socialActions,8);assert.equal(p.missionData.claimed.m_posts,true);
 const c={type:'trackerEpisode',trackerId:'legacy'},id='community_replay_1234567890';await Promise.all([run(uid,c,100001,id),run(uid,c,100001,id)]);assert.equal((await state(uid)).tracker[1].episode,4);
});
test('concurrent read claim grants once and last daily quota cannot overspend',async()=>{
 const uid='reader';await ref(uid).set({xp:0,last_read_date:'1970-01-01',daily_read_count:4});const {read}=await run(uid,{type:'newsReadStart',articleId:'news-1'}),c={type:'newsReadClaim',sessionId:read.id};
 const results=await Promise.allSettled([run(uid,c,110000),run(uid,c,110000)]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await state(uid)).xp,10);assert.equal((await state(uid)).daily_read_count,5);await assert.rejects(run(uid,{type:'newsReadStart',articleId:'news-1'},120000),e=>e.code==='news-daily-limit');
});
test('concurrent mission claim and overflow fail atomically',async()=>{
 const uid='mission';await ref(uid).set({xp:0,gold:0,gems:0,missionData:{date:'1970-01-01',progress:{newsRead:5},claimed:{}}});const c={type:'communityMissionClaim',missionId:'m_news'};
 const r=await Promise.allSettled([run(uid,c),run(uid,c)]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);const p=await state(uid);assert.equal(p.xp,20);assert.equal(p.gold,70);assert.equal(p.gems,5);
 await ref('overflow').set({xp:Number.MAX_SAFE_INTEGER});const {read}=await run('overflow',{type:'newsReadStart',articleId:'news-1'});await assert.rejects(run('overflow',{type:'newsReadClaim',sessionId:read.id},110000),e=>e.code==='numeric-overflow');assert.equal((await state('overflow')).daily_read_count,undefined);
});
test('direct episode set concurrent replay is isolated to verified owner and preserves rewards/fields',async()=>{
 const uid='direct-tracker',other='other-tracker';await ref(uid).set({xp:20,gold:42,tracker:[{id:'same',title:'One Piece',episode:1096,legacy:true}]});await ref(other).set({tracker:[{id:'same',title:'Other account',episode:3}]});
 const cmd={type:'trackerEpisodeSet',trackerId:'same',episode:1150},id='tracker_direct_same_123456789012';const [a,b]=await Promise.all([run(uid,cmd,100000,id),run(uid,cmd,100000,id)]);assert.deepEqual(a,b);assert.equal(a.xpDelta,0);assert.equal((await state(uid)).tracker[0].episode,1150);assert.equal((await state(uid)).tracker[0].legacy,true);assert.equal((await state(uid)).xp,20);assert.equal((await state(uid)).gold,42);assert.equal((await state(other)).tracker[0].episode,3);
 await assert.rejects(run(uid,{...cmd,episode:0}),e=>e.code==='tracker-episode-invalid');await assert.rejects(run(uid,{...cmd,trackerId:'foreign'}),e=>e.code==='tracker-not-found');
});
