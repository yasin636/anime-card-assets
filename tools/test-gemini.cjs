const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const {test}=require('node:test');const ts=require('../apps/mobile/node_modules/typescript');
const file=path.resolve(__dirname,'../apps/mobile/src/ai/gemini.ts');const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const compiled=new Module(file,module);compiled.filename=file;compiled.paths=Module._nodeModulePaths(path.dirname(file));function loadTs(file){const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=n=>{if(n.startsWith('.')){const f=path.resolve(path.dirname(file),n);if(fs.existsSync(f+'.ts'))return loadTs(f+'.ts');return require(f);}return require(n);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);return m.exports;}
compiled.require=n=>n==='./appGuide'?loadTs(path.resolve(path.dirname(file),'appGuide.ts')):require(n);compiled._compile(js,file);
const {MODEL_IDS,apiError,generate}=compiled.exports;
test('exact seven user-specified IDs, order retained, duplicate removed, robotics not filtered',()=>{
 assert.deepEqual(MODEL_IDS,['gemini-3.5-flash','gemini-3.5-flash-lite','gemini-3.6-flash','gemini-robotics-er-2-preview','gemini-3.1-flash-lite','gemini-2.5-flash','gemini-2.5-flash-lite']);assert.equal(new Set(MODEL_IDS).size,7);
});
test('HTTP errors including unavailable model, quota and permissions are safe and distinct',()=>{
 for(const status of [400,401,403,404,429,500,503])assert.equal(typeof apiError(status),'string');assert.notEqual(apiError(404),apiError(429));
});
for(const id of MODEL_IDS)test(`exact selected ID is used for generation: ${id}`,async()=>{
 const original=global.fetch;
 try{
  global.fetch=async(url,options)=>{assert.equal(url,`https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent`);assert(!url.includes('fixture-key'));assert.equal(options.headers['x-goog-api-key'],'fixture-key');assert.equal(JSON.parse(options.body).contents[0].parts[0].text,'question');return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'hidden thinking',thought:true},{text:'answer'}]}}]})};};
  assert.equal(await generate('fixture-key',id,[{role:'user',parts:[{text:'question'}]}],new AbortController().signal),'answer');
 }finally{global.fetch=original;}
});
test('invalid model path rejected before network; no arbitrary old model fallback',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error('not expected');};
 try{for(const id of ['models/../../evil','gemini-unlisted','gemini-1.5-flash'])await assert.rejects(generate('fixture-key',id,[],new AbortController().signal));assert.equal(calls,0);}finally{global.fetch=original;}
});
test('error payload never displayed and no-text response never called success',async()=>{
 const original=global.fetch;
 try{
  for(const status of [400,403,404,429,503]){global.fetch=async()=>({ok:false,status,json:async()=>({error:{message:'fixture-key'}})});await assert.rejects(generate('fixture-key',MODEL_IDS[0],[],new AbortController().signal),e=>!e.message.includes('fixture-key'));}
  global.fetch=async()=>({ok:true,json:async()=>({candidates:[]})});await assert.rejects(generate('fixture-key',MODEL_IDS[0],[],new AbortController().signal));
 }finally{global.fetch=original;}
});
test('key management separated from chat, per-owner secure store and real generation probe',()=>{
 const root=path.resolve(__dirname,'../apps/mobile/src');const provider=fs.readFileSync(path.join(root,'ai/AIProvider.tsx'),'utf8'),settings=fs.readFileSync(path.join(root,'settings/AIProviderScreen.tsx'),'utf8'),chat=fs.readFileSync(path.join(root,'ai/GeminiScreen.tsx'),'utf8');
 assert(provider.includes('SecureStore.setItemAsync'));assert(provider.includes('SecureStore.deleteItemAsync'));assert(provider.includes('WHEN_UNLOCKED_THIS_DEVICE_ONLY'));assert(provider.includes('SHA256,uid'));assert(!provider.includes('AsyncStorage'));assert(!/console\./.test(provider));assert(!provider.includes('updateDoc'));
 assert(provider.includes('await generate(validateKey(replacement),selected'));assert(settings.includes('await ai.test(model,replacement,signal)'));assert(settings.includes('signal.aborted'));assert(settings.includes('নতুন key'));assert(!chat.includes('SecureStore'));assert(!chat.includes('secureTextEntry'));assert(chat.includes('Retry'));assert(chat.includes('New chat'));assert(chat.includes('controller.current?.abort()'));
 assert(provider.includes("generate(validateKey(''),liveConfig.current.model,[...history"));assert(provider.includes("slice(-6)"));assert(provider.includes("options.image.length>2097152"));assert(!provider.includes('discoverModels'));
});
test('grounding is explicit, source links only come from response metadata, unsupported model is never switched',async()=>{
 const original=global.fetch;let body,calls=0;try{global.fetch=async(_url,options)=>{calls++;body=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Current result'}]},groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/news',title:'Actual source'}},{web:{uri:'javascript:bad',title:'bad'}}]}}]})};};
 const r=await generate('fixture-key',MODEL_IDS[0],[{role:'user',parts:[{text:'latest?'}]}],new AbortController().signal,{search:true});assert.deepEqual(body.tools,[{google_search:{}}]);assert(r.includes('https://example.com/news'));assert(!r.includes('javascript:'));assert(body.systemInstruction.parts[0].text.includes('AniGooD-0.23.0-Watch4B'));
 global.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Answer'}]}}]})});const missing=await generate('fixture-key',MODEL_IDS[0],[],new AbortController().signal,{search:true});assert(missing.includes('live source পাওয়া যায়নি'));
 global.fetch=async()=>{calls++;return {ok:false,status:400};};const before=calls;await assert.rejects(generate('fixture-key',MODEL_IDS[0],[],new AbortController().signal,{search:true}));assert.equal(calls,before+1);
 }finally{global.fetch=original;}
});
test('release app guide is versioned and includes authoritative current features without private-state claims',()=>{const {APP_GUIDE,APP_GUIDE_VERSION}=loadTs(path.resolve(path.dirname(file),'appGuide.ts'));assert.equal(APP_GUIDE_VERSION,'AniGooD-0.23.0-Watch4B');for(const word of ['My Shadow Soldiers','SecureStore','first boss','Feed','20prepares/day','Step8 deferred','Live Search','never invent','cannot perform'])assert(APP_GUIDE.toLowerCase().includes(word.toLowerCase()),word);});
