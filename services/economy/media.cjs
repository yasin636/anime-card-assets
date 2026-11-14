'use strict';
// Image-only Cloudinary adapter. No credentials or provider responses are logged.
const {createHash}=require('node:crypto');
const {EconomyError,txRun}=require('./domain.cjs');
const {providerError,safeBody}=require('./media-errors.cjs');
const fail=code=>{throw new EconomyError(code);};
const types=['mediaPrepare','mediaFinalize','mediaDiscard'];
const fields={mediaPrepare:['purpose'],mediaFinalize:['uploadId'],mediaDiscard:['uploadId']};
const LIMITS={avatar:1048576,feed:3145728,chat:3145728};
function validate(c){if(!c||!types.includes(c.type)||Object.keys(c).some(k=>k!=='type'&&!fields[c.type].includes(k))||fields[c.type].some(k=>!Object.hasOwn(c,k)))fail('invalid-command');if(c.type==='mediaPrepare'&&!Object.hasOwn(LIMITS,c.purpose))fail('invalid-command');if(c.type!=='mediaPrepare'&&(typeof c.uploadId!=='string'||!/^img_[a-f0-9]{40}$/.test(c.uploadId)))fail('invalid-command-field');}
function config(env=process.env){const cloud=env.CLOUDINARY_CLOUD_NAME,key=env.CLOUDINARY_API_KEY,secret=env.CLOUDINARY_API_SECRET;if(!/^[a-zA-Z0-9_-]{1,100}$/.test(cloud||'')||!/^\d{1,40}$/.test(key||'')||typeof secret!=='string'||secret.length<8)fail('media-not-configured');return {cloud,key,secret};}
function sign(params,secret){return createHash('sha256').update(Object.entries(params).filter(([,v])=>v!==undefined&&v!=='').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('&')+secret).digest('hex');}
function provider({env=process.env,fetcher=fetch}={}){const cfg=config(env);return {cfg,async destroy(publicId,deliveryType='upload'){const timestamp=Math.floor(Date.now()/1000),params={public_id:publicId,timestamp,invalidate:true,...(deliveryType==='authenticated'?{type:deliveryType}:{})},ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetcher(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/destroy`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,api_key:cfg.key,signature:sign(params,cfg.secret)}).toString(),signal:ctl.signal});if(!r.ok)fail(providerError(r.status,await safeBody(r))); const body=await r.json();if(!['ok','not found'].includes(body.result))fail('media-provider-unavailable');}catch(e){if(e instanceof EconomyError)throw e;fail('media-provider-unavailable');}finally{clearTimeout(timer);}},async inspect(publicId,deliveryType='upload'){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const response=await fetcher(`https://api.cloudinary.com/v1_1/${cfg.cloud}/resources/image/${deliveryType}/${encodeURIComponent(publicId)}`,{headers:{Authorization:`Basic ${Buffer.from(cfg.key+':'+cfg.secret).toString('base64')}`},signal:ctl.signal});if(response.status===404)fail('media-upload-not-found');if(!response.ok)fail(providerError(response.status,await safeBody(response))); return await response.json();}catch(e){if(e instanceof EconomyError)throw e;fail('media-provider-unavailable');}finally{clearTimeout(timer);}}};}
function verifiedAsset(raw,s,cfg){
 if(!raw||raw.public_id!==s.publicId||raw.resource_type!=='image'||raw.type!==(s.purpose==='chat'?'authenticated':'upload')||!['jpg','jpeg','png','webp'].includes(raw.format)||!Number.isSafeInteger(raw.bytes)||raw.bytes<1||raw.bytes>LIMITS[s.purpose]||!Number.isSafeInteger(raw.width)||!Number.isSafeInteger(raw.height)||raw.width<1||raw.height<1||raw.width>4096||raw.height>4096||raw.width*raw.height>16777216||(raw.pages!==undefined&&raw.pages!==1)||!Number.isSafeInteger(raw.version)||raw.version<1)fail('media-file-invalid');
 return {publicId:s.publicId,assetId:typeof raw.asset_id==='string'?raw.asset_id:'',url:`https://res.cloudinary.com/${cfg.cloud}/image/${s.purpose==='chat'?'authenticated':'upload'}/v${raw.version}/${s.publicId}.${raw.format}`,bytes:raw.bytes,width:raw.width,height:raw.height,format:raw.format};
}
async function executeMedia({db,verifiedUid:uid,operationId,command:c,now=Date.now(),cloudinary}){
 validate(c);const service=cloudinary||provider(),actor=db.collection('user_meta').doc(uid),receipt=actor.collection('economy_receipts').doc(operationId),fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(c).sort()))).digest('hex');
 // Receipt replay works even if the file later expires or is removed from the provider.
 const saved=await receipt.get();if(saved.exists){if(saved.data().fingerprint!==fingerprint)fail('operation-id-conflict');return saved.data().result;}
 const id=c.uploadId||`img_${createHash('sha256').update(uid+':'+operationId).digest('hex').slice(0,40)}`,upload=actor.collection('media_uploads').doc(id);let asset;
 if(c.type==='mediaFinalize'){const snap=await upload.get();if(!snap.exists)fail('media-upload-not-found');const s=snap.data();if(s.status!=='prepared'||s.expiresAt<now)fail('media-upload-not-ready');asset=verifiedAsset(await service.inspect(s.publicId,s.purpose==='chat'?'authenticated':'upload'),s,service.cfg);}
 return txRun(db,async tx=>{
  const replay=await tx.get(receipt);if(replay.exists){if(replay.data().fingerprint!==fingerprint)fail('operation-id-conflict');return replay.data().result;}
  const me=await tx.get(actor);if(!me.exists)fail('profile-not-found');const p=me.data(),result={type:c.type,mediaCapability:'images-v1'},date=new Date(now).toISOString().slice(0,10);
  if(c.type==='mediaPrepare'){
   const quota=actor.collection('media_limits').doc(date),qs=await tx.get(quota),count=qs.data()?.count||0;if(!Number.isSafeInteger(count)||count<0)fail('invalid-profile-number');if(count>=20)fail('media-daily-limit');
   // Folder-scoped Media Library User must have access to this pre-created folder.
   const owner=createHash('sha256').update(uid).digest('hex').slice(0,32),publicId=`animemetahub/${owner}/${id}`,timestamp=Math.floor(now/1000);
   const params={timestamp,public_id:publicId,asset_folder:'animemetahub',overwrite:false,allowed_formats:'jpg,jpeg,png,webp',...(c.purpose==='chat'?{type:'authenticated'}:{})};
   const session={id,uid,purpose:c.purpose,publicId,status:'prepared',createdAt:now,expiresAt:now+3600000};
   tx.create(upload,session);tx.create(db.collection('media_cleanup_jobs').doc(id),{uid,uploadId:id,publicId,notBefore:now+7200000});tx.set(quota,{count:count+1,date});Object.assign(result,{uploadId:id,purpose:c.purpose,maxBytes:LIMITS[c.purpose],expiresAt:session.expiresAt,upload:{url:`https://api.cloudinary.com/v1_1/${service.cfg.cloud}/image/upload`,apiKey:service.cfg.key,params,signature:sign(params,service.cfg.secret)}});
  }else{
   const snap=await tx.get(upload);if(!snap.exists)fail('media-upload-not-found');const s=snap.data();if(s.uid!==uid)fail('media-not-owner');
   if(c.type==='mediaDiscard'){
    if(s.status==='attached')fail('media-already-attached');tx.update(upload,{status:'discarded',cleanupNeeded:true,discardedAt:now});result.discarded=true;
   }else{
    if(s.status!=='prepared'||s.expiresAt<now)fail('media-upload-not-ready');
    if(s.purpose==='avatar'){
     const old=p.avatarMedia;if(old?.publicId&&old?.uploadId)tx.set(db.collection('media_cleanup_jobs').doc(old.uploadId),{uid,uploadId:old.uploadId,publicId:old.publicId,notBefore:now+7200000});
     tx.update(actor,{avatar:asset.url,avatarMedia:{uploadId:id,publicId:asset.publicId},updated_at:new Date(now)});
    }
    tx.update(upload,{status:s.purpose==='avatar'?'attached':'ready',asset,finalizedAt:now});Object.assign(result,{uploadId:id,purpose:s.purpose,asset});
   }
  }
  tx.create(receipt,{fingerprint,result,createdAt:new Date(now)});return result;
 });
}
module.exports={types,validate,config,sign,provider,verifiedAsset,executeMedia,LIMITS};
