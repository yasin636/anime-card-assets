import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { useAuth } from '../auth/AuthProvider';
import { getAuth } from '@react-native-firebase/auth';
import {postSavedQuiz,QuizOperation} from './quizTransport';
import { generate, MODEL_IDS } from './gemini';
type Config={model:string;enabled:boolean};
type Context=Config&{requestQuiz:(operation:QuizOperation,token:string,signal:AbortSignal)=>Promise<Response>;ready:boolean;hasKey:boolean;revision:number;error:string;save:(config:Config,replacementKey:string)=>Promise<void>;remove:()=>Promise<void>;test:(model:string,replacementKey:string,signal:AbortSignal)=>Promise<void>;ask:(text:string,signal:AbortSignal)=>Promise<string>};
const AIContext=createContext<Context|null>(null);
export function useAI(){const value=useContext(AIContext);if(!value)throw Error('AIProvider missing');return value;}
export function AIProvider({children}:{children:React.ReactNode}){
 const {user}=useAuth();const uid=user?.uid||'';const secret=useRef(''),storageName=useRef(''),alive=useRef(true),writing=useRef(false);
 const liveConfig=useRef<Config>({model:MODEL_IDS[0],enabled:true});
 const [ready,setReady]=useState(false),[hasKey,setHasKey]=useState(false),[model,setModel]=useState<string>(MODEL_IDS[0]),[enabled,setEnabled]=useState(true),[revision,setRevision]=useState(0),[error,setError]=useState('');
 const owner=()=>alive.current&&getAuth().currentUser?.uid===uid;
 useEffect(()=>{let mounted=true;alive.current=true;(async()=>{
  if(!await SecureStore.isAvailableAsync())throw Error('unavailable');
  const name=`gemini.v1.${await digestStringAsync(CryptoDigestAlgorithm.SHA256,uid)}`;if(!mounted)return;storageName.current=name;
  const raw=await SecureStore.getItemAsync(name);if(!mounted)return;
  if(raw){const data=JSON.parse(raw);if(typeof data.key!=='string'||typeof data.model!=='string')throw Error('invalid');secret.current=data.key;setHasKey(!!data.key);const previous=data.model.replace(/^models\//,'');const selected=MODEL_IDS.includes(previous)?previous:MODEL_IDS[0];liveConfig.current={model:selected,enabled:data.enabled!==false};setModel(selected);setEnabled(data.enabled!==false);}
  setReady(true);
 })().catch(()=>{if(mounted)setError('Secure AI configuration পড়া যায়নি। Key অন্য storage-এ লেখা হয়নি।');});
 return()=>{mounted=false;alive.current=false;secret.current='';};},[uid]);
 const validateKey=(replacement:string)=>{const key=replacement.trim()||secret.current;if(!key)throw Error('API key দাও বা আগে save করো।');if(key.length>256||/\s/.test(key))throw Error('API key-তে whitespace বা অস্বাভাবিক দৈর্ঘ্য আছে।');return key;};
 const mutate=async(fn:()=>Promise<void>)=>{if(!ready||!owner())throw Error('AI settings এখন প্রস্তুত নয়।');if(writing.current)throw Error('আগের settings save শেষ হতে দাও।');writing.current=true;try{await fn();}finally{writing.current=false;}};
 const save=async(config:Config,replacement:string)=>mutate(async()=>{
  if(!MODEL_IDS.includes(config.model))throw Error('তালিকা থেকে model বেছে নাও।');
  const key=validateKey(replacement);
  try{await SecureStore.setItemAsync(storageName.current,JSON.stringify({...config,key}),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});}catch{throw Error('Secure storage-এ save হয়নি। আগের settings রাখা হয়েছে।');}
  if(!owner())return;liveConfig.current={...config};secret.current=key;setHasKey(true);setModel(config.model);setEnabled(config.enabled);setRevision(n=>n+1);
 });
 const remove=async()=>mutate(async()=>{
  try{await SecureStore.deleteItemAsync(storageName.current);}catch{throw Error('Secure storage থেকে key মোছা যায়নি। আবার চেষ্টা করো।');}
  if(!owner())return;liveConfig.current={...liveConfig.current,enabled:false};secret.current='';setHasKey(false);setEnabled(false);setRevision(n=>n+1);
 });
 const test=async(selected:string,replacement:string,signal:AbortSignal)=>{
  if(!ready||!owner())throw Error('AI settings এখন প্রস্তুত নয়।');
  if(!MODEL_IDS.includes(selected))throw Error('তালিকা থেকে model বেছে নাও।');
  await generate(validateKey(replacement),selected,[{role:'user',parts:[{text:'Reply with OK.'}]}],signal);
 };
 const ask=async(text:string,signal:AbortSignal)=>{
  if(!ready||!owner())throw Error('AI settings এখন প্রস্তুত নয়।');if(!liveConfig.current.enabled)throw Error('Gemini বন্ধ আছে। Settings → AI Provider থেকে চালু করো।');
  // Preserve current-question-only requests. Display history is local to chat, not sent to Google.
  return generate(validateKey(''),liveConfig.current.model,[{role:'user',parts:[{text}]}],signal);
 };
 const requestQuiz=(operation:QuizOperation,token:string,signal:AbortSignal)=>postSavedQuiz(operation,token,signal,ready&&liveConfig.current.enabled&&secret.current?{key:validateKey(''),model:liveConfig.current.model}:undefined,owner);
 return <AIContext.Provider value={{ready,hasKey,model,enabled,revision,error,save,remove,test,ask,requestQuiz}}>{children}</AIContext.Provider>;
}
