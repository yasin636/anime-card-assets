export type Section='anime'|'movie'|'drama';
export type Title={key:string;provider:'jikan'|'tmdb';kind:'anime'|'movie'|'tv';id:number;name:string;image:string|null;banner:string|null;description:string;year:number|null;rating:number|null;genres:string[];episodes:number|null;seasons?:{number:number;name:string;episodes:number}[]};
export type Episode={number:number;name:string};
export type CatalogFilter={year:string;genre:string;origin:string};
const plain=(v:unknown,max=6000)=>typeof v==='string'?v.replace(/<[^>]*>/g,'').slice(0,max):'';
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
const image=(v:unknown,host:string)=>{try{const u=new URL(String(v));return u.protocol==='https:'&&u.hostname===host?u.toString():null;}catch{return null;}};
const tmdbImage=(v:unknown)=>typeof v==='string'&&/^\/[\w.\-/]+$/.test(v)?`https://image.tmdb.org/t/p/w500${v}`:null;
function anime(m:any):Title{return {key:`jikan:${m.mal_id}`,provider:'jikan',kind:'anime',id:m.mal_id,name:plain(m.title_english||m.title||m.title_japanese,240)||'Untitled',image:image(m.images?.jpg?.large_image_url,'cdn.myanimelist.net'),banner:null,description:plain(m.synopsis),year:number(m.year),rating:number(m.score),genres:Array.isArray(m.genres)?m.genres.map((g:any)=>plain(g.name,80)).filter(Boolean):[],episodes:number(m.episodes)};}
function tmdb(m:any,kind:'movie'|'tv'):Title{return {key:`tmdb:${kind}:${m.id}`,provider:'tmdb',kind,id:m.id,name:plain(m.title||m.name,240)||'Untitled',image:tmdbImage(m.poster_path),banner:tmdbImage(m.backdrop_path),description:plain(m.overview),year:Number(String(m.release_date||m.first_air_date||'').slice(0,4))||null,rating:number(m.vote_average),genres:Array.isArray(m.genres)?m.genres.map((g:any)=>plain(g.name,80)).filter(Boolean):[],episodes:kind==='movie'?1:number(m.number_of_episodes),seasons:Array.isArray(m.seasons)?m.seasons.filter((s:any)=>Number.isInteger(s.season_number)&&s.season_number>=0).map((s:any)=>({number:s.season_number,name:plain(s.name,120),episodes:number(s.episode_count)||0})):undefined};}
export function validateCredential(v:string){const s=v.trim();if(s.length<16||s.length>4096||!/^[a-zA-Z0-9._-]+$/.test(s))throw Error('TMDB API key বা API Read Access Token সঠিকভাবে দাও।');return s;}
export async function catalogRequest(section:Section,query:string,page:number,filter:CatalogFilter,credential:string,signal:AbortSignal):Promise<{items:Title[];more:boolean}>{
 if(section==='anime'){
  const params=new URLSearchParams({page:String(page),limit:'24',sfw:'true',order_by:'members',sort:'desc'});
  if(query.trim())params.set('q',query.trim());
  const genres:Record<string,string>={Action:'1',Comedy:'4',Drama:'8',Fantasy:'10',Romance:'22','Sci-Fi':'24'};
  if(genres[filter.genre])params.set('genres',genres[filter.genre]);
  if(/^\d{4}$/.test(filter.year)){params.set('start_date',`${filter.year}-01-01`);params.set('end_date',`${filter.year}-12-31`);}
  const data=await request(`https://api.jikan.moe/v4/anime?${params}`,{},signal);
  return {items:(data.data||[]).filter((m:any)=>Number.isInteger(m.mal_id)&&m.mal_id>0).map(anime),more:!!data.pagination?.has_next_page};
 }
 const kind=section==='movie'?'movie':'tv',search=!!query.trim();
 const params:any={page:String(page),include_adult:'false',language:'en-US'};
 if(search)params.query=query.trim();else{params.sort_by='popularity.desc';if(filter.genre)params.with_genres=filter.genre;if(filter.year)params[kind==='movie'?'primary_release_year':'first_air_date_year']=filter.year;if(section==='drama')params.with_origin_country=filter.origin||'KR|CN|JP';}
 const data=await tmdbRequest(`/${search?'search':'discover'}/${kind}`,params,credential,signal);
 // TMDB search ignores discover filters; UI disables them during search.
 return {items:(data.results||[]).filter((m:any)=>Number.isInteger(m.id)&&m.id>0).map((m:any)=>tmdb(m,kind)),more:page<Math.min(data.total_pages||0,500)};
}
export async function titleDetail(t:Title,credential:string,signal:AbortSignal):Promise<Title>{
 if(t.provider==='jikan'){const d=await request(`https://api.jikan.moe/v4/anime/${t.id}/full`,{},signal);if(!d.data)throw Error('এই title পাওয়া যায়নি।');return anime(d.data);}
 return tmdb(await tmdbRequest(`/${t.kind}/${t.id}`,{},credential,signal),t.kind as 'movie'|'tv');
}
export async function seasonEpisodes(t:Title,season:number,credential:string,signal:AbortSignal):Promise<Episode[]>{const d=await tmdbRequest(`/tv/${t.id}/season/${season}`,{},credential,signal);return (d.episodes||[]).filter((e:any)=>Number.isInteger(e.episode_number)&&e.episode_number>0).map((e:any)=>({number:e.episode_number,name:plain(e.name,200)||`Episode ${e.episode_number}`}));}
async function tmdbRequest(path:string,params:Record<string,string>,credential:string,signal:AbortSignal){
 const key=validateCredential(credential);const u=new URL('https://api.themoviedb.org/3'+path);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);
 const headers:Record<string,string>={accept:'application/json'};if(/^[a-fA-F0-9]{32}$/.test(key))u.searchParams.set('api_key',key);else headers.Authorization=`Bearer ${key}`;
 return request(u.toString(),{headers},signal);
}
async function request(url:string,init:RequestInit,signal:AbortSignal){const r=await fetch(url,{...init,signal,redirect:'error'});if(!r.ok){if(r.status===401||r.status===403)throw Error('Catalog access denied। TMDB credential/permission পরীক্ষা করো।');if(r.status===429)throw Error('Catalog rate limit। কিছুক্ষণ পরে Retry করো।');throw Error('Catalog পাওয়া যায়নি। Network পরীক্ষা করে Retry করো।');}const d=await r.json();if(d.errors)throw Error('Catalog query সফল হয়নি। পরে Retry করো।');return d;}
