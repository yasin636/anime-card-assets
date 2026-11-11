'use strict';
const {createHash}=require('node:crypto');
const {EconomyError}=require('./domain.cjs');
const fail=c=>{throw new EconomyError(c);};
const emojis=['👍','❤️','😂','😮','😢','🔥'];
const types=['feedView','feedPostView','feedCreate','feedEdit','feedDelete','feedLike','feedReact','feedComment','feedCommentEdit','feedCommentDelete','feedShare','socialMissionClaim'];
const fields={feedView:[],feedPostView:['postId'],feedCreate:['caption','linkUrl'],feedEdit:['postId','caption'],feedDelete:['postId'],feedLike:['postId','liked'],feedReact:['postId','emoji'],feedComment:['postId','text'],feedCommentEdit:['postId','commentId','text'],feedCommentDelete:['postId','commentId'],feedShare:['postId'],socialMissionClaim:['missionId']};
function validate(c){
 if(!c||!Object.hasOwn(fields,c.type)||Object.keys(c).some(k=>k!=='type'&&!fields[c.type].includes(k))||fields[c.type].some(k=>!Object.hasOwn(c,k)))fail('invalid-command');
 for(const key of ['postId','commentId'])if(fields[c.type].includes(key)&&(typeof c[key]!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(c[key])))fail('invalid-command-field');
 for(const key of ['caption','text'])if(fields[c.type].includes(key)&&(typeof c[key]!=='string'||!c[key].trim()||c[key].length>(key==='caption'?2000:1000)))fail('social-text-invalid');
 if(c.type==='feedCreate'&&(typeof c.linkUrl!=='string'||c.linkUrl.length>2000||(c.linkUrl&&!safeLink(c.linkUrl))))fail('social-link-invalid');
 if(c.type==='feedLike'&&typeof c.liked!=='boolean')fail('invalid-command');
 if(c.type==='feedReact'&&!emojis.includes(c.emoji))fail('invalid-command');
 if(c.type==='socialMissionClaim'&&!['m_posts','m_social'].includes(c.missionId))fail('invalid-command');
}
function safeLink(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
const num=(p,k)=>{const n=p[k]??0;if(!Number.isSafeInteger(n)||n<0)fail('invalid-profile-number');return n;};
function level(xp){let l=1;while(l<100){const cost=l<=10?50:l<=20?80:l<=60?300:l<=80?650:l<=90?850:1000;if(xp<cost)break;xp-=cost;l++;}return l;}
const goals={postsCreated:2,socialActions:10};
function missions(p,date){const m=p.missionData;return m?.date===date?structuredClone(m):{date,progress:{newsRead:0,postsCreated:0,socialActions:0,animeAdded:0,communityActions:0},claimed:{m_news:false,m_posts:false,m_social:false,m_tracker:false,m_community:false}};}
function progress(m,key){m.progress={...m.progress,[key]:Math.min(goals[key],Math.max(0,Number(m.progress?.[key])||0)+1)};}
function visible(p,now){return p.isAdmin===true||now-Number(p.created_at_ms||0)<7*86400000;}
function identity(p,uid){return {uid,username:String(p.username||'Hunter').slice(0,100),avatar:String(p.avatar||'').slice(0,4096)};}
// Strict public projection: never return private user data, full liker UID maps or other clients' operation receipts.
function view(p,id,uid){
 const comments=Array.isArray(p.comments)?p.comments:[],reactions=p.reactions||{};
 return {id,...identity(p,p.uid),gems:Number(p.gems)||0,equippedTheme:String(p.equippedTheme||''),caption:String(p.caption||p.text||''),linkUrl:safeLink(p.linkUrl)?p.linkUrl:'',mediaUrl:typeof p.mediaUrl==='string'&&(safeLink(p.mediaUrl)||(/^data:image\//.test(p.mediaUrl)&&p.mediaUrl.length<260000))?p.mediaUrl:'',mediaType:String(p.mediaType||''),hasLegacyMedia:!!p.mediaUrl,created_at_ms:Number(p.created_at_ms)||0,isAdmin:p.isAdmin===true,edited:!!p.edited,version:Number(p.socialVersion)||0,likesCount:Number(p.likesCount)||0,liked:!!p.likedBy?.[uid],shareCount:Number(p.shareCount)||0,reaction:emojis.find(e=>Array.isArray(reactions[e])&&reactions[e].includes(uid))||'',reactions:Object.fromEntries(emojis.map(e=>[e,Array.isArray(reactions[e])?reactions[e].length:0])),comments:comments.map(c=>({id:String(c.id),...identity(c,c.uid),text:String(c.text||''),createdAtMs:Number(c.createdAtMs)||0,edited:!!c.edited}))};
}
async function executeSocial({db,verifiedUid:uid,verifiedAdmin=false,operationId,command:c,now=Date.now()}){
 validate(c);const users=db.collection('user_meta'),actor=users.doc(uid),posts=db.collection('feed_posts'),date=new Date(now).toISOString().slice(0,10);
 if(c.type==='feedView'||c.type==='feedPostView'){
  const me=await actor.get();if(!me.exists)fail('profile-not-found');
  const activity=await db.collection('post_activity').doc(uid).get();
  let docs;if(c.type==='feedPostView'){const d=await posts.doc(c.postId).get();if(!d.exists||!visible(d.data(),now))fail('social-post-unavailable');docs=[d];}else docs=(await posts.orderBy('created_at_ms','desc').limit(60).get()).docs;
  return {type:c.type,socialCapability:'social-v1',posts:docs.filter(d=>visible(d.data(),now)).map(d=>view(d.data(),d.id,uid)),missionData:missions(me.data(),date),dailyPosts:activity.data()?.day_key===date?Number(activity.data().count)||0:0,admin:verifiedAdmin,serverNow:now};
 }
 const fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(c).sort()))).digest('hex'),receipt=actor.collection('economy_receipts').doc(operationId),id=`s_${createHash('sha256').update(uid+':'+operationId).digest('hex').slice(0,40)}`;
 return db.runTransaction(async tx=>{
  const saved=await tx.get(receipt);if(saved.exists){if(saved.data().fingerprint!==fingerprint)fail('operation-id-conflict');return saved.data().result;}
  const me=await tx.get(actor);if(!me.exists)fail('profile-not-found');const p=me.data(),m=missions(p,date),patch={},result={type:c.type,socialCapability:'social-v1',xpDelta:0,creatorXpDelta:0};let post,postRef,creator,creatorRef,actorDelta=0,creatorDelta=0,deleted=false,activityRef,activityPatch;
  if(c.type==='socialMissionClaim'){
   const key=c.missionId==='m_posts'?'postsCreated':'socialActions';if(m.claimed?.[c.missionId])fail('social-mission-claimed');if(Number(m.progress?.[key]||0)<goals[key])fail('social-mission-incomplete');
   m.claimed={...m.claimed,[c.missionId]:true};const reward={gold:50,xp:key==='postsCreated'?15:20,gems:5};patch.gold=num(p,'gold')+reward.gold;patch.gems=num(p,'gems')+reward.gems;actorDelta=reward.xp;result.reward=reward;
  }else if(c.type==='feedCreate'){
   activityRef=db.collection('post_activity').doc(uid);const a=await tx.get(activityRef),count=a.data()?.day_key===date?num(a.data(),'count'):0;if(!verifiedAdmin&&count>=10)fail('social-daily-limit');
   postRef=posts.doc(id);post={...identity(p,uid),gems:num(p,'gems'),equippedTheme:String(p.equippedTheme||''),caption:c.caption.trim(),linkUrl:c.linkUrl.trim(),mediaUrl:'',mediaType:'',likesCount:0,likedBy:{},shareCount:0,comments:[],reactions:{},created_at_ms:now,created_at:new Date(now),isAdmin:verifiedAdmin,socialVersion:1};
   activityPatch={uid,day_key:date,count:count+1,updated_at:new Date(now)};actorDelta=15;progress(m,'postsCreated');
  }else{
   postRef=posts.doc(c.postId);const snapshot=await tx.get(postRef);if(!snapshot.exists||!visible(snapshot.data(),now))fail('social-post-unavailable');post=snapshot.data();
   if(typeof post.uid!=='string'||!post.uid||post.uid.includes('/'))fail('social-post-invalid');
   if(post.uid!==uid){creatorRef=users.doc(post.uid);const cp=await tx.get(creatorRef);if(cp.exists)creator=cp.data();}
   const own=post.uid===uid;
   if(c.type==='feedEdit'||c.type==='feedDelete'){
    if(!own)fail('social-not-owner');if(c.type==='feedDelete'){deleted=true;actorDelta=-15;}else{post.caption=c.caption.trim();post.edited=true;}
   }else if(c.type==='feedLike'){
    const likedBy={...(post.likedBy||{})},was=!!likedBy[uid];if(was!==c.liked){if(c.liked)likedBy[uid]=true;else delete likedBy[uid];post.likesCount=Math.max(0,(Number(post.likesCount)||0)+(c.liked?1:-1));post.likedBy=likedBy;if(!own){actorDelta=c.liked?5:-5;if(c.liked)creatorDelta=1;}if(c.liked)progress(m,'socialActions');}
   }else if(c.type==='feedReact'){
    const r={...(post.reactions||{})},was=emojis.find(e=>r[e]?.includes(uid));for(const e of emojis)if(Array.isArray(r[e]))r[e]=r[e].filter(u=>u!==uid);if(was!==c.emoji)r[c.emoji]=[...(r[c.emoji]||[]),uid];post.reactions=r;
   }else if(c.type==='feedComment'){
    post.comments=[...(post.comments||[]),{id,...identity(p,uid),text:c.text.trim(),createdAtMs:now}];actorDelta=10;if(!own)creatorDelta=3;progress(m,'socialActions');
   }else if(c.type==='feedCommentEdit'||c.type==='feedCommentDelete'){
    const index=(post.comments||[]).findIndex(v=>v.id===c.commentId);if(index<0)fail('social-comment-unavailable');if(post.comments[index].uid!==uid)fail('social-not-owner');
    if(c.type==='feedCommentDelete'){post.comments.splice(index,1);actorDelta=-10;}else post.comments[index]={...post.comments[index],text:c.text.trim(),edited:true};
   }else if(c.type==='feedShare'){post.shareCount=(Number(post.shareCount)||0)+1;actorDelta=5;if(!own)creatorDelta=5;}
   post.socialVersion=(Number(post.socialVersion)||0)+1;post.updated_at=new Date(now);
  }
  if(post&&!deleted&&Buffer.byteLength(JSON.stringify(post))>850000)fail('social-post-full');
  const xp=Math.max(0,num(p,'xp')+actorDelta);if(!Number.isSafeInteger(xp))fail('numeric-overflow');
  patch.xp=xp;patch.level=level(xp);patch.missionData=m;patch.updated_at=new Date(now);result.xpDelta=xp-num(p,'xp');result.missionData=m;
  if(creator&&creatorDelta){const cxp=num(creator,'xp')+creatorDelta;if(!Number.isSafeInteger(cxp))fail('numeric-overflow');tx.update(creatorRef,{xp:cxp,level:level(cxp),updated_at:new Date(now)});result.creatorXpDelta=creatorDelta;}
  for(const v of Object.values(patch))if(typeof v==='number'&&!Number.isSafeInteger(v))fail('numeric-overflow');
  if(postRef){result.postId=postRef.id;if(deleted){tx.delete(postRef);result.deleted=true;}else{tx.set(postRef,post);result.post=view(post,postRef.id,uid);}}
  if(activityRef)tx.set(activityRef,activityPatch,{merge:true});tx.update(actor,patch);tx.create(receipt,{fingerprint,result,createdAt:new Date(now)});return result;
 });
}
module.exports={types,validate,executeSocial,emojis,view,visible,missions,progress,level,safeLink};
