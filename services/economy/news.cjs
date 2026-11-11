'use strict';
const {EconomyError}=require('./domain.cjs');
const URL_SOURCE='https://api.jikan.moe/v4/anime?order_by=start_date&sort=desc&limit=15&sfw=true&status=airing';
let cache=null,pending=null;
function safeImage(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?s:'';}catch{return '';}}
function mapArticles(raw){if(!Array.isArray(raw))throw new EconomyError('news-provider-unavailable');return raw.filter(a=>Number.isSafeInteger(a?.mal_id)&&a.mal_id>0).slice(0,15).map(a=>({id:`news-${a.mal_id}`,title:String(a.title||a.title_english||'Anime Update').slice(0,300),image:safeImage(a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||''),excerpt:String(a.synopsis||'No synopsis.').slice(0,180)+'...',url:`https://myanimelist.net/anime/${a.mal_id}`,date:typeof a.aired?.from==='string'?a.aired.from:'',score:typeof a.score==='number'?a.score:null,episodes:Number.isSafeInteger(a.episodes)?a.episodes:null}));}
async function loadCatalog({fetcher=fetch,now=Date.now()}={}){
 if(cache&&now-cache.fetchedAt<300000)return {...cache,stale:false};if(pending)return pending;
 pending=(async()=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);try{const r=await fetcher(URL_SOURCE,{signal:c.signal,headers:{Accept:'application/json'}});if(!r.ok)throw Error('provider');const body=await r.json(),articles=mapArticles(body.data);cache={articles,fetchedAt:now};return {...cache,stale:false};}catch{if(cache&&now-cache.fetchedAt<86400000)return {...cache,stale:true};throw new EconomyError('news-provider-unavailable');}finally{clearTimeout(timer);pending=null;}})();return pending;
}
function resetCatalogForTests(){cache=null;pending=null;}
module.exports={URL_SOURCE,mapArticles,loadCatalog,resetCatalogForTests};
