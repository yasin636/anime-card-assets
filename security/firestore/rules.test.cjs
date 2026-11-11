'use strict';
const {test,before,after}=require('node:test');
const {readFileSync}=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,updateDoc,getDoc,getDocs,collection,deleteDoc,serverTimestamp,Timestamp}=require('firebase/firestore');
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-anime-meta-hub',firestore:{rules:readFileSync('firestore.rules','utf8')}});});
after(async()=>{await env?.cleanup();});
const db=uid=>uid?env.authenticatedContext(uid,{email:uid+'@example.com'}).firestore():env.unauthenticatedContext().firestore();
function profile(uid){return {
 uid,email:uid+'@example.com',username:'Hunter',avatar:'https://example.com/avatar.png',Bio:'',
 xp:0,level:1,gold:0,gems:0,inventoryCards:[],equippedSlots:{},inventory:{themes:[]},equippedTheme:'',tracker:[],recentChats:[],freeSpins:0,
 pityRare:0,pityLegendary:0,permBonusAtk:0,permBonusHp:0,permBonusDef:0,flatBonusAtk:0,flatBonusHp:0,flatBonusDef:0,
 storyRulesShown:false,dungeonConqueror:false,last_claim_date:Timestamp.fromMillis(0),daily_read_count:0,last_read_date:'',
 missionData:{date:'',progress:{newsRead:0,postsCreated:0,socialActions:0,animeAdded:0,communityActions:0},claimed:{m_news:false,m_posts:false,m_social:false,m_tracker:false,m_community:false}},
 created_at:serverTimestamp(),updated_at:serverTimestamp()
};}
async function seed(uid){await env.withSecurityRulesDisabled(async ctx=>{await setDoc(doc(ctx.firestore(),'user_meta',uid),{...profile(uid),gold:5418,xp:3964,gems:318,legacyUnknown:'preserve'});});}
test('exact zero-balance signup succeeds; owner reads missing/existing profile',async()=>{
 const uid='signup',ref=doc(db(uid),'user_meta',uid);
 await assertSucceeds(getDoc(ref));await assertSucceeds(setDoc(ref,profile(uid)));await assertSucceeds(getDoc(ref));
});
test('signup cannot mint rewards, insert unknown fields, forge email, or omit defaults',async()=>{
 for(const [i,patch]of [{gold:1},{inventoryCards:[{id:'fake'}]},{admin:true},{email:'other@example.com'},{freeSpins:1},{permBonusAtk:1},{missionData:{}},{created_at:Timestamp.fromMillis(0)}].entries()){
 const uid='bad'+i;await assertFails(setDoc(doc(db(uid),'user_meta',uid),{...profile(uid),...patch}));
 }
 const p=profile('missing');delete p.gems;await assertFails(setDoc(doc(db('missing'),'user_meta','missing'),p));
});
test('existing balances and unknown legacy fields survive allowed profile edits',async()=>{
 const uid='legacy';await seed(uid);const ref=doc(db(uid),'user_meta',uid);
 await assertSucceeds(updateDoc(ref,{username:'New',Bio:'Hello',avatar:'https://example.com/2.png',updated_at:serverTimestamp()}));
 const result=(await getDoc(ref)).data();require('node:assert/strict').equal(result.gold,5418);require('node:assert/strict').equal(result.legacyUnknown,'preserve');
 await assertFails(updateDoc(ref,{username:'',updated_at:serverTimestamp()}));
 await assertFails(updateDoc(ref,{Bio:'x'.repeat(2001),updated_at:serverTimestamp()}));
 await assertFails(deleteDoc(ref));
});
test('every protected economy field rejects owner tampering',async()=>{
 const uid='protected';await seed(uid);const ref=doc(db(uid),'user_meta',uid);
 for(const [field,value]of Object.entries({gold:99999,gems:999,xp:99999,level:100,inventoryCards:[{}],equippedSlots:{a:'fake'},inventory:{themes:['naruto']},equippedTheme:'naruto',pityRare:100,pityLegendary:100,flatBonusAtk:900,flatBonusHp:900,flatBonusDef:900,permBonusAtk:900,permBonusHp:900,permBonusDef:900,dungeonConqueror:true,activeStoryId:'fake',freeSpins:9,uid:'another',email:'another@example.com',legacyUnknown:'changed'})){
 await assertFails(updateDoc(ref,{[field]:value,updated_at:serverTimestamp()}));
 }
 await assertFails(setDoc(ref,profile(uid)));
});
test('anonymous and cross-account access, queries, receipts and arbitrary collections denied',async()=>{
 const uid='private';await seed(uid);
 for(const actor of [null,'attacker']){
 const ref=doc(db(actor),'user_meta',uid);await assertFails(getDoc(ref));await assertFails(updateDoc(ref,{gold:999}));await assertFails(deleteDoc(ref));
 }
 await assertFails(getDocs(collection(db(uid),'user_meta')));
 for(const path of ['user_meta/private/economy_receipts/operation_123456789012345','user_meta/private/story_sessions/session','user_meta/private/shadows/beru','user_meta/private/story_clears/beru','unreviewed/data']){
 const ref=doc(db(uid),path);await assertFails(getDoc(ref));await assertFails(setDoc(ref,{result:{gold:999}}));
 }
});
test('trusted Admin-equivalent bypass can write protected data and receipt',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>{
 await assertSucceeds(setDoc(doc(ctx.firestore(),'user_meta','server'),{gold:900}));
 await assertSucceeds(setDoc(doc(ctx.firestore(),'user_meta/server/economy_receipts/op'),{fingerprint:'trusted'}));
 });
});

