import React,{useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {TrackerList} from './TrackerList';
import {useEconomy} from '../collection/EconomyProvider';
import {TrackerEntry,CommunityCommand} from './types';
export function CommunityScreen(){const e=useEconomy(),focused=useIsFocused(),[foreground,setForeground]=useState(AppState.currentState==='active'),[entries,setEntries]=useState<TrackerEntry[]>([]),[supported,setSupported]=useState(false),loaded=useRef(false);
 const active=focused&&foreground,disabled=!active||!e.configured||!e.ready||e.busy||!!e.pending;
 useEffect(()=>{const sub=AppState.addEventListener('change',v=>setForeground(v==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{if(!active)loaded.current=false;if(active&&!disabled&&!loaded.current){loaded.current=true;void e.run({type:'communityView'});}},[active,disabled]);
 useEffect(()=>{if(e.result?.communityCapability==='community-v1')setSupported(true);if(e.result?.tracker)setEntries(e.result.tracker);},[e.result]);
 const send=(c:CommunityCommand)=>{if(!disabled)void e.run(c);};
 return <TrackerList entries={entries} disabled={disabled} active={active} supported={supported} send={send} onTab={()=>{}} result={e.result}/>;
}
