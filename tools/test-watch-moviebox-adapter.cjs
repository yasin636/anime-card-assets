'use strict';
// MovieBox OWN-ADAPTER prototype — NETWORK-FREE CONTRACT TESTS.
// These verify the bounded data contract (URL builders + response parsing) of the
// own-adapter prototype. They are NOT MovieBox integration: no live backend, no
// signing, no credentials. The backend access path remains an unresolved blocker.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('../apps/mobile/node_modules/typescript');
function load(file){const ex={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../apps/mobile/src/watch',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:ex,require:n=>{if(n==='expo/fetch')return {fetch:()=>{throw Error('Network forbidden in contract tests');}};throw Error('Unexpected require: '+n);},URL,URLSearchParams,Error,TextDecoder,encodeURIComponent});return ex;}
const mb=load('movieboxAdapter.ts');

const BASE='https://moviebox.example.com';
const LONG_ID='8666220730591376344';

test('stream URL uses path subject_id + se/ep contract (not id/season/episode query)',()=>{
  const url=new URL(mb.buildStreamUrl(BASE,LONG_ID,2,3));
  assert.equal(url.pathname,`/api/stream/${LONG_ID}`);
  assert.equal(url.searchParams.get('se'),'2');
  assert.equal(url.searchParams.get('ep'),'3');
  assert.equal(url.searchParams.get('id'),null);
  assert.equal(url.searchParams.get('season'),null);
});

test('captions URL is a separate path with se/ep',()=>{
  const url=new URL(mb.buildCaptionsUrl(BASE,LONG_ID,1,5));
  assert.equal(url.pathname,`/api/stream/${LONG_ID}/captions`);
  assert.equal(url.searchParams.get('se'),'1');
  assert.equal(url.searchParams.get('ep'),'5');
});

test('long provider subject IDs stay exact strings; Number coercion loses identity',()=>{
  assert.equal(mb.normalizeSubjectId(LONG_ID),LONG_ID);
  assert.equal(Number.isSafeInteger(Number(LONG_ID)),false);
  assert.notEqual(BigInt(Number(LONG_ID)).toString(),LONG_ID);
  assert.throws(()=>mb.normalizeSubjectId('invalid id with spaces'),/Invalid subject id/);
  assert.throws(()=>mb.normalizeSubjectId(''),/Invalid subject id/);
});

test('streams parse with count and labels; cookie-dependent DASH flagged',()=>{
  const raw=JSON.stringify({streams:[
    {url:'https://cdn.example.com/movie.mp4',format:'MP4',resolutions:'1080p',codecName:'h264',duration:889,size:123456789},
    {url:'https://cdn.example.com/movie.mpd',format:'DASH',resolutions:'adaptive',signCookie:'abc'}
  ]});
  const out=mb.parseStreams(raw,LONG_ID,0,0);
  assert.equal(out.count,2);
  assert.equal(out.streams[0].quality,'1080p');
  assert.equal(out.streams[0].codec,'h264');
  assert.equal(out.streams[0].durationSec,889);
  assert.ok(out.streams[0].sizeMb>0);
  assert.equal(out.streams[1].cookieDependent,true);
});

test('empty streams are reported as zero, never as success',()=>{
  const out=mb.parseStreams(JSON.stringify({streams:[]}),LONG_ID,0,0);
  assert.equal(out.count,0);
  assert.equal(out.streams.length,0);
});

test('missing/invalid streams response fails honestly',()=>{
  assert.throws(()=>mb.parseStreams('not json',LONG_ID,0,0),/Invalid JSON/);
  assert.throws(()=>mb.parseStreams(JSON.stringify({subject_id:LONG_ID}),LONG_ID,0,0),/Missing streams/);
});

test('captions parse separately with language/code',()=>{
  const raw=JSON.stringify({captions:[
    {id:'c1',lanName:'Bengali',lan:'bn',url:'https://subs.example.com/bn.vtt'},
    {id:'c2',language:'English',lan:'en',url:'https://subs.example.com/en.vtt'}
  ]});
  const out=mb.parseCaptions(raw,LONG_ID,1,2);
  assert.equal(out.count,2);
  assert.equal(out.captions[0].language,'Bengali');
  assert.equal(out.captions[0].code,'bn');
  assert.equal(out.captions[1].language,'English');
});

test('captions response is not a streams response and vice versa',()=>{
  assert.throws(()=>mb.parseCaptions(JSON.stringify({streams:[]}),LONG_ID,0,0),/Missing captions/);
  assert.throws(()=>mb.parseStreams(JSON.stringify({captions:[]}),LONG_ID,0,0),/Missing streams/);
});

test('invalid season/episode rejected before any URL is built',()=>{
  assert.throws(()=>mb.buildStreamUrl(BASE,LONG_ID,-1,1),/Invalid season\/episode/);
  assert.throws(()=>mb.buildStreamUrl(BASE,LONG_ID,1,0),/Invalid season\/episode/);
});
