'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createServer}=require('./http.cjs');
async function fixture(fn,options={}){
 let verifies=0,transactions=0;
 const server=createServer({auth:{verifyIdToken:async(token,revoked)=>{verifies++;assert.equal(revoked,true);if(token!=='valid')throw Error('PRIVATE ERROR');return {uid:'actual-user'};}},db:{collection:()=>({doc:uid=>{assert.equal(uid,'actual-user');return {collection:()=>({doc:()=>({})})};}}),runTransaction:async()=>{transactions++;throw Error('SECRET FIRESTORE STACK');}},...options});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const address=`http://127.0.0.1:${server.address().port}`;
 try{await fn(address,()=>({verifies,transactions}));}finally{await new Promise(resolve=>server.close(resolve));}
}
const post=(url,body,token='valid')=>fetch(url+'/v1/economy',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
const command={operationId:'operation_123456789012345',command:{type:'summon'}};
test('health works, unsupported route denied, requests require token verification',()=>fixture(async(url,counts)=>{
 assert.equal((await fetch(url+'/health')).status,200);assert.equal((await fetch(url+'/v1/economy')).status,404);
 const missing=await fetch(url+'/v1/economy',{method:'POST'});assert.equal(missing.status,401);
 const bad=await post(url,command,'wrong');assert.equal(bad.status,401);assert.deepEqual(await bad.json(),{error:'unauthenticated'});assert.equal(counts().transactions,0);
}));
test('forged UID/body/currency/invalid command rejected before writes',()=>fixture(async url=>{
 assert.equal((await post(url,{...command,uid:'other-user'})).status,400);
 assert.equal((await post(url,'{broken')).status,400);
 assert.equal((await post(url,{...command,command:{type:'summon',gold:999999}})).status,409);
}));
test('SDK failures redact secrets and use token UID, never payload UID',()=>fixture(async url=>{
 const r=await post(url,command);assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(await r.json(),{error:'service-unavailable'});
}));
test('oversized body, wrong content type, and per-user throttling',()=>fixture(async url=>{
 const wrong=await fetch(url+'/v1/economy',{method:'POST',headers:{Authorization:'Bearer valid'},body:'{}'});assert.equal(wrong.status,415);
 assert.equal((await post(url,'x'.repeat(9000))).status,413);
 assert.equal((await post(url,command)).status,429);
},{limit:1}));
