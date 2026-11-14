'use strict';
const {randomInt,randomUUID,createHash}=require('node:crypto');
const {EconomyError,stats,cards,txRun}=require('./domain.cjs');
const {STORY_CHAPTERS:chapters,BOSS_DIALOGUES:dialogues}=require('../../docs/react-native-blueprint/reference/catalog.json');
const fail=code=>{throw new EconomyError(code);};
const types=['storyView','storyStart','storyAdvance','storyAction','storyArise','storyClaim','storyForfeit'];
const num=(p,k)=>{const n=p[k]??0;if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>Number.MAX_SAFE_INTEGER)fail('invalid-profile-number');return n;};
function validate(c){
 const fields={storyView:[],storyStart:['enemyId'],storyAdvance:['sessionId','version'],storyAction:['sessionId','version','action'],storyArise:['sessionId','version','shadowIds'],storyClaim:['sessionId','version'],storyForfeit:['sessionId','version']};
 if(!c||!Object.hasOwn(fields,c.type)||Object.keys(c).some(k=>k!=='type'&&!fields[c.type].includes(k))||fields[c.type].some(k=>!Object.hasOwn(c,k)))fail('invalid-command');
 if(c.type==='storyStart'&&!chapters.some(ch=>ch.enemies.some(e=>e.id===c.enemyId)))fail('invalid-story-enemy');
 if(c.type!=='storyStart'&&c.type!=='storyView'){
  if(typeof c.sessionId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(c.sessionId)||!Number.isSafeInteger(c.version)||c.version<0)fail('invalid-command');
 }
 if(c.type==='storyAction'&&!['strike','heavy','guard'].includes(c.action))fail('invalid-command');
 if(c.type==='storyArise'&&(!Array.isArray(c.shadowIds)||!c.shadowIds.length||c.shadowIds.length>11||c.shadowIds.some(id=>typeof id!=='string'||!chapters.some(ch=>ch.enemies.some(e=>e.id===id)))||new Set(c.shadowIds).size!==c.shadowIds.length))fail('invalid-shadows');
}
function power(p){
 const inv=p.inventoryCards||[];if(!Array.isArray(inv))fail('invalid-inventory');
 const total={hp:0,atk:0,def:0};for(const item of inv){const s=stats(cards.find(c=>c.id===item.id)||item);for(const k of Object.keys(total))total[k]+=s[k];}
 const result={};for(const [key,suffix]of [['hp','Hp'],['atk','Atk'],['def','Def']]){result[key]=Math.max(1,Math.round(total[key]*(1+num(p,'permBonus'+suffix)/100))+num(p,'flatBonus'+suffix));if(!Number.isSafeInteger(result[key]))fail('invalid-profile-number');}return result;
}
function eligible(p){return num(p,'xp')>=100&&Array.isArray(p.inventoryCards)&&p.inventoryCards.length>=3;}
function lookup(id){for(const ch of chapters){const enemy=ch.enemies.find(e=>e.id===id);if(enemy)return {ch,enemy};}fail('invalid-story-enemy');}
function lines(enemy,kind){return structuredClone(dialogues[enemy.id]?.[kind]||{
 intro:[{speaker:'enemy',text:`${enemy.name} আবির্ভূত হয়েছে! সতর্ক থাকো!`},{speaker:'player',text:'আরেকটি বাধা। দ্রুত শেষ করে ফেলি।'}],
 mid:[{speaker:'enemy',text:'তুমি আমার ভাবনার চেয়ে শক্তিশালী...'},{speaker:'player',text:'তুমি এখনো কিছু দেখনি।'}],victory:[{speaker:'player',text:'পরাজিত! Shadow Monarch-এর আরেকটি জয়।'}],defeat:[{speaker:'enemy',text:'দুর্বল! তুমি এই Dungeon-এর যোগ্য নও!'}]
 }[kind]);}
