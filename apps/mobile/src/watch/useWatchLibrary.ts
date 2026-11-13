import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {emptyLibrary,Library,parseLibrary} from './library';
function useWatchLibraryData(uid:string,enabled=true){
 const [library,setLibrary]=useState<Library>(emptyLibrary),[ready,setReady]=useState(false),[error,setError]=useState('');const ref=useRef(library),queue=useRef(Promise.resolve()),alive=useRef(true),loaded=useRef(false);
 const key=`watch.library.v1.${uid}`;
 useEffect(()=>{if(!enabled)return;alive.current=true;void AsyncStorage.getItem(key).then(raw=>{if(alive.current){ref.current=parseLibrary(raw);setLibrary(ref.current);loaded.current=true;setReady(true);}}).catch(()=>{if(alive.current)setError('Watch library পড়া যায়নি। আগের data overwrite হবে না।');});return()=>{alive.current=false;loaded.current=false;};},[key,enabled]);
 const update=(fn:(v:Library)=>Library)=>{if(!loaded.current)return;ref.current=fn(ref.current);setLibrary(ref.current);const raw=JSON.stringify(ref.current);queue.current=queue.current.then(()=>AsyncStorage.setItem(key,raw)).catch(()=>{if(alive.current)setError('Watch library save হয়নি। Device storage পরীক্ষা করো।');});};
 return {library,ref,ready,error,update};
}

const LibraryContext=createContext<ReturnType<typeof useWatchLibraryData>|null>(null);
export function WatchLibraryProvider({uid,children}:{uid:string;children:React.ReactNode}){const value=useWatchLibraryData(uid);return React.createElement(LibraryContext.Provider,{value},children);}
export function useWatchLibrary(uid:string){const shared=useContext(LibraryContext);const local=useWatchLibraryData(uid,!shared);return shared||local;}
