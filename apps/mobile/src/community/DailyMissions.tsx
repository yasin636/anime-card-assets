import React,{useEffect,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useEconomy} from '../collection/EconomyProvider';
import {SocialMissions} from '../social/types';
import {communityMissions,remainingDay} from './types';
import {ActionButton,f} from '../ui/forms';
export function DailyMissions(){const e=useEconomy(),focused=useIsFocused(),[foreground,setForeground]=useState(AppState.currentState==='active'),[data,setData]=useState<SocialMissions|null>(e.feedCache?.missionData||null),[tick,setTick]=useState(Date.now()),[offset,setOffset]=useState(0),[open,setOpen]=useState(false),loaded=useRef('');
 const active=focused&&foreground,disabled=!active||!e.configured||!e.ready||e.busy||!!e.pending,now=tick+offset,date=new Date(now).toISOString().slice(0,10),fresh=data?.date===date;
 useEffect(()=>{const app=AppState.addEventListener('change',v=>setForeground(v==='active'));return()=>app.remove();},[]);
 useEffect(()=>{if(!active){loaded.current='';return;}const timer=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(timer);},[active]);
 useEffect(()=>{if(open&&!disabled&&loaded.current!==date){loaded.current=date;void e.run({type:'communityView'});}},[open,disabled,date]);
 useEffect(()=>{if(e.result?.missionData)setData(e.result.missionData);if(e.result?.serverNow){setOffset(e.result.serverNow-Date.now());setTick(Date.now());}},[e.result]);

 const available=communityMissions.filter(m=>m.id!=='m_news');
 return <View style={[f.panel,{marginHorizontal:18,marginTop:16}]}><Text style={f.section}>Daily Missions</Text><Text style={f.body}>আজ একটু এগিয়ে যাও · UTC reset {remainingDay(now)}</Text><ActionButton secondary title={open?'Mission গুটিয়ে রাখো ↑':'আজকের missions দেখো ↓'} onPress={()=>setOpen(!open)}/>{open&&available.map(m=><View key={m.id} style={{gap:8,borderTopWidth:1,borderColor:'#394053',paddingTop:14}}><Text style={f.label}>{m.name}</Text><Text style={f.body}>{m.detail} · {fresh?Math.min(data?.progress[m.key]||0,m.goal):0}/{m.goal}</Text><Text style={f.body}>+{m.gold} Gold · +{m.xp} XP · +{m.gems} Gems</Text><ActionButton title={fresh&&data?.claimed[m.id]?'আজ নেওয়া হয়েছে':'Reward নাও'} disabled={disabled||!fresh||!!data?.claimed[m.id]||(data?.progress[m.key]||0)<m.goal} onPress={()=>void e.run({type:'communityMissionClaim',missionId:m.id})}/></View>)}{open&&<Text style={f.body}>News সরানো হয়েছে, তাই তার পুরোনো mission এখানে নেই। বাকি reward আর progress-এর নিয়ম একই আছে।</Text>}{open&&!!e.error&&<Text style={f.error}>{e.error}</Text>}</View>;
}
