import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAudioModeAsync,useAudioPlayer,useAudioPlayerStatus,AudioPlayer} from 'expo-audio';
import {AudioPreferences,defaults,nextTrack,preferences,referenceTracks} from './model';
const tracks=[require('../../assets/audio/music-drift.wav'),require('../../assets/audio/music-orbit.wav'),require('../../assets/audio/music-neon.wav')];
export type Sfx='click'|'reward'|'tick'|'wheelEnd'|'summon';
type AudioContextValue={prefs:AudioPreferences;ready:boolean;foreground:boolean;desired:boolean;playing:boolean;loading:boolean;error:string;position:number;duration:number;update:(p:Partial<AudioPreferences>)=>void;play:()=>void;pause:()=>void;restart:()=>void;playSfx:(kind:Sfx)=>void;reset:()=>Promise<void>};
const Context=createContext<AudioContextValue|null>(null);
const quietly=(fn:()=>unknown)=>{try{const r=fn();if(r&&typeof (r as Promise<unknown>).catch==='function')void (r as Promise<unknown>).catch(()=>{});}catch{}};
export function useOptionalAudio(){return useContext(Context);}
export function useAppAudio(){const value=useContext(Context);if(!value)throw Error('AudioProvider missing');return value;}
export function AudioProvider({uid,children}:{uid:string;children:React.ReactNode}){
 const key=`audio.preferences.v1.${uid}`,[prefs,setPrefs]=useState(defaults),[ready,setReady]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active'),[desired,setDesired]=useState(false),[loading,setLoading]=useState(false),[restartNonce,setRestartNonce]=useState(0),[error,setError]=useState('');
 const music=useAudioPlayer(null),status=useAudioPlayerStatus(music),click=useAudioPlayer(require('../../assets/audio/ui-click.wav')),reward=useAudioPlayer(require('../../assets/audio/reward-chime.wav')),tick=useAudioPlayer(require('../../assets/audio/wheel-tick.wav')),wheelEnd=useAudioPlayer(require('../../assets/audio/wheel-end.wav')),summon=useAudioPlayer(require('../../assets/audio/summon-rise.wav'));
 const players={click,reward,tick,wheelEnd,summon},alive=useRef(true),prefsRef=useRef(prefs),active=useRef(false),loadedTrack=useRef(''),sequence=useRef(0),writeQueue=useRef(Promise.resolve()),finishSeen=useRef(false),lastSfx=useRef<Record<string,number>>({});prefsRef.current=prefs;active.current=ready&&foreground;
 useEffect(()=>{alive.current=true;let valid=true;void AsyncStorage.getItem(key).then(raw=>{if(valid){setPrefs(preferences(raw?JSON.parse(raw):defaults));setReady(true);}}).catch(()=>{if(valid)setError('Audio settings পড়া যায়নি। Reset না করা পর্যন্ত পুরোনো settings overwrite করা হবে না।');});void setAudioModeAsync({playsInSilentMode:true,interruptionMode:'doNotMix',allowsRecording:false,shouldPlayInBackground:false,shouldRouteThroughEarpiece:false}).catch(()=>{if(valid)setError('Device audio session configure হয়নি। Playback পরীক্ষা করে error জানাও।');});
  const sub=AppState.addEventListener('change',s=>{setForeground(s==='active');if(s!=='active'){active.current=false;sequence.current++;setDesired(false);for(const p of [music,...Object.values(players)])quietly(()=>p.pause());}});
  return()=>{valid=false;alive.current=false;active.current=false;sequence.current++;sub.remove();for(const p of [music,...Object.values(players)])quietly(()=>p.pause());};
 },[key]);
 useEffect(()=>{if(!ready)return;const value=JSON.stringify(prefs);writeQueue.current=writeQueue.current.then(()=>AsyncStorage.setItem(key,value)).catch(()=>{if(alive.current)setError('Audio settings ফোনে save হয়নি; restart-এর পরে আগের settings ফিরতে পারে।');});},[ready,prefs,key]);
 useEffect(()=>{quietly(()=>{music.volume=prefs.musicVolume;music.loop=prefs.mode==='repeat';});},[prefs.musicVolume,prefs.mode,music]);
 useEffect(()=>{const enabled=ready&&foreground&&prefs.sfxEnabled;for(const p of Object.values(players))quietly(()=>{p.muted=!enabled;p.volume=prefs.sfxVolume;if(!enabled)p.pause();});},[ready,foreground,prefs.sfxEnabled,prefs.sfxVolume]);
 useEffect(()=>{const epoch=++sequence.current;let timer:ReturnType<typeof setTimeout>|undefined,subscription:{remove:()=>void}|undefined;const sourceKey=`${prefs.library}:${prefs.track}`;
  const valid=()=>alive.current&&active.current&&sequence.current===epoch;
  const fail=()=>{if(!valid())return;sequence.current++;if(timer)clearTimeout(timer);loadedTrack.current='';setLoading(false);setDesired(false);quietly(()=>music.pause());setError('Music load/play হয়নি। Network বা original source unavailable হতে পারে। Retry/Restart চাপো, অন্য track নাও, অথবা নিজে Offline demo বেছে নাও।');};
  if(!ready||!foreground||!desired){setLoading(false);quietly(()=>music.pause());return;}
  const begin=()=>{if(!valid())return;try{if(!music.isLoaded)return;loadedTrack.current=sourceKey;if(timer)clearTimeout(timer);setLoading(false);music.play();}catch{fail();}};
  try{
   if(loadedTrack.current!==sourceKey){setLoading(true);finishSeen.current=false;music.replace(prefs.library==='reference'?{uri:referenceTracks[prefs.track].uri}:tracks[prefs.track]);timer=setTimeout(fail,30000);
    subscription=music.addListener('playbackStatusUpdate',state=>{if(state.playbackState==='error')fail();else if(state.isLoaded&&loadedTrack.current!==sourceKey)begin();});begin();
   }else{setLoading(false);music.play();subscription=music.addListener('playbackStatusUpdate',state=>{if(state.playbackState==='error')fail();});}
  }catch{fail();}
  return()=>{if(timer)clearTimeout(timer);quietly(()=>subscription?.remove());};
 },[ready,foreground,desired,prefs.library,prefs.track,restartNonce,music]);
 useEffect(()=>{if(!status.didJustFinish){finishSeen.current=false;return;}if(finishSeen.current||!desired||!active.current||loading||loadedTrack.current!==`${prefsRef.current.library}:${prefsRef.current.track}`)return;finishSeen.current=true;if(prefsRef.current.mode==='continue')setPrefs(p=>({...p,track:nextTrack(p.track)}));},[status.didJustFinish,desired]);
 const playSfx=(kind:Sfx)=>{if(!alive.current||!active.current||!prefsRef.current.sfxEnabled||prefsRef.current.sfxVolume===0)return;const now=Date.now();if(now-(lastSfx.current[kind]||0)<(kind==='tick'?35:100))return;lastSfx.current[kind]=now;const p=players[kind];quietly(()=>p.seekTo(0).then(()=>{if(alive.current&&active.current&&prefsRef.current.sfxEnabled)p.play();}));};
 const reset=async()=>{setDesired(false);try{await writeQueue.current;await AsyncStorage.removeItem(key);if(alive.current){setPrefs(defaults);setReady(true);setError('');}}catch{if(alive.current)setError('Audio settings reset হয়নি। Storage পাওয়া গেলে আবার চেষ্টা করো।');}};
 return <Context.Provider value={{prefs,ready,foreground,desired,playing:!!status.playing,loading,error,position:loadedTrack.current===`${prefs.library}:${prefs.track}`?(status.currentTime||0):0,duration:loadedTrack.current===`${prefs.library}:${prefs.track}`?(status.duration||0):0,update:p=>{if(ready)setPrefs(old=>preferences({...old,...p}));},play:()=>{if(ready&&foreground){setError('');setDesired(true);}},pause:()=>{setDesired(false);sequence.current++;quietly(()=>music.pause());},restart:()=>{if(ready&&foreground){loadedTrack.current='';setError('');setDesired(true);setRestartNonce(n=>n+1);}},playSfx,reset}}>{children}</Context.Provider>;
}
// Existing screen sounds retain their local toggle, with global mute/foreground as an additional gate.
export function useSoundGate(players:AudioPlayer[],local=true,visible=true){const audio=useAppAudio(),allowed=audio.ready&&audio.foreground&&audio.prefs.sfxEnabled&&audio.prefs.sfxVolume>0&&local&&visible,gate=useRef(allowed);gate.current=allowed;
 useEffect(()=>{for(const p of players)quietly(()=>{p.muted=!allowed;p.volume=audio.prefs.sfxVolume;if(!allowed)p.pause();});return()=>{for(const p of players)quietly(()=>p.pause());};},[allowed,audio.prefs.sfxVolume,...players]);return gate;
}
