'use strict';
const {test,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),fs=require('node:fs');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');
global.IS_REACT_ACT_ENVIRONMENT=true;
const ids=require('../services/economy/quiz-ai.cjs').models;let store,identity,view,tree,requests,generated;
const original=global.fetch;
function load(file){const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=name=>{
 if(name==='expo-secure-store')return {isAvailableAsync:async()=>true,getItemAsync:async k=>store.get(k)||null,setItemAsync:async(k,v)=>{store.set(k,v);},deleteItemAsync:async k=>{store.delete(k);},WHEN_UNLOCKED_THIS_DEVICE_ONLY:'device'};
 if(name==='expo-crypto')return {CryptoDigestAlgorithm:{SHA256:'sha256'},digestStringAsync:async(_,uid)=>uid};
 if(name==='../auth/AuthProvider')return {useAuth:()=>({user:identity})};
 if(name==='@react-native-firebase/auth')return {getAuth:()=>({currentUser:identity})};
 if(name==='./gemini')return {MODEL_IDS:ids,generate:async(...args)=>{generated.push(args);return 'OK';}};
 if(name==='./quizTransport')return load(path.join(path.dirname(file),'quizTransport.ts'));
 return req(name);
 };m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}
const operation={operationId:'quiz_request_123456789012345',command:{type:'quizStart',title:'Naruto'}};
async function mount(uid='alice'){identity={uid};const api=load(path.join(__dirname,'../apps/mobile/src/ai/AIProvider.tsx'));await act(async()=>{tree=create(React.createElement(api.AIProvider,null,React.createElement(function Probe(){view=api.useAI();return null;})));await new Promise(r=>setImmediate(r));});}
beforeEach(()=>{store=new Map([['gemini.v1.alice',JSON.stringify({key:'owner-one-test-key',model:'gemini-2.5-flash',enabled:true})]]);requests=[];generated=[];tree=null;global.fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,status:200,json:async()=>({result:{type:'quizStart'}})};};});
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());global.fetch=original;});
test('one saved provider serves Sensei and Quiz, secret not exposed on context or command body',async()=>{
 await mount();assert(view.ready&&view.hasKey);assert.equal('key' in view,false);assert.equal('getKey' in view,false);const signal=new AbortController().signal;
 await view.ask('Hello',signal);assert.equal(generated[0][0],'owner-one-test-key');
 await view.requestQuiz(operation,'firebase-token',signal);const r=requests[0];assert.equal(r.url,'https://anime-meta-hub-economy.onrender.com/v1/economy');assert.equal(r.opts.headers['x-amh-ai-key'],'owner-one-test-key');assert.equal(r.opts.headers['x-amh-ai-model'],'gemini-2.5-flash');assert(!r.opts.body.includes('owner-one-test-key'));assert(!r.url.includes('owner-one-test-key'));assert.equal(r.opts.redirect,'error');
});
test('save/replacement and global model selection take effect for both AI paths; delete stops later key transmission',async()=>{
 await mount();const oldBroker=view.requestQuiz;await act(async()=>view.save({model:'gemini-2.5-flash-lite',enabled:true},'replacement-test-key'));const signal=new AbortController().signal;
 await oldBroker(operation,'token',signal);assert.equal(requests[0].opts.headers['x-amh-ai-key'],'replacement-test-key');assert.equal(requests[0].opts.headers['x-amh-ai-model'],'gemini-2.5-flash-lite');await view.ask('Hi',signal);assert.equal(generated[0][0],'replacement-test-key');
 await act(async()=>view.remove());assert.equal(view.hasKey,false);await view.requestQuiz(operation,'token',signal);assert.equal(requests[1].opts.headers['x-amh-ai-key'],undefined);assert.equal(store.has('gemini.v1.alice'),false);await assert.rejects(view.ask('Hi',signal));
});
test('disabled provider never transmits saved key; switched UID cannot transmit old owner key',async()=>{
 await mount();const oldBroker=view.requestQuiz;await act(async()=>view.save({model:'gemini-2.5-flash',enabled:false},''));await oldBroker(operation,'token',new AbortController().signal);assert.equal(requests[0].opts.headers['x-amh-ai-key'],undefined);
 identity={uid:'bob'};await assert.rejects(view.requestQuiz(operation,'token',new AbortController().signal));assert.equal(requests.length,1);
});
test('broker refuses non-AI operations rather than attaching key to purchases/reads/skips',async()=>{
 await mount();for(const command of [{type:'summon'},{type:'arenaView'},{type:'quizAnswer',skip:true}])await assert.rejects(view.requestQuiz({...operation,command},'token',new AbortController().signal));assert.equal(requests.length,0);
});
