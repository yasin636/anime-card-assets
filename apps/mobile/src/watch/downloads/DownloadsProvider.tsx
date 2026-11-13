import React,{createContext,useContext,useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {DownloadManager} from './manager';
import {nativeDownloadIO} from './nativeIO';
const Context=createContext<{manager:DownloadManager|null;revision:number}>({manager:null,revision:0});
export function useDownloads(){return useContext(Context).manager;}
export function DownloadsProvider({uid,children}:{uid:string;children:React.ReactNode}){const [manager,setManager]=useState<DownloadManager|null>(null),[revision,refresh]=useState(0);
 useEffect(()=>{let alive=true;setManager(null);let current:DownloadManager|undefined;void nativeDownloadIO(uid).then(async io=>{current=new DownloadManager(io,()=>{if(alive)refresh(n=>n+1);});if(!alive)return;await current.init();if(alive)setManager(current);}).catch(()=>{});const sub=AppState.addEventListener('change',state=>{if(state!=='active')void current?.pause();});return()=>{alive=false;sub.remove();void current?.shutdown();};},[uid]);
 // New context wrapper identity on each render propagates progress with same manager instance.
 return <Context.Provider value={{manager,revision}}>{children}</Context.Provider>;
}
