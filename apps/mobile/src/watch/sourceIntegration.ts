import {fetch as httpFetch} from 'expo/fetch';
import {mediaUrl} from './model';
/** Phase4A data-only HTTP boundary. No JS execution, torrents, DRM or implicit credential forwarding. */
export type SourceKind='stremio'|'json';
export type SourceConfig={id:string;name:string;kind:SourceKind;url:string;enabled:boolean;idPrefixes:string[];apiHeaders:Record<string,string>;playbackOrigins:string[];allowProxyHeaders:boolean};
export type RemoteSubtitle={id:string;url:string;lang:string};
export type IntegratedStream={id:string;name:string;description:string;url:string;headers:Record<string,string>;subtitles:RemoteSubtitle[]};
export type StreamLookup={type:'movie'|'series';id:string;season?:number;episode?:number};
export class SourceError extends Error{constructor(readonly code:'config'|'network'|'timeout'|'http'|'response'|'unsupported'|'mapping',readonly status?:number){super(code);}}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=240)=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').slice(0,max):'';
export const MAX_RESPONSE_BYTES=128*1024;
function publicUrl(value:string){try{return mediaUrl(value);}catch{throw new SourceError('config');}}
function headers(input:unknown,mode:'api'|'playback'):Record<string,string>{
 if(input===undefined)return {};if(!record(input)||Object.keys(input).length>8)throw new SourceError('config');
 const allowed=mode==='api'?['authorization','x-api-key','accept','user-agent']:['referer','user-agent'];const out:Record<string,string>={};
 for(const [key,value]of Object.entries(input)){const name=key.toLowerCase();if(!allowed.includes(name)||typeof value!=='string'||value.length>2048||/[\r\n\u0000]/.test(value)||Object.prototype.hasOwnProperty.call(out,name))throw new SourceError('config');if(name==='referer')publicUrl(value);out[name]=value;}
 return out;
}
export function validateSource(input:unknown):SourceConfig{
 if(!record(input)||!['stremio','json'].includes(String(input.kind))||typeof input.url!=='string'||typeof input.name!=='string'||!input.name.trim()||typeof input.id!=='string'||!/^src-[a-z0-9-]{1,64}$/.test(input.id))throw new SourceError('config');
 const url=publicUrl(input.url);const u=new URL(url);if(u.hash||input.kind==='stremio'&&!u.pathname.endsWith('/manifest.json'))throw new SourceError('config');
 if(!Array.isArray(input.idPrefixes)||!input.idPrefixes.length||input.idPrefixes.length>8||input.idPrefixes.some(p=>!['tt','kitsu:','tmdb:','mal:'].includes(String(p))))throw new SourceError('config');
 if(!Array.isArray(input.playbackOrigins)||input.playbackOrigins.length>12)throw new SourceError('config');
 const origins=input.playbackOrigins.map(v=>{if(typeof v!=='string')throw new SourceError('config');const parsed=new URL(publicUrl(v));if(parsed.pathname!=='/'||parsed.search||parsed.hash)throw new SourceError('config');return parsed.origin;});
 return {id:input.id,name:text(input.name.trim(),80),kind:input.kind as SourceKind,url,enabled:input.enabled===true,idPrefixes:[...new Set(input.idPrefixes as string[])],apiHeaders:headers(input.apiHeaders,'api'),playbackOrigins:[...new Set(origins)],allowProxyHeaders:input.allowProxyHeaders===true};
}
function parseBounded(raw:string):unknown{
 if(raw.length>MAX_RESPONSE_BYTES)throw new SourceError('response');let bytes:number;try{bytes=encodeURIComponent(raw).replace(/%[A-F\d]{2}/gi,'x').length;}catch{throw new SourceError('response');}if(bytes>MAX_RESPONSE_BYTES)throw new SourceError('response');
 try{return JSON.parse(raw);}catch{throw new SourceError('response');}
}
function stream(entry:unknown,index:number,source:SourceConfig):IntegratedStream|null{
 if(!record(entry)||typeof entry.url!=='string'||entry.infoHash||entry.ytId||entry.drm||entry.code||entry.externalUrl)return null;
 let url:string;try{url=publicUrl(entry.url);}catch{return null;}
 // Raw custom headers are not an escape hatch. Only explicit proxy request Referer/User-Agent.
 if(entry.headers!==undefined)return null;
 let requestHeaders:Record<string,string>={};
 if(entry.behaviorHints!==undefined){if(!record(entry.behaviorHints))return null;const proxy=entry.behaviorHints.proxyHeaders;if(proxy!==undefined){
  if(!source.allowProxyHeaders||!record(proxy)||proxy.response!==undefined||!source.playbackOrigins.includes(new URL(url).origin))return null;
  try{requestHeaders=headers(proxy.request,'playback');}catch{return null;}
 }}
 const subs:RemoteSubtitle[]=[];
 if(entry.subtitles!==undefined){if(!Array.isArray(entry.subtitles)||entry.subtitles.length>24)return null;for(const [i,item]of entry.subtitles.entries()){if(!record(item)||typeof item.url!=='string')continue;try{const subUrl=publicUrl(item.url);subs.push({id:`subtitle-${i}`,url:subUrl,lang:text(item.lang,40)||'Unknown'});}catch{}}}
 return {id:`${source.id}-${index}`,name:text(entry.name,120)||`Stream ${index+1}`,description:text(entry.title||entry.description,1000),url,headers:requestHeaders,subtitles:subs};
}
export function parseIntegratedStreams(raw:string,config:SourceConfig):IntegratedStream[]{const source=validateSource(config),data=parseBounded(raw);if(!record(data)||!Array.isArray(data.streams)||data.streams.length>50)throw new SourceError('response');return data.streams.map((s,i)=>stream(s,i,source)).filter((s):s is IntegratedStream=>s!==null);}
export function streamRequestUrl(config:SourceConfig,lookup:StreamLookup){
 const source=validateSource(config);if(!source.enabled)throw new SourceError('config');
 if(!/^(tt\d{5,12}|(?:kitsu|tmdb|mal):[1-9]\d{0,11})$/.test(lookup.id)||!source.idPrefixes.some(prefix=>lookup.id.startsWith(prefix)))throw new SourceError('mapping');
 if(!['movie','series'].includes(lookup.type))throw new SourceError('mapping');
 if(lookup.type==='series'&&(!Number.isSafeInteger(lookup.season)||lookup.season!<0||!Number.isSafeInteger(lookup.episode)||lookup.episode!<1))throw new SourceError('mapping');
 const u=new URL(source.url);
 if(source.kind==='stremio'){
  // Configured query token remains only on the exact API origin; URL path token retained.
  const id=lookup.type==='series'?`${lookup.id}:${lookup.season}:${lookup.episode}`:lookup.id;
  u.pathname=u.pathname.slice(0,-'manifest.json'.length)+`stream/${lookup.type}/${encodeURIComponent(id)}.json`;
 }else{u.searchParams.set('type',lookup.type);u.searchParams.set('id',lookup.id);if(lookup.type==='series'){u.searchParams.set('season',String(lookup.season));u.searchParams.set('episode',String(lookup.episode));}}
 return u.toString();
}
export async function fetchSourceText(url:string,apiHeaders:Record<string,string>,signal:AbortSignal,maxBytes=MAX_RESPONSE_BYTES){
 let response:Response;try{response=await httpFetch(publicUrl(url),{headers:apiHeaders,redirect:'error',credentials:'omit',signal});}catch{throw new SourceError(signal.aborted?'timeout':'network');}
 if(response.url&&new URL(response.url).origin!==new URL(url).origin)throw new SourceError('response');
 if(!response.ok)throw new SourceError('http',response.status);
 const length=response.headers.get('content-length');if(length&&(Number(length)>maxBytes||!Number.isFinite(Number(length))))throw new SourceError('response');
 // Expo native fetch disables OkHttp redirects for redirect:error and supports streamed reads.
 let body:string;try{if(response.body?.getReader){const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maxBytes){await reader.cancel();throw new SourceError('response');}chunks.push(part.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}finally{reader.releaseLock();}}else body=await response.text();}catch{throw new SourceError(signal.aborted?'timeout':'response');}
 if(body.length>maxBytes)throw new SourceError('response');try{if(encodeURIComponent(body).replace(/%[A-F\d]{2}/gi,'x').length>maxBytes)throw new SourceError('response');}catch{throw new SourceError('response');}return body;
}
export async function findStreams(config:SourceConfig,lookup:StreamLookup,signal:AbortSignal){const source=validateSource(config);const url=streamRequestUrl(source,lookup);if(source.kind==='stremio'){const manifest=await checkManifest(source,signal);if(!manifestAllows(manifest,lookup))throw new SourceError('unsupported');}return parseIntegratedStreams(await fetchSourceText(url,source.apiHeaders,signal),source);}
export type ManifestSummary={name:string;types:string[];idPrefixes:string[];resources:{types:string[];idPrefixes:string[]}[]};
export function manifestAllows(m:ManifestSummary,lookup:StreamLookup){const matches=(prefixes:string[])=>!prefixes.length||prefixes.some(p=>lookup.id.startsWith(p));return m.types.includes(lookup.type)&&matches(m.idPrefixes)&&m.resources.some(r=>(!r.types.length||r.types.includes(lookup.type))&&matches(r.idPrefixes));}
export async function checkManifest(config:SourceConfig,signal:AbortSignal):Promise<ManifestSummary>{
 const s=validateSource(config);if(s.kind!=='stremio')throw new SourceError('config');const data=parseBounded(await fetchSourceText(s.url,s.apiHeaders,signal));
 if(!record(data)||typeof data.id!=='string'||!Array.isArray(data.types)||!Array.isArray(data.resources)||data.resources.length>30)throw new SourceError('unsupported');
 const strings=(v:unknown):string[]=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>40||v.some(x=>typeof x!=='string'||x.length>80))throw new SourceError('response');return v as string[];};
 const resources=data.resources.filter(r=>r==='stream'||record(r)&&r.name==='stream').map(r=>r==='stream'?{types:[] as string[],idPrefixes:[] as string[]}:{types:strings((r as Record<string,unknown>).types),idPrefixes:strings((r as Record<string,unknown>).idPrefixes)});
 if(!resources.length)throw new SourceError('unsupported');return {name:text(data.name,80)||s.name,types:strings(data.types).filter(t=>t==='movie'||t==='series'),idPrefixes:strings(data.idPrefixes),resources};
}
export function sourceErrorText(e:unknown){if(e instanceof SourceError){if(e.code==='http')return `Source: HTTP ${e.status}. Access/rate limit পরীক্ষা করো।`;if(e.code==='mapping')return 'Supported ID mapping পাওয়া যায়নি। Explicit ID দাও বা অন্য source নাও।';if(e.code==='timeout')return 'Source timeout. Retry করো।';if(e.code==='network')return 'Source connection হয়নি। HTTPS/redirect/network পরীক্ষা করো।';if(e.code==='unsupported')return 'Supported HTTP stream resource নেই।';if(e.code==='config')return 'Source URL, ID, headers ও allowed playback origins পরীক্ষা করো।';}return 'Source response গ্রহণ করা যায়নি।';}
