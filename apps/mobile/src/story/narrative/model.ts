import script from './script.json';
import {StorySession} from '../types';
export type JournalEntry={id:string;title:string;text:string;chapter:number;kind:'scene'|'choice'|'echo'|'battle';at:number};
export type Archive={version:1;entries:JournalEntry[];seen:string[];choices:Record<string,string>};
export const emptyArchive=():Archive=>({version:1,entries:[],seen:[],choices:{}});
export const chapters=script.chapters;
export const enemyScript=script.enemies;
export function readArchive(raw:string|null):Archive{
 if(!raw)return emptyArchive();const a=JSON.parse(raw);
 if(a.version!==1||!Array.isArray(a.entries)||!Array.isArray(a.seen)||!a.choices||typeof a.choices!=='object'||Array.isArray(a.choices))throw Error('invalid-archive');
 if(a.entries.some((e:JournalEntry)=>!e||typeof e.id!=='string'||typeof e.title!=='string'||typeof e.text!=='string'||!Number.isFinite(e.at)||!Number.isInteger(e.chapter)||e.chapter<1||e.chapter>5||!['scene','choice','echo','battle'].includes(e.kind))||a.seen.some((id:unknown)=>typeof id!=='string')||Object.values(a.choices).some(c=>!['listen','resolve'].includes(String(c))))throw Error('invalid-archive');
 return {...a,entries:a.entries.slice(-120),seen:a.seen.slice(-80)};
}
export function remember(a:Archive,e:JournalEntry):Archive{return {...a,entries:[...a.entries.filter(old=>old.id!==e.id),e].slice(-120),seen:e.kind==='battle'?a.seen:[...new Set([...a.seen,e.id])].slice(-80)};}
export function authoredTalk(s:StorySession,choice?:string|null){
 const kind=s.dialogueKind as 'intro'|'mid'|'victory'|'defeat',authored=enemyScript[s.enemyId as keyof typeof enemyScript];
 const fallback=s.dialogue[s.dialogueIndex];if(!authored||!authored[kind])return fallback;
 const line=authored[kind][s.dialogueIndex]||fallback;
 if(kind==='mid'&&s.dialogueIndex===0){
  if(s.ariseUsed&&s.shadowIds.length){const reactions:Record<string,string>={kasaka:'তোমার পেছনে যারা দাঁড়িয়েছে... তাদের গন্ধ এই অন্ধকূপের। তুমি ওদের ফিরিয়ে এনেছ?',baran:'আমার প্রহরীরাও তোমার পাশে। ওদের ডেকেছ, না ওরাই তোমাকে বেছে নিয়েছে?',igris:'ওরা আদেশের অপেক্ষায় নেই। তোমার পাশে থাকার সিদ্ধান্ত নিয়েছে। এই পার্থক্যটাই দেখতে চেয়েছিলাম।',tusk:'আমার মন্দিরের সৈন্য তোমার পাশে দাঁড়ায় কী করে? নাম ফিরিয়ে দিয়েছ ওদের?',beru:'তোমার পেছনে এত উপস্থিতি। কেউ কাউকে ঠেলে সরাচ্ছে না। এই সেনাকে কী দিয়ে বেঁধেছ?'};return {speaker:'enemy',text:reactions[s.enemyId]||'তোমার Shadows-ও লড়ছে। তাহলে আজ তোমাকে একা ভাবা আমার ভুল ছিল।'};}
  if(s.log.filter(l=>l.includes('Guard')).length>=2)return {speaker:'enemy',text:'বারবার আঘাত ঠেকাচ্ছ। তুমি শুধু বাঁচতে চাইছ না—আমার ভুলের অপেক্ষা করছ।'};
  if(s.enemy.def===0)return {speaker:'enemy',text:'বর্মের ওপর ভরসা করে ভুল করেছি। এবার আমাদের মাঝখানে আর কিছু নেই।'};
 }
 if(kind==='intro'&&s.dialogueIndex===1&&choice)return {speaker:'system',text:choice==='listen'?'Gate-এর মুখে তুমি কথা শুনেছিলে। সেই নীরব সিদ্ধান্তের প্রতিধ্বনি এখানেও এসেছে—সামনের উপস্থিতিটা তোমার পদক্ষেপ মাপছে।':'Gate-এর মুখে এগিয়ে যাওয়ার কথা বলেছিলে। আজ সেই কথাই মনে পড়ল; ভয় যায়নি, তবু পা থামেনি।'};
 return line;
}
export function battleRecord(s:StorySession):JournalEntry{
 const outcome=s.phase==='claimed'?'জয় · reward claim সম্পন্ন':s.outcome==='win'?'জয় · reward claim বাকি':s.phase==='forfeited'?'Battle থেকে বেরিয়েছ':'পরাজয় · Story currency deduction নেই';
 const c=s.chronicle;
 const detail=c?` ${c.complete?'সম্পূর্ণ battle':'আংশিক record · version '+c.fromVersion+' থেকে'}: Strike ${c.strikes}, Heavy ${c.heavy}, Guard ${c.guards}, ARISE ${c.arises}। Player attacks ${c.playerAttempts}, crit ${c.playerCrits}, miss ${c.playerMisses}; enemy attacks ${c.enemyAttempts}, crit ${c.enemyCrits}, miss ${c.enemyMisses}। Actual damage dealt ${c.damageDealt}, taken ${c.damageTaken}; shield breaks enemy ${c.enemyShieldBreaks}, player ${c.playerShieldBreaks}।`:' Expanded counters এই পুরোনো record-এ নেই।';
 return {id:`battle:${s.id}`,chapter:s.chapterId,kind:'battle',title:s.enemy.name,text:`${outcome}।${detail} Server-recorded enemy turns: ${s.turn}। ARISE: ${s.ariseUsed?`${s.shadowIds.length}টি Shadow`:'ব্যবহার হয়নি'}।${s.reward?` Claim receipt: +${s.reward.xp} XP, +${s.reward.gold} Gold, +${s.reward.gems} Gems।`:''}`,at:Date.now()};
}
