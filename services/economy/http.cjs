'use strict';
const http=require('node:http');
const {execute}=require('./transaction.cjs');
const {EconomyError}=require('./domain.cjs');
function createHandler({auth,db,limit=60,enabled=false}){
 const windows=new Map();
 return async(req,res)=>{
  const send=(status,payload)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));};
  if(req.method==='GET'&&req.url==='/health')return send(200,{ok:true});
  if(req.method!=='POST'||req.url!=='/v1/economy')return send(404,{error:'not-found'});
  if(!enabled)return send(503,{error:'economy-not-enabled'});
  const match=/^Bearer ([^\s]+)$/.exec(req.headers.authorization||'');
  if(!match)return send(401,{error:'unauthenticated'});
  let identity;
  try{identity=await auth.verifyIdToken(match[1],true);}catch{return send(401,{error:'unauthenticated'});}
  if(!identity?.uid)return send(401,{error:'unauthenticated'});
  if(!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{error:'json-required'});
  // Process-local backstop only. Production hosting must also enforce global quotas/abuse controls.
  const now=Date.now();
  for(const [uid,item]of windows)if(item.until<=now)windows.delete(uid);
  const window=windows.get(identity.uid)||{until:now+60000,count:0};
  if(++window.count>limit)return send(429,{error:'rate-limited'});
  windows.set(identity.uid,window);
  try{
   let bytes=0,body='';
   for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>8192)return send(413,{error:'request-too-large'});body+=chunk;}
   let parsed;try{parsed=JSON.parse(body);}catch{return send(400,{error:'invalid-json'});}
   if(!parsed||Array.isArray(parsed)||Object.keys(parsed).some(k=>!['operationId','command'].includes(k)))return send(400,{error:'invalid-request'});
   const result=await execute({db,verifiedUid:identity.uid,operationId:parsed.operationId,command:parsed.command});
   return send(200,{result});
  }catch(error){
   if(error instanceof EconomyError)return send(409,{error:error.code});
   // Do not leak token, credentials, profile data, SDK exception or stack traces.
   return send(503,{error:'service-unavailable'});
  }
 };
}
function createServer(deps){return http.createServer(createHandler(deps));}
module.exports={createHandler,createServer};
