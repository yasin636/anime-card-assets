export type AnimeSource='kitsu'|'tmdb-tv'|'tmdb-movie';
export type Section='anime'|'movie'|'drama';
export type Title={key:string;provider:'jikan'|'kitsu'|'tmdb';kind:'anime'|'movie'|'tv';id:number;name:string;image:string|null;banner:string|null;description:string;year:number|null;rating:number|null;genres:string[];episodes:number|null;seasons?:{number:number;name:string;episodes:number}[]};
export type Episode={number:number;name:string};
export type CatalogFilter={year:string;genre:string;origin:string};
const plain=(v:unknown,max=6000)=>typeof v==='string'?v.replace(/<[^>]*>/g,'').slice(0,max):'';
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
const image=(v:unknown,host:string)=>{try{const u=new URL(String(v));return u.protocol==='https:'&&u.hostname===host?u.toString():null;}catch{return null;}};
const tmdbImage=(v:unknown)=>typeof v==='string'&&/^\/[\w.\-/]+$/.test(v)?`https://image.tmdb.org/t/p/w500${v}`:null;
function kitsu(m:any):Title{const a=m.attributes||{};const score=Number(a.averageRating);return {key:`kitsu:${m.id}`,provider:'kitsu',kind:'anime',id:Number(m.id),name:plain(a.titles?.en||a.canonicalTitle||a.titles?.en_jp,240)||'Untitled',image:kitsuImage(a.posterImage?.large||a.posterImage?.medium),banner:kitsuImage(a.coverImage?.large),description:plain(a.description||a.synopsis),year:Number(String(a.startDate||'').slice(0,4))||null,rating:a.averageRating!=null&&Number.isFinite(score)?score/10:null,genres:[],episodes:number(a.episodeCount)};}
function kitsuImage(v:unknown){return image(v,'media.kitsu.app')||image(v,'media.kitsu.io');}
export class CatalogError extends Error{constructor(readonly code:'network'|'timeout'|'http'|'response'|'credential',readonly status?:number){super(code);}}
export function catalogErrorText(error:unknown,provider:string){const label=provider==='kitsu'?'Kitsu':provider==='jikan'?'Legacy Jikan':'TMDB';if(error instanceof CatalogError){if(error.code==='timeout')return `${label}: request সময়মতো শেষ হয়নি (timeout)। Retry বা অন্য catalog বেছে নাও।`;if(error.code==='network')return `${label}: API connection হয়নি। এই provider-এর server/routing/TLS সমস্যা হতে পারে; অন্য catalog চেষ্টা করো।`;if(error.code==='credential')return 'TMDB credential প্রয়োজন। Catalog settings-এ নিজের key/token save করো।';if(error.code==='http')return `${label}: HTTP ${error.status}। ${error.status===401||error.status===403?'Access/credential পরীক্ষা করো।':error.status===429?'Rate limit; কিছুক্ষণ পরে Retry করো।':'Provider request সফল হয়নি; পরে Retry করো।'}`;}return `${label}: catalog response পড়া যায়নি। Retry বা অন্য catalog বেছে নাও।`;}
function tmdb(m:any,kind:'movie'|'tv'):Title{return {key:`tmdb:${kind}:${m.id}`,provider:'tmdb',kind,id:m.id,name:plain(m.title||m.name,240)||'Untitled',image:tmdbImage(m.poster_path),banner:tmdbImage(m.backdrop_path),description:plain(m.overview),year:Number(String(m.release_date||m.first_air_date||'').slice(0,4))||null,rating:number(m.vote_average),genres:Array.isArray(m.genres)?m.genres.map((g:any)=>plain(g.name,80)).filter(Boolean):[],episodes:kind==='movie'?1:number(m.number_of_episodes),seasons:Array.isArray(m.seasons)?m.seasons.filter((s:any)=>Number.isInteger(s.season_number)&&s.season_number>=0).map((s:any)=>({number:s.season_number,name:plain(s.name,120),episodes:number(s.episode_count)||0})):undefined};}
export function validateCredential(v:string){const s=v.trim();if(s.length<16||s.length>4096||!/^[a-zA-Z0-9._-]+$/.test(s))throw Error('TMDB API key বা API Read Access Token সঠিকভাবে দাও।');return s;}
export async function catalogRequest(section:Section,query:string,page:number,filter:CatalogFilter,credential:string,signal:AbortSignal,animeSource:AnimeSource='kitsu'):Promise<{items:Title[];more:boolean}>{
 if(section==='anime'&&animeSource==='kitsu'){
  const params=new URLSearchParams({'page[limit]':'20','page[offset]':String((page-1)*20),sort:'popularityRank'});
  if(query.trim())params.set('filter[text]',query.trim());
  if(filter.genre)params.set('filter[categories]',filter.genre==='Sci-Fi'?'science-fiction':filter.genre.toLowerCase());
  if(/^\d{4}$/.test(filter.year))params.set('filter[year]',filter.year);
  const data=await request(`https://kitsu.app/api/edge/anime?${params}`,{headers:{Accept:'application/vnd.api+json'}},signal);
  if(!Array.isArray(data.data))throw new CatalogError('response');
  return {items:data.data.filter((m:any)=>m.type==='anime'&&/^\d+$/.test(String(m.id))&&Number.isSafeInteger(Number(m.id))&&Number(m.id)>0&&m.attributes?.nsfw!==true).map(kitsu),more:!!data.links?.next};
 }
 const japanese=section==='anime',kind=section==='movie'||japanese&&animeSource==='tmdb-movie'?'movie':'tv',search=!!query.trim();
 const params:any={page:String(page),include_adult:'false',language:'en-US'};
 if(search)params.query=query.trim();else{params.sort_by='popularity.desc';if(filter.genre)params.with_genres=filter.genre;if(filter.year)params[kind==='movie'?'primary_release_year':'first_air_date_year']=filter.year;if(section==='drama')params.with_origin_country=filter.origin||'KR|CN|JP';}
 if(japanese&&!search){const ids:Record<string,string>=kind==='tv'?{Action:'10759',Comedy:'35',Drama:'18',Fantasy:'10765','Sci-Fi':'10765'}:{Action:'28',Comedy:'35',Drama:'18',Fantasy:'14',Romance:'10749','Sci-Fi':'878'};params.with_genres=ids[filter.genre]?`16,${ids[filter.genre]}`:'16';params.with_original_language='ja';}
 const data=await tmdbRequest(`/${search?'search':'discover'}/${kind}`,params,credential,signal);

 // TMDB search ignores discover filters; UI disables them during search.
 return {items:(data.results||[]).filter((m:any)=>Number.isInteger(m.id)&&m.id>0&&(!japanese||!search||m.original_language==='ja'&&m.genre_ids?.includes(16))).map((m:any)=>tmdb(m,kind)),more:page<Math.min(data.total_pages||0,500)};
}
export async function titleDetail(t:Title,credential:string,signal:AbortSignal):Promise<Title>{
 if(t.provider==='jikan')return t; // Keep legacy IDs/snapshots, never call the retired public service.
 if(t.provider==='kitsu'){const d=await request(`https://kitsu.app/api/edge/anime/${t.id}`,{headers:{Accept:'application/vnd.api+json'}},signal);if(!d.data||Number(d.data.id)!==t.id)throw new CatalogError('response');return kitsu(d.data);}
 return tmdb(await tmdbRequest(`/${t.kind}/${t.id}`,{},credential,signal),t.kind as 'movie'|'tv');
}
export async function seasonEpisodes(t:Title,season:number,credential:string,signal:AbortSignal):Promise<Episode[]>{const d=await tmdbRequest(`/tv/${t.id}/season/${season}`,{},credential,signal);return (d.episodes||[]).filter((e:any)=>Number.isInteger(e.episode_number)&&e.episode_number>0).map((e:any)=>({number:e.episode_number,name:plain(e.name,200)||`Episode ${e.episode_number}`}));}
async function tmdbRequest(path:string,params:Record<string,string>,credential:string,signal:AbortSignal){
 let key:string;try{key=validateCredential(credential);}catch{throw new CatalogError('credential');}const u=new URL('https://api.themoviedb.org/3'+path);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);
 const headers:Record<string,string>={accept:'application/json'};if(/^[a-fA-F0-9]{32}$/.test(key))u.searchParams.set('api_key',key);else headers.Authorization=`Bearer ${key}`;
 return request(u.toString(),{headers},signal);
}
async function request(url:string,init:RequestInit,signal:AbortSignal){let r:Response;try{r=await fetch(url,{...init,signal,redirect:'error'});}catch{throw new CatalogError(signal.aborted?'timeout':'network');}if(!r.ok)throw new CatalogError('http',r.status);try{const d=await r.json();if(d.errors)throw new CatalogError('response');return d;}catch{throw new CatalogError(signal.aborted?'timeout':'response');}}