test('6A social documents, quota and rewards remain server-only for owners and other clients',async()=>{
 for(const path of ['feed_posts/social_rules','post_activity/social-rules','user_meta/social-rules/economy_receipts/social_receipt']){
  const ref=doc(db('social-rules'),path);await assertFails(setDoc(ref,{uid:'social-rules',caption:'mint',xp:999,isAdmin:true}));await assertFails(getDoc(ref));await assertFails(deleteDoc(ref));
 }
 await assertFails(getDocs(collection(db('social-rules'),'feed_posts')));
});

test('6B DM, Global, unread, recent and presence stay server-only; no signed-in catch-all',async()=>{
 for(const path of ['direct_chats/alice_bob','direct_chats/alice_bob/messages/private','global_messages/global-msg']){
  const ref=doc(db('alice'),path);await assertFails(setDoc(ref,{senderId:'alice',text:'forge',participants:['alice','bob']}));await assertFails(getDoc(ref));await assertFails(deleteDoc(ref));
 }
 const uid='chat-rules';await seed(uid);for(const patch of [{online:true,lastSeenMs:999},{recentChats:['victim']},{presenceSession:'forged'},{missionData:{progress:{communityActions:3}}}])await assertFails(updateDoc(doc(db(uid),'user_meta',uid),{...patch,updated_at:serverTimestamp()}));
});
test('6C direct client tracker, reward, mission and read-session forgery denied',async()=>{
 const uid='community-denial';await seed(uid);const own=db(uid);
 for(const patch of [{tracker:[{id:1,title:'Forged',episode:1}]},{daily_read_count:5,last_read_date:'2026-11-08'},{activeNewsReadId:'forged'},{missionData:{date:'2026-11-08',progress:{newsRead:5},claimed:{}}}])await assertFails(updateDoc(doc(own,'user_meta',uid),patch));
 const session=doc(own,'user_meta',uid,'news_sessions','forged');await assertFails(setDoc(session,{status:'claimed',notBefore:0}));await assertFails(getDoc(session));await assertFails(deleteDoc(session));
});
test('6D upload sessions, quotas and cleanup tasks cannot be read or forged by mobile clients',async()=>{
 const uid='media-denial';await seed(uid);const own=db(uid);
 for(const name of ['media_uploads','media_limits','media_cleanup']){
  const r=doc(own,'user_meta',uid,name,'forged');await assertFails(getDoc(r));await assertFails(setDoc(r,{status:'ready',asset:{url:'https://evil.example/image.jpg'}}));await assertFails(deleteDoc(r));
 }
 await assertFails(updateDoc(doc(own,'user_meta',uid),{avatarMedia:{uploadId:'forged',publicId:'someone-else'}}));
});
