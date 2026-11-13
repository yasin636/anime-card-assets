import {Directory,File,Paths} from 'expo-file-system';
import {fetch as httpFetch} from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {fetchSourceText} from '../sourceIntegration';
import {DownloadEntry,validDownload} from './model';
import {DownloadIO} from './manager';
export async function nativeDownloadIO(uid:string):Promise<DownloadIO>{
 const hash=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,uid),root=new Directory(Paths.document,`watch-downloads-${hash}`);root.create({intermediates:true,idempotent:true});
 const indexKey=`watch.downloads.v1.${uid}`,secret=(id:string)=>`watch.download.v1.${uid}.${id}`;let ids:string[]=[];let queue:Promise<unknown>=Promise.resolve();
 const ordered=<T,>(fn:()=>Promise<T>):Promise<T>=>{const task=queue.then(fn,fn);queue=task.catch(()=>{});return task;};
 const file=(id:string,sub?:string)=>{if(!/^dl-[a-z0-9-]{1,70}$/.test(id)||sub&&!/^sub-\d{1,2}$/.test(sub))throw Error('Invalid private file ID');return new File(root,sub?`${id}-${sub}.vtt`:`${id}.video`);};
 return {
 async load(){const raw=await AsyncStorage.getItem(indexKey);const parsed=raw?JSON.parse(raw):[];if(!Array.isArray(parsed)||parsed.length>20||parsed.some(id=>typeof id!=='string'||!/^dl-[a-z0-9-]{1,70}$/.test(id)))throw Error('Invalid index');ids=[...new Set(parsed)];const entries:DownloadEntry[]=[];for(const id of ids){const data=await SecureStore.getItemAsync(secret(id));if(!data||data.length>18000)throw Error('Missing private metadata');const entry=JSON.parse(data);if(!validDownload(entry)||entry.id!==id)throw Error('Invalid metadata');entries.push(entry);}return entries;},
 save(e){const raw=JSON.stringify(e);if(raw.length>16000)return Promise.reject(Error('Private metadata limit'));return ordered(async()=>{const existed=ids.includes(e.id);await SecureStore.setItemAsync(secret(e.id),raw);if(!existed){const next=[...ids,e.id];try{await AsyncStorage.setItem(indexKey,JSON.stringify(next));ids=next;}catch(err){await SecureStore.deleteItemAsync(secret(e.id));throw err;}}});},
 remove(e){return ordered(async()=>{const next=ids.filter(id=>id!==e.id);await AsyncStorage.setItem(indexKey,JSON.stringify(next));ids=next;for(const sub of e.subtitles){const f=file(e.id,sub.id);if(f.exists)f.delete();}const f=file(e.id);if(f.exists)f.delete();await SecureStore.deleteItemAsync(secret(e.id));});},
 size(id){const f=file(id);return f.exists?f.size:0;},head(id){const h=file(id).open();try{return h.readBytes(16);}finally{h.close();}},
 writer(id,offset){const f=file(id);if(!offset)f.create({overwrite:true,intermediates:true});else if(!f.exists||f.size!==offset)throw Error('Partial size changed');const handle=f.open();handle.offset=offset;return {write:bytes=>handle.writeBytes(bytes),close:()=>handle.close()};},
 deleteVideo(id){const f=file(id);if(f.exists)f.delete();},free:()=>Paths.availableDiskSpace,
 saveCaption(id,sub,text){file(id,sub).write(text);},readCaption(id,sub){return file(id,sub).textSync();},uri:id=>file(id).uri,
 fetch:(url,init)=>httpFetch(url,{headers:init.headers,signal:init.signal||undefined,credentials:'omit',redirect:init.redirect}),caption:(url,signal)=>fetchSourceText(url,{},signal,512*1024),
 };
}
