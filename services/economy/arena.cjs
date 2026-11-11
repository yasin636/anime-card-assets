'use strict';
const {randomInt,randomUUID,createHash}=require('node:crypto');
const {EconomyError,cards,stats}=require('./domain.cjs');
const fail=code=>{throw new EconomyError(code);};
const amount=(p,key)=>{const n=p[key]??0;if(!Number.isSafeInteger(n)||n<0)fail('invalid-profile-number');return n;};
const wheel=[['LOSE',0,0],['2x XP',40,0],['10 XP',10,0],['JACKPOT',100,0],['BANKRUPT',-20,0],['50 XP',50,0],['3x XP',60,0],['FREE',0,1]];
const types=['arenaView','leaderboardView','publicProfile','wheelSpin','battleStart','battleTurn','battleForfeit','weeklyClaim','quizStart','quizAnswer','quizClose'];
function validate(c){
 const fields={arenaView:[],leaderboardView:[],publicProfile:['uid'],wheelSpin:[],battleStart:['instanceIds'],battleTurn:['battleId','instanceId'],battleForfeit:['battleId'],weeklyClaim:[],quizStart:['title'],quizAnswer:['quizId','answer','skip','questionIndex'],quizClose:['quizId']};
 if(!c||!Object.hasOwn(fields,c.type)||Object.keys(c).some(k=>k!=='type'&&!fields[c.type].includes(k)))fail('invalid-command');
 if(c.type==='battleStart'&&(!Array.isArray(c.instanceIds)||c.instanceIds.length<3||new Set(c.instanceIds).size!==c.instanceIds.length||c.instanceIds.some(i=>typeof i!=='string'||!i||i.length>160)))fail('select-at-least-three-unique-cards');
 for(const k of ['battleId','instanceId','quizId','uid'])if(fields[c.type].includes(k)&&(typeof c[k]!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(c[k])))fail('invalid-command-field');
 if(c.type==='quizStart'&&(typeof c.title!=='string'||!c.title.trim()||c.title.length>120))fail('invalid-anime-title');
 if(c.type==='quizAnswer'&&(typeof c.answer!=='string'||c.answer.length>1000||typeof c.skip!=='boolean'||!Number.isInteger(c.questionIndex)||c.questionIndex<0||c.questionIndex>4))fail('invalid-answer');
}
function spin(p,index){
 const free=amount(p,'freeSpins')>0,fee=free?0:20,xp=amount(p,'xp');if(xp<fee)fail('insufficient-xp');
 const [label,reward,extra]=wheel[index];
 const patch={xp:Math.max(0,xp-fee+reward),freeSpins:amount(p,'freeSpins')-(free?1:0)+extra};
 return {patch,result:{type:'wheelSpin',index,label,fee,reward,xpDelta:patch.xp-xp,freeSpins:patch.freeSpins}};
}
function hit(target,damage){
 if(target.def>0){target.hp=Math.max(0,target.hp-Math.round(damage*2/3));target.def=Math.max(0,target.def-Math.round(damage/3));}
 else target.hp=Math.max(0,target.hp-damage);
}
function outcome(b){
 if(b.player.hp<=0)return 'lose';if(b.enemy.hp<=0)return 'win';
 if(b.player.cards.every(c=>c.used)&&b.enemy.cards.every(c=>c.used))return b.player.hp>=b.enemy.hp?'win':'lose';
 return '';
}
function enemyTurn(b){const card=b.enemy.cards.find(c=>!c.used);if(!card)return;card.used=true;const damage=Math.round(card.atk*.5);hit(b.player,damage);b.log.push(`AI: ${card.name} → ${damage}`);}
function team(list){return {hp:2*list.reduce((n,c)=>n+c.hp,0),def:list.reduce((n,c)=>n+c.def,0),cards:list.map(c=>({...c,used:false}))};}
function startBattle(p,ids,id,random=randomInt){
 const list=p.inventoryCards||[];const selected=ids.map(instanceId=>{const owned=list.filter(c=>c.instanceId===instanceId);if(owned.length!==1)fail('instance-not-unique-or-owned');const raw=owned[0],base=cards.find(c=>c.id===raw.id);if(!base)fail('unknown-legacy-card');return {...base,...stats(raw),instanceId};});
 const ai=selected.map((c,i)=>{const pool=cards.filter(a=>a.rarity===c.rarity);return {...pool[random(pool.length)],instanceId:`ai_${i}`};});
 const b={id,status:'active',player:team(selected),enemy:team(ai),log:[],first:random(2)===0?'player':'enemy'};
 if(b.first==='enemy')enemyTurn(b);const ended=outcome(b);if(ended){b.status='finished';b.outcome=ended;}return b;
}
function turn(original,instanceId){
 const b=structuredClone(original);if(b.status!=='active')fail('battle-ended');
 const card=b.player.cards.find(c=>c.instanceId===instanceId&&!c.used);if(!card)fail('card-already-used-or-missing');
 card.used=true;const damage=Math.round(card.atk*.5);hit(b.enemy,damage);b.log.push(`You: ${card.name} → ${damage}`);
 let result=outcome(b);if(!result){enemyTurn(b);result=outcome(b);}
 // If the AI started, its final attack can leave player cards exhausted first.
 while(!result&&b.player.cards.every(c=>c.used)&&b.enemy.cards.some(c=>!c.used)){enemyTurn(b);result=outcome(b);}
 if(result){b.status='finished';b.outcome=result;}
 return b;
}
function weekKey(now=new Date()){
 // Owner release explicitly uses Asia/Dhaka (UTC+06), Sunday start.
 const local=new Date(now.getTime()+6*3600000);local.setUTCDate(local.getUTCDate()-local.getUTCDay());return local.toISOString().slice(0,10);
}
function publicRow(doc,index){const p=doc.data();return {uid:doc.id,rank:index+1,username:String(p.username||'Hunter').slice(0,100),avatar:String(p.avatar||'').slice(0,4096),xp:typeof p.xp==='number'?p.xp:0,equippedTheme:typeof p.equippedTheme==='string'?p.equippedTheme:''};}
function publicFeatured(data){
 const projected={};
 for(const slot of ['legendary-1','legendary-2','rare-1','rare-2','common-1','common-2']){
  const raw=data.equippedSlots?.[slot];if(!raw||typeof raw.id!=='string')continue;
  const base=cards.find(c=>c.id===raw.id);
  if(!base){projected[slot]={id:raw.id.slice(0,160),name:String(raw.name||raw.id).slice(0,100),rarity:'unknown'};continue;}
  const power=stats(raw);projected[slot]={id:base.id,name:base.name,rarity:base.rarity,image:base.image,...power};
 }
 return projected;
}
function publicBadge(gems){return gems>=2000?'Mythic Meta Hub':gems>=1000?'Diamond Rinnegan':gems>=600?'Golden Shuriken':gems>=300?'Silver Katana':gems>=100?'Copper Kunai':'';}
function sanitizeQuiz(q){return {id:q.id,title:q.title,index:q.index,total:q.questions.length,correct:q.correct,wrong:q.wrong,skipped:q.skipped,status:q.status,question:q.status==='active'?{question:q.questions[q.index].question,hint:q.questions[q.index].hint}:null};}
const {generateQuiz,judgeQuiz}=require('./quiz-ai.cjs');
async function executeArena({db,verifiedUid:uid,operationId,command:c,ai}){
 validate(c);const ref=db.collection('user_meta').doc(uid),sessions=ref.collection('arena_sessions'),receipt=ref.collection('economy_receipts').doc(operationId);
 if(c.type==='publicProfile'){
  const snap=await db.collection('user_meta').doc(c.uid).get();if(!snap.exists)fail('profile-not-found');
  const data=snap.data();const {rank,...identity}=publicRow(snap,0);return {type:c.type,publicProfile:{...identity,Bio:typeof data.Bio==='string'?data.Bio.slice(0,2000):'',badge:publicBadge(Number(data.gems)||0),featuredSlots:publicFeatured(data)}};
 }
 if(c.type==='leaderboardView'){const board=await db.collection('user_meta').orderBy('xp','desc').limit(10).get();const owner=await ref.get(),week=weekKey();return {type:c.type,leaderboard:board.docs.map(publicRow),week,weeklyClaimed:owner.exists&&owner.data().weeklyRewardClaimed===week};}
 if(c.type==='arenaView'){
  const p=(await ref.get()).data();if(!p)fail('profile-not-found');
  const board=await db.collection('user_meta').orderBy('xp','desc').limit(10).get();
  let battle=null,quiz=null;if(p.activeBattleId){const snap=await sessions.doc(p.activeBattleId).get();if(snap.exists)battle=snap.data();}
  if(p.activeQuizId){const snap=await sessions.doc(p.activeQuizId).get();if(snap.exists)quiz=sanitizeQuiz(snap.data());}
  return {type:c.type,leaderboard:board.docs.map(publicRow),week:weekKey(),battle,quiz,quizAvailable:true,quizCredentialMode:'user-provider',weeklyClaimed:p.weeklyRewardClaimed===weekKey()};
 }
 const fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(c).sort()))).digest('hex');
 // Existing receipt checked before costly provider calls. Transaction rechecks for races.
 const old=await receipt.get();if(old.exists){if(old.data().fingerprint!==fingerprint)fail('operation-id-conflict');return old.data().result;}
 const id=randomUUID(),index=randomInt(8);let questions=null,verdict=null,judgedIndex=-1;
 if(c.type==='quizStart'){const owner=await ref.get();if(!owner.exists)fail('profile-not-found');if(owner.data().activeQuizId)fail('quiz-already-active');questions=await generateQuiz(c.title.trim(),ai);}
 if(c.type==='quizAnswer'&&!c.skip){
  const snap=await sessions.doc(c.quizId).get();if(!snap.exists||snap.data().status!=='active')fail('quiz-ended');
  const q=snap.data();if(q.index!==c.questionIndex)fail('quiz-question-changed');judgedIndex=q.index;verdict=await judgeQuiz(q.questions[q.index],c.answer,ai);
 }
 return db.runTransaction(async tx=>{
  const existing=await tx.get(receipt);if(existing.exists){if(existing.data().fingerprint!==fingerprint)fail('operation-id-conflict');return existing.data().result;}
  const snap=await tx.get(ref);if(!snap.exists)fail('profile-not-found');const p=snap.data();let patch={},result={type:c.type},sessionRef=null,session=null;
  if(c.type==='wheelSpin')({patch,result}=spin(p,index));
  else if(c.type==='battleStart'){
   if(p.activeBattleId)fail('battle-already-active');if(amount(p,'gold')<400)fail('insufficient-gold');
   session=startBattle(p,c.instanceIds,id);sessionRef=sessions.doc(id);patch={gold:amount(p,'gold')-400,activeBattleId:id};
   if(session.status==='finished'){const win=session.outcome==='win';result.reward={gold:win?800:200,gems:win?10:2,xp:win?30:10};patch={gold:patch.gold+result.reward.gold,gems:amount(p,'gems')+result.reward.gems,xp:amount(p,'xp')+result.reward.xp,activeBattleId:''};}
   result.battle=session;
  }else if(c.type==='battleTurn'||c.type==='battleForfeit'){
   if(p.activeBattleId!==c.battleId)fail('battle-not-active');sessionRef=sessions.doc(c.battleId);const saved=await tx.get(sessionRef);if(!saved.exists)fail('battle-not-active');
   if(c.type==='battleForfeit'){session={...saved.data(),status:'forfeited'};patch={activeBattleId:''};}
   else {session=turn(saved.data(),c.instanceId);if(session.status==='finished'){
    const win=session.outcome==='win';patch={activeBattleId:'',gold:amount(p,'gold')+(win?800:200),gems:amount(p,'gems')+(win?10:2),xp:amount(p,'xp')+(win?30:10)};
    result.reward={gold:win?800:200,gems:win?10:2,xp:win?30:10};
   }}result.battle=session;
  }else if(c.type==='weeklyClaim'){
   const week=weekKey();if(p.weeklyRewardClaimed===week)fail('weekly-already-claimed');
   const top=await tx.get(db.collection('user_meta').orderBy('xp','desc').limit(3));const rank=top.docs.findIndex(d=>d.id===uid);if(rank<0)fail('not-top-three');
   const [gold,gems,xp]=[[500,30,50],[300,20,30],[100,10,15]][rank];patch={gold:amount(p,'gold')+gold,gems:amount(p,'gems')+gems,xp:amount(p,'xp')+xp,weeklyRewardClaimed:week};result.reward={gold,gems,xp};result.rank=rank+1;result.week=week;result.weeklyClaimed=true;
  }else if(c.type==='quizStart'){
   if(p.activeQuizId)fail('quiz-already-active');session={id,title:c.title.trim(),questions,index:0,correct:0,wrong:0,skipped:0,status:'active'};sessionRef=sessions.doc(id);patch={activeQuizId:id};result.quiz=sanitizeQuiz(session);
  }else if(c.type==='quizAnswer'||c.type==='quizClose'){
   if(p.activeQuizId!==c.quizId)fail('quiz-not-active');sessionRef=sessions.doc(c.quizId);const saved=await tx.get(sessionRef);if(!saved.exists)fail('quiz-not-active');session=saved.data();if(session.status!=='active')fail('quiz-ended');
   if(c.type==='quizClose'){session.status='closed';patch={activeQuizId:''};}
   else{
    if(session.index!==c.questionIndex||(!c.skip&&session.index!==judgedIndex))fail('quiz-question-changed');
    const q=session.questions[session.index],correct=!c.skip&&verdict.correct,delta=c.skip?-15:correct?10:-10;
    patch={xp:Math.max(0,amount(p,'xp')+delta)};session.index++;session[c.skip?'skipped':correct?'correct':'wrong']++;
    result.feedback={correct,answer:q.answer,explanation:c.skip?'Skipped':verdict.explanation,fallback:!!verdict?.fallback,xpDelta:patch.xp-amount(p,'xp')};
    if(session.index===5){session.status='finished';const gems=session.correct===5?10:session.correct===4?5:0;patch.gems=amount(p,'gems')+gems;patch.activeQuizId='';result.gems=gems;
     // Claim progress only for a complete quiz, UTC date, bounded source goal3.
     const date=new Date().toISOString().slice(0,10),m=p.missionData;
     const current=m?.date===date?m:{date,progress:{newsRead:0,postsCreated:0,socialActions:0,animeAdded:0,communityActions:0},claimed:{m_news:false,m_posts:false,m_social:false,m_tracker:false,m_community:false}};
     patch.missionData={...current,progress:{...current.progress,communityActions:Math.min(3,Number(current.progress?.communityActions||0)+1)}};
    }
   }result.quiz=sanitizeQuiz(session);
  }
  for(const v of Object.values(patch))if(typeof v==='number'&&(!Number.isSafeInteger(v)||v<0))fail('numeric-overflow');
  if(sessionRef)tx.set(sessionRef,session);if(Object.keys(patch).length)tx.update(ref,patch);
  tx.create(receipt,{fingerprint,result,createdAt:new Date()});return result;
 });
}
module.exports={types,executeArena,spin,wheel,hit,startBattle,turn,weekKey,sanitizeQuiz,validate,publicFeatured};
