import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { getAuth } from '@react-native-firebase/auth';
import { useAuth } from '../auth/AuthProvider';
import type { Card } from '../domain/profile';
export type Command = {type:'prepare'|'summon'} | {type:'equip';instanceId:string;slot:string} | {type:'unequip';slot:string} | {type:'recycle';instanceId:string} | {type:'buyTheme'|'equipTheme';themeId:string};
type Pending={operationId:string;command:Command};
type Result={type:string;card?:Card;gold?:number;xp?:number;duplicate?:boolean};
type Context={configured:boolean;endpointAvailable:boolean;checking:boolean;connection:string;check:()=>Promise<void>;ready:boolean;busy:boolean;pending:Pending|null;error:string;result:Result|null;run:(command?:Command)=>Promise<void>};
const Context=createContext<Context|null>(null);
export function useEconomy(){const c=useContext(Context);if(!c)throw Error('EconomyProvider missing');return c;}
const raw=process.env.EXPO_PUBLIC_ECONOMY_API_URL || process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL || '';
const endpoint=/^https:\/\/[^/\s]+(?:\/[^\s]*)?$/.test(raw)?raw.replace(/\/+$/,''):'';
const messages:Record<string,string>={
 'owner-test-only':'এই account live test-এর অনুমোদিত নয়।','economy-not-enabled':'Server economy বন্ধ আছে।','insufficient-gold':'পর্যাপ্ত Gold নেই।','theme-already-owned':'এই theme আগেই কেনা হয়েছে।','theme-not-owned':'আগে theme কিনতে হবে।',
 'rarity-mismatch':'এই slot-এ একই rarity-এর card লাগবে।','instance-not-unique-or-owned':'Card পাওয়া যায়নি বা পরিচয় অনিশ্চিত। Collection refresh করো।',
 'ambiguous-legacy-slot':'পুরোনো featured slot-এর card পরিচয় অনিশ্চিত। আগে ওই slot Unequip করে আবার চেষ্টা করো।',
 'unknown-legacy-card':'এই পুরোনো card-এর catalog mapping যাচাই প্রয়োজন। Card মুছে ফেলা হয়নি।',
 'profile-too-large':'Profile আকার সীমার কাছাকাছি। কোনো পুরোনো data বাদ দেওয়া হয়নি।',
 'unauthenticated':'Session যাচাই হয়নি। আবার login করো; pending কাজটি রেখে দেওয়া হয়েছে।',
 'rate-limited':'একটু অপেক্ষা করে একই কাজ Retry করো।','service-unavailable':'Server এখন পাওয়া যাচ্ছে না। একই কাজ Retry করো।',
};
export function EconomyProvider({children}:{children:React.ReactNode}){
 const {user,profile}=useAuth();const uid=user?.uid || '';const key=`economy.pending.v1.${uid}`;
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[pending,setPending]=useState<Pending|null>(null),[error,setError]=useState(''),[result,setResult]=useState<Result|null>(null);
 const [checking,setChecking]=useState(false),[connection,setConnection]=useState('Server-এর সঙ্গে সংযোগ হচ্ছে…'),[allowed,setAllowed]=useState(false);
 const checkLock=useRef(false);
 const lock=useRef(false),active=useRef(true),pendingRef=useRef<Pending|null>(null);
 useEffect(()=>{active.current=true;let alive=true;AsyncStorage.getItem(key).then(value=>{
  if(!alive)return;if(value){const saved=JSON.parse(value) as Pending;if(typeof saved.operationId!=='string'||!saved.command?.type)throw Error('invalid pending');pendingRef.current=saved;setPending(saved);}setReady(true);
 }).catch(()=>{if(alive)setError('Pending command পড়া যায়নি। নিরাপত্তার জন্য নতুন spend বন্ধ আছে।');});return()=>{alive=false;active.current=false;};},[key]);
 const check=useCallback(async()=>{
  if(checkLock.current||lock.current||!endpoint||!uid||!active.current)return;
  checkLock.current=true;setChecking(true);setAllowed(false);setConnection('Server যাচাই হচ্ছে… Free server জাগতে এক মিনিটের বেশি লাগতে পারে।');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
  try{
   const current=getAuth().currentUser;if(current?.uid!==uid)return;
   const token=await current.getIdToken();
   const response=await fetch(`${endpoint}/v1/economy/status`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal});
   if(!response.ok)throw Error(`Server check ব্যর্থ (${response.status})। Backend update/permission পরীক্ষা প্রয়োজন।`);
   const data=await response.json();if(data.profileReadable!==true||typeof data.mutationsAllowed!=='boolean')throw Error('Server status যাচাই হয়নি।');
   if(active.current&&getAuth().currentUser?.uid===uid){setAllowed(data.mutationsAllowed);setConnection(data.mutationsAllowed?'Connection verified · এই account-এ economy অনুমোদিত। কোনো Gold/card বদলানো হয়নি।':'Auth + own Firestore read verified · spending বন্ধ আছে। কোনো Gold/card বদলানো হয়নি।');}
  }catch(e){if(active.current&&getAuth().currentUser?.uid===uid)setConnection(e instanceof Error&&e.name!=='AbortError'?e.message:'সংযোগে সময় বেশি লাগছে। Retry connection চাপো।');}
  finally{clearTimeout(timer);checkLock.current=false;if(active.current)setChecking(false);}
 },[uid]);
 useEffect(()=>{
  if(!ready||profile?.uid!==uid||!uid||!endpoint)return;
  void check();
  const subscription=AppState.addEventListener('change',state=>{
   if(state==='active')void check();
  });
  return()=>subscription.remove();
 },[ready,profile?.uid,uid,check]);
 const run=async(command?:Command)=>{
  if(lock.current||!ready)return;if(!allowed){setError('Server permission এখনো যাচাই হয়নি। সংযোগের জন্য অপেক্ষা করো বা Retry connection চাপো।');return;}if(!endpoint){setError('Trusted economy backend এখনো configure করা হয়নি। কোনো Gold/card বদলানো হয়নি।');return;}
  if(getAuth().currentUser?.uid!==uid)return;
  if(pendingRef.current&&command){setError('আগের কাজের ফল এখনো নিশ্চিত নয়। আগে Retry pending চাপো।');return;}
  const operation=pendingRef.current || (command?{operationId:randomUUID(),command}:null);if(!operation)return;
  lock.current=true;setBusy(true);setError('');setResult(null);
  let controller:AbortController|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  try{
   // Persist BEFORE sending. Timeout/kill/relaunch must reuse this operation ID, not spend twice.
   await AsyncStorage.setItem(key,JSON.stringify(operation));pendingRef.current=operation;if(active.current)setPending(operation);
   const current=getAuth().currentUser;if(current?.uid!==uid)return;
   const token=await current.getIdToken();controller=new AbortController();timer=setTimeout(()=>controller?.abort(),90000);
   const response=await fetch(`${endpoint}/v1/economy`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(operation),signal:controller.signal});
   const payload=await response.json();
   // Only definitive command rejection clears pending. 401/429/5xx/network errors retain it.
   if(!response.ok){
    if(response.status===409){await AsyncStorage.removeItem(key);pendingRef.current=null;if(active.current)setPending(null);}
    throw Error(messages[payload.error]||`কাজটি নিশ্চিত হয়নি (${payload.error||response.status})। Pending থাকলে Retry করো।`);
   }
   if(!payload.result||payload.result.type!==operation.command.type)throw Error('Server result যাচাই হয়নি। একই কাজ Retry করো।');
   await AsyncStorage.removeItem(key);pendingRef.current=null;
   if(active.current&&getAuth().currentUser?.uid===uid){setPending(null);setResult(payload.result);}
  }catch(e){if(active.current)setError(e instanceof Error&&e.message&&!e.message.includes('Network request')&&e.name!=='AbortError'?e.message:'সংযোগ বিচ্ছিন্ন বা সময় শেষ। ফল নিশ্চিত নয়—Retry pending চাপো; নতুন করে Gold খরচ হবে না।');}
  finally{if(timer)clearTimeout(timer);lock.current=false;if(active.current)setBusy(false);}
 };
 return <Context.Provider value={{configured:!!endpoint&&allowed,endpointAvailable:!!endpoint,checking,connection,check,ready,busy,pending,error,result,run}}>{children}</Context.Provider>;
}
