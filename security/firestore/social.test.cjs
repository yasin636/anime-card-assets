'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const req=createRequire(require('node:path').resolve('../../services/economy/package.json')),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const {execute}=require('../../services/economy/transaction.cjs');let app,db;
before(()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');app=initializeApp({projectId:'demo-anime-meta-hub'},'social-tests');db=getFirestore(app);});after(async()=>deleteApp(app));
const ref=uid=>db.collection('user_meta').doc(uid),post=id=>db.collection('feed_posts').doc(id),state=async uid=>(await ref(uid).get()).data();let serial=0;
const run=(uid,command,id=`social_operation_${++serial}_1234567890123456`,verifiedAdmin=false)=>execute({db,verifiedUid:uid,verifiedAdmin,operationId:id,command});
const seed=async(uid,extra={})=>ref(uid).set({uid,username:'ADMIN',avatar:'',xp:100,gold:0,gems:0,email:'private@example.com',inventoryCards:[],...extra});
const create=uid=>run(uid,{type:'feedCreate',caption:'বাংলা anime post',linkUrl:''});
test('Social concurrent create replay is one post/XP/quota; quota enforced transactionally, admin name no bypass',async()=>{
 const uid='social-quota';await seed(uid);const command={type:'feedCreate',caption:'Hello anime',linkUrl:''},op='social_same_create_123456789012345';
 const [a,b]=await Promise.all([run(uid,command,op),run(uid,command,op)]);assert.deepEqual(a,b);assert.equal((await state(uid)).xp,115);assert.equal(a.post.isAdmin,false);
 const day=new Date().toISOString().slice(0,10);await db.collection('post_activity').doc(uid).set({day_key:day,count:9});
 const both=await Promise.allSettled([create(uid),create(uid)]);assert.equal(both.filter(r=>r.status==='fulfilled').length,1);assert.equal(both.find(r=>r.status==='rejected').reason.code,'social-daily-limit');
 await assert.rejects(run(uid,{...command,caption:'Different'},op),e=>e.code==='operation-id-conflict');
 await run(uid,{type:'feedDelete',postId:a.postId});assert.equal((await db.collection('post_activity').doc(uid).get()).data().count,10);
 await assert.rejects(create(uid),e=>e.code==='social-daily-limit');const admin=await run(uid,command,undefined,true);assert.equal(admin.post.isAdmin,true);
});
test('Social like/comment/react/share exact deltas, ownership, creator keep, self rules and floor zero',async()=>{
 const owner='social-author',actor='social-reader';await seed(owner);await seed(actor);const {postId}=await create(owner);
 const like={type:'feedLike',postId,liked:true},op='social_same_like_123456789012345';const [a,b]=await Promise.all([run(actor,like,op),run(actor,like,op)]);assert.deepEqual(a,b);assert.equal(a.xpDelta,5);assert.equal(a.creatorXpDelta,1);
 assert.equal((await run(actor,like)).xpDelta,0);assert.equal((await state(owner)).xp,116);
 assert.equal((await run(actor,{...like,liked:false})).xpDelta,-5);assert.equal((await state(owner)).xp,116);
 assert.equal((await run(actor,like)).creatorXpDelta,1); // Preserve explicit source re-like rule.
 const comment=await run(actor,{type:'feedComment',postId,text:'দারুণ!'});const cid=comment.post.comments.at(-1).id;assert.equal(comment.xpDelta,10);assert.equal(comment.creatorXpDelta,3);
 await assert.rejects(run(owner,{type:'feedCommentEdit',postId,commentId:cid,text:'tamper'}),e=>e.code==='social-not-owner');
 assert.equal((await run(actor,{type:'feedCommentEdit',postId,commentId:cid,text:'এডিট'})).xpDelta,0);
 const react=await run(actor,{type:'feedReact',postId,emoji:'❤️'});assert.equal(react.xpDelta,0);assert.equal(react.post.reaction,'❤️');
 const changed=await run(actor,{type:'feedReact',postId,emoji:'🔥'});assert.equal(changed.post.reactions['❤️'],0);assert.equal(changed.post.reactions['🔥'],1);assert.equal(changed.post.liked,true);
 assert.equal((await run(actor,{type:'feedReact',postId,emoji:'🔥'})).post.reaction,'');
 const share=await run(actor,{type:'feedShare',postId});assert.equal(share.xpDelta,5);assert.equal(share.creatorXpDelta,5);
 assert.equal((await run(owner,{type:'feedLike',postId,liked:true})).xpDelta,0);assert.equal((await run(owner,{type:'feedComment',postId,text:'নিজের comment'})).xpDelta,10);assert.equal((await run(owner,{type:'feedShare',postId})).xpDelta,5);
 await ref(actor).update({xp:2});assert.equal((await run(actor,{type:'feedCommentDelete',postId,commentId:cid})).xpDelta,-2);
 await assert.rejects(run(actor,{type:'feedDelete',postId}),e=>e.code==='social-not-owner');
 const ownerBefore=(await state(owner)).xp;await run(owner,{type:'feedDelete',postId});assert.equal((await state(owner)).xp,ownerBefore-15);assert.equal((await post(postId).get()).exists,false);
});
test('Social mission claim once/date, actual action progress, failure rolls back post/XP/receipt',async()=>{
 const uid='social-mission';await seed(uid);await create(uid);const two=await create(uid);assert.equal(two.missionData.progress.postsCreated,2);
 const cmd={type:'socialMissionClaim',missionId:'m_posts'},op='social_mission_same_123456789012345';const [a,b]=await Promise.all([run(uid,cmd,op),run(uid,cmd,op)]);assert.deepEqual(a,b);assert.equal((await state(uid)).gold,50);assert.equal((await state(uid)).gems,5);
 await assert.rejects(run(uid,cmd),e=>e.code==='social-mission-claimed');await assert.rejects(run(uid,{type:'socialMissionClaim',missionId:'m_social'}),e=>e.code==='social-mission-incomplete');
 for(let i=0;i<10;i++)await run(uid,{type:'feedComment',postId:two.postId,text:`comment ${i}`});assert.equal((await state(uid)).missionData.progress.socialActions,10);await run(uid,{type:'socialMissionClaim',missionId:'m_social'});assert.equal((await state(uid)).gold,100);
 const before=await state(uid),opid='social_failure_rollback_123456789012';const failing={collection:db.collection.bind(db),runTransaction:fn=>db.runTransaction(async tx=>{await fn(tx);throw Error('injected-before-commit');})};
 await assert.rejects(execute({db:failing,verifiedUid:uid,operationId:opid,command:{type:'feedCreate',caption:'must rollback',linkUrl:''}}),/injected-before-commit/);assert.deepEqual(await state(uid),before);assert.equal((await ref(uid).collection('economy_receipts').doc(opid).get()).exists,false);
});
test('Social preserves legacy fields/timestamps, filtered read projection and hidden posts cannot earn XP',async()=>{
 const uid='social-legacy';await seed(uid);const id='social_legacy_post',old=Date.now()-8*86400000;await post(id).set({uid,username:'Legacy',text:'old text',created_at_ms:old,created_at:new Date(old),comments:[],legacyUnknown:'KEEP',mediaUrl:'',isAdmin:false});
 await assert.rejects(run(uid,{type:'feedPostView',postId:id}),e=>e.code==='social-post-unavailable');await assert.rejects(run(uid,{type:'feedLike',postId:id,liked:true}),e=>e.code==='social-post-unavailable');
 await post(id).update({created_at_ms:Date.now()});const result=await run(uid,{type:'feedEdit',postId:id,caption:'নতুন caption'});assert.equal(result.xpDelta,0);const stored=(await post(id).get()).data();assert.equal(stored.legacyUnknown,'KEEP');assert.equal(typeof stored.created_at.toMillis,'function');
 const view=await run(uid,{type:'feedPostView',postId:id});assert.equal(view.posts[0].caption,'নতুন caption');assert(!JSON.stringify(view).includes('private@example.com'));
});
