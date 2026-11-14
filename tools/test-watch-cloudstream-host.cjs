'use strict';
// CloudStream host JS bridge — NETWORK-FREE CONTRACT TESTS (mocked native).
// Verifies the JS bridge mapping, distinct error codes, boundary rules
// (torrent/DRM reject, playback-origin filter, zero-links = error), and
// diagnostic redaction. NOT live integration.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('../apps/mobile/node_modules/typescript');

// Controllable fake native module.
let fakeNative={loadProvider:async()=>({ok:true,message:'loaded'}),listProviders:async()=>['DemoProvider'],search:async()=>[],load:async()=>({name:'D',url:'https://x.test/d',apiName:'DemoProvider',type:'MOVIE',episodes:[]}),loadLinks:async()=>({ok:true,links:[],subtitles:[]}),unloadProvider:async()=>({ok:true,message:'unloaded'})};
function loadBridge(platform){
  const ex={};
  const rnMock={Platform:{OS:platform},NativeModules:{CloudStreamHost:fakeNative}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../apps/mobile/src/watch/cloudstreamHost.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:ex,require:n=>{if(n==='react-native')return rnMock;if(n==='./sourceIntegration')return {};throw Error('Unexpected require: '+n);},URL,URLSearchParams,Error,encodeURIComponent,Promise,Object,Array,String,Number,RegExp});
  return ex;
}
const bridge=loadBridge('android');

test('host availability reflects platform + native module',()=>{
  assert.equal(bridge.isCloudStreamHostAvailable(),true);
  const noNative=loadBridge('ios');
  assert.equal(noNative.isCloudStreamHostAvailable(),false);
});

test('normalizeProviderUrl accepts https, rejects non-https/oversize',()=>{
  assert.equal(bridge.normalizeProviderUrl('https://x.test/v'),'https://x.test/v');
  assert.throws(()=>bridge.normalizeProviderUrl('http://x.test/v'),/Invalid provider url/);
  assert.throws(()=>bridge.normalizeProviderUrl('ftp://x.test/v'),/Invalid provider url/);
  assert.throws(()=>bridge.normalizeProviderUrl('x'.repeat(5000)),/Invalid provider url/);
});

test('loadProvider surfaces load-error distinctly',async()=>{
  fakeNative.loadProvider=async()=>{throw new Error('load-error: bad manifest');};
  await assert.rejects(()=>bridge.loadProvider('x.cs3'),err=>err.code==='load-error');
  fakeNative.loadProvider=async()=>({ok:true,message:'loaded'});
});

test('search maps hits and surfaces search-error',async()=>{
  fakeNative.search=async()=>[{name:'Demo',url:'https://x.test/1',apiName:'DemoProvider',type:'MOVIE',posterUrl:'https://p/x.jpg',year:2024}];
  const hits=await bridge.search('DemoProvider','demo');
  assert.equal(hits.length,1);
  assert.equal(hits[0].name,'Demo');
  assert.equal(hits[0].year,2024);
  assert.equal(hits[0].url,'https://x.test/1');
  fakeNative.search=async()=>{throw new Error('search-error: boom');};
  await assert.rejects(()=>bridge.search('DemoProvider','q'),err=>err.code==='search-error');
  fakeNative.search=async()=>[];
});

test('load maps details + episodes',async()=>{
  fakeNative.load=async()=>({name:'Series',url:'https://x.test/s',apiName:'DemoProvider',type:'TV',episodes:[{name:'E1',url:'https://x.test/s1',episode:1,season:1}]});
  const d=await bridge.load('DemoProvider','https://x.test/s');
  assert.equal(d.name,'Series');
  assert.equal(d.episodes[0].episode,1);
  assert.equal(d.episodes[0].url,'https://x.test/s1');
});

test('resolveLinks maps streams; rejects torrent/DRM; filters by playbackOrigins',async()=>{
  fakeNative.loadLinks=async()=>({ok:true,links:[
    {source:'CDN',name:'1080p',url:'https://cdn.test/a.mp4',referer:'https://cdn.test',quality:1080,type:'VIDEO',headers:{Referer:'https://cdn.test'}},
    {source:'CDN',name:'torrent',url:'https://cdn.test/t.torrent',quality:0,type:'TORRENT',headers:{}},
    {source:'CDN',name:'drm',url:'https://cdn.test/d.mp4',quality:1080,type:'DRM',headers:{}},
    {source:'CDN',name:'other',url:'https://elsewhere.test/o.mp4',quality:720,type:'VIDEO',headers:{}}
  ],subtitles:[{lang:'en',url:'https://subs.test/en.vtt'}]});
  const {streams,subtitles}=await bridge.resolveLinks('DemoProvider','data',['https://cdn.test']);
  assert.equal(streams.length,1);
  assert.equal(streams[0].url,'https://cdn.test/a.mp4');
  assert.equal(streams[0].headers.referer,'https://cdn.test');
  assert.equal(subtitles.length,1);
  assert.equal(subtitles[0].lang,'en');
});

test('resolveLinks surfaces zero-links as an error, never success',async()=>{
  fakeNative.loadLinks=async()=>({ok:true,links:[],subtitles:[]});
  await assert.rejects(()=>bridge.resolveLinks('DemoProvider','data',[]),err=>err.code==='zero-links');
});

test('resolveLinks rejects non-allowlisted playback origin',async()=>{
  fakeNative.loadLinks=async()=>({ok:true,links:[{source:'CDN',name:'x',url:'https://elsewhere.test/o.mp4',quality:720,type:'VIDEO',headers:{}}],subtitles:[]});
  await assert.rejects(()=>bridge.resolveLinks('DemoProvider','data',['https://cdn.test']),err=>err.code==='zero-links');
});

test('timeout error maps distinctly',async()=>{
  fakeNative.loadLinks=async()=>{throw new Error('request timed out');};
  await assert.rejects(()=>bridge.resolveLinks('DemoProvider','data',[]),err=>err.code==='timeout');
});

test('redactDiagnostic redacts token/cookie/signed/auth values',()=>{
  const out=bridge.redactDiagnostic({token:'abc',cookie:'x=1',signedUrl:'https://x/signed=abc',normal:'ok',nested:{apiKey:'secret',keep:'v'}});
  assert.equal(out.token,'[REDACTED]');
  assert.equal(out.cookie,'[REDACTED]');
  assert.equal(out.signedUrl,'[REDACTED]');
  assert.equal(out.normal,'ok');
  assert.equal(out.nested.apiKey,'[REDACTED]');
  assert.equal(out.nested.keep,'v');
  // Token inside a string value is also redacted.
  const s=bridge.redactDiagnostic('got token=secret123 here');
  assert.match(s,/token=\[REDACTED\]/);
});
