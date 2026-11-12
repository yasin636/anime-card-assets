import {mediaUrl} from './model';
/** Data-only boundary for future JSON/Stremio response adapters. Never eval plugins.
 * This is NOT a complete Stremio client: no manifest/install, torrent, DRM or private headers.
 * Source URLs are user-authorized media, not a promise of licensed catalog coverage.
 */
export type MediaCandidate={id:string;title:string;url:string};
export interface SourceAdapter {readonly id:string;resolve(input:unknown):readonly MediaCandidate[];}
export const MAX_SOURCE_JSON_BYTES=64*1024;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const jsonStreamsAdapter:SourceAdapter={id:'json-streams-v1',resolve(input){
 if(!object(input)||!Array.isArray(input.streams)||input.streams.length>50)throw Error('Expected at most 50 streams.');
 return input.streams.map((entry,index)=>{
  if(!object(entry)||typeof entry.url!=='string')throw Error('Each stream needs an HTTPS URL.');
  // Reject privileged execution/network options rather than silently pretending support.
  if(entry.headers||entry.behaviorHints||entry.infoHash||entry.drm||entry.code)throw Error('Only direct media URLs are supported.');
  const title=typeof entry.title==='string'?entry.title:typeof entry.name==='string'?entry.name:`Video ${index+1}`;
  return {id:`json-${index}`,title:title.slice(0,160),url:mediaUrl(entry.url)};
 });
}};
export function parseSourceJson(raw:string):readonly MediaCandidate[]{
 // Bound UTF-8 size conservatively without requiring Node/Buffer in Hermes.
 if(raw.length>MAX_SOURCE_JSON_BYTES||encodeURIComponent(raw).replace(/%[A-F\d]{2}/gi,'x').length>MAX_SOURCE_JSON_BYTES)throw Error('Source JSON exceeds 64 KiB.');
 let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw Error('Invalid source JSON.');}
 return jsonStreamsAdapter.resolve(parsed);
}
