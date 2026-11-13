import {Caption,checkResponse,DownloadEntry,DownloadProblem,downloadInput,sniffVideo,validDownload} from './model';
import {parseSubtitles} from '../playerModel';
export interface DownloadIO{
 load():Promise<DownloadEntry[]>;save(entry:DownloadEntry):Promise<void>;remove(entry:DownloadEntry):Promise<void>;
 size(id:string):number;head(id:string):Uint8Array;writer(id:string,offset:number):{write(bytes:Uint8Array):void;close():void};deleteVideo(id:string):void;free():number;
 saveCaption(id:string,captionId:string,text:string):void;readCaption(id:string,captionId:string):string;uri(id:string):string;
 fetch(url:string,init:RequestInit):Promise<Response>;caption(url:string,signal:AbortSignal):Promise<string>;
}
export class DownloadManager{
 items:DownloadEntry[]=[];ready=false;error='';private active?:{id:string;abort:AbortController;reason?:'pause'|'cancel';done:Promise<void>};private closing=false;private adding=false;private serial=0;
 constructor(readonly io:DownloadIO,private notify:()=>void){}
 private emit(){this.notify();}
 async init(){try{const entries=await this.io.load();if(entries.some(e=>!validDownload(e)))throw new DownloadProblem('metadata');for(const e of entries){Object.assign(e,downloadInput(e));if(e.etag&&(typeof e.etag!=='string'||e.etag.length>512||/[\r\n\0]/.test(e.etag)))throw new DownloadProblem('metadata');e.bytes=this.io.size(e.id);if(e.state!=='complete')e.state='paused';else if(!e.bytes||e.bytes!==e.total){e.state='error';e.message='Local video file নেই/অসম্পূর্ণ। Restart download করো।';} }this.items=entries;this.ready=true;}catch{this.error='Downloads storage পড়া যায়নি। পুরোনো files overwrite করা হবে না।';}this.emit();}
 async add(input:Parameters<typeof downloadInput>[0]){if(!this.ready||this.closing)throw new DownloadProblem('Downloads storage প্রস্তুত নয়।');if(this.active||this.adding)throw new DownloadProblem('একবারে একটি download চলে। চলতি download Pause করে আরেকটি নাও।');if(this.items.length>=20)throw new DownloadProblem('সর্বোচ্চ ২০টি download রাখা যাবে।');const safe=downloadInput(input);const e:DownloadEntry={...safe,id:`dl-${Date.now().toString(36)}-${(++this.serial).toString(36)}`,state:'paused',bytes:0,total:0,captions:[],message:'',created:Date.now()};this.adding=true;try{try{await this.io.save(e);}catch{throw new DownloadProblem('Download metadata save হয়নি। Device storage পরীক্ষা করো।');}if(this.closing)return;this.items.push(e);this.emit();void this.start(e.id);}finally{this.adding=false;}}
 async start(id:string){if(this.active||this.closing)return;const e=this.items.find(x=>x.id===id);if(!e)return;const job={id,abort:new AbortController(),reason:undefined as 'pause'|'cancel'|undefined,done:Promise.resolve()};this.active=job;job.done=this.run(e,job).catch(()=>{e.state='error';e.message='Download/storage action ব্যর্থ হয়েছে। Partial file play হবে না।';this.error='Local download/storage পরীক্ষা করো।';}).finally(()=>{if(this.active===job)this.active=undefined;this.emit();});return job.done;}
 private async run(e:DownloadEntry,job:NonNullable<DownloadManager['active']>){let writer:ReturnType<DownloadIO['writer']>|undefined,reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let idle:ReturnType<typeof setTimeout>|undefined;const signal=job.abort.signal;
 const timeout=()=>{clearTimeout(idle);idle=setTimeout(()=>job.abort.abort(),45000);};
 try{e.state='checking';e.message='';e.bytes=this.io.size(e.id);this.emit();await this.io.save(e);if(signal.aborted)throw new DownloadProblem('abort');
 if(!(e.total>0&&e.bytes===e.total&&e.kind)){
  if(e.bytes&&!e.etag)throw new DownloadProblem('এই server strong file validator দেয়নি; নিরাপদ Resume সম্ভব নয়। Restart download করো।');
  timeout();const headers:Record<string,string>={...e.headers,'Accept-Encoding':'identity'};if(e.bytes){headers.Range=`bytes=${e.bytes}-`;headers['If-Range']=e.etag!;}
  const response=await this.io.fetch(e.url,{headers,signal,credentials:'omit',redirect:Object.keys(e.headers).length?'error':'follow'});timeout();const checked=checkResponse(response.status,k=>response.headers.get(k),e.bytes,e.etag,e.total);e.total=checked.total;e.etag=checked.etag;
  if(this.io.free()<e.total-e.bytes+10*1024*1024)throw new DownloadProblem('ফোনে যথেষ্ট খালি storage নেই।');
  if(!response.body)throw new DownloadProblem('এই device-এ streaming download reader পাওয়া যায়নি।');reader=response.body.getReader();
  const chunks:Uint8Array[]=[];let prefixSize=0;if(!e.bytes){while(prefixSize<16){const p=await reader.read();if(p.done)break;chunks.push(p.value);prefixSize+=p.value.length;timeout();}const prefix=new Uint8Array(prefixSize);let i=0;for(const p of chunks){prefix.set(p,i);i+=p.length;}e.kind=sniffVideo(prefix);}
  if(signal.aborted)throw new DownloadProblem('abort');writer=this.io.writer(e.id,e.bytes);e.state='downloading';await this.io.save(e);this.emit();let last=0;
  const write=(bytes:Uint8Array)=>{if(signal.aborted)throw new DownloadProblem('abort');if(e.bytes+bytes.length>e.total)throw new DownloadProblem('Server file size মেলেনি; অসম্পূর্ণ file play হবে না।');writer!.write(bytes);e.bytes+=bytes.length;if(Date.now()-last>250){last=Date.now();this.emit();}};
  for(const p of chunks)write(p);while(true){const p=await reader.read();timeout();if(p.done)break;write(p.value);}writer.close();writer=undefined;reader.releaseLock();reader=undefined;
  if(e.bytes!==e.total)throw new DownloadProblem('Download অসম্পূর্ণ। Resume অথবা Restart করো।');sniffVideo(this.io.head(e.id));await this.io.save(e);
 }
 clearTimeout(idle);if(signal.aborted)throw new DownloadProblem('abort');e.state='subtitles';this.emit();let failures=0;
 for(const sub of e.subtitles){if(signal.aborted)throw new DownloadProblem('abort');if(e.captions.some(c=>c.id===sub.id))continue;try{timeout();const raw=sub.text||await this.io.caption(sub.url!,signal);parseSubtitles(raw);if(signal.aborted)throw new DownloadProblem('abort');this.io.saveCaption(e.id,sub.id,raw);e.captions.push({id:sub.id,lang:sub.lang});await this.io.save(e);}catch{if(signal.aborted)throw new DownloadProblem('abort');failures++;}finally{clearTimeout(idle);}}
 e.state='complete';e.message=failures?`${failures}টি subtitle save হয়নি। Video আছে; Retry subtitles করো।`:'';await this.io.save(e);
 }catch(err){try{e.bytes=this.io.size(e.id);}catch{e.bytes=0;}if(job.reason){e.state='paused';e.message=job.reason==='pause'?'Paused · Resume চাপো।':'';}else{e.state='error';e.message=signal.aborted?'Download timeout/network interruption। Resume চেষ্টা করো।':err instanceof DownloadProblem?err.message:'Download হয়নি। Network/storage পরীক্ষা করে Resume করো।';}try{await this.io.save(e);}catch{this.error='Download metadata save হয়নি। Storage পরীক্ষা করো।';}}
 finally{clearTimeout(idle);job.abort.abort();try{await reader?.cancel();}catch{}try{reader?.releaseLock();}catch{}try{writer?.close();}catch{}this.emit();}}
 async pause(){const a=this.active;if(!a)return;a.reason='pause';a.abort.abort();await a.done;}
 async cancel(id:string){const a=this.active;if(a?.id===id){a.reason='cancel';a.abort.abort();await a.done;}const e=this.items.find(x=>x.id===id);if(!e)return;await this.io.remove(e);this.items=this.items.filter(x=>x.id!==id);this.emit();}
 async restart(id:string){if(this.active)throw new DownloadProblem('চলতি download আগে Pause করো।');const e=this.items.find(x=>x.id===id);if(!e)return;this.io.deleteVideo(id);e.bytes=0;e.total=0;e.etag=undefined;e.kind=undefined;e.captions=[];e.state='paused';await this.io.save(e);void this.start(id);}
 offline(id:string){const e=this.items.find(x=>x.id===id);if(!e||e.state!=='complete'||this.io.size(id)!==e.total)throw new DownloadProblem('Local download সম্পূর্ণ নেই।');sniffVideo(this.io.head(id));const localSubtitles=e.captions.map(c=>{const text=this.io.readCaption(id,c.id);parseSubtitles(text);return {...c,text};});return {source:{uri:this.io.uri(id),contentType:'progressive' as const},title:e.title,resume:0,testMode:e.testMode,localSubtitles};}
 async shutdown(){this.closing=true;await this.pause();}
 get activeId(){return this.active?.id;}
}
