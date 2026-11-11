'use strict';
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),{models,generateQuiz,judgeQuiz}=require('./quiz-ai.cjs');
const original=global.fetch;afterEach(()=>{global.fetch=original;});
const ai={key:'transient-test-only-not-a-real-key',model:'gemini-2.5-flash-lite'};
const questions=()=>Array.from({length:5},(_,i)=>({question:`Question ${i}`,answer:`Answer ${i}`,hint:'Hint'}));
const reply=value=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(value)}]}}]})});
test('server accepts exact same seven model IDs, no discovery or silent fallback',()=>{
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../../apps/mobile/src/ai/gemini.ts'),'utf8');
 assert.deepEqual(models,source.match(/'gemini-[^']+'/g).slice(0,7).map(s=>s.slice(1,-1)));
});
test('generation uses per-request key only in Google header and selected model URL',async()=>{
 let calls=0;global.fetch=async(url,opts)=>{calls++;assert(url.endsWith('/gemini-2.5-flash-lite:generateContent'));assert(!url.includes(ai.key));assert.equal(opts.headers['x-goog-api-key'],ai.key);assert(!opts.body.includes(ai.key));return reply(questions());};
 assert.equal((await generateQuiz('Naruto',ai)).length,5);assert.equal(calls,1);
});
test('missing key, malformed key or unknown model fails before any Google call',async()=>{
 global.fetch=async()=>{throw Error('must not call');};
 for(const provider of [undefined,{key:'x y',model:ai.model},{key:'secret',model:'attacker-model'}])await assert.rejects(generateQuiz('Naruto',provider),e=>['quiz-provider-key-required','invalid-ai-provider'].includes(e.code));
});
test('provider errors sanitized, permission/quota/model error never silently judges correct',async()=>{
 for(const [status,code]of [[401,'gemini-permission-denied'],[403,'gemini-permission-denied'],[404,'gemini-model-unavailable'],[429,'gemini-quota'],[400,'gemini-invalid-request']]){
 global.fetch=async()=>({ok:false,status,json:async()=>({error:ai.key})});
 await assert.rejects(generateQuiz('Naruto',ai),e=>e.code===code&&!e.message.includes(ai.key));await assert.rejects(judgeQuiz({question:'Name?',answer:'Naruto'},'Naruto',ai),e=>e.code===code);
 }
});
test('exact5 schema, thought filtering, first-word fallback only for transient judgment failures',async()=>{
 global.fetch=async()=>reply(questions().slice(0,4));await assert.rejects(generateQuiz('Naruto',ai),e=>e.code==='invalid-quiz-provider-response');
 global.fetch=async()=>{throw Error(ai.key);};const r=await judgeQuiz({question:'Name?',answer:'Naruto Uzumaki'},'naruto',ai);assert.equal(r.correct,true);assert.equal(r.fallback,true);assert(!JSON.stringify(r).includes(ai.key));
 await assert.rejects(judgeQuiz({question:'Q',answer:'A'},'A',undefined),e=>e.code==='quiz-provider-key-required');
});