function dialogue(s,kind,next){s.phase='dialogue';s.dialogue=lines(s.enemy,kind);s.dialogueIndex=0;s.dialogueKind=kind;s.afterDialogue=next;}
function counters(complete=true,fromVersion=0){return {schema:1,complete,fromVersion,strikes:0,heavy:0,guards:0,arises:0,playerAttempts:0,playerCrits:0,playerMisses:0,enemyAttempts:0,enemyCrits:0,enemyMisses:0,damageDealt:0,damageTaken:0,enemyShieldBreaks:0,playerShieldBreaks:0};}
function start(p,enemyId,id,roll,now){
 if(!eligible(p))fail('story-entry-requirement');const {ch,enemy}=lookup(enemyId),st=power(p);
 return {id,version:0,chapterId:ch.id,enemyId,enemy:{...enemy,maxHp:enemy.hp,maxDef:enemy.def},player:{...st,maxHp:st.hp,maxDef:st.def},playerName:String(p.username||'Jin-Woo'),phase:'coin',first:roll<.5?'player':'enemy',notBefore:now+2500,dialogue:[],dialogueIndex:0,heavyCooldown:0,guard:false,midDone:false,enraged:false,ariseUsed:false,shadowIds:[],ariseBonus:{hp:0,atk:0,def:0},turn:0,events:[],log:[],rewardClaimed:false,chronicle:counters()};
}
function damage(atk,target){const before=target.hp,shield=target.def;target.hp=Math.max(0,target.hp-Math.max(1,Math.round(atk*(shield>0?.02:.05))));if(shield>0)target.def=Math.max(0,target.def-Math.max(1,Math.round(atk*.01)));return {damage:before-target.hp,shieldDamage:shield-target.def,shieldBreak:shield>0&&target.def===0};}
function attack(s,who,base,roll){
 const target=who==='player'?s.enemy:s.player,miss=roll<.05,crit=!miss&&roll<.15;
 const event={who,miss,crit,...(miss?{damage:0,shieldDamage:0,shieldBreak:false}:damage(crit?Math.round(base*2):base,target))};
 const c=s.chronicle;if(c){const own=who==='player';c[own?'playerAttempts':'enemyAttempts']++;if(miss)c[own?'playerMisses':'enemyMisses']++;if(crit)c[own?'playerCrits':'enemyCrits']++;c[own?'damageDealt':'damageTaken']+=event.damage;if(event.shieldBreak)c[own?'enemyShieldBreaks':'playerShieldBreaks']++;}
 s.events.push(event);s.log.push(`${who==='player'?'তুমি':s.enemy.name}: ${miss?'MISS':`${crit?'CRITICAL · ':''}−${event.damage} HP / −${event.shieldDamage} DEF`}${event.shieldBreak?' · SHIELD BREAK':''}`);s.log=s.log.slice(-40);
}
function end(s,won){s.outcome=won?'win':'lose';dialogue(s,won?'victory':'defeat',won?'victory':'defeat');}
function enemyTurn(s,roll){
 if(s.enemy.hp<=0){end(s,true);return;}
 const atk=s.guard?Math.round(s.enemy.atk*.5):s.enemy.atk;s.guard=false;attack(s,'enemy',atk,roll);s.turn++;
 if(s.player.hp<=0)end(s,false);else s.phase='fight';
}
function step(saved,c,{now=Date.now(),roll=.5,shadows=[]}={}){
 const s=structuredClone(saved);if(c.version!==s.version)fail('story-version-changed');s.events=[];if(!s.chronicle)s.chronicle=counters(false,s.version);
 if(c.type==='storyForfeit'){
  if(['victory','claimed'].includes(s.phase)||s.outcome==='win')fail('story-reward-pending');s.phase='forfeited';
 }else if(c.type==='storyAdvance'){
  if(s.phase==='coin'){if(now<s.notBefore)fail('story-too-early');dialogue(s,'intro',s.first==='enemy'?'enemy':'fight');}
  else if(s.phase==='dialogue'){
   if(++s.dialogueIndex>=s.dialogue.length){s.phase=s.afterDialogue;if(s.phase==='enemy')s.notBefore=now+500;}
  }else if(s.phase==='enemy'){if(now<s.notBefore)fail('story-too-early');enemyTurn(s,roll);}
  else fail('story-invalid-phase');
 }else if(c.type==='storyArise'){
  if(s.phase!=='fight')fail('story-invalid-phase');if(s.chapterId<2)fail('arise-chapter-locked');if(s.ariseUsed)fail('arise-already-used');
  const bonus={hp:0,atk:0,def:0};for(const id of c.shadowIds){if(!shadows.some(sh=>sh.id===id))fail('shadow-not-owned');const {enemy}=lookup(id);for(const k of Object.keys(bonus))bonus[k]+=Math.round(enemy[k]*.5);}
  if(!c.shadowIds.length)fail('invalid-shadows');for(const k of Object.keys(bonus)){s.player[k]+=bonus[k];if(!Number.isSafeInteger(s.player[k]))fail('invalid-profile-number');}s.player.maxHp+=bonus.hp;s.player.maxDef+=bonus.def;s.ariseUsed=true;s.shadowIds=c.shadowIds;s.ariseBonus=bonus;s.events=[{arise:true}];s.chronicle.arises++;
 }else if(c.type==='storyAction'){
  if(s.phase!=='fight')fail('story-invalid-phase');
  if(c.action==='guard'){s.chronicle.guards++;s.guard=true;s.log.push('🛡 Guard · পরের enemy attack অর্ধেক');s.phase='enemy';s.notBefore=now+600;}
  else{
   if(c.action==='heavy'){if(s.heavyCooldown>0)fail('heavy-cooldown');s.heavyCooldown=3;}else if(s.heavyCooldown>0)s.heavyCooldown--;
   s.chronicle[c.action==='heavy'?'heavy':'strikes']++;
   attack(s,'player',c.action==='heavy'?Math.round(s.player.atk*1.5):s.player.atk,roll);
   // Death takes priority: a defeated boss cannot enrage or attack after dialogue.
   if(s.enemy.hp<=0)end(s,true);
   else{
    if(s.enemy.isBoss&&!s.enraged&&s.enemy.hp<=s.enemy.maxHp*.2){s.enraged=true;s.enemy.atk=Math.round(lookup(s.enemyId).enemy.atk*1.5);s.events.push({enrage:true});s.log.push('BOSS ENRAGED · ATK +50%');}
    if(s.enemy.isBoss&&!s.midDone&&s.enemy.hp<=s.enemy.maxHp*.5){s.midDone=true;dialogue(s,'mid','enemy');}else{s.phase='enemy';s.notBefore=now+900;}
   }
  }
 }else fail('invalid-command');
 s.version++;s.log=s.log.slice(-40);return s;
}
function rewards(enemyId,first){const {ch,enemy}=lookup(enemyId),r=ch.reward;
 return first?(enemy.isBoss?{xp:r.xp,gold:r.gold,gems:r.gems,permAtk:r.permAtk,permHp:r.permHp,permDef:r.permDef}:{xp:Math.max(1,Math.round(r.xp*.05)),gold:Math.max(1,Math.round(r.gold*.05)),gems:0,permAtk:0,permHp:0,permDef:0}):{xp:enemy.isBoss?Math.round(r.xp*.3):Math.max(1,Math.round(r.xp*.05*.3)),gold:0,gems:0,permAtk:0,permHp:0,permDef:0};}
