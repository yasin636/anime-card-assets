'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validate,chatId,checkParent,user,message,cursor}=require('./chat.cjs');
test('Chat strict schema rejects impersonation, forged time/unread/reward, self chosen channel and bad text',()=>{
 for(const extra of [{senderId:'victim'},{createdAtMs:1},{unread:0},{xp:50},{senderAdmin:true},{chatId:'other'}])assert.throws(()=>validate({type:'chatSend',peerId:'peer',text:'হ্যালো',...extra}));
 assert.throws(()=>validate({type:'chatSend',peerId:'../other',text:'x'}));assert.throws(()=>validate({type:'chatGlobalSend',text:' '}));assert.throws(()=>validate({type:'chatGlobalSend',text:'x'.repeat(2001)}));assert.throws(()=>validate({type:'chatGlobalReact',messageId:'m',emoji:'😈'}));assert.throws(()=>validate({type:'chatPresence',online:true,sessionId:'x',sequence:-1}));
 validate({type:'chatSend',peerId:'abc',text:'বাংলা message'});assert.equal(chatId('b','a'),'a_b');
});
test('Parent membership, cursors and case-safe public projections never expose private metadata',()=>{
 assert.throws(()=>checkParent({participants:['a','b']},'a','c'));checkParent({participants:['a','b']},'b','a');assert.deepEqual(cursor('123:abc'),{at:123,id:'abc'});assert.throws(()=>cursor('123:../secret'));
 const p={username:'Hunter',xp:100,gems:30,online:true,lastSeenMs:100,email:'SECRET',gold:999,inventoryCards:['private']};const u=user(p,'owner',70101);assert.equal(u.online,false);assert(!('email'in u));assert(!('gold'in u));assert.equal(user(p,'owner',200).online,true);
 const m=message({senderId:'a',text:'hello',reactions:{'❤️':['a','b'],'🔥':['a']},private:'SECRET'},'msg','a');assert.deepEqual(m.selected,['❤️','🔥']);assert.equal(m.reactions['❤️'],2);assert(!JSON.stringify(m).includes('SECRET'));assert(!JSON.stringify(m.reactions).includes('"a"'));
});
