'use strict';
const {test,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');global.IS_REACT_ACT_ENVIRONMENT=true;
let store,identity,tree,view,requests,send,listeners,storageFails,configured,tokenHook;const originalFetch=global.fetch;
function load(file=path.join(__dirname,'../apps/mobile/src/chat/ChatProvider.tsx')){const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=name=>{
 if(name==='react-native')return {AppState:{currentState:'active',addEventListener:(_,fn)=>{listeners.add(fn);return {remove:()=>listeners.delete(fn)};}}};
 if(name==='@react-native-async-storage/async-storage')return {getItem:async key=>store.get(key)||null,setItem:async(key,v)=>{if(storageFails)throw Error('storage unavailable');store.set(key,v);},removeItem:async key=>store.delete(key)};
 if(name==='expo-crypto')return {randomUUID:require('node:crypto').randomUUID};
 if(name==='@react-native-firebase/auth')return {getAuth:()=>({currentUser:identity})};
 if(name==='../auth/AuthProvider')return {useAuth:()=>({user:identity})};if(name==='../collection/EconomyProvider')return {useEconomy:()=>({configured})};
 if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.ts'));return req(name);
 };m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}
const ok=(payload,status=200)=>({ok:status>=200&&status<300,status,json:async()=>payload});const settle=()=>new Promise(r=>setImmediate(r));let api;
async function mount(uid){identity={uid,getIdToken:async()=>{if(tokenHook)await tokenHook();return `token-${uid}`;}};await act(async()=>{tree=create(React.createElement(api.ChatProvider,{key:uid},React.createElement(function Probe(){view=api.useChat();return null;})));await settle();});}
async function unmount(){if(tree){await act(async()=>{tree.unmount();await settle();});tree=null;}}
beforeEach(()=>{store=new Map();requests=[];listeners=new Set();storageFails=false;configured=true;tokenHook=null;process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL='https://example.com';send=async(_url,opts)=>{const {command:c}=JSON.parse(opts.body);return ok({result:{type:c.type,chatCapability:'chat-v1',serverNow:Date.now(),inbox:[],recent:[],totalUnread:0}});};global.fetch=async(url,opts)=>{requests.push({url,opts});return send(url,opts);};api=load();});
afterEach(async()=>{await unmount();global.fetch=originalFetch;delete process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL;});
test('Chat cold launch only reads inbox/presence, never sends text, and cleanup removes heartbeat listeners',async()=>{
 await mount('alice');assert(view.ready);assert(requests.some(r=>JSON.parse(r.opts.body).command.type==='chatInbox'));assert(!requests.some(r=>JSON.parse(r.opts.body).command.type==='chatSend'));assert.equal(store.size,0);await unmount();assert.equal(listeners.size,0);assert(requests.some(r=>JSON.parse(r.opts.body).command.online===false));
});
test('Message persists before POST, 503 retains identical ID across relaunch, retry once clears only own pending',async()=>{
 await mount('alice');let original;send=async(_url,opts)=>{const body=JSON.parse(opts.body);if(body.command.type==='chatSend'){assert(store.has('chat.pending.v1.alice'));original=body;return ok({error:'service-unavailable'},503);}return ok({result:{type:body.command.type,chatCapability:'chat-v1',serverNow:Date.now(),inbox:[],recent:[]}});};
 await act(async()=>{await view.mutate({type:'chatSend',peerId:'bob',text:'hello'});});assert(view.pending);const id=view.pending.operationId;await unmount();await mount('alice');assert.equal(view.pending.operationId,id);
 send=async(_url,opts)=>{const body=JSON.parse(opts.body);if(body.command.type==='chatSend')assert.deepEqual(body,original);return ok({result:{type:body.command.type,chatCapability:'chat-v1',serverNow:Date.now(),inbox:[],recent:[]}});};
 await act(async()=>{await view.mutate();});assert.equal(view.pending,null);assert.equal(store.has('chat.pending.v1.alice'),false);
});
test('Storage failure sends no message; definitive 409 clears pending; another account cannot replay it',async()=>{
 await mount('alice');storageFails=true;await act(async()=>{await view.mutate({type:'chatGlobalSend',text:'hi'});});assert(!requests.some(r=>JSON.parse(r.opts.body).command.type==='chatGlobalSend'));storageFails=false;
 send=async(_url,opts)=>{const c=JSON.parse(opts.body).command;return c.type==='chatGlobalSend'?ok({error:'service-unavailable'},503):ok({result:{type:c.type,chatCapability:'chat-v1',serverNow:Date.now(),inbox:[],recent:[]}});};await act(async()=>{await view.mutate({type:'chatGlobalSend',text:'hi'});});const saved=store.get('chat.pending.v1.alice');await unmount();await mount('bob');assert.equal(view.pending,null);assert.equal(store.get('chat.pending.v1.alice'),saved);
 await unmount();await mount('alice');send=async()=>ok({error:'chat-not-owner'},409);await act(async()=>{await view.mutate();});assert.equal(view.pending,null);assert.equal(store.has('chat.pending.v1.alice'),false);
});
test('Foreground/background presence commands carry ordered lease sequence; no token saved in local storage',async()=>{
 await mount('alice');await act(async()=>{for(const fn of listeners)fn('background');await settle();});assert.equal(view.foreground,false);
 await act(async()=>{for(const fn of listeners)fn('active');await settle();});assert.equal(view.foreground,true);
 const commands=requests.map(r=>JSON.parse(r.opts.body).command).filter(c=>c.type==='chatPresence');assert(commands.length>=3);assert(commands[1].sequence>commands[0].sequence);assert.equal(commands[1].online,false);assert.equal(commands[2].online,true);assert.equal(store.size,0);
});
test('Wrong-account token transition sends no user read after awaiting token',async()=>{
 await mount('alice');tokenHook=async()=>{identity={uid:'bob',getIdToken:async()=>'bob'};};const count=requests.length;await assert.rejects(view.read({type:'chatGlobal',before:''}));assert.equal(requests.length,count);
});
