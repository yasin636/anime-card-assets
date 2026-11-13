import React,{createContext,useContext,useRef,useState} from 'react';
import {View} from 'react-native';
import type {RemoteSubtitle} from './sourceIntegration';
import type {VideoSource} from 'expo-video';
import {AdvancedPlayer} from './AdvancedPlayer';
export type PlaybackSession={source:VideoSource;title:string;resume:number;localSubtitles?:{id:string;lang:string;text:string}[];testMode?:boolean;testCaptions?:string;onNextStream?:()=>Promise<void>;remoteSubtitles?:RemoteSubtitle[];report?:(position:number,duration:number)=>void;previous?:()=>void;next?:()=>void};
type State={open:(session:PlaybackSession)=>void;close:()=>void;expand:()=>void;active:boolean};
const Context=createContext<State|null>(null);
export function useWatchPlayback(){const c=useContext(Context);if(!c)throw Error('WatchPlaybackProvider missing');return c;}
export function WatchPlaybackProvider({children,onWatch}:{children:React.ReactNode;onWatch:()=>void}){
 const [session,setSession]=useState<(PlaybackSession&{id:number})|null>(null),[mini,setMini]=useState(false);const sequence=useRef(0);
 const open=(s:PlaybackSession)=>{setMini(false);setSession({...s,report:s.testMode?undefined:s.report,previous:s.testMode?undefined:s.previous,next:s.testMode?undefined:s.next,onNextStream:s.testMode?undefined:s.onNextStream,title:s.testMode&&!s.title.startsWith('TEST')?`TEST · ${s.title}`:s.title,id:++sequence.current});};const close=()=>setSession(null);
 return <Context.Provider value={{open,close,expand:()=>setMini(false),active:!!session}}><View style={{flex:1}}>{children}{session&&<AdvancedPlayer key={session.id} session={session} mini={mini} onMini={()=>setMini(true)} onExpand={()=>setMini(false)} onClose={close} onReload={position=>open({...session,resume:position})} onEpisode={fn=>{close();fn();onWatch();}}/>}</View></Context.Provider>;
}