async function executeStory({db,verifiedUid:uid,operationId,command:c}){
 validate(c);const user=db.collection('user_meta').doc(uid),sessions=user.collection('story_sessions'),army=user.collection('shadows'),clears=user.collection('story_clears');
 if(c.type==='storyView'){
  const profile=await user.get();if(!profile.exists)fail('profile-not-found');const p=profile.data();const [sh,cl,session]=await Promise.all([army.get(),clears.get(),p.activeStoryId?sessions.doc(p.activeStoryId).get():null]);
  return {type:c.type,storyCapability:'story-v1',chronicleCapability:'chronicle-v1',story:session?.exists?session.data():null,shadows:sh.docs.map(d=>d.data()),cleared:cl.docs.map(d=>d.id),storyPower:power(p),storyEligible:eligible(p)};
 }
 const receipt=user.collection('economy_receipts').doc(operationId),fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(c).sort()))).digest('hex'),id=randomUUID(),roll=randomInt(0,2**32)/2**32;
 return txRun(db,async tx=>{
  const old=await tx.get(receipt);if(old.exists){if(old.data().fingerprint!==fingerprint)fail('operation-id-conflict');return old.data().result;}
  const profile=await tx.get(user);if(!profile.exists)fail('profile-not-found');const p=profile.data();let s,patch={},reward=null,firstClear=false;
  const sessionRef=sessions.doc(c.type==='storyStart'?id:c.sessionId);
  if(c.type==='storyStart'){if(p.activeStoryId)fail('story-already-active');s=start(p,c.enemyId,id,roll,Date.now());patch.activeStoryId=id;}
  else{
   if(p.activeStoryId!==c.sessionId)fail('story-not-active');const stored=await tx.get(sessionRef);if(!stored.exists)fail('story-not-active');const saved=stored.data();if(c.version!==saved.version)fail('story-version-changed');
   if(c.type==='storyClaim'){
    if(saved.phase!=='victory'||saved.rewardClaimed)fail('story-not-victory');const clear=await tx.get(clears.doc(saved.enemyId));firstClear=!clear.exists;reward=rewards(saved.enemyId,firstClear);s={...saved,phase:'claimed',rewardClaimed:true,version:saved.version+1,reward,firstClear};
    patch={activeStoryId:'',xp:num(p,'xp')+reward.xp,gold:num(p,'gold')+reward.gold,gems:num(p,'gems')+reward.gems,permBonusAtk:num(p,'permBonusAtk')+reward.permAtk,permBonusHp:num(p,'permBonusHp')+reward.permHp,permBonusDef:num(p,'permBonusDef')+reward.permDef};if(saved.enemy.isBoss&&firstClear)patch.dungeonConqueror=true;
   }else{
    let shadows=[];if(c.type==='storyArise'){const records=await Promise.all(c.shadowIds.map(sh=>tx.get(army.doc(sh))));shadows=records.filter(d=>d.exists).map(d=>({id:d.id}));}
    s=step(saved,c,{roll,now:Date.now(),shadows});if(['forfeited','defeat'].includes(s.phase))patch.activeStoryId='';
   }
  }
  for(const [k,v]of Object.entries(patch))if(typeof v==='number'&&(!Number.isSafeInteger(v)||v<0))fail('invalid-profile-number');
  // Shadow is earned at server-confirmed victory, before the explicit reward claim.
  if(s.outcome==='win'){const {enemy}=lookup(s.enemyId);tx.set(army.doc(enemy.id),{...enemy,catalogVersion:1});}
  if(firstClear)tx.create(clears.doc(s.enemyId),{enemyId:s.enemyId,sessionId:s.id,claimedAt:new Date(),catalogVersion:1});
  tx.set(sessionRef,s);if(Object.keys(patch).length)tx.update(user,patch);
  const result={type:c.type,story:s,...(reward?{reward,firstClear}:{})};tx.create(receipt,{fingerprint,result,createdAt:new Date()});return result;
 });
}
module.exports={types,validate,power,eligible,lookup,lines,start,damage,step,rewards,counters,executeStory};
