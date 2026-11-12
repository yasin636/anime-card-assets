import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
type Presentation={ready:boolean;reduced:boolean;systemReduced:boolean;reduceRequested:boolean;foreground:boolean;error:string;setReduceRequested:(v:boolean)=>void};
const Context=createContext<Presentation|null>(null);
export function usePresentation(){return useContext(Context)||{ready:false,reduced:true,systemReduced:true,reduceRequested:false,foreground:AppState.currentState==='active',error:'',setReduceRequested:()=>{}};}
export function PresentationProvider({uid,children}:{uid:string;children:React.ReactNode}){
 const key=`presentation.preferences.v1.${uid}`,[ready,setReady]=useState(false),[systemReduced,setSystemReduced]=useState(true),[reduceRequested,setReduced]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active'),[error,setError]=useState(''),queue=useRef(Promise.resolve());
 useEffect(()=>{let alive=true,systemChanged=false;const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',v=>{systemChanged=true;if(alive)setSystemReduced(v);});void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive&&!systemChanged)setSystemReduced(v);}).catch(()=>{if(alive)setSystemReduced(true);});void AsyncStorage.getItem(key).then(raw=>{if(!alive)return;const data=raw?JSON.parse(raw):{};if(data.reduceMotion!==undefined&&typeof data.reduceMotion!=='boolean')throw Error();setReduced(data.reduceMotion===true);setReady(true);}).catch(()=>{if(alive)setError('Motion settings পড়া যায়নি; নিরাপদ static presentation রাখা হয়েছে।');});const state=AppState.addEventListener('change',s=>setForeground(s==='active'));return()=>{alive=false;motion.remove();state.remove();};},[key]);
 const change=(v:boolean)=>{if(!ready)return;setReduced(v);queue.current=queue.current.then(()=>AsyncStorage.setItem(key,JSON.stringify({reduceMotion:v}))).catch(()=>setError('Motion preference ফোনে save হয়নি।'));};
 return <Context.Provider value={{ready,reduced:!ready||systemReduced||reduceRequested||!foreground,systemReduced,reduceRequested,foreground,error,setReduceRequested:change}}>{children}</Context.Provider>;
}
