'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const req=createRequire(require('node:path').resolve('../../services/economy/package.json')),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const {executeMedia}=require('../../services/economy/media.cjs'),{executeSocial}=require('../../services/economy/social.cjs'),{cleanupMedia}=require('../../services/economy/media-cleanup.cjs');let app,db,serial=0;
const cloudinary={cfg:{cloud:'test',key:'12345',secret:'emulator-only-not-a-real-secret'},inspect:async publicId=>({public_id:publicId,resource_type:'image',type:'upload',bytes:100,width:512,height:512,format:'jpg',version:1})};
before(()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');app=initializeApp({projectId:'demo-anime-meta-hub-media'},'media-tests');db=getFirestore(app);});after(async()=>deleteApp(app));
const ref=uid=>db.collection('user_meta').doc(uid),state=async uid=>(await ref(uid).get()).data(),seed=uid=>ref(uid).set({xp:0,gold:0,gems:0});
const run=(uid,command,operationId=`media_emulator_${++serial}_1234567890`,now=100000)=>executeMedia({db,verifiedUid:uid,operationId,command,cloudinary,now});
test('media concurrent prepare replay consumes one quota and finalize replay attaches once',async()=>{
 const uid='replay';await seed(uid);const c={type:'mediaPrepare',purpose:'avatar'},id='media_same_prepare_1234567890';const [a,b]=await Promise.all([run(uid,c,id),run(uid,c,id)]);assert.deepEqual(a,b);assert.equal((await ref(uid).collection('media_limits').doc('1970-01-01').get()).data().count,1);
 const f={type:'mediaFinalize',uploadId:a.uploadId},fid='media_same_finalize_1234567890';const [x,y]=await Promise.all([run(uid,f,fid),run(uid,f,fid)]);assert.deepEqual(x,y);assert.equal((await state(uid)).avatar,x.asset.url);assert.equal((await state(uid)).xp,0);
 await assert.rejects(run('other',{type:'mediaFinalize',uploadId:a.uploadId}),e=>e.code==='media-upload-not-found');
});
test('media final prepare quota races cannot exceed twenty',async()=>{
 const uid='quota';await seed(uid);await ref(uid).collection('media_limits').doc('1970-01-01').set({count:19});const results=await Promise.allSettled([run(uid,{type:'mediaPrepare',purpose:'feed'}),run(uid,{type:'mediaPrepare',purpose:'feed'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await ref(uid).collection('media_limits').doc('1970-01-01').get()).data().count,20);
});
test('Feed attach vs discard is atomic; cleanup preserves live media and deletes abandoned uploads',async()=>{
 const uid='feed';await seed(uid);const p=await run(uid,{type:'mediaPrepare',purpose:'feed'});await run(uid,{type:'mediaFinalize',uploadId:p.uploadId});
 const outcomes=await Promise.allSettled([executeSocial({db,verifiedUid:uid,operationId:'media_feed_publish_1234567890',now:100001,command:{type:'feedCreate',caption:'Photo',linkUrl:'',mediaId:p.uploadId}}),run(uid,{type:'mediaDiscard',uploadId:p.uploadId})]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
 const session=ref(uid).collection('media_uploads').doc(p.uploadId),s=(await session.get()).data(),destroyed=[];
 await cleanupMedia({db,now:7400000,limit:100,cloudinary:{...cloudinary,destroy:async id=>destroyed.push(id)}});
 if(s.status==='attached'){assert(!destroyed.includes(s.publicId));assert.equal((await state(uid)).xp,15);}else{assert(destroyed.includes(s.publicId));assert.equal((await session.get()).data().status,'deleted');assert.equal((await state(uid)).xp,0);}
});
test('cleanup failure retains job and retries; concurrent cleanup blocks finalize',async()=>{
 const uid='cleanup';await seed(uid);const p=await run(uid,{type:'mediaPrepare',purpose:'feed'}),session=ref(uid).collection('media_uploads').doc(p.uploadId);
 await cleanupMedia({db,now:7400000,limit:100,cloudinary:{...cloudinary,destroy:async()=>{throw Error('offline');}}});assert.equal((await session.get()).data().status,'deleting');assert((await db.collection('media_cleanup_jobs').doc(p.uploadId).get()).exists);
 await assert.rejects(run(uid,{type:'mediaFinalize',uploadId:p.uploadId}),e=>e.code==='media-upload-not-ready');await cleanupMedia({db,now:8100000,limit:100,cloudinary:{...cloudinary,destroy:async()=>{}}});assert.equal((await session.get()).data().status,'deleted');assert(!(await db.collection('media_cleanup_jobs').doc(p.uploadId).get()).exists);
});
