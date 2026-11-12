export type AudioPreferences={library:'reference'|'demo';track:number;mode:'repeat'|'continue';musicVolume:number;sfxVolume:number;sfxEnabled:boolean;voiceEnabled:boolean};
export const defaults:AudioPreferences={library:'reference',track:0,mode:'repeat',musicVolume:.35,sfxVolume:.7,sfxEnabled:true,voiceEnabled:true};
const volume=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;
export function preferences(value:unknown):AudioPreferences{const p=(value&&typeof value==='object'?value:{}) as Partial<AudioPreferences>;return {library:p.library==='demo'?'demo':'reference',track:Number.isInteger(p.track)&&p.track!>=0&&p.track!<3?p.track!:0,mode:p.mode==='continue'?'continue':'repeat',musicVolume:volume(p.musicVolume,defaults.musicVolume),sfxVolume:volume(p.sfxVolume,defaults.sfxVolume),sfxEnabled:typeof p.sfxEnabled==='boolean'?p.sfxEnabled:true,voiceEnabled:typeof p.voiceEnabled==='boolean'?p.voiceEnabled:true};}
export function nextTrack(track:number){return (track+1)%3;}
export const referenceTracks=[{id:'dark-aria',title:'Dark Aria',uri:'https://files.catbox.moe/oogzjb.mp3'},{id:'tanjiro',title:'Kamado Tanjiro',uri:'https://files.catbox.moe/hbnkwu.mp3'},{id:'suzume',title:'Suzume',uri:'https://files.catbox.moe/viowx8.mp3'}];
export const referenceNames=referenceTracks.map(t=>t.title);
export const trackNames=['System Drift · original demo','Quiet Orbit · original demo','Neon Steps · original demo'];
