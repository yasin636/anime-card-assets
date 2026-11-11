'use strict';
// Real React hooks with mocked native storage/auth/network; not physical-device QA.
const {test,beforeEach,afterEach}=require('node:test');const assert=require('node:assert/strict');
const path=require('node:path'),Module=require('node:module'),fs=require('node:fs');
const mobileRequire=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json'));
const React=mobileRequire('react'),{create,act}=mobileRequire('react-test-renderer'),ts=mobileRequire('typescript');
global.IS_REACT_ACT_ENVIRONMENT=true;
const filename=path.join(__dirname,'../apps/mobile/src/collection/EconomyProvider.tsx');
let store,identity,context,tree,view,listener,requests,send,storageFails,tokenHook,quizSender;
const storage={getItem:async key=>store.get(key)||null,setItem:async(k,v)=>{if(storageFails)throw Error('storage unavailable');store.set(k,v);},removeItem:async k=>{store.delete(k);}};
const originalFetch=global.fetch;
function load(){
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));
 mod.require=name=>{
  if(name==='react-native')return {AppState:{addEventListener:(_,fn)=>{listener=fn;return {remove:()=>{listener=null;}};}}};
  if(name==='@react-native-async-storage/async-storage')return storage;
  if(name==='expo-crypto')return {randomUUID:require('node:crypto').randomUUID};
  if(name==='@react-native-firebase/auth')return {getAuth:()=>({currentUser:identity})};
  if(name==='../ai/AIProvider')return {useAI:()=>({requestQuiz:(...args)=>quizSender(...args)})};
  if(name==='../auth/AuthProvider')return {useAuth:()=>context};
  return mobileRequire(name);
 };
 mod._compile(code,filename);return mod.exports;
}
let api;
const user=uid=>({uid,getIdToken:async()=>{if(tokenHook)await tokenHook();return `token-${uid}`;}});
const ok=(payload,status=200)=>({ok:status>=200&&status<300,status,json:async()=>payload});
async function settle(){await new Promise(resolve=>setImmediate(resolve));}
async function mount(uid){identity=user(uid);context={user:identity,profile:{uid}};await act(async()=>{tree=create(React.createElement(api.EconomyProvider,{key:uid},React.createElement(function Probe(){view=api.useEconomy();return null;})));await settle();});}
async function unmount(){if(tree){await act(async()=>{tree.unmount();await settle();});tree=null;}}
beforeEach(()=>{
 quizSender=async()=>{throw Error('unexpected AI call');};store=new Map();requests=[];storageFails=false;tokenHook=null;view=null;tree=null;listener=null;
 process.env.EXPO_PUBLIC_ECONOMY_API_URL='';
 process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL='https://example.com';
 send=async(url,opts)=>url.endsWith('/status')?ok({profileReadable:true,mutationsAllowed:true}):ok({result:{type:JSON.parse(opts.body).command.type}});
 global.fetch=async(url,opts)=>{requests.push({url,opts});return send(url,opts);};api=load();
});
afterEach(async()=>{await unmount();global.fetch=originalFetch;delete process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL;});
test('cold launch and foreground auto-check only GET; no persisted authority or spending',async()=>{
 await mount('alice');assert.equal(view.configured,true);assert(requests.every(r=>!r.opts.method));assert.equal(store.size,0);
 await act(async()=>{listener('active');await settle();});assert.equal(requests.length,2);assert.equal(store.size,0);
 await unmount();send=async()=>ok({profileReadable:true,mutationsAllowed:false});await mount('alice');assert.equal(view.configured,false);assert.equal(store.size,0);
});
test('failed response retains operation before request; cold relaunch retries identical id once',async()=>{
 await mount('alice');let original;
 send=async(url,opts)=>{if(url.endsWith('/status'))return ok({profileReadable:true,mutationsAllowed:true});assert(store.has('economy.pending.v1.alice'));original=JSON.parse(opts.body);return ok({error:'service-unavailable'},503);};
 await act(async()=>{await view.run({type:'summon'});});assert(view.pending);assert.equal(view.pending.operationId,original.operationId);
 await unmount();await mount('alice');assert.equal(view.pending.operationId,original.operationId);
 send=async(url,opts)=>{assert.deepEqual(JSON.parse(opts.body),original);return ok({result:{type:'summon'}});};
 await act(async()=>{await view.run();});assert.equal(view.pending,null);assert.equal(store.has('economy.pending.v1.alice'),false);assert.equal(view.result.type,'summon');
});
test('switching accounts never replays another account pending request or authority',async()=>{
 await mount('alice');send=async()=>ok({error:'service-unavailable'},503);await act(async()=>{await view.run({type:'summon'});});const pending=store.get('economy.pending.v1.alice');
 await unmount();send=async()=>ok({profileReadable:true,mutationsAllowed:false});await mount('bob');assert.equal(view.pending,null);assert.equal(view.configured,false);
 const count=requests.length;await act(async()=>{await view.run();});assert.equal(requests.length,count);assert.equal(store.get('economy.pending.v1.alice'),pending);
});
test('storage failure sends no mutation; request must persist before spending',async()=>{
 await mount('alice');storageFails=true;const count=requests.length;await act(async()=>{await view.run({type:'summon'});});assert.equal(requests.length,count);assert.equal(view.pending,null);
});
test('account switch while fetching token cancels sending old-account command',async()=>{
 await mount('alice');tokenHook=async()=>{identity=user('bob');};const count=requests.length;
 await act(async()=>{await view.run({type:'summon'});});assert.equal(requests.length,count);assert(store.has('economy.pending.v1.alice'));
});
test('definitive command conflict clears pending, revoked access disables spending but retains uncertain pending',async()=>{
 await mount('alice');send=async()=>ok({error:'insufficient-gold'},409);await act(async()=>{await view.run({type:'summon'});});assert.equal(view.pending,null);
 send=async()=>ok({error:'owner-test-only'},403);await act(async()=>{await view.run({type:'summon'});});assert(view.pending);assert.equal(view.configured,false);
});
test('malformed stored pending fails closed without silently deleting it or spending',async()=>{
 store.set('economy.pending.v1.alice','{broken');await mount('alice');assert.equal(view.ready,false);assert(view.error);assert.equal(requests.length,0);assert.equal(store.get('economy.pending.v1.alice'),'{broken');
});

