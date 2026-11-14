'use strict';
// MovieBox OWN-ADAPTER wiring — NETWORK-FREE CONTRACT TESTS (injected fetch).
// Verifies the opt-in Test Lab wiring layer: fail-closed config, distinct error
// codes (not-configured / mapping / http / network / response / empty), string ID
// passthrough, and the same header/cookie/DASH strictness as the existing boundary.
// This is a contract/prototype, NOT MovieBox integration (no live backend).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('../apps/mobile/node_modules/typescript');
const modules={};
function load(file,deps){const ex={};const dir=path.join(__dirname,'../apps/mobile/src/watch');vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(dir,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:ex,require:n=>{if(n==='expo/fetch')return {fetch:()=>{throw Error('Network forbidden in contract tests');}};if(deps&&deps[n])return deps[n];throw Error('Unexpected require: '+n);},URL,URLSearchParams,Error,TextDecoder,encodeURIComponent});return ex;}
const adapter=load('movieboxAdapter.ts');
const mb=load('movieboxSource.ts',{'./movieboxAdapter':adapter});
const BASE='https://moviebox.example.com';
const ORIGIN='https://cdn.example.com';
const ID='8666220730591376344';

function cfg(extra){return {enabled:true,backendUrl:BASE,playbackOrigins:[ORIGIN],idPrefixes:['mb:'],...extra};}
function fetchOk(body){return async()=>({ok:true,status:200,text:async()=>body});}
function streamsBody(n){return JSON.stringify({streams:Array.from({length:n},(_,i)=>({url:`${ORIGIN}/s${i}.mp4`,format:'MP4',resolutions:'1080p'}))});}

test('disabled source fails closed with not-configured',async()=>{
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg({enabled:false}),{type:'movie',subjectId:ID},fetchOk(streamsBody(1)),new AbortController().signal),err=>err.code==='not-configured');
});

test('missing backend URL fails with not-configured (live gate not passed)',async()=>{
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg({backendUrl:''}),{type:'movie',subjectId:ID},fetchOk(streamsBody(1)),new AbortController().signal),err=>err.code==='not-configured');
});

test('non-https backend and malformed origins fail with config',()=>{
  assert.throws(()=>mb.validateMovieBoxSource(cfg({backendUrl:'http://x.example.com'})),err=>err.code==='config');
  assert.throws(()=>mb.validateMovieBoxSource(cfg({playbackOrigins:['not-a-url']})),err=>err.code==='config');
});

test('invalid subject ID fails with mapping (no Number coercion)',async()=>{
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:'bad id'},fetchOk(streamsBody(1)),new AbortController().signal),err=>err.code==='mapping');
  // Long string ID must not be coerced: Number(ID) loses identity, BigInt(Number(ID)) differs.
  assert.equal(Number.isSafeInteger(Number(ID)),false);
});

test('series with invalid season/episode fails with mapping',async()=>{
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'series',subjectId:ID,season:-1,episode:1},fetchOk(streamsBody(1)),new AbortController().signal),err=>err.code==='mapping');
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'series',subjectId:ID,season:0,episode:0},fetchOk(streamsBody(1)),new AbortController().signal),err=>err.code==='mapping');
});

test('non-200 backend fails with http + status (429 surfaces honestly)',async()=>{
  const fetch429=async()=>({ok:false,status:429,text:async()=>'{}'});
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetch429,new AbortController().signal),err=>err.code==='http'&&err.status===429);
});

test('network failure surfaces as network, not success',async()=>{
  const fetchFail=async()=>{throw new Error('ECONNREFUSED');};
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetchFail,new AbortController().signal),err=>err.code==='network');
});

test('zero streams fails with empty — NOT reported as success',async()=>{
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetchOk(streamsBody(0)),new AbortController().signal),err=>err.code==='empty');
});

test('invalid JSON body fails with response',async()=>{
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetchOk('not json'),new AbortController().signal),err=>err.code==='response');
});

test('success maps bounded streams with quality/format; origin-locked',async()=>{
  const out=await mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetchOk(streamsBody(2)),new AbortController().signal);
  assert.equal(out.length,2);
  assert.equal(out[0].url,`${ORIGIN}/s0.mp4`);
  assert.match(out[0].description,/1080p MP4/);
  // A stream outside playbackOrigins is rejected by the boundary, surfacing empty (not success).
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetchOk(JSON.stringify({streams:[{url:'https://elsewhere.example/x.mp4',format:'MP4'}]})),new AbortController().signal),err=>err.code==='empty');
});

test('cookie-dependent DASH and raw-header entries are rejected (no pass-through)',async()=>{
  const body=JSON.stringify({streams:[
    {url:`${ORIGIN}/dash.mpd`,format:'DASH',signCookie:'abc'},
    {url:`${ORIGIN}/hdr.mp4`,format:'MP4',headers:{Origin:ORIGIN}}
  ]});
  await assert.rejects(()=>mb.resolveMovieBoxStreams(cfg(),{type:'movie',subjectId:ID},fetchOk(body),new AbortController().signal),err=>err.code==='empty');
});

test('URL builder contract used by the wiring matches adapter path',async()=>{
  const captured=[];
  const fetchCapture=async(url)=>{captured.push(url);return {ok:true,status:200,text:async()=>streamsBody(1)};};
  await mb.resolveMovieBoxStreams(cfg(),{type:'series',subjectId:ID,season:2,episode:3},fetchCapture,new AbortController().signal);
  const u=new URL(captured[0]);
  assert.equal(u.pathname,`/api/stream/${ID}`);
  assert.equal(u.searchParams.get('se'),'2');
  assert.equal(u.searchParams.get('ep'),'3');
});
