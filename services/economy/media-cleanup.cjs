'use strict';
const {provider}=require('./media.cjs');
const {txRun}=require('./domain.cjs');
// Admin-only queue; no browser endpoint. Never delete an asset while its session can attach.
async function cleanupMedia({db,cloudinary,now=Date.now(),limit=10}){
 const service=cloudinary||provider(),jobs=await db.collection('media_cleanup_jobs').orderBy('notBefore').limit(limit).get();let removed=0,failed=0;
 for(const job of jobs.docs){
  if(job.data().notBefore>now)break;
  try{
   const target=await txRun(db,async tx=>{
    const js=await tx.get(job.ref);if(!js.exists)return null;const j=js.data();if(j.notBefore>now||j.leaseUntil>now)return null;
    if(typeof j.uid!=='string'||!j.uid||j.uid.includes('/')||!/^img_[a-f0-9]{40}$/.test(j.uploadId)||!/^animemetahub\/[a-f0-9]{32}\/img_[a-f0-9]{40}$/.test(j.publicId)){tx.delete(job.ref);return null;}
    const actor=db.collection('user_meta').doc(j.uid),ref=actor.collection('media_uploads').doc(j.uploadId),ss=await tx.get(ref);if(!ss.exists||ss.data().publicId!==j.publicId){tx.delete(job.ref);return null;}const s=ss.data();
    let linked=false;
    if(s.status==='attached'){
     if(s.purpose==='avatar'){const p=await tx.get(actor);linked=p.exists&&p.data().avatarMedia?.uploadId===s.id&&p.data().avatar===s.asset?.url;}
     else if(s.purpose==='chat'&&typeof s.messagePath==='string'&&/^(direct_chats\/[a-zA-Z0-9_-]+\/messages|global_messages)\/m_[a-f0-9]{40}$/.test(s.messagePath)){const m=await tx.get(db.doc(s.messagePath));linked=m.exists&&m.data().mediaId===s.id&&m.data().senderId===j.uid;}
     else if(s.postId){const p=await tx.get(db.collection('feed_posts').doc(s.postId));linked=p.exists&&p.data().mediaId===s.id;}
    }
    if(linked){tx.delete(job.ref);return null;}
    if(s.expiresAt+3600000>now){tx.update(job.ref,{notBefore:s.expiresAt+3600000});return null;}
    tx.update(ref,{status:'deleting'});tx.update(job.ref,{leaseUntil:now+120000});return {publicId:s.publicId,ref,deliveryType:s.purpose==='chat'?'authenticated':'upload'};
   });
   if(!target)continue;
   await service.destroy(target.publicId,target.deliveryType);
   await txRun(db,async tx=>{const session=await tx.get(target.ref);if(session.exists&&session.data().status==='deleting')tx.update(target.ref,{status:'deleted',deletedAt:now});tx.delete(job.ref);});removed++;
  }catch{failed++;try{await job.ref.update({leaseUntil:0,notBefore:now+600000});}catch{} }
 }
 return {removed,failed};
}
function startMediaCleanup({db,env=process.env}){
 if(!env.CLOUDINARY_CLOUD_NAME||!env.CLOUDINARY_API_KEY||!env.CLOUDINARY_API_SECRET)return ()=>{};
 let busy=false,stopped=false;const run=async()=>{if(busy||stopped)return;busy=true;try{await cleanupMedia({db});}catch{/* Keep errors/credentials private; queue retries next tick. */}finally{busy=false;}};
 const initial=setTimeout(run,60000),interval=setInterval(run,600000);initial.unref();interval.unref();return ()=>{stopped=true;clearTimeout(initial);clearInterval(interval);};
}
module.exports={cleanupMedia,startMediaCleanup};
