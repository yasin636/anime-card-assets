export type Cue={start:number;end:number;text:string};
export const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
export function clock(seconds:number){const n=Math.floor(clamp(seconds,0,359999));return `${Math.floor(n/3600)?`${Math.floor(n/3600)}:`:''}${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function time(raw:string){const parts=raw.trim().replace(',','.').split(':').map(Number);if(parts.some(n=>!Number.isFinite(n)||n<0)||parts.length<2||parts.length>3)return NaN;return parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts[0]*60+parts[1];}
export function parseSubtitles(raw:string):Cue[]{
 if(raw.length>512*1024)throw Error('Subtitle file exceeds 512 KiB.');
 const cues:Cue[]=[];const lines=raw.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
 for(let i=0;i<lines.length;i++){const match=lines[i].match(/^\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s+-->\s+((?:\d+:)?\d{2}:\d{2}[.,]\d{3})/);if(!match)continue;const start=time(match[1]),end=time(match[2]);const texts:string[]=[];while(i+1<lines.length&&lines[i+1].trim())texts.push(lines[++i]);const text=texts.join('\n').replace(/<[^>]*>/g,'').slice(0,1500);if(Number.isFinite(start)&&end>start&&text)cues.push({start,end,text});if(cues.length>5000)throw Error('Subtitle file has too many cues.');}
 if(!cues.length)throw Error('Valid UTF-8 SRT/VTT subtitle cues পাওয়া যায়নি।');return cues.sort((a,b)=>a.start-b.start);
}
// Positive offset delays the subtitle; preserve overlapping cues rather than invent translations.
export function cueText(cues:Cue[],position:number,delay:number){const t=position-delay;return cues.filter(c=>c.start<=t&&t<c.end).slice(0,3).map(c=>c.text).join('\n');}
export function trackName(t:{label:string;language:string},index:number){const label=t.label?.trim();if(label&&label!=='und')return label;const lang=t.language?.trim();return lang&&lang!=='und'?lang:`Track ${index+1}`;}
export function backgroundMayPlay(inPip:boolean,pipRequested:boolean){return inPip||pipRequested;}
