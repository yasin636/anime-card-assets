import React,{useCallback,useEffect,useState,useRef} from 'react';
import {AppState,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useEvent} from 'expo';
import {useVideoPlayer,VideoView,VideoSource} from 'expo-video';
import {useAppAudio} from '../audio/AudioProvider';
import {mediaUrl,trackLabel} from './model';
const sample=require('../../assets/watch/track-check.mp4');
export function WatchScreen({onLink}:{onLink?:(url:string)=>Promise<{resume:number;report:(position:number,duration:number)=>void}>}={}){
 const [source,setSource]=useState<VideoSource>(null),[revision,setRevision]=useState(0),[url,setUrl]=useState(''),[message,setMessage]=useState(''),[sampleSelected,setSampleSelected]=useState(false);
 const music=useAppAudio();const [resume,setResume]=useState(0);const [report,setReport]=useState<((position:number,duration:number)=>void)|undefined>(undefined);const epoch=useRef(0);
 useFocusEffect(useCallback(()=>{music.pause();return()=>{epoch.current++;setSource(null);setRevision(n=>n+1);};},[]));
 const load=async(local:boolean)=>{const request=++epoch.current;try{const uri=local?'':mediaUrl(url);const context=!local&&onLink?await onLink(uri):undefined;if(request!==epoch.current)return;music.pause();setMessage('');setResume(context?.resume||0);setReport(()=>context?.report);setSampleSelected(local);setSource(local?sample:{uri});setRevision(n=>n+1);}catch(e){if(request===epoch.current)setMessage((e as Error).message);}};
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>ANIGOOD WATCH</Text><Text style={s.title}>Your next world.</Text><Text style={s.body}>নিজের বা অনুমতিপ্রাপ্ত ভিডিও চালাও। উপলব্ধ audio ও subtitle track-ই দেখানো হবে।</Text>
 <View style={s.card}><Player key={revision} source={source} resume={resume} onProgress={sampleSelected?undefined:report}/></View>
 <View style={s.card}><Text style={s.heading}>Playback check</Text><Text style={s.body}>১২ সেকেন্ডের offline test pattern · দুইটি test tone (440 / 880 Hz) ও English subtitle। এটি সিনেমা বা বাস্তব dub নয়। শব্দ কমিয়ে পরীক্ষা করো।</Text><Button text="Play offline sample" onPress={()=>load(true)}/></View>
 <View style={s.card}><Text style={s.heading}>Open your video</Text><Text style={s.body}>Public HTTPS MP4 / HLS / DASH link। Provider ভিডিওর সঙ্গে তোমার IP পাবে; private login, DRM বা সব codec এই পরীক্ষায় সমর্থিত নয়। Link সংরক্ষণ করা হয় না।</Text><TextInput accessibilityLabel="HTTPS video URL" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://…" placeholderTextColor="#8f88a6" style={s.input}/><Button text="Open video" onPress={()=>load(false)}/></View>
 {!!message&&<Text accessibilityRole="alert" style={s.error}>{message}</Text>}
 {!!source&&<Button text="Reload selected video" onPress={()=>{setMessage('');setRevision(n=>n+1);}}/>}
 {sampleSelected&&!!source&&<Text style={s.body}>Sample: generated test media, no copyrighted movie content.</Text>}
 </ScrollView>;
}
function Player({source,resume=0,onProgress}:{source:VideoSource;resume?:number;onProgress?:(position:number,duration:number)=>void}){
 const player=useVideoPlayer(source,p=>{p.timeUpdateEventInterval=1;p.staysActiveInBackground=false;p.showNowPlayingNotification=false;});
 const {status}=useEvent(player,'statusChange',{status:player.status});
 const {availableAudioTracks}=useEvent(player,'availableAudioTracksChange',{availableAudioTracks:player.availableAudioTracks});
 const {availableSubtitleTracks}=useEvent(player,'availableSubtitleTracksChange',{availableSubtitleTracks:player.availableSubtitleTracks});
 const {audioTrack}=useEvent(player,'audioTrackChange',{audioTrack:player.audioTrack});
 const {subtitleTrack}=useEvent(player,'subtitleTrackChange',{subtitleTrack:player.subtitleTrack});
 const [error,setError]=useState('');
 const progress=useRef(onProgress);progress.current=onProgress;
 useEffect(()=>{let sought=false,last=0;const report=()=>{try{if(player.duration>0)progress.current?.(player.currentTime,player.duration);}catch{}};const seek=()=>{if(!sought&&player.status==='readyToPlay'){sought=true;if(resume>0&&resume<player.duration-3)player.currentTime=resume;}};const a=player.addListener('statusChange',seek);const b=player.addListener('timeUpdate',()=>{if(Date.now()-last>5000){last=Date.now();report();}});const c=AppState.addEventListener('change',v=>{if(v!=='active')report();});seek();return()=>{report();a.remove();b.remove();c.remove();};},[player,resume]);
 useEffect(()=>{const a=AppState.addEventListener('change',state=>{if(state!=='active')player.pause();});const b=player.addListener('statusChange',e=>{if(e.status==='error')setError('ভিডিও লোড হয়নি। Link, network, codec বা provider access পরীক্ষা করে Reload করো।');else setError('');});return()=>{a.remove();b.remove();};},[player]);
 const select=(fn:()=>void)=>{try{fn();setError('');}catch{setError('এই track নির্বাচন হয়নি। আবার চেষ্টা করো।');}};
 return <><VideoView player={player} style={s.video} nativeControls contentFit="contain" fullscreenOptions={{enable:true,orientation:'landscape'}} allowsPictureInPicture={false}/><Text style={s.body}>{!source?'ভিডিও বেছে নাও।':status==='loading'?'Loading…':status==='readyToPlay'?'Ready · Play চাপো':status==='error'?'Playback unavailable':'Preparing…'}</Text>{!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
 {!!source&&<><Text style={s.heading}>Audio</Text><View style={s.wrap}>{availableAudioTracks.map((t,i)=><Button key={t.id} text={`${audioTrack?.id===t.id?'● ':''}${trackLabel(t,i)}`} onPress={()=>select(()=>{player.audioTrack=t;})}/>)}</View>{!availableAudioTracks.length&&<Text style={s.body}>কোনো selectable audio track পাওয়া যায়নি।</Text>}<Text style={s.heading}>Subtitles</Text><View style={s.wrap}><Button text={`${!subtitleTrack?'● ':''}Off`} onPress={()=>select(()=>{player.subtitleTrack=null;})}/>{availableSubtitleTracks.map((t,i)=><Button key={t.id} text={`${subtitleTrack?.id===t.id?'● ':''}${trackLabel(t,i)}`} onPress={()=>select(()=>{player.subtitleTrack=t;})}/>)}</View>{!availableSubtitleTracks.length&&<Text style={s.body}>এই source-এ subtitle track পাওয়া যায়নি। External subtitle import পরের player ধাপে।</Text>}</>}
 </>;
}
function Button({text,onPress}:{text:string;onPress:()=>void}){return <Pressable accessibilityRole="button" accessibilityLabel={text} onPress={onPress} style={s.button}><Text style={s.buttonText}>{text}</Text></Pressable>;}
const s=StyleSheet.create({page:{padding:18,gap:16,paddingBottom:36},eyebrow:{color:'#67e8f9',letterSpacing:3,fontSize:11},title:{color:'#f3edff',fontSize:30,fontWeight:'800'},body:{color:'#bab3ce',fontSize:13,lineHeight:21},heading:{color:'#f3edff',fontSize:16,fontWeight:'700'},card:{backgroundColor:'#14112a',borderWidth:1,borderColor:'#30284a',borderRadius:20,padding:14,gap:12},video:{width:'100%',aspectRatio:16/9,backgroundColor:'#000'},input:{color:'#fff',borderColor:'#49405f',borderWidth:1,borderRadius:12,padding:12},button:{backgroundColor:'#29213f',borderRadius:12,paddingHorizontal:14,paddingVertical:12,borderWidth:1,borderColor:'#55436e'},buttonText:{color:'#d6c7ff',fontWeight:'600'},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8},error:{color:'#ffb5c2',lineHeight:21}});
