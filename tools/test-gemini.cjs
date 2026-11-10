const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const {test}=require('node:test');const ts=require('../apps/mobile/node_modules/typescript');
const file=path.resolve(__dirname,'../apps/mobile/src/ai/gemini.ts');const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const compiled=new Module(file,module);compiled.filename=file;compiled.paths=Module._nodeModulePaths(path.dirname(file));compiled._compile(js,file);
const {selectModels,apiError,discoverModels,generate}=compiled.exports;
const model=(name,methods=['generateContent'])=>({name:`models/${name}`,displayName:name,supportedGenerationMethods:methods});
test('runtime model list only real returned Gemini generateContent entries, max six, unique',()=>{
 const raw=[...Array.from({length:10},(_,i)=>model(`gemini-${i+1}-fixture`)),model('gemini-1-fixture'),model('gemini-1-tts'),model('gemini-1-image'),model('gemini-1-embedding'),model('gemini-1-native-audio'),model('gemma-3'),model('gemini-other',['embedContent']),{name:'models/../../evil',supportedGenerationMethods:['generateContent']}];
 const selected=selectModels(raw);assert.equal(selected.length,6);assert.equal(new Set(selected.map(m=>m.name)).size,6);assert.equal(selected[0].name,'models/gemini-10-fixture');
 assert.equal(selectModels([model('gemini-1-fixture')]).length,1);assert.deepEqual(selectModels(null),[]);
});
test('standard HTTP error text does not depend on provider payload',()=>{for(const status of [400,401,403,429,500,503,404])assert.equal(typeof apiError(status),'string');});
test('discovery paginates without putting key in URL and ignores untrusted error text',async()=>{
 const original=global.fetch;let count=0;const secret='fixture-secret-never-log';
 try{
  global.fetch=async(url,options)=>{assert(!url.includes(secret));assert.equal(options.headers['x-goog-api-key'],secret);count++;return {ok:true,json:async()=>count===1?{models:[model('gemini-1-fixture')],nextPageToken:'next token'}:{models:[model('gemini-2-fixture')]}};};
  const result=await discoverModels(secret,new AbortController().signal);assert.equal(count,2);assert.equal(result.length,2);
  global.fetch=async()=>({ok:false,status:403,json:async()=>({error:{message:secret}})});
  await assert.rejects(discoverModels(secret,new AbortController().signal),e=>!e.message.includes(secret));
 }finally{global.fetch=original;}
});
test('generation uses TLS/header key, extracts text, rejects path injection and redacts errors',async()=>{
 const original=global.fetch;
 try{
  global.fetch=async(url,options)=>{assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-1-fixture:generateContent');assert.equal(options.headers['x-goog-api-key'],'fixture-key');const body=JSON.parse(options.body);assert.equal(body.contents[0].parts[0].text,'anime?');return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'internal thinking',thought:true},{text:'answer'}]}}]})};};
  assert.equal(await generate('fixture-key','models/gemini-1-fixture',[{role:'user',parts:[{text:'anime?'}]}],new AbortController().signal),'answer');
  await assert.rejects(generate('fixture-key','models/../evil',[],new AbortController().signal));
  global.fetch=async()=>({ok:false,status:429,json:async()=>({error:{message:'fixture-key'}})});
  await assert.rejects(generate('fixture-key','models/gemini-1-fixture',[],new AbortController().signal),e=>!e.message.includes('fixture-key'));
 }finally{global.fetch=original;}
});
test('BYOK screen stores key only in secure store, has remove and no sensitive logging',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../apps/mobile/src/ai/GeminiScreen.tsx'),'utf8');
 assert(source.includes('SecureStore.setItemAsync'));assert(source.includes('SecureStore.deleteItemAsync'));assert(source.includes('WHEN_UNLOCKED_THIS_DEVICE_ONLY'));
 assert(!source.includes('AsyncStorage'));assert(!/console\./.test(source));assert(!source.includes('updateDoc'));
 assert(source.includes("generate(savedKey.current,model,[{role:'user',parts:[{text}]}]"));
});
