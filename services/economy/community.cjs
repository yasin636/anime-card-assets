'use strict';
const {createHash}=require('node:crypto');
const {EconomyError,txRun}=require('./domain.cjs');
const {missions,level}=require('./social.cjs');
const {loadCatalog}=require('./news.cjs');
const fail=code=>{throw new EconomyError(code);};
const missionRules={m_news:{key:'newsRead',goal:5,gold:70,xp:20,gems:5},m_posts:{key:'postsCreated',goal:2,gold:50,xp:15,gems:5},m_social:{key:'socialActions',goal:10,gold:50,xp:20,gems:5},m_tracker:{key:'animeAdded',goal:3,gold:90,xp:30,gems:8},m_community:{key:'communityActions',goal:3,gold:250,xp:40,gems:10}};
const fields={communityView:[],trackerAdd:['title'],trackerEpisode:['trackerId'],trackerEpisodeSet:['trackerId','episode'],trackerRemove:['trackerId'],communityMissionClaim:['missionId'],newsCatalog:[],newsReadStart:['articleId'],newsReadClaim:['sessionId'],newsReadCancel:['sessionId']},types=Object.keys(fields);
function validate(c){
 if(!c||!Object.hasOwn(fields,c.type)||Object.keys(c).some(k=>k!=='type'&&!fields[c.type].includes(k))||fields[c.type].some(k=>!Object.hasOwn(c,k)))fail('invalid-command');
 if(c.type==='trackerEpisodeSet'&&(!Number.isSafeInteger(c.episode)||c.episode<1||c.episode>100000))fail('tracker-episode-invalid');
 if(c.type==='trackerAdd'&&(typeof c.title!=='string'||!c.title.trim()||c.title.length>200))fail('tracker-title-invalid');
 if(fields[c.type].includes('trackerId')&&!((typeof c.trackerId==='number'&&Number.isSafeInteger(c.trackerId))||(typeof c.trackerId==='string'&&c.trackerId.length>0&&c.trackerId.length<=160)))fail('invalid-command-field');
 if(c.type==='communityMissionClaim'&&!Object.hasOwn(missionRules,c.missionId))fail('invalid-command');
 if(c.type==='newsReadStart'&&(typeof c.articleId!=='string'||!/^news-[1-9]\d{0,10}$/.test(c.articleId)))fail('invalid-command');
 if(fields[c.type].includes('sessionId')&&(typeof c.sessionId!=='string'||!/^read_[a-f0-9]{40}$/.test(c.sessionId)))fail('invalid-command-field');
}
function amount(p,k){const n=p[k]??0;if(!Number.isSafeInteger(n)||n<0)fail('invalid-profile-number');return n;}
function readingCount(p,date){return p.last_read_date===date?amount(p,'daily_read_count'):0;}
function trackerPlan(p,c,now){
 if(p.tracker!==undefined&&!Array.isArray(p.tracker))fail('tracker-legacy-invalid');const tracker=[...(p.tracker||[])];
 if(c.type==='trackerAdd'){
  const title=c.title.trim();if(tracker.some(t=>String(t?.title||'').trim().toLowerCase()===title.toLowerCase()))fail('tracker-duplicate');
  let id=now;for(const t of tracker)if(typeof t?.id==='number')id=Math.max(id,t.id+1);if(!Number.isSafeInteger(id))fail('numeric-overflow');tracker.unshift({id,title,episode:1});
 }else{
  const matches=tracker.map((t,i)=>t?.id===c.trackerId?i:-1).filter(i=>i>=0);if(matches.length!==1)fail(matches.length?'tracker-id-ambiguous':'tracker-not-found');const i=matches[0];
  if(c.type==='trackerRemove')tracker.splice(i,1);else{const n=c.type==='trackerEpisodeSet'?c.episode:Number(tracker[i].episode||0)+1;if(!Number.isSafeInteger(n)||n<1)fail('numeric-overflow');tracker[i]={...tracker[i],episode:n};}
 }
 if(Buffer.byteLength(JSON.stringify({...p,tracker}))>850000)fail('profile-too-large');return tracker;
}
async function executeCommunity({db,verifiedUid:uid,operationId,command:c,now=Date.now(),catalog=loadCatalog}){
 validate(c);const ref=db.collection('user_meta').doc(uid),date=new Date(now).toISOString().slice(0,10),base={type:c.type,communityCapability:'community-v1',serverNow:now};
 if(c.type==='communityView'||c.type==='newsCatalog'){
  const me=await ref.get();if(!me.exists)fail('profile-not-found');const p=me.data();if(c.type==='newsCatalog')return {...base,...await catalog(),dailyReads:readingCount(p,date),date};
  if(p.tracker!==undefined&&!Array.isArray(p.tracker))fail('tracker-legacy-invalid');
  return {...base,tracker:p.tracker||[],missionData:missions(p,date),dailyReads:readingCount(p,date),date,activeReadId:typeof p.activeNewsReadId==='string'?p.activeNewsReadId:''};
 }
 const receipt=ref.collection('economy_receipts').doc(operationId),fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(c).sort()))).digest('hex');
 let article;
 if(c.type==='newsReadStart'){
  const saved=await receipt.get();if(saved.exists){if(saved.data().fingerprint!==fingerprint)fail('operation-id-conflict');return saved.data().result;}
  article=(await catalog()).articles.find(a=>a.id===c.articleId);if(!article)fail('news-article-unavailable');
 }
 const newId=`read_${createHash('sha256').update(uid+':'+operationId).digest('hex').slice(0,40)}`;
 return txRun(db,async tx=>{
  const saved=await tx.get(receipt);if(saved.exists){if(saved.data().fingerprint!==fingerprint)fail('operation-id-conflict');return saved.data().result;}
  const me=await tx.get(ref);if(!me.exists)fail('profile-not-found');const p=me.data(),m=missions(p,date),patch={},result={...base,xpDelta:0};
  if(c.type.startsWith('tracker')){patch.tracker=trackerPlan(p,c,now);result.tracker=patch.tracker;if(c.type==='trackerAdd')m.progress.animeAdded=Math.min(3,Math.max(0,Number(m.progress.animeAdded)||0)+1);}
  else if(c.type==='communityMissionClaim'){
   const rule=missionRules[c.missionId];if(m.claimed[c.missionId])fail('community-mission-claimed');if(Number(m.progress[rule.key]||0)<rule.goal)fail('community-mission-incomplete');
   const xp=amount(p,'xp')+rule.xp;patch.xp=xp;patch.level=level(xp);patch.gold=amount(p,'gold')+rule.gold;patch.gems=amount(p,'gems')+rule.gems;m.claimed[c.missionId]=true;result.reward={xp:rule.xp,gold:rule.gold,gems:rule.gems};result.xpDelta=rule.xp;
  }else if(c.type==='newsReadStart'){
   if(readingCount(p,date)>=5)fail('news-daily-limit');const read={id:newId,articleId:article.id,title:article.title,startedAt:now,notBefore:now+10000,expiresAt:now+120000,status:'active'};
   tx.create(ref.collection('news_sessions').doc(newId),read);patch.activeNewsReadId=newId;result.read=read;
  }else{
   if(p.activeNewsReadId!==c.sessionId)fail('news-read-not-active');const sessionRef=ref.collection('news_sessions').doc(c.sessionId),savedSession=await tx.get(sessionRef);if(!savedSession.exists)fail('news-read-not-active');const s=savedSession.data();if(s.status!=='active')fail('news-read-not-active');
   if(c.type==='newsReadCancel'){tx.update(sessionRef,{status:'cancelled'});patch.activeNewsReadId='';result.cancelled=true;}
   else{
    if(now<s.notBefore)fail('news-too-early');if(now>s.expiresAt)fail('news-read-expired');const count=readingCount(p,date);if(count>=5)fail('news-daily-limit');
    const xp=amount(p,'xp')+10;patch.xp=xp;patch.level=level(xp);patch.daily_read_count=count+1;patch.last_read_date=date;patch.activeNewsReadId='';m.progress.newsRead=Math.min(5,Math.max(0,Number(m.progress.newsRead)||0)+1);result.xpDelta=10;result.dailyReads=count+1;result.articleId=s.articleId;tx.update(sessionRef,{status:'claimed',claimedAt:now});
   }
  }
  for(const value of Object.values(patch))if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<0))fail('numeric-overflow');
  patch.missionData=m;patch.updated_at=new Date(now);result.missionData=m;tx.update(ref,patch);tx.create(receipt,{fingerprint,result,createdAt:new Date(now)});return result;
 });
}
module.exports={types,validate,trackerPlan,missionRules,readingCount,executeCommunity};
