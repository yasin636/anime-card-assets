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