test('Quiz retries use ephemeral broker credentials while persisted operation contains no key',async()=>{
 await mount('alice');let transientKey='first-test-key',firstId;
 quizSender=async(operation)=>{
  const persisted=store.get('economy.pending.v1.alice');assert(persisted);assert(!persisted.includes('test-key'));assert.deepEqual(JSON.parse(persisted),operation);
  if(!firstId)firstId=operation.operationId;else assert.equal(operation.operationId,firstId);
  return transientKey==='first-test-key'?ok({error:'service-unavailable'},503):ok({result:{type:'quizStart'}});
 };
 await act(async()=>view.run({type:'quizStart',title:'Naruto'}));assert(view.pending);assert(!JSON.stringify(view.pending).includes(transientKey));
 transientKey='replacement-test-key';await act(async()=>view.run());assert.equal(view.pending,null);assert.equal(view.result.type,'quizStart');
});

test('Story ARISE/claim uses no AI credential and retries exact persisted session/version after relaunch',async()=>{
 for(const command of [{type:'storyArise',sessionId:'story-test-session',version:4,shadowIds:['goblin']},{type:'storyClaim',sessionId:'story-test-session',version:8}]){
  send=async()=>ok({profileReadable:true,mutationsAllowed:true});await mount('alice');let operation;
  send=async(url,opts)=>{if(url.endsWith('/status'))return ok({profileReadable:true,mutationsAllowed:true});operation=JSON.parse(opts.body);assert.deepEqual(operation.command,command);assert(!Object.keys(opts.headers).some(k=>k.startsWith('x-amh-ai')));assert.equal(store.get('economy.pending.v1.alice'),opts.body);return ok({error:'service-unavailable'},503);};
  await act(async()=>view.run(command));assert(view.pending);await unmount();await mount('alice');
  send=async(url,opts)=>{assert.deepEqual(JSON.parse(opts.body),operation);return ok({result:{type:command.type,story:{id:command.sessionId,version:command.version+1}}});};
  await act(async()=>view.run());assert.equal(view.pending,null);assert.equal(view.result.story.version,command.version+1);await unmount();
 }
});
