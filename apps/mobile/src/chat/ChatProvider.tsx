import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {randomUUID} from 'expo-crypto';
import {getAuth} from '@react-native-firebase/auth';
import {useAuth} from '../auth/AuthProvider';
import {useEconomy} from '../collection/EconomyProvider';
import {ChatCommand,ChatRead,ChatMutation,ChatResult,InboxRow,ChatUser} from './types';
import {ChatError,chatRequest} from './transport';
type Pending={operationId:string;command:ChatMutation};
type Context={ready:boolean;busy:boolean;pending:Pending|null;error:string;result:ChatResult|null;inbox:InboxRow[];recent:ChatUser[];unread:number;serverOffset:number;refreshInbox:()=>Promise<void>;read:(c:ChatRead,signal?:AbortSignal)=>Promise<ChatResult>;mutate:(c?:ChatMutation)=>Promise<ChatResult|undefined>;foreground:boolean};
const Context=createContext<Context|null>(null);
export function useChat(){const c=useContext(Context);if(!c)throw Error('ChatProvider missing');return c;}
const raw=process.env.EXPO_PUBLIC_ECONOMY_API_URL||process.env.EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL||'';
const endpoint=/^https:\/\/[^/\s]+(?:\/[^\s]*)?$/.test(raw)?raw.replace(/\/+$/,''):'';
export function ChatProvider({children}:{children:React.ReactNode}){
 const {user}=useAuth(),e=useEconomy(),uid=user?.uid||'',key=`chat.pending.v1.${uid}`;
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[pending,setPending]=useState<Pending|null>(null),[error,setError]=useState(''),[result,setResult]=useState<ChatResult|null>(null),[inbox,setInbox]=useState<InboxRow[]>([]),[recent,setRecent]=useState<ChatUser[]>([]),[unread,setUnread]=useState(0),[serverOffset,setOffset]=useState(0),[foreground,setForeground]=useState(AppState.currentState==='active');
 const alive=useRef(true),lock=useRef(false),pendingRef=useRef<Pending|null>(null),inboxLock=useRef(false),controllers=useRef(new Set<AbortController>()),lastToken=useRef(''),session=useRef(randomUUID()),sequence=useRef(0),presenceSupported=useRef(true);
 useEffect(()=>{alive.current=true;let active=true;AsyncStorage.getItem(key).then(raw=>{if(!active)return;if(raw){const p=JSON.parse(raw);if(!p.operationId||!p.command?.type)throw Error('invalid pending');pendingRef.current=p;setPending(p);}setReady(true);}).catch(()=>{if(active)setError('Pending chat request পড়া যায়নি। নতুন send নিরাপত্তার জন্য বন্ধ আছে।');});return()=>{active=false;alive.current=false;for(const c of controllers.current)c.abort();};},[key]);
 const request=useCallback(async(command:ChatCommand,operationId:string,signal?:AbortSignal)=>{
  const current=getAuth().currentUser;if(!endpoint||!e.configured||current?.uid!==uid||!alive.current)throw Error('Trusted chat connection প্রস্তুত নয়।');
  const controller=new AbortController();controllers.current.add(controller);const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel);if(signal?.aborted)controller.abort();const timer=setTimeout(cancel,90000);
  try{const token=await current.getIdToken();lastToken.current=token;if(!alive.current||getAuth().currentUser?.uid!==uid||controller.signal.aborted)throw Error('Session বদলেছে।');const r=await chatRequest(endpoint,token,{operationId,command},controller.signal);if(!alive.current||getAuth().currentUser?.uid!==uid||controller.signal.aborted)throw Error('Session বদলেছে।');if(['chatInbox','chatGlobal','chatThread','chatSearch'].includes(command.type))setOffset(r.serverNow-Date.now());presenceSupported.current=true;return r;}
  finally{clearTimeout(timer);controllers.current.delete(controller);signal?.removeEventListener('abort',cancel);}
 },[uid,e.configured]);
 const read=useCallback((c:ChatRead,signal?:AbortSignal)=>request(c,randomUUID(),signal),[request]);
 const refreshInbox=useCallback(async()=>{if(inboxLock.current||!ready||!e.configured)return;inboxLock.current=true;try{const r=await read({type:'chatInbox'});setInbox(r.inbox||[]);setRecent(r.recent||[]);setUnread(r.totalUnread||0);if(!pendingRef.current&&!lock.current)setError('');}catch(err){if(alive.current&&!(err instanceof Error&&err.name==='AbortError'))setError(err instanceof Error?err.message:'Inbox load হয়নি।');}finally{inboxLock.current=false;}},[read,ready,e.configured]);
 const mutate=async(c?:ChatMutation)=>{
  if(lock.current||!ready||!e.configured||getAuth().currentUser?.uid!==uid)return;
  if(c&&pendingRef.current){setError('আগের message/action-এর ফল নিশ্চিত নয়। আগে Retry pending চাপো।');return;}
  const op=pendingRef.current||(c?{operationId:randomUUID(),command:c}:null);if(!op)return;lock.current=true;setBusy(true);setError('');
  try{await AsyncStorage.setItem(key,JSON.stringify(op));pendingRef.current=op;setPending(op);const r=await request(op.command,op.operationId);await AsyncStorage.removeItem(key);pendingRef.current=null;if(alive.current&&getAuth().currentUser?.uid===uid){setPending(null);setResult(r);void refreshInbox();return r;}}
  catch(err){if(err instanceof ChatError&&err.status===409){await AsyncStorage.removeItem(key);pendingRef.current=null;if(alive.current)setPending(null);}if(alive.current)setError(err instanceof Error&&err.name!=='AbortError'?err.message:'ফল নিশ্চিত নয়। Retry pending একই operation ব্যবহার করবে—দুবার message/reward হবে না।');}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 // Presence is ephemeral, not an economy mutation. Token is never persisted/logged.
 useEffect(()=>{
  if(!ready||!e.configured)return;setForeground(AppState.currentState==='active');let stopped=false;
  const presence=async(online:boolean)=>{if(online&&!presenceSupported.current)return;const command={type:'chatPresence' as const,online,sessionId:session.current,sequence:++sequence.current};const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const current=getAuth().currentUser;const token=current?.uid===uid?await current.getIdToken():lastToken.current;if(token){lastToken.current=token;await chatRequest(endpoint,token,{operationId:randomUUID(),command},controller.signal);}}catch(err){if(err instanceof ChatError&&['invalid-command','not-found'].includes(err.code))presenceSupported.current=false;}finally{clearTimeout(timer);}};
  if(AppState.currentState==='active')void presence(true);
  const heartbeat=setInterval(()=>{if(!stopped&&AppState.currentState==='active')void presence(true);},30000);
  const sub=AppState.addEventListener('change',state=>{const active=state==='active';setForeground(active);if(!active)for(const c of controllers.current)c.abort();void presence(active);});
  return()=>{stopped=true;clearInterval(heartbeat);sub.remove();void presence(false);};
 },[uid,ready,e.configured]);
 useEffect(()=>{if(!ready||!e.configured||!foreground)return;void refreshInbox();const timer=setInterval(()=>void refreshInbox(),15000);return()=>clearInterval(timer);},[ready,e.configured,foreground,refreshInbox]);
 return <Context.Provider value={{ready,busy,pending,error,result,inbox,recent,unread,serverOffset,refreshInbox,read,mutate,foreground}}>{children}</Context.Provider>;
}
