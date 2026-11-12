'use strict';
const {createHash}=require('node:crypto');
const {EconomyError}=require('./domain.cjs');
const {missions,level}=require('./social.cjs');
const fail=c=>{throw new EconomyError(c);};
const emojis=['❤️','😂','👍','🔥','😞'];
const fields={chatInbox:[],chatSearch:['query','cursor'],chatPresence:['online','sessionId','sequence'],chatThread:['peerId','before'],chatGlobal:['before'],chatSend:['peerId','text'],chatGlobalSend:['text'],chatDelete:['peerId','messageId'],chatGlobalDelete:['messageId'],chatGlobalReact:['messageId','emoji'],chatRecentRemove:['peerId'],chatMissionClaim:[],chatPostSend:['peerId','postId'],chatGlobalPostSend:['postId'],chatImageSend:['peerId','text','mediaId'],chatGlobalImageSend:['text','mediaId'],chatImage:['peerId','messageId'],chatPostPreview:['postId']};
const types=Object.keys(fields),idOK=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(s);
function validate(c){
 if(!c||!Object.hasOwn(fields,c.type)||Object.keys(c).some(k=>k!=='type'&&!fields[c.type].includes(k))||fields[c.type].some(k=>!Object.hasOwn(c,k)))fail('invalid-command');
 for(const k of ['peerId','messageId'])if(fields[c.type].includes(k)&&!(c.type==='chatImage'&&k==='peerId'&&c[k]==='')&&!idOK(c[k]))fail('invalid-command-field');
 if(fields[c.type].includes('text')&&(typeof c.text!=='string'||(!c.text.trim()&&!['chatImageSend','chatGlobalImageSend'].includes(c.type))||c.text.length>2000))fail('chat-text-invalid');
 if(fields[c.type].includes('postId')&&!idOK(c.postId))fail('invalid-command-field');
 if(fields[c.type].includes('mediaId')&&(typeof c.mediaId!=='string'||!/^img_[a-f0-9]{40}$/.test(c.mediaId)))fail('invalid-command-field');
 if(c.type==='chatSearch'&&(typeof c.query!=='string'||c.query.length>100||!c.query.trim()||typeof c.cursor!=='string'||(c.cursor&&!idOK(c.cursor))))fail('invalid-command');
 if(fields[c.type].includes('before'))cursor(c.before);
 if(c.type==='chatGlobalReact'&&!emojis.includes(c.emoji))fail('invalid-command');
 if(c.type==='chatPresence'&&(typeof c.online!=='boolean'||!idOK(c.sessionId)||!Number.isSafeInteger(c.sequence)||c.sequence<0))fail('invalid-command');
}
function cursor(s){if(s==='')return null;if(typeof s!=='string'||!/^\d{1,16}:[a-zA-Z0-9_-]{1,160}$/.test(s))fail('invalid-command');const at=Number(s.split(':')[0]);if(!Number.isSafeInteger(at))fail('invalid-command');return {at,id:s.slice(s.indexOf(':')+1)};}
const num=n=>Number.isSafeInteger(n)&&n>=0?n:0;
function user(p,uid,now){return {uid,username:String(p.username||'Hunter').slice(0,100),avatar:String(p.avatar||'').slice(0,4096),xp:num(p.xp),gems:num(p.gems),equippedTheme:String(p.equippedTheme||'').slice(0,100),online:p.online===true&&now-num(p.lastSeenMs)<70000,lastSeenMs:num(p.lastSeenMs)};}
function message(p,id,uid){const r=p.reactions||{};return {id,senderId:String(p.senderId||''),senderName:String(p.senderName||'Hunter').slice(0,100),senderAvatar:String(p.senderAvatar||'').slice(0,4096),senderGems:num(p.senderGems),senderTheme:String(p.senderTheme||'').slice(0,100),senderAdmin:p.senderAdmin===true,text:String(p.text||''),createdAtMs:num(p.createdAtMs),...(p.mediaId?{mediaId:p.mediaId}:{}),...(p.postId?{postId:p.postId}:{}),reactions:Object.fromEntries(emojis.map(e=>[e,Array.isArray(r[e])?r[e].length:0])),selected:emojis.filter(e=>Array.isArray(r[e])&&r[e].includes(uid))};}
const chatId=(a,b)=>[a,b].sort().join('_');
function checkParent(p,uid,peer){if(!Array.isArray(p.participants)||p.participants.length!==2||!p.participants.includes(uid)||!p.participants.includes(peer))fail('chat-not-participant');}
function pageQuery(col,before){const {FieldPath}=require('firebase-admin/firestore');let q=col.orderBy('createdAtMs','desc').orderBy(FieldPath.documentId(),'desc');const c=cursor(before);if(c)q=q.startAfter(c.at,col.doc(c.id));return q.limit(51);}
function page(snap,uid){const docs=snap.docs.slice(0,50),last=docs.at(-1);return {messages:docs.map(d=>message(d.data(),d.id,uid)).reverse(),hasMore:snap.docs.length>50,nextCursor:last?`${num(last.data().createdAtMs)}:${last.id}`:''};}
async function executeChat({db,verifiedUid:uid,verifiedAdmin=false,operationId,command:c,now=Date.now()}){
 validate(c);const users=db.collection('user_meta'),meRef=users.doc(uid),global=db.collection('global_messages'),base={type:c.type,chatCapability:'chat-v1',serverNow:now};
 if(c.peerId===uid)fail('chat-self');
 if(['chatInbox','chatSearch','chatGlobal'].includes(c.type)){
  const mine=await meRef.get();if(!mine.exists)fail('profile-not-found');
  if(c.type==='chatGlobal'){
   const batch=page(await pageQuery(global,c.before).get(),uid),ids=[...new Set(batch.messages.map(m=>m.senderId))].filter(idOK);
   // Bounded public sender projection for real, expiring presence dots; never infer activity from messages.
   const profiles=await Promise.all(ids.map(id=>users.doc(id).get()));
   return {...base,...batch,users:profiles.filter(d=>d.exists).map(d=>user(d.data(),d.id,now)),missionData:missions(mine.data(),new Date(now).toISOString().slice(0,10))};
  }
  if(c.type==='chatSearch'){
   let q=users.orderBy(require('firebase-admin/firestore').FieldPath.documentId()).limit(100);if(c.cursor)q=q.startAfter(c.cursor);const snap=await q.get(),needle=c.query.trim().normalize('NFKC').toLowerCase();
   return {...base,users:snap.docs.filter(d=>d.id!==uid&&String(d.data().username||'').normalize('NFKC').toLowerCase().includes(needle)).map(d=>user(d.data(),d.id,now)),nextSearchCursor:snap.docs.length===100?snap.docs.at(-1).id:'',query:c.query};
  }
  // Single array-contains filter protects privacy without requiring a new composite index.
  // Owner-test scope: per-user conversation scan is sorted/bounded in the response; index at scale before public rollout.
  const inbox=await db.collection('direct_chats').where('participants','array-contains',uid).get();const docs=inbox.docs.filter(d=>Array.isArray(d.data().participants)&&d.data().participants.length===2).sort((a,b)=>num(b.data().updatedAtMs)-num(a.data().updatedAtMs)).slice(0,50);
  const recent=(Array.isArray(mine.data().recentChats)?mine.data().recentChats:[]).filter(id=>idOK(id)&&id!==uid).slice(0,30),peers=[...new Set([...docs.map(d=>d.data().participants.find(id=>id!==uid)),...recent])].filter(idOK);
  const profiles=await Promise.all(peers.map(id=>users.doc(id).get())),byId=new Map(profiles.map(d=>[d.id,user(d.data()||{username:'Unavailable user'},d.id,now)]));
  return {...base,inbox:docs.map(d=>{const p=d.data(),peerId=p.participants.find(id=>id!==uid);return {chatId:d.id,peer:byId.get(peerId),lastText:String(p.lastText||'').slice(0,2000),lastSenderId:String(p.lastSenderId||''),updatedAtMs:num(p.updatedAtMs),unread:num(p[`unread_${uid}`])};}).filter(d=>d.peer),recent:recent.map(id=>byId.get(id)).filter(Boolean),totalUnread:docs.reduce((n,d)=>n+num(d.data()[`unread_${uid}`]),0)};
 }
 if(c.type==='chatPostPreview'){
  const mine=await meRef.get();if(!mine.exists)fail('profile-not-found');const post=await db.collection('feed_posts').doc(c.postId).get();if(!post.exists||!require('./social.cjs').visible(post.data(),now))fail('social-post-unavailable');const p=post.data();return {...base,sharedPost:{id:post.id,username:String(p.username||'Hunter').slice(0,100),caption:String(p.caption||p.text||'').slice(0,2000)}};
 }
 if(c.type==='chatImage'){
  const mine=await meRef.get();if(!mine.exists)fail('profile-not-found');
  let col=global;
  if(c.peerId){const parent=await db.collection('direct_chats').doc(chatId(uid,c.peerId)).get();if(!parent.exists)fail('chat-not-participant');checkParent(parent.data(),uid,c.peerId);col=parent.ref.collection('messages');}
  const saved=await col.doc(c.messageId).get();if(!saved.exists||!saved.data().mediaId)fail('chat-message-unavailable');const msg=saved.data();if(!idOK(msg.senderId))fail('chat-message-unavailable');
  const upload=await users.doc(msg.senderId).collection('media_uploads').doc(msg.mediaId).get(),m=upload.data();
  if(!m||m.purpose!=='chat'||m.status!=='attached'||m.messagePath!==saved.ref.path||!m.asset||m.uid!==msg.senderId)fail('media-upload-not-ready');
  const {config,sign}=require('./media.cjs'),cfg=config(),expiresAt=now+60000,params={public_id:m.publicId,format:m.asset.format,type:'authenticated',timestamp:Math.floor(now/1000),expires_at:Math.floor(expiresAt/1000),attachment:false};
  return {...base,imageUrl:`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/download?${new URLSearchParams({...params,api_key:cfg.key,signature:sign(params,cfg.secret)})}`,expiresAt};
 }
 if(c.type==='chatPresence'){
  return db.runTransaction(async tx=>{const mine=await tx.get(meRef);if(!mine.exists)fail('profile-not-found');const p=mine.data();if((!c.online&&p.presenceSession!==c.sessionId)||(p.presenceSession===c.sessionId&&num(p.presenceSequence)>=c.sequence))return {...base,ignored:true};tx.update(meRef,{online:c.online,lastSeenMs:now,presenceSession:c.sessionId,presenceSequence:c.sequence});return base;});
 }
 if(c.type==='chatThread'){
  const ref=db.collection('direct_chats').doc(chatId(uid,c.peerId));return db.runTransaction(async tx=>{
   const [mine,peer,saved]=await Promise.all([tx.get(meRef),tx.get(users.doc(c.peerId)),tx.get(ref)]);if(!mine.exists)fail('profile-not-found');if(!peer.exists)fail('chat-user-unavailable');const p=saved.exists?saved.data():{chatId:ref.id,participants:[uid,c.peerId].sort(),updatedAtMs:now,lastText:'',lastSenderId:'',sequence:0};checkParent(p,uid,c.peerId);
   const snap=await tx.get(pageQuery(ref.collection('messages'),c.before));if(!saved.exists&&snap.docs.length)fail('chat-not-participant');if(!c.before){tx.set(ref,{...p,[`unread_${uid}`]:0,[`readThrough_${uid}`]:num(p.sequence),[`readAt_${uid}`]:now});tx.update(meRef,{recentChats:[c.peerId,...(mine.data().recentChats||[]).filter(id=>id!==c.peerId)].slice(0,30)});}
   return {...base,...page(snap,uid),peer:user(peer.data(),c.peerId,now)};
  });
 }
 const receipt=meRef.collection('economy_receipts').doc(operationId),fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(c).sort()))).digest('hex'),id=`m_${createHash('sha256').update(uid+':'+operationId).digest('hex').slice(0,40)}`;
 return db.runTransaction(async tx=>{
  const old=await tx.get(receipt);if(old.exists){if(old.data().fingerprint!==fingerprint)fail('operation-id-conflict');return old.data().result;}
  const mine=await tx.get(meRef);if(!mine.exists)fail('profile-not-found');const p=mine.data(),result={...base};
  if(c.type==='chatRecentRemove'){tx.update(meRef,{recentChats:(p.recentChats||[]).filter(id=>id!==c.peerId)});result.peerId=c.peerId;}
  else if(c.type==='chatMissionClaim'){
   const m=missions(p,new Date(now).toISOString().slice(0,10));if(m.claimed.m_community)fail('chat-mission-claimed');if(num(m.progress.communityActions)<3)fail('chat-mission-incomplete');
   for(const k of ['xp','gold','gems'])if(p[k]!==undefined&&(!Number.isSafeInteger(p[k])||p[k]<0))fail('invalid-profile-number');
   const reward={gold:250,xp:40,gems:10},xp=num(p.xp)+40,gold=num(p.gold)+250,gems=num(p.gems)+10;if(![xp,gold,gems].every(Number.isSafeInteger))fail('numeric-overflow');m.claimed.m_community=true;tx.update(meRef,{xp,level:level(xp),gold,gems,missionData:m,updated_at:new Date(now)});result.reward=reward;result.missionData=m;
  }else{
   const direct=['chatSend','chatDelete','chatPostSend','chatImageSend'].includes(c.type);let parent,parentRef,peer;
   if(direct){parentRef=db.collection('direct_chats').doc(chatId(uid,c.peerId));const [saved,ps]=await Promise.all([tx.get(parentRef),tx.get(users.doc(c.peerId))]);if(!ps.exists)fail('chat-user-unavailable');peer=ps.data();if(!saved.exists&&(await tx.get(parentRef.collection('messages').limit(1))).docs.length)fail('chat-not-participant');parent=saved.exists?saved.data():{chatId:parentRef.id,participants:[uid,c.peerId].sort(),sequence:0};checkParent(parent,uid,c.peerId);}
   const col=direct?parentRef.collection('messages'):global,ref=col.doc(c.messageId||id);
   if(['chatSend','chatGlobalSend','chatPostSend','chatGlobalPostSend','chatImageSend','chatGlobalImageSend'].includes(c.type)){
    let media=null;if(c.mediaId){const ms=await tx.get(meRef.collection('media_uploads').doc(c.mediaId));media=ms.data();if(!media||media.uid!==uid||media.purpose!=='chat'||media.status!=='ready'||media.expiresAt<now||!media.asset)fail('media-upload-not-ready');}
    if(c.postId){const ps=await tx.get(db.collection('feed_posts').doc(c.postId));if(!ps.exists||!require('./social.cjs').visible(ps.data(),now))fail('social-post-unavailable');}
    const stamp=direct?Math.max(now,num(parent.updatedAtMs)+1):now,seq=direct?num(parent.sequence)+1:0;
    if(!Number.isSafeInteger(stamp)||!Number.isSafeInteger(seq)||(direct&&!Number.isSafeInteger(num(parent[`unread_${c.peerId}`])+1)))fail('numeric-overflow');
    const msg={senderId:uid,senderName:String(p.username||'Hunter').slice(0,100),senderAvatar:String(p.avatar||'').slice(0,4096),senderGems:num(p.gems),senderTheme:String(p.equippedTheme||''),senderAdmin:verifiedAdmin,text:c.postId?`animemetahub://post/${c.postId}`:c.text.trim(),...(c.postId?{postId:c.postId}:{}),...(media?{mediaId:c.mediaId}:{}),createdAtMs:stamp,createdAt:new Date(stamp),sequence:seq,reactions:{}};
    if(media)tx.update(meRef.collection('media_uploads').doc(c.mediaId),{status:'attached',messagePath:ref.path,attachedAt:now});
    tx.create(ref,msg);result.message=message(msg,ref.id,uid);
    if(direct){tx.set(parentRef,{...parent,sequence:seq,updatedAtMs:stamp,updatedAt:new Date(stamp),lastText:msg.text||(msg.mediaId?'Photo':''),lastSenderId:uid,lastMessageId:ref.id,[`unread_${c.peerId}`]:num(parent[`unread_${c.peerId}`])+1});tx.update(meRef,{recentChats:[c.peerId,...(p.recentChats||[]).filter(id=>id!==c.peerId)].slice(0,30)});tx.update(users.doc(c.peerId),{recentChats:[uid,...(peer.recentChats||[]).filter(id=>id!==uid)].slice(0,30)});result.peerId=c.peerId;}
    else{const m=missions(p,new Date(now).toISOString().slice(0,10));m.progress.communityActions=Math.min(3,num(m.progress.communityActions)+1);tx.update(meRef,{missionData:m});result.missionData=m;}
   }else{
    const saved=await tx.get(ref);if(!saved.exists)fail('chat-message-unavailable');const msg=saved.data();
    if(c.type==='chatGlobalReact'){
     const r={...(msg.reactions||{})},list=Array.isArray(r[c.emoji])?r[c.emoji]:[];r[c.emoji]=list.includes(uid)?list.filter(v=>v!==uid):[...list,uid];if(Buffer.byteLength(JSON.stringify(r))>750000)fail('chat-message-full');tx.update(ref,{reactions:r});result.message=message({...msg,reactions:r},ref.id,uid);
    }else{
     if(msg.senderId!==uid)fail('chat-not-owner');let latest;if(direct)latest=await tx.get(pageQuery(col,'').limit(2));
     let photo;if(msg.mediaId){const upload=await tx.get(users.doc(uid).collection('media_uploads').doc(msg.mediaId));photo=upload.data();}
     tx.delete(ref);if(photo?.purpose==='chat'&&photo.messagePath===ref.path)tx.set(db.collection('media_cleanup_jobs').doc(msg.mediaId),{uid,uploadId:msg.mediaId,publicId:photo.publicId,notBefore:now+7200000});result.deletedId=ref.id;if(direct){const patch={};if((msg.sequence?msg.sequence>num(parent[`readThrough_${c.peerId}`]):num(msg.createdAtMs)>num(parent[`readAt_${c.peerId}`])))patch[`unread_${c.peerId}`]=Math.max(0,num(parent[`unread_${c.peerId}`])-1);
      if(parent.lastMessageId===ref.id||latest.docs[0]?.id===ref.id){const previous=latest.docs.find(d=>d.id!==ref.id)?.data();patch.lastText=previous?.text||'';patch.lastSenderId=previous?.senderId||'';patch.lastMessageId=latest.docs.find(d=>d.id!==ref.id)?.id||'';}if(Object.keys(patch).length)tx.update(parentRef,patch);result.peerId=c.peerId;}
    }
   }
  }
  tx.create(receipt,{fingerprint,result,createdAt:new Date(now)});return result;
 });
}
module.exports={types,validate,executeChat,chatId,checkParent,user,message,cursor,emojis};
