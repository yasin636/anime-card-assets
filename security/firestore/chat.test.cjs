'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const req=createRequire(require('node:path').resolve('../../services/economy/package.json')),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const {execute}=require('../../services/economy/transaction.cjs'),{chatId}=require('../../services/economy/chat.cjs');let app,db,serial=0;
before(()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');app=initializeApp({projectId:'demo-anime-meta-hub-chat'},'chat-tests');db=getFirestore(app);});after(async()=>deleteApp(app));
const ref=uid=>db.collection('user_meta').doc(uid),parent=(a,b)=>db.collection('direct_chats').doc(chatId(a,b));
const seed=(uid,extra={})=>ref(uid).set({uid,username:uid,avatar:'',xp:100,gold:0,gems:0,recentChats:[],email:'PRIVATE@example.com',inventoryCards:['private'],...extra});
const run=(uid,command,operationId=`chat_operation_${++serial}_123456789012345`)=>execute({db,verifiedUid:uid,operationId,command});
const state=async uid=>(await ref(uid).get()).data();
test('DM send concurrent receipt replay sends once, exact unread and read/send race, no XP changes',async()=>{
 const a='chat-alice',b='chat-bob';await seed(a);await seed(b);const c={type:'chatSend',peerId:b,text:'হ্যালো Bob'},id='chat_same_send_123456789012345';
 const [one,two]=await Promise.all([run(a,c,id),run(a,c,id)]);assert.deepEqual(one,two);assert.equal((await parent(a,b).collection('messages').get()).size,1);assert.equal((await parent(a,b).get()).data()[`unread_${b}`],1);assert.equal((await state(a)).xp,100);
 await assert.rejects(run(a,{...c,text:'other'},id),e=>e.code==='operation-id-conflict');
 await Promise.all([run(b,{type:'chatThread',peerId:a,before:''}),run(a,{...c,text:'দ্বিতীয়'})]);
 const p=(await parent(a,b).get()).data(),count=p[`unread_${b}`];assert(count===0||count===1);const latest=await run(b,{type:'chatThread',peerId:a,before:''});assert.equal(latest.messages.length,2);assert.equal((await parent(a,b).get()).data()[`unread_${b}`],0);
 assert(!JSON.stringify(latest).includes('PRIVATE'));assert(!('readThrough_chat-bob'in latest));
 const inbox=await run(b,{type:'chatInbox'});assert.equal(inbox.inbox.length,1);assert.equal(inbox.inbox[0].peer.uid,a);assert.equal(inbox.totalUnread,0);
});
test('DM ownership, parent membership/collision, delete unread and last preview, recent hide keeps messages',async()=>{
 const a='chat-delete-a',b='chat-delete-b',x='chat-outsider';await seed(a);await seed(b);await seed(x);const sent=await run(a,{type:'chatSend',peerId:b,text:'private text'});
 await assert.rejects(run(b,{type:'chatDelete',peerId:a,messageId:sent.message.id}),e=>e.code==='chat-not-owner');assert.equal((await run(x,{type:'chatInbox'})).inbox.length,0);
 const d=await run(a,{type:'chatDelete',peerId:b,messageId:sent.message.id});assert.equal(d.deletedId,sent.message.id);const p=(await parent(a,b).get()).data();assert.equal(p[`unread_${b}`],0);assert.equal(p.lastText,'');
 await run(a,{type:'chatSend',peerId:b,text:'keep this'});await run(a,{type:'chatRecentRemove',peerId:b});assert.equal((await state(a)).recentChats.includes(b),false);assert.equal((await parent(a,b).collection('messages').get()).size,1);
 const collision=parent(a,x);await collision.set({participants:[b,x]});await assert.rejects(run(a,{type:'chatThread',peerId:x,before:''}),e=>e.code==='chat-not-participant');
 const orphanPeer='chat-orphan';await seed(orphanPeer);await parent(a,orphanPeer).collection('messages').doc('orphan').set({senderId:x,text:'must not leak',createdAtMs:1});await assert.rejects(run(a,{type:'chatThread',peerId:orphanPeer,before:''}),e=>e.code==='chat-not-participant');await assert.rejects(run(a,{type:'chatSend',peerId:orphanPeer,text:'claim orphan'}),e=>e.code==='chat-not-participant');
});
test('Newest-first DM paging repairs oldest-window bug without losing timestamp ties or legacy fields',async()=>{
 const a='chat-page-a',b='chat-page-b';await seed(a);await seed(b);const par=parent(a,b);await par.set({participants:[a,b],updatedAtMs:1});const batch=db.batch();for(let i=0;i<110;i++)batch.set(par.collection('messages').doc(`legacy_${String(i).padStart(3,'0')}`),{senderId:b,senderName:'Legacy',text:`text${i}`,createdAtMs:1000,createdAt:new Date(1000),legacy:'keep'});await batch.commit();
 let before='',ids=[];for(let n=0;n<3;n++){const r=await run(a,{type:'chatThread',peerId:b,before});assert.equal(r.messages[0].id,n===0?'legacy_060':n===1?'legacy_010':'legacy_000');ids.push(...r.messages.map(m=>m.id));before=r.nextCursor;if(n===2)assert.equal(r.hasMore,false);}
 assert.equal(ids.length,110);assert.equal(new Set(ids).size,110);assert.equal((await par.collection('messages').doc('legacy_000').get()).data().legacy,'keep');
});
test('Global send/retry has no XP, combined community mission caps/claims once, multi-emoji independent',async()=>{
 const a='chat-global-a',b='chat-global-b';await seed(a);await seed(b);const command={type:'chatGlobalSend',text:'আড্ডা'},op='chat_global_same_123456789012345';const [r,s]=await Promise.all([run(a,command,op),run(a,command,op)]);assert.deepEqual(r,s);assert.equal((await state(a)).missionData.progress.communityActions,1);assert.equal((await state(a)).xp,100);
 await Promise.all([run(a,{...command,text:'two'}),run(a,{...command,text:'three'})]);assert.equal((await state(a)).missionData.progress.communityActions,3);
 let reacted=await run(b,{type:'chatGlobalReact',messageId:r.message.id,emoji:'❤️'});reacted=await run(b,{type:'chatGlobalReact',messageId:r.message.id,emoji:'🔥'});assert.deepEqual(reacted.message.selected,['❤️','🔥']);reacted=await run(b,{type:'chatGlobalReact',messageId:r.message.id,emoji:'❤️'});assert.deepEqual(reacted.message.selected,['🔥']);
 await assert.rejects(run(b,{type:'chatGlobalDelete',messageId:r.message.id}),e=>e.code==='chat-not-owner');await run(a,{type:'chatGlobalDelete',messageId:r.message.id});assert.equal((await state(a)).missionData.progress.communityActions,3);
 const claims=await Promise.allSettled([run(a,{type:'chatMissionClaim'}),run(a,{type:'chatMissionClaim'})]);assert.equal(claims.filter(r=>r.status==='fulfilled').length,1);const p=await state(a);assert.equal(p.xp,140);assert.equal(p.gold,250);assert.equal(p.gems,10);await assert.rejects(run(b,{type:'chatMissionClaim'}),e=>e.code==='chat-mission-incomplete');
});
test('Presence sequence/lease prevents stale cleanup and search is case-insensitive with privacy projection',async()=>{
 const a='chat-presence',b='chat-search-other';await seed(a);await seed(b,{username:'AniME Hunter'});
 await run(a,{type:'chatPresence',online:true,sessionId:'device-a',sequence:1});await run(a,{type:'chatPresence',online:false,sessionId:'device-a',sequence:3});await run(a,{type:'chatPresence',online:true,sessionId:'device-a',sequence:2});assert.equal((await state(a)).online,false);
 await run(a,{type:'chatPresence',online:true,sessionId:'device-b',sequence:1});await run(a,{type:'chatPresence',online:false,sessionId:'device-a',sequence:4});assert.equal((await state(a)).online,true);
 const search=await run(a,{type:'chatSearch',query:'anime',cursor:''});assert(search.users.some(u=>u.uid===b));assert(!search.users.some(u=>u.uid===a));assert(!JSON.stringify(search).includes('PRIVATE'));assert(!('gold'in search.users[0]));
});
test('Injected commit failure leaves no DM, unread, mission or receipt side effects',async()=>{
 const a='chat-rollback-a',b='chat-rollback-b';await seed(a);await seed(b);const operationId='chat_rollback_1234567890123456',failing={collection:db.collection.bind(db),runTransaction:fn=>db.runTransaction(async tx=>{await fn(tx);throw Error('injected-before-commit');})};
 await assert.rejects(execute({db:failing,verifiedUid:a,operationId,command:{type:'chatSend',peerId:b,text:'rollback'}}),/injected-before-commit/);assert.equal((await parent(a,b).get()).exists,false);assert.equal((await ref(a).collection('economy_receipts').doc(operationId).get()).exists,false);assert.deepEqual((await state(b)).recentChats,[]);
});

test('Global sender presence is bounded public projection with real heartbeat expiry',async()=>{
 const a='global-presence-sender',b='global-presence-reader';await seed(a,{online:true,lastSeenMs:Date.now(),email:'DO_NOT_EXPOSE',inventoryCards:['SECRET_CARD']});await seed(b);
 await run(a,{type:'chatGlobalSend',text:'Presence sample'});
 const read=await run(b,{type:'chatGlobal',before:''});const sender=read.users.find(u=>u.uid===a);assert(sender);assert.equal(sender.online,true);assert(!('email'in sender));assert(!('inventoryCards'in sender));assert(read.users.length<=50);
 await ref(a).update({lastSeenMs:Date.now()-71000});const expired=await run(b,{type:'chatGlobal',before:''});assert.equal(expired.users.find(u=>u.uid===a).online,false);
});

test('post sharing verifies visibility/deletion; replay creates one DM without draft or XP forgery',async()=>{
 const a='share-owner',b='share-recipient';await seed(a);await seed(b);const post=db.collection('feed_posts').doc('share-post');await post.set({uid:a,caption:'real',created_at_ms:Date.now(),isAdmin:false});
 const c={type:'chatPostSend',peerId:b,postId:post.id},op='post_share_replay_123456789012345';const x=await run(a,c,op),y=await run(a,c,op);assert.deepEqual(x,y);assert.equal(x.message.postId,post.id);assert.equal(x.message.text,`animemetahub://post/${post.id}`);assert.equal((await state(a)).xp,100);
 await post.delete();await assert.rejects(run(a,{...c}),e=>e.code==='social-post-unavailable');await post.set({uid:a,created_at_ms:Date.now()-8*86400000});await assert.rejects(run(a,{type:'chatGlobalPostSend',postId:post.id}),e=>e.code==='social-post-unavailable');
});
test('private photo is single-use, participant-only, expiring, deleted message cannot renew access',async()=>{
 const a='photo-owner',b='photo-recipient',stranger='photo-stranger';await seed(a);await seed(b);await seed(stranger);const uploadId='img_'+'a'.repeat(40),publicId='animemetahub/'+'b'.repeat(32)+'/'+uploadId;
 process.env.CLOUDINARY_CLOUD_NAME='emulator';process.env.CLOUDINARY_API_KEY='12345';process.env.CLOUDINARY_API_SECRET='emulator-not-a-real-secret';
 await ref(a).collection('media_uploads').doc(uploadId).set({id:uploadId,uid:a,purpose:'chat',status:'ready',publicId,expiresAt:Date.now()+3600000,asset:{format:'jpg',url:'https://unused/authenticated'}});
 const c={type:'chatImageSend',peerId:b,text:'',mediaId:uploadId},op='photo_send_same_123456789012345';const x=await run(a,c,op),y=await run(a,c,op);assert.deepEqual(x,y);assert(!JSON.stringify(x).includes('https://unused'));assert.equal((await state(a)).xp,100);await assert.rejects(run(a,c),e=>e.code==='media-upload-not-ready');
 const r=await run(b,{type:'chatImage',peerId:a,messageId:x.message.id});assert(r.expiresAt>Date.now());assert(r.expiresAt<=Date.now()+60000);assert(r.imageUrl.includes('signature='));assert(r.imageUrl.includes('type=authenticated'));await assert.rejects(run(stranger,{type:'chatImage',peerId:a,messageId:x.message.id}),e=>e.code==='chat-not-participant');
 await assert.rejects(run(b,{type:'chatDelete',peerId:a,messageId:x.message.id}),e=>e.code==='chat-not-owner');await run(a,{type:'chatDelete',peerId:b,messageId:x.message.id});await assert.rejects(run(b,{type:'chatImage',peerId:a,messageId:x.message.id}),e=>e.code==='chat-message-unavailable');assert((await db.collection('media_cleanup_jobs').doc(uploadId).get()).exists);
});
test('public feed upload cannot be sent as a private chat attachment',async()=>{
 const a='photo-purpose',b='photo-purpose-peer';await seed(a);await seed(b);const id='img_'+'f'.repeat(40);await ref(a).collection('media_uploads').doc(id).set({uid:a,purpose:'feed',status:'ready',expiresAt:Date.now()+3600000,asset:{url:'https://public'}});await assert.rejects(run(a,{type:'chatImageSend',peerId:b,text:'hi',mediaId:id}),e=>e.code==='media-upload-not-ready');
});
test('Global photo visible only after attach, concurrent attach single-use, cleanup preserves live authenticated image',async()=>{
 const a='global-photo-owner',b='global-photo-reader';await seed(a);await seed(b);const id='img_'+'c'.repeat(40),publicId='animemetahub/'+'d'.repeat(32)+'/'+id;
 await ref(a).collection('media_uploads').doc(id).set({id,uid:a,purpose:'chat',status:'ready',publicId,expiresAt:Date.now()+3600000,asset:{format:'jpg'}});
 const results=await Promise.allSettled([run(a,{type:'chatGlobalImageSend',mediaId:id,text:'photo'}),run(a,{type:'chatGlobalImageSend',mediaId:id,text:'photo'})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);const sent=results.find(x=>x.status==='fulfilled').value;
 const r=await run(b,{type:'chatImage',peerId:'',messageId:sent.message.id});assert(r.imageUrl.includes('expires_at='));
 const job=db.collection('media_cleanup_jobs').doc(id);await job.set({uid:a,uploadId:id,publicId,notBefore:Date.now()-1});const {cleanupMedia}=require('../../services/economy/media-cleanup.cjs');let destroyed=false;await cleanupMedia({db,now:Date.now()+8000000,cloudinary:{destroy:async target=>{if(target===publicId)destroyed=true;}}});assert.equal(destroyed,false);assert(!(await job.get()).exists);
 await run(a,{type:'chatGlobalDelete',messageId:sent.message.id});let delivery;await cleanupMedia({db,now:Date.now()+8000000,cloudinary:{destroy:async(target,type)=>{if(target===publicId)delivery=type;}}});assert.equal(delivery,'authenticated');await assert.rejects(run(b,{type:'chatImage',peerId:'',messageId:sent.message.id}),e=>e.code==='chat-message-unavailable');
});
test('Sensei shared-post preview revalidates server visibility, never returns private profile fields',async()=>{const a='sensei-share';await seed(a);const post=db.collection('feed_posts').doc('sensei-post');await post.set({uid:a,username:'Reader',caption:'Discuss',created_at_ms:Date.now(),privateField:'SECRET'});const r=await run(a,{type:'chatPostPreview',postId:post.id});assert.deepEqual(r.sharedPost,{id:post.id,username:'Reader',caption:'Discuss'});assert(!JSON.stringify(r).includes('SECRET'));await post.delete();await assert.rejects(run(a,{type:'chatPostPreview',postId:post.id}),e=>e.code==='social-post-unavailable');});
