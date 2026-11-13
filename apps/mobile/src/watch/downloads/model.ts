import {mediaUrl} from '../model';
export class DownloadProblem extends Error{constructor(message:string){super(message);this.name='DownloadProblem';}}
export type DownloadState='paused'|'checking'|'downloading'|'subtitles'|'complete'|'error';
export type Caption={id:string;lang:string;url?:string;text?:string};
export type DownloadEntry={id:string;title:string;url:string;headers:Record<string,string>;subtitles:Caption[];testMode:boolean;state:DownloadState;bytes:number;total:number;etag?:string;kind?:'mp4'|'mkv'|'avi';captions:{id:string;lang:string}[];message:string;created:number};
export const MAX_VIDEO_BYTES=2*1024*1024*1024;
export function downloadInput(input:{url:string;headers?:Record<string,string>;subtitles?:Caption[];title:string;testMode?:boolean}){
 const url=mediaUrl(input.url);if(/\.(m3u8|mpd)(?:$|[?#])/i.test(url))throw new DownloadProblem('এই HLS/DASH/live stream offline save সমর্থিত নয়। Segment downloader এই বিল্ডে নেই।');
 const headers:Record<string,string>={};for(const [k,v]of Object.entries(input.headers||{})){if(!['referer','user-agent'].includes(k.toLowerCase())||typeof v!=='string'||v.length>2048||/[\r\n\0]/.test(v))throw new DownloadProblem('এই playback headers দিয়ে download সমর্থিত নয়।');headers[k.toLowerCase()]=v;}
 const subtitles=input.subtitles||[];if(subtitles.length>24)throw new DownloadProblem('সর্বোচ্চ ২৪টি subtitle নেওয়া যাবে।');
 const safe=subtitles.map((s,i)=>({id:`sub-${i}`,lang:String(s.lang).slice(0,40),...(s.url?{url:mediaUrl(s.url)}:{}),...(s.text?{text:s.text}:{})}));
 if(safe.some(s=>!s.url&&!s.text)||safe.some(s=>s.text&&s.text.length>512*1024))throw new DownloadProblem('Subtitle format/size সমর্থিত নয়।');
 return {url,headers,subtitles:safe,title:input.title.slice(0,240),testMode:input.testMode===true};
}
export function sniffVideo(bytes:Uint8Array):'mp4'|'mkv'|'avi'{const ascii=(a:number,b:number)=>Array.from(bytes.slice(a,b)).map(n=>String.fromCharCode(n)).join('');if(bytes.length>=12&&ascii(4,8)==='ftyp')return 'mp4';if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return 'mkv';if(ascii(0,4)==='RIFF'&&ascii(8,12)==='AVI ')return 'avi';throw new DownloadProblem('Response আসল supported video file নয়। HTML/playlist/text save করা হয়নি।');}
export function checkResponse(status:number,get:(key:string)=>string|null,offset:number,etag?:string,expected=0){
 if(status!==200&&status!==206)throw new DownloadProblem(`Video host HTTP ${status} দিয়েছে; download হয়নি।`);
 const type=(get('content-type')||'').toLowerCase();if(/mpegurl|dash\+xml|text\/|html|json|xml/.test(type))throw new DownloadProblem('এই response playlist/text/HTML; direct video download নয়।');
 if(get('content-encoding')&&!/^identity$/i.test(get('content-encoding')!))throw new DownloadProblem('Compressed response নিরাপদভাবে resume করা যায় না।');
 const length=Number(get('content-length'));let total=length;
 if(status===206){const range=get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);if(!range||Number(range[1])!==offset||Number(range[2])+1!==Number(range[3]))throw new DownloadProblem('Server সঠিক Range দেয়নি। Restart download করো।');total=Number(range[3]);if(length&&length!==total-offset)throw new DownloadProblem('Range length মেলেনি।');}
 if(offset){if(status!==206||!etag||get('etag')!==etag||expected&&total!==expected)throw new DownloadProblem('File বদলেছে অথবা server resume সমর্থন করেনি। Restart download করো; partial file-এ append করা হয়নি।');}
 if(!Number.isSafeInteger(total)||total<=0||total>MAX_VIDEO_BYTES)throw new DownloadProblem('File size জানা নেই অথবা 2 GiB সীমার বেশি; এই বিল্ডে download করা যাবে না।');
 const raw=get('etag');if(raw&&(raw.length>512||/[\r\n\0]/.test(raw)))throw new DownloadProblem('Server file validator invalid; download করা হয়নি।');return {total,etag:raw&&!/^W\//i.test(raw)?raw:undefined};
}
export function validDownload(v:any):v is DownloadEntry{return !!v&&/^dl-[a-z0-9-]{1,70}$/.test(v.id)&&typeof v.title==='string'&&v.title.length<=240&&typeof v.url==='string'&&Number.isSafeInteger(v.bytes)&&v.bytes>=0&&Number.isSafeInteger(v.total)&&v.total>=0&&v.total<=MAX_VIDEO_BYTES&&Array.isArray(v.captions)&&v.captions.every((c:any)=>/^sub-\d{1,2}$/.test(c.id)&&typeof c.lang==='string')&&['paused','checking','downloading','subtitles','complete','error'].includes(v.state);}
