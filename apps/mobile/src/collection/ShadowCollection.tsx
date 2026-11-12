import React,{useEffect,useRef,useState} from 'react';
import {AppState,Image,Text,View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {chapters} from '../story/catalog.json';
import {storyArtwork} from '../story/artwork';
import {useEconomy} from './EconomyProvider';
import {ActionButton,f} from '../ui/forms';
export function ShadowCollection(){const e=useEconomy(),focused=useIsFocused(),[foreground,setForeground]=useState(AppState.currentState==='active'),[owned,setOwned]=useState<string[]>([]),[loaded,setLoaded]=useState(false),started=useRef(false);
 const disabled=!focused||!foreground||!e.ready||!e.configured||e.busy||!!e.pending;
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>setForeground(s==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{if(!disabled&&!started.current){started.current=true;void e.run({type:'storyView'});}},[disabled]);
 useEffect(()=>{if(e.result?.type==='storyView'){setOwned((e.result.shadows||[]).map(s=>s.id));setLoaded(true);}},[e.result]);
 return <><Text style={f.body}>Adventure-এ তোমার জেতা শত্রুদের স্মৃতি। এখানে শুধু card দেখা যায়—এখান থেকে equip বা নতুন reward নয়।</Text>{!loaded&&<Text style={f.body}>তোমার Shadow Army আসছে…</Text>}{!!e.error&&<Text style={f.error}>{e.error}</Text>}<ActionButton secondary title="Refresh my shadows" disabled={disabled} onPress={()=>void e.run({type:'storyView'})}/>{loaded&&!owned.length&&<Text style={f.body}>এখনো Shadow নেই। Adventure-এ শত্রুকে হারিয়ে তোমার army শুরু করো।</Text>}{chapters.flatMap(c=>c.enemies.filter(enemy=>owned.includes(enemy.id)).map(enemy=><View key={enemy.id} style={f.panel}>{enemy.isBoss&&<Text style={{color:'#ffd78e',fontWeight:'900',backgroundColor:'#61431e',padding:8}}>★ BOSS</Text>}<Image source={storyArtwork[enemy.id]} resizeMode="contain" style={{width:'100%',height:210}}/><Text style={f.section}>{enemy.name}</Text><Text style={f.body}>Chapter {c.id} · Original HP {enemy.hp} · ATK {enemy.atk} · DEF {enemy.def}</Text><Text style={f.body}>ARISE bonus · HP {Math.round(enemy.hp*.5)} · ATK {Math.round(enemy.atk*.5)} · DEF {Math.round(enemy.def*.5)}</Text></View>))}</>;
}
