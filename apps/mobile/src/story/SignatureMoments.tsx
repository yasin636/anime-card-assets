import {useAudioPlayer} from 'expo-audio';
import React,{useEffect,useRef} from 'react';
import {Animated,Image,Modal,Pressable,StyleSheet,Text,View} from 'react-native';
import Svg,{Circle,Path,Line} from 'react-native-svg';
import {LinearGradient} from 'expo-linear-gradient';
import {storyArtwork} from './artwork';
export const bossSignatures={
 kasaka:{name:'KASAKA',title:'VENOM IN THE DARK',color:'#8cf390',description:'অন্ধকূপের বাতাস ভারী হয়ে আসে। সবুজ আভার ভেতর চোখ দুটো তোমাকে খুঁজছে।',motif:'venom'},
 baran:{name:'BARAN',title:'THE THUNDER THRONE',color:'#95caff',description:'দুর্গের আলো ম্লান। দূরের বজ্রধ্বনি কাছে এসে থামে—ফটকের ঠিক ওপাশে।',motif:'thunder'},
 igris:{name:'IGRIS',title:'THE SILENT OATH',color:'#ff94ae',description:'কথা নয়। তলোয়ার তুলে এক মুহূর্তের অভিবাদন। তারপর শুরু হবে পরীক্ষা।',motif:'sword'},
 tusk:{name:'TUSK',title:'CIRCLE OF DOMINION',color:'#ffc17e',description:'মেঝের বৃত্তগুলো একে একে জেগে ওঠে। মন্দিরের ভেতর গভীর একটি স্পন্দন।',motif:'rune'},
 beru:{name:'BERU',title:'THE HUNTER LISTENS',color:'#c9a1ff',description:'শব্দ থেমে যায়। অন্ধকারে এক জোড়া চোখ। শিকারি এবার তোমার দিকে ফিরেছে।',motif:'eyes'},
};
export type BossCue={id:string;enemyId:keyof typeof bossSignatures;kind:'entry'|'enrage'};
export const signatureAudio:Record<string,number>={kasaka:require('../../assets/audio/boss-kasaka.wav'),baran:require('../../assets/audio/boss-baran.wav'),igris:require('../../assets/audio/boss-igris.wav'),tusk:require('../../assets/audio/boss-tusk.wav'),beru:require('../../assets/audio/boss-beru.wav')};
export function SignatureGlyph({enemyId,color}:{enemyId:keyof typeof bossSignatures;color:string}){
 return <Svg width="240" height="160" viewBox="0 0 240 160">{enemyId==='kasaka'?<>{[0,1,2,3,4].map(i=><Circle key={i} cx={48+i*35} cy={100-(i%2)*35} r={9+i*3} fill={`${color}18`} stroke={color} strokeWidth="1"/>)}<Path d="M45 115 Q120 155 195 115" stroke={color} strokeWidth="2" fill="none"/></>:enemyId==='baran'?<Path d="M147 8 L90 80 L127 78 L87 150 L165 62 L127 65 Z" fill={`${color}30`} stroke={color} strokeWidth="2"/>:enemyId==='igris'?<><Path d="M120 8 L125 105 L115 105 Z M88 110 L152 110 M120 112 L120 150" stroke={color} strokeWidth="3" fill={`${color}40`}/><Path d="M70 130 Q120 158 170 130" stroke={color} fill="none"/></>:enemyId==='tusk'?<>{[30,49,68].map(r=><Circle key={r} cx="120" cy="80" r={r} stroke={color} strokeWidth="1" fill="none"/>)}{[0,1,2,3,4,5].map(i=><Line key={i} x1={120+Math.cos(i*Math.PI/3)*40} y1={80+Math.sin(i*Math.PI/3)*40} x2={120+Math.cos(i*Math.PI/3)*67} y2={80+Math.sin(i*Math.PI/3)*67} stroke={color} strokeWidth="3"/>)}</>:<><Path d="M35 68 L93 82 L70 96 Z M205 68 L147 82 L170 96 Z" fill={color}/><Path d="M80 116 Q120 136 160 116" stroke={color} strokeWidth="1" fill="none"/></>}</Svg>;
}
export function SignatureMoment({cue,reduced,onClose,sound=true}:{cue:BossCue|null;reduced:boolean;onClose:()=>void;sound?:boolean}){
 const p=useRef(new Animated.Value(0)).current;
 // Keep one native player for this mounted screen. Changing the hook source
 // releases its old shared object before effect cleanup on Android.
 const audio=useAudioPlayer(null);
 useEffect(()=>{
  let alive=true;
  if(cue&&sound&&!reduced){
   // Audio is cosmetic: synchronous native errors and asynchronous seek/play
   // failures must never terminate a server-confirmed battle.
   try{audio.replace(signatureAudio[cue.enemyId]);void audio.seekTo(0).then(()=>{if(alive)audio.play();}).catch(()=>{});}catch{}
  }
  return()=>{alive=false;try{audio.pause();}catch{}};
 },[cue?.id,audio,sound,reduced]);
 useEffect(()=>{if(!cue)return;p.setValue(reduced?1:0);const a=Animated.timing(p,{toValue:1,duration:reduced?0:1900,useNativeDriver:true});a.start();const timer=setTimeout(onClose,reduced?3000:4200);return()=>{a.stop();clearTimeout(timer);};},[cue?.id,reduced,p]);
 if(!cue)return null;const b=bossSignatures[cue.enemyId];
 return <Modal visible transparent animationType="none" onRequestClose={onClose}><Pressable accessibilityRole="button" accessibilityLabel="Skip boss signature moment" onPress={onClose} style={s.backdrop}><LinearGradient colors={['#020610',`${b.color}18`,'#020610']} style={StyleSheet.absoluteFill}/><Text style={[s.micro,{color:b.color}]}>{cue.kind==='entry'?'SIGNATURE ENCOUNTER':'CONFIRMED ENRAGE / ATK +50%'}</Text><Animated.View style={{opacity:reduced?1:p.interpolate({inputRange:[0,.3,1],outputRange:[.15,1,1]}),transform:[{translateY:reduced?0:p.interpolate({inputRange:[0,1],outputRange:[25,0]})}]}}><SignatureGlyph enemyId={cue.enemyId} color={b.color}/></Animated.View><Image source={storyArtwork[cue.enemyId]} resizeMode="contain" style={s.art}/><Text style={[s.name,{color:b.color}]}>{b.name}</Text><Text style={s.title}>{b.title}</Text><Text style={s.body}>{b.description}</Text><Text style={s.foot}>CINEMATIC PRESENTATION · NOT A NEW DAMAGE SKILL</Text><Text style={[s.micro,{color:b.color}]}>TAP / BACK TO SKIP</Text></Pressable></Modal>;
}
const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:'#020610',padding:25,alignItems:'center',justifyContent:'center',gap:16},micro:{fontSize:9,fontWeight:'900',letterSpacing:2,textAlign:'center'},art:{width:'100%',height:210},name:{fontSize:34,fontWeight:'900',letterSpacing:5},title:{color:'#f0efff',fontSize:14,fontWeight:'900',letterSpacing:2,textAlign:'center'},body:{color:'#bcc8da',fontSize:14,lineHeight:25,textAlign:'center',maxWidth:400},foot:{fontSize:7,letterSpacing:1,color:'#6f819b',textAlign:'center'}});
