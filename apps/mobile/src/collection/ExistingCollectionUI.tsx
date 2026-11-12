import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../domain/profile';
import cards from '../domain/cards.json';
import themes from '../domain/themes.json';
import chapters from '../domain/shadows.json';
import { f, ActionButton } from '../ui/forms';
import { Command, useEconomy } from './EconomyProvider';
const slots=['legendary-1','legendary-2','rare-1','rare-2','common-1','common-2'];
const colors:Record<string,string>={legendary:'#ffd166',rare:'#c4b5fd',common:'#67e8f9'};
function hydrate(card:Card){return {...cards.find(c=>c.id===card.id),...card};}
function request(command:Command,message:string,run:(c:Command)=>Promise<void>){Alert.alert('Confirm',message,[{text:'Cancel',style:'cancel'},{text:'Confirm',style:command.type==='recycle'?'destructive':'default',onPress:()=>void run(command)}]);}
export function EconomyStatus({diagnostics=false}:{diagnostics?:boolean}={}){
 const e=useEconomy(),{user}=useAuth();
 return <>{diagnostics&&<View style={f.panel}><Text style={f.section}>Connection diagnostics</Text><Text style={f.body}>{e.connection}</Text><Text selectable style={f.body}>UID: {user?.uid}</Text><ActionButton secondary title="Recheck connection" busy={e.checking} disabled={!e.endpointAvailable||e.busy} onPress={()=>void e.check()}/></View>}{!e.configured&&<View style={{padding:14,gap:8}}><Text accessibilityRole={e.checking?undefined:'alert'} style={f.body}>{e.checking?'Connecting…':'সংযোগ পাওয়া যায়নি। আবার চেষ্টা করো।'}</Text>{!e.checking&&<ActionButton secondary title="Retry connection" disabled={!e.endpointAvailable||e.busy} onPress={()=>void e.check()}/>}</View>}{!!e.error&&<Text accessibilityRole="alert" style={f.error}>{e.error}</Text>}{e.pending&&<View style={f.panel}><Text style={f.body}>আগের কাজটি নিশ্চিত হয়নি। একই কাজ Retry করো।</Text><ActionButton title="Retry pending · same operation" busy={e.busy} disabled={!e.configured} onPress={()=>void e.run()}/></View>}</>;
}

function Tile({card,onPress}:{card:Card;onPress:()=>void}){
 const c=hydrate(card);return <Pressable accessibilityRole="button" accessibilityLabel={`${c.name||c.id}, ${c.rarity||'legacy'} details`} onPress={onPress} style={{width:'31%',borderWidth:1,borderColor:colors[c.rarity||'']||'#45325e',borderRadius:12,padding:5,gap:5,backgroundColor:'#0b0820'}}>{c.image?<Image source={{uri:c.image}} resizeMode="contain" style={{height:130,width:'100%'}}/>:<View style={{height:130}}/>}<Text style={[f.eyebrow,{fontSize:8,letterSpacing:.5}]}>{c.rarity||'LEGACY'}</Text><Text style={[f.body,{fontSize:10}]} numberOfLines={2}>{c.name||c.id}</Text></Pressable>;
}
export function ExistingCardDetail({card,onClose}:{card:Card|null;onClose:()=>void}){
 const auth=useAuth(),e=useEconomy();if(!card)return null;const c=hydrate(card),owned=!!card.instanceId;
 const disabled=!e.configured||!e.ready||!!e.pending||!owned||e.busy;
 const duplicates=(auth.profile?.inventoryCards||[]).filter(item=>item.id===card.id).length;
 const reward=({legendary:[600,300],rare:[300,150],common:[100,50]} as Record<string,number[]>)[c.rarity||''];
 return <Modal visible transparent animationType="slide" onRequestClose={onClose}><SafeAreaView style={{flex:1,backgroundColor:'#030014ee'}}><ScrollView contentContainerStyle={[f.content,{paddingTop:20}]}><ActionButton secondary title="Close details" onPress={onClose}/><View style={f.panel}><Text style={f.section}>{c.name||c.id}</Text>{c.image&&<Image source={{uri:c.image}} resizeMode="contain" style={{height:300,width:'100%'}}/>}<Text style={f.eyebrow}>{c.rarity||'UNKNOWN LEGACY'} · {duplicates} copies owned</Text><Text style={f.body}>HP {c.hp??'—'} · ATK {c.atk??'—'} · DEF {c.def??'—'}</Text><Text selectable style={f.body}>Instance: {card.instanceId||'Legacy identity preparation required'}</Text></View><EconomyStatus/><Text style={f.section}>Equip to slot</Text>{slots.filter(s=>s.startsWith(c.rarity||'!')).map(slot=><ActionButton key={slot} secondary title={`Equip → ${slot}`} disabled={disabled} onPress={()=>request({type:'equip',instanceId:card.instanceId!,slot},`Replace ${slot} with ${c.name||c.id}? Card inventory-তেই থাকবে।`,e.run)}/>)}{reward&&<ActionButton title={`Recycle · +${reward[0]} Gold / +${reward[1]} XP`} disabled={disabled} onPress={()=>request({type:'recycle',instanceId:card.instanceId!},`এটি স্থায়ীভাবে সরবে। +${reward[0]} Gold / +${reward[1]} XP। ${duplicates>1?'Duplicate: raw HP/ATK/DEF-এর 100% permanent flat bonus যোগ হবে।':'একমাত্র copy: flat bonus নেই।'} Equipped slot-ও clear হবে।`,e.run)}/>}<Text style={f.body}>Reward ও duplicate check server-এর সর্বশেষ inventory থেকে হবে; এখানে দেখানো preview guarantee নয়।</Text></ScrollView></SafeAreaView></Modal>;
}
