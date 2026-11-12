export type AudioPreferences={track:number;mode:'repeat'|'continue';musicVolume:number;sfxVolume:number;sfxEnabled:boolean;voiceEnabled:boolean};
export const defaults:AudioPreferences={track:0,mode:'repeat',musicVolume:.35,sfxVolume:.7,sfxEnabled:true,voiceEnabled:true};
const volume=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;
export function preferences(value:unknown):AudioPreferences{const p=(value&&typeof value==='object'?value:{}) as Partial<AudioPreferences>;return {track:Number.isInteger(p.track)&&p.track!>=0&&p.track!<3?p.track!:0,mode:p.mode==='continue'?'continue':'repeat',musicVolume:volume(p.musicVolume,defaults.musicVolume),sfxVolume:volume(p.sfxVolume,defaults.sfxVolume),sfxEnabled:typeof p.sfxEnabled==='boolean'?p.sfxEnabled:true,voiceEnabled:typeof p.voiceEnabled==='boolean'?p.voiceEnabled:true};}
export function nextTrack(track:number){return (track+1)%3;}
export const trackNames=['System Drift · original demo','Quiet Orbit · original demo','Neon Steps · original demo'];
