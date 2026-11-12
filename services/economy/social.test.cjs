'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validate,visible,view,missions,progress,level,safeLink}=require('./social.cjs');
test('strict Social commands reject forged ownership, rewards, admin, clock and unsafe links',()=>{
 for(const extra of [{uid:'victim'},{xp:1000},{isAdmin:true},{created_at_ms:0},{gold:900}])assert.throws(()=>validate({type:'feedCreate',caption:'হ্যালো',linkUrl:'',...extra}));
 for(const url of ['javascript:alert(1)','file:///etc/passwd','https://user:pass@example.com'])assert.throws(()=>validate({type:'feedCreate',caption:'Hello',linkUrl:url}));
 for(const type of ['feedLike','feedComment','feedDelete'])assert.throws(()=>validate({type,postId:'a/b'}));
 assert.throws(()=>validate({type:'feedLike',postId:'abc',liked:1}));assert.throws(()=>validate({type:'feedReact',postId:'abc',emoji:'😈'}));assert.throws(()=>validate({type:'feedCreate',caption:' '.repeat(4),linkUrl:''}));assert.throws(()=>validate({type:'socialMissionClaim',missionId:'m_news'}));
 validate({type:'feedCreate',caption:'বাংলা post',linkUrl:'https://example.com/anime'});assert(safeLink('https://example.com'));assert(!safeLink('javascript:x'));
});
test('Social projection exposes no private fields, other liker maps or unknown reaction groups',()=>{
 const p={uid:'owner',username:'Hunter',email:'SECRET',xp:5000,inventoryCards:['private'],created_at_ms:1000,likedBy:{alice:true,bob:true},reactions:{'❤️':['alice','bob'],private:['uid']},comments:[{id:'c',uid:'bob',username:'B',text:'Hello',private:'secret'}]};
 const r=view(p,'p','alice');assert(r.liked);assert.equal(r.reaction,'❤️');assert.equal(r.reactions['❤️'],2);assert(!('email'in r));assert(!('likedBy'in r));assert(!('private'in r.comments[0]));assert(!JSON.stringify(r).includes('secret'));assert(!('private'in r.reactions));
});
test('seven-day boundary hides not deletes; UTC missions bounded and unrelated progress preserved',()=>{
 assert(!visible({created_at_ms:0},7*86400000));assert(visible({created_at_ms:1},7*86400000));assert(visible({isAdmin:true,created_at_ms:0},9e12));
 const m=missions({},'2026-11-08');for(let i=0;i<20;i++)progress(m,'socialActions');assert.equal(m.progress.socialActions,10);assert.equal(m.progress.postsCreated,0);
 assert.equal(missions({missionData:m},'2026-11-09').progress.socialActions,0);assert.equal(missions({missionData:m},m.date).progress.socialActions,10);
 assert.equal(level(99),2);assert.equal(level(100),3);assert.equal(level(Number.MAX_SAFE_INTEGER),100);
});

function socialDB(){
 const store=new Map([['user_meta/u',{username:'Hunter',xp:100}],['user_meta/owner',{xp:0}],['feed_posts/p',{uid:'owner',created_at_ms:90000,socialVersion:1,comments:[{id:'root',uid:'owner',username:'Owner',text:'Root',createdAtMs:90000}]}]]);
 const ref=path=>({path,id:path.split('/').at(-1),collection:n=>({doc:id=>ref(`${path}/${n}/${id}`)})});
 const snap=r=>({exists:store.has(r.path),data:()=>structuredClone(store.get(r.path))});
 return {store,collection:n=>({doc:id=>ref(`${n}/${id}`)}),runTransaction:async fn=>{const writes=[];const result=await fn({get:async r=>snap(r),set:(r,v)=>writes.push(()=>store.set(r.path,structuredClone(v))),create:(r,v)=>writes.push(()=>{assert(!store.has(r.path));store.set(r.path,structuredClone(v));}),update:(r,v)=>writes.push(()=>store.set(r.path,{...store.get(r.path),...structuredClone(v)})),delete:r=>writes.push(()=>store.delete(r.path))});writes.forEach(w=>w());return result;}};
}
const socialRun=(db,command,operationId,verifiedUid='u')=>require('./social.cjs').executeSocial({db,command,operationId,verifiedUid,now:100000});
test('comment reply validates parent and receipts reward exactly once; nested reply stays under root',async()=>{
 const db=socialDB(),command={type:'feedCommentReply',postId:'p',commentId:'root',text:'Reply'};
 const a=await socialRun(db,command,'reply_one');await socialRun(db,command,'reply_one');assert.equal(db.store.get('user_meta/u').xp,110);assert.equal(db.store.get('user_meta/owner').xp,3);
 const reply=a.post.comments.find(c=>c.text==='Reply');assert.equal(reply.parentId,'root');
 const b=await socialRun(db,{...command,commentId:reply.id,text:'Nested'},'reply_two');assert.equal(b.post.comments.at(-1).parentId,'root');
 await assert.rejects(socialRun(db,{...command,commentId:'missing'},'missing'),/social-comment-unavailable/);
 await assert.rejects(socialRun(db,{...command,text:'Different'},'reply_one'),/operation-id-conflict/);
});
test('comment reactions toggle/switch, receipt retry does not toggle twice and projection hides UID maps',async()=>{
 const db=socialDB(),command={type:'feedCommentReact',postId:'p',commentId:'root',emoji:'❤️'};
 let a=await socialRun(db,command,'react_one');await socialRun(db,command,'react_one');assert.equal(a.post.comments[0].reactions['❤️'],1);assert.equal(a.post.comments[0].reaction,'❤️');assert(!JSON.stringify(a.post.comments[0].reactions).includes('"u"'));assert.equal(db.store.get('user_meta/u').xp,100);
 a=await socialRun(db,{...command,emoji:'🔥'},'react_two');assert.equal(a.post.comments[0].reactions['❤️'],0);assert.equal(a.post.comments[0].reactions['🔥'],1);
 a=await socialRun(db,{...command,emoji:'🔥'},'react_three');assert.equal(a.post.comments[0].reaction,'');
 await assert.rejects(socialRun(db,{...command,commentId:'missing'},'missing'),/social-comment-unavailable/);
 for(const extra of [{uid:'owner'},{parentId:'root'},{xp:1000}])assert.throws(()=>validate({...command,...extra}));assert.throws(()=>validate({...command,emoji:'bad'}));
});
test('reply ownership enforced; deleting parent retains others replies and deducts only once',async()=>{
 const db=socialDB();const r=await socialRun(db,{type:'feedCommentReply',postId:'p',commentId:'root',text:'Retain me'},'reply');const reply=r.post.comments.at(-1);
 await assert.rejects(socialRun(db,{type:'feedCommentDelete',postId:'p',commentId:reply.id},'foreign_delete','owner'),/social-not-owner/);
 await assert.rejects(socialRun(db,{type:'feedCommentEdit',postId:'p',commentId:reply.id,text:'forged'},'foreign_edit','owner'),/social-not-owner/);
 const cmd={type:'feedCommentDelete',postId:'p',commentId:'root'};const deleted=await socialRun(db,cmd,'delete_root','owner');await socialRun(db,cmd,'delete_root','owner');assert.equal(deleted.post.comments.length,1);assert.equal(deleted.post.comments[0].parentId,'');assert.equal(deleted.post.comments[0].text,'Retain me');assert.equal(db.store.get('user_meta/owner').xp,0);
});
