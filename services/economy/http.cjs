'use strict';
const http=require('node:http');
const {execute}=require('./transaction.cjs');
const {EconomyError}=require('./domain.cjs');
function createHandler({auth,db,limit=60,enabled=false,testUids=[]}){
 const windows=new Map();
 const testers=new Set(testUids.filter(uid=>typeof uid==='string'&&uid&&!uid.includes('/')));
 return async(req,res)=>{
  const send=(status,payload)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));};
  if(req.method==='GET'&&req.url==='/health')return send(200,{ok:true});
  const probe=req.method==='GET'&&req.url==='/v1/economy/status';
  if(!probe&&(req.method!=='POST'||req.url!=='/v1/economy'))return send(404,{error:'not-found'});
  if(!probe&&!enabled&&!testers.size)return send(503,{error:'economy-not-enabled'});
  const match=/^Bearer ([^\s]+)$/.exec(req.headers.authorization||'');
  if(!match)return send(401,{error:'unauthenticated'});
  let identity;
  try{identity=await auth.verifyIdToken(match[1],true);}catch{return send(401,{error:'unauthenticated'});}
  if(!identity?.uid)return send(401,{error:'unauthenticated'});
  const allowed=enabled||testers.has(identity.uid);
  if(!probe&&!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{error:'json-required'});
  // Process-local backstop only. Production hosting must also enforce global quotas/abuse controls.
  const now=Date.now();
  for(const [uid,item]of windows)if(item.until<=now)windows.delete(uid);
  const window=windows.get(identity.uid)||{until:now+60000,count:0};
  if(++window.count>limit)return send(429,{error:'rate-limited'});
  windows.set(identity.uid,window);
  if(probe){
   try{
    const profile=await db.collection('user_meta').doc(identity.uid).get();
    if(!profile.exists)return send(409,{error:'profile-not-found'});
    return send(200,{profileReadable:true,mutationsAllowed:allowed,mode:enabled?'enabled':allowed?'owner-test':'disabled'});
   }catch{return send(503,{error:'service-unavailable'});}
  }
  if(!allowed)return send(403,{error:'owner-test-only'});

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
