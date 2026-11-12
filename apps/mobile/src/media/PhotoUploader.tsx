import React,{useEffect,useRef,useState} from 'react';
import {AppState,Image,Text,View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAuth} from '@react-native-firebase/auth';
import {randomUUID} from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {ActionButton,f} from '../ui/forms';
import {advance,MediaError,Purpose,Work,Prepared,providerError} from './workflow';
const raw=process.env.EXPO_PUBLIC_ECONOMY_API_URL||process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL||'';
const endpoint=/^https:\/\/[^/\s]+(?:\/[^\s]*)?$/.test(raw)?raw.replace(/\/+$/,''):'';
export function PhotoUploader({uid,purpose,disabled=false,consumedId,onReady,onBusy,onPending}:{uid:string;purpose:Purpose;disabled?:boolean;consumedId?:string;onReady?:(id:string|null)=>void;onBusy?:(busy:boolean)=>void;onPending?:(pending:boolean)=>void}){
 const key=`media.pending.v1.${uid}.${purpose}`,focused=useIsFocused(),[ready,setReady]=useState(false),[work,setWork]=useState<Work|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 const selecting=useRef(false),alive=useRef(true),lock=useRef(false),controller=useRef<AbortController|null>(null),workRef=useRef<Work|null>(null),callbacks=useRef({onReady,onBusy,onPending});callbacks.current={onReady,onBusy,onPending};workRef.current=work;
 const check=()=>{if(!alive.current||getAuth().currentUser?.uid!==uid)throw new MediaError('unauthenticated');if(controller.current?.signal.aborted)throw new MediaError('cancelled');};
 const save=async(w:Work)=>{check();await AsyncStorage.setItem(key,JSON.stringify(w));check();workRef.current=w;setWork(w);callbacks.current.onPending?.(!w.done);};
 useEffect(()=>{alive.current=true;let valid=true;AsyncStorage.getItem(key).then(s=>{if(!valid)return;if(s){const w=JSON.parse(s) as Work;if(w.uid!==uid||w.purpose!==purpose||typeof w.uri!=='string'||typeof w.prepareId!=='string')throw Error();setWork(w);callbacks.current.onPending?.(!w.done);if(w.done&&purpose==='feed'&&w.done.uploadId!==consumedId)callbacks.current.onReady?.(w.done.uploadId);}setReady(true);}).catch(()=>{if(valid)setError('Pending photo পড়া যায়নি। Storage যাচাই ছাড়া overwrite করা হয়নি।');});const sub=AppState.addEventListener('change',s=>{if(s!=='active'&&!selecting.current)controller.current?.abort();});return()=>{valid=false;alive.current=false;controller.current?.abort();callbacks.current.onBusy?.(false);sub.remove();};},[key]);
 useEffect(()=>{if(!focused)controller.current?.abort();},[focused]);
 useEffect(()=>{if(consumedId&&work?.done?.uploadId===consumedId&&!lock.current){void AsyncStorage.removeItem(key).then(()=>{if(alive.current){setWork(null);setStatus('ছবিসহ post প্রকাশ হয়েছে।');callbacks.current.onReady?.(null);}}).catch(()=>setError('Post হয়েছে; local attachment clear হয়নি। Retry refresh করো।'));}},[consumedId,work?.done?.uploadId]);
 const request=async(id:string,command:Record<string,unknown>)=>{check();if(!endpoint)throw new MediaError('media-not-configured');const token=await getAuth().currentUser!.getIdToken();check();const r=await fetch(`${endpoint}/v1/economy`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({operationId:id,command}),signal:controller.current!.signal});const data=await r.json();check();if(!r.ok)throw new MediaError(data.error||'upload-failed',command.type==='mediaFinalize'?'inspect':command.type==='mediaDiscard'?'discard':'prepare');if(data.result?.type!==command.type||data.result?.mediaCapability!=='images-v1')throw new MediaError('upload-failed');return data.result;};
 const upload=async(p:Prepared,uri:string)=>{
  if(!/^https:\/\/api\.cloudinary\.com\/v1_1\/[a-zA-Z0-9_-]+\/image\/upload$/.test(p.upload.url))throw new MediaError('upload-failed');
  const form=new FormData();form.append('file',{uri,type:'image/jpeg',name:'photo.jpg'} as unknown as Blob);form.append('api_key',p.upload.apiKey);form.append('signature',p.upload.signature);for(const [k,v]of Object.entries(p.upload.params))form.append(k,String(v));
  const response=await fetch(p.upload.url,{method:'POST',body:form,signal:controller.current!.signal});check();if(!response.ok){let body:unknown=null;try{body=await response.json();}catch{}throw new MediaError(providerError(response.status,body),'upload');}
 };
 const execute=async(action:'pick'|'retry'|'remove')=>{
  if(lock.current||!ready||disabled||!focused)return;lock.current=true;setBusy(true);callbacks.current.onBusy?.(true);setError('');controller.current=new AbortController();const timeout=setTimeout(()=>controller.current?.abort(),120000);
  try{
   check();let w=workRef.current;
   if(action==='remove'){
    if(w?.prepared&&!(purpose==='avatar'&&w.done))await request(w.discardId,{type:'mediaDiscard',uploadId:w.prepared.uploadId});
    check();await AsyncStorage.removeItem(key);setWork(null);callbacks.current.onPending?.(false);callbacks.current.onReady?.(null);setStatus('Local photo সরানো হয়েছে।');return;
   }
   if(action==='pick'){selecting.current=true;
    if(w)throw new MediaError('upload-failed');const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();check();if(!permission.granted){setError('Gallery permission প্রয়োজন। Settings থেকে photo access দাও।');return;}
    const picked=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,...(purpose==='avatar'?{aspect:[1,1] as [number,number]}:{}),quality:1});check();if(picked.canceled)return;const image=picked.assets[0];if(image.fileSize&&image.fileSize>20*1024*1024)throw new MediaError('media-file-invalid');
    const resize=purpose==='avatar'?{width:512}:image.width>=image.height?{width:Math.min(1600,image.width)}:{height:Math.min(1600,image.height)};
    const compressed=await ImageManipulator.manipulateAsync(image.uri,[{resize}],{format:ImageManipulator.SaveFormat.JPEG,compress:.7,base64:true});check();if(!compressed.base64||compressed.base64.length*3/4>(purpose==='avatar'?1048576:3145728))throw new MediaError('media-file-invalid');
    w={uid,purpose,uri:compressed.uri,prepareId:randomUUID(),finalizeId:randomUUID(),discardId:randomUUID()};await save(w);
   }
   selecting.current=false;if(!w)return;if(AppState.currentState!=='active')throw new MediaError('cancelled');const done=await advance(w,{request,save,upload,check,stage:setStatus});check();if(purpose==='feed')callbacks.current.onReady?.(done.done!.uploadId);setStatus(purpose==='avatar'?'Profile photo server-এ save হয়েছে।':'Photo verified · caption লিখে Publish করো।');
  }catch(err){if(alive.current)setError(controller.current?.signal.aborted?'Upload থেমেছে। একই ছবি Retry বা Remove করো।':err instanceof MediaError?`${err.message} [${err.stage||'client'} / ${err.code}]`:'সংযোগে upload নিশ্চিত হয়নি। একই ছবি Retry করো।');}
  finally{selecting.current=false;clearTimeout(timeout);lock.current=false;if(alive.current){setBusy(false);callbacks.current.onBusy?.(false);}controller.current=null;}
 };
 return <View style={{gap:12}}>{work&&<Image source={{uri:work.done?.asset.url||work.uri}} accessibilityLabel="Selected photo preview" resizeMode="contain" style={{height:180,width:'100%',borderRadius:12}}/>}<ActionButton secondary title={work?'Photo selected':'Choose Gallery photo'} disabled={!ready||disabled||busy||!!work} onPress={()=>void execute('pick')}/>{work&&!work.done&&<ActionButton title="Retry pending photo upload" disabled={disabled||busy||!ready} onPress={()=>void execute('retry')}/>} {work&&<ActionButton secondary title={purpose==='avatar'&&work.done?'Choose another profile photo':'Remove photo attachment'} disabled={disabled||busy||!ready} onPress={()=>void execute('remove')}/>} {busy&&<ActionButton secondary title="Stop upload · keep pending" onPress={()=>controller.current?.abort()}/>} {!!status&&<Text style={f.body}>{status}</Text>}{!!error&&<Text accessibilityRole="alert" style={f.error}>{error}</Text>}<Text style={f.body}>{purpose==='avatar'?'JPEG photo · সর্বোচ্চ 1 MB':'Photo · সর্বোচ্চ 3 MB · caption প্রয়োজন'}</Text></View>;
}
