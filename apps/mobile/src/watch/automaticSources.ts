import {findStreams,IntegratedStream,SourceConfig,SourceError} from './sourceIntegration';
import type {SourceIdentity} from './catalog';
export const openAnimationSource:SourceConfig={id:'src-openanimation',name:'Open Animation',kind:'stremio',url:'https://raw.githubusercontent.com/yasin636/anime-card-assets/arena/cd835a4c-anime-card-assets/docs/watch-sources/blender/manifest.json',enabled:true,idPrefixes:['tt1254207'],apiHeaders:{},playbackOrigins:[],allowProxyHeaders:false};
export const openAnimationStream:IntegratedStream={id:'open-animation-archive',name:'Big Buck Bunny · Archive 240p',description:'Blender Foundation · CC BY 3.0 · full short film · H.264/AAC · keep ending credits · https://peach.blender.org/about/',url:'https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4',headers:{},subtitles:[]};
export function automaticCandidates(sources:SourceConfig[],identities:SourceIdentity[],type:'movie'|'series'){
 const safe=identities.filter(i=>!i.requiresEpisodeConfirmation).sort((a,b)=>Number(b.id.startsWith('tt'))-Number(a.id.startsWith('tt')));
 const available=[...sources.filter(s=>s.enabled)];if(type==='movie'&&safe.some(i=>i.id==='tt1254207')&&!available.some(s=>s.id===openAnimationSource.id))available.unshift(openAnimationSource);
 return available.map(source=>({source,identity:safe.find(i=>source.idPrefixes.some(p=>i.id.startsWith(p)))})).filter((x):x is {source:SourceConfig;identity:SourceIdentity}=>!!x.identity);
}
export async function resolveAutomatically(sources:SourceConfig[],identities:SourceIdentity[],type:'movie'|'series',season:number,episode:number,signal:AbortSignal){
 const candidates=automaticCandidates(sources,identities,type);if(!candidates.length)throw new SourceError('mapping');let last:unknown=new SourceError('unsupported');
 for(const {source,identity}of candidates){if(signal.aborted)throw new SourceError('timeout');try{const rows=await findStreams(source,{type,id:identity.id,season,episode},signal);if(rows.length)return rows;}catch(e){last=e;}}
 if(last instanceof SourceError)throw last;throw new SourceError('response');
}
