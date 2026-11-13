import React,{useCallback,useRef,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAppAudio} from '../audio/AudioProvider';
import {useAuth} from '../auth/AuthProvider';
import {Title} from './catalog';
import {DownloadsScreen} from './downloads/DownloadsScreen';
import {PlayerTestLab} from './PlayerTestLab';
import {SourceBrowser} from './SourceBrowser';
import {openAnimationStream} from './automaticSources';
import {IntegratedStream} from './sourceIntegration';
import {mediaUrl} from './model';
import {useWatchPlayback} from './WatchPlaybackProvider';
const sample=require('../../assets/watch/track-check.mp4');
export function WatchScreen({onLink,onPrevious,onNext,selection,credential,initialDownloads=false}:{initialDownloads?:boolean;selection?:{title:Title;season:number;episode:number};credential?:string;onLink?:(url:string)=>Promise<{resume:number;report:(position:number,duration:number)=>void}>;onPrevious?:()=>void;onNext?:()=>void}={}){
 const {user}=useAuth();
 const music=useAppAudio(),playback=useWatchPlayback();const [url,setUrl]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(false),[advanced,setAdvanced]=useState(false),[downloadsTab,setDownloadsTab]=useState(initialDownloads);const epoch=useRef(0);
 useFocusEffect(useCallback(()=>{music.pause();return()=>{epoch.current++;};},[]));
 const load=async(local:boolean)=>{const request=++epoch.current;setLoading(true);try{const uri=local?'':mediaUrl(url);const context=!local&&onLink?await onLink(uri):undefined;if(request!==epoch.current)return;music.pause();setMessage('');playback.open({source:local?sample:{uri},title:local?'AniGooD · Offline playback sample':'AniGooD · Your video',resume:context?.resume||0,report:context?.report,previous:local?undefined:onPrevious,next:local?undefined:onNext});}catch{if(request===epoch.current)setMessage('Valid public HTTPS video link দাও। Link load/setup সফল হয়নি।');}finally{if(request===epoch.current)setLoading(false);}};
 const playStream=async(stream:IntegratedStream,alternatives:IntegratedStream[]=[]):Promise<void>=>{const request=++epoch.current;const context=onLink?await onLink(stream.url):undefined;if(request!==epoch.current)return;music.pause();playback.open({source:{uri:stream.url,headers:stream.headers},title:selection?`${selection.title.name} · ${stream.name}`:stream.name,resume:context?.resume||0,report:context?.report,remoteSubtitles:stream.subtitles,onNextStream:alternatives.length?()=>playStream(alternatives[0],alternatives.slice(1)):undefined,previous:onPrevious,next:onNext});};
 if(downloadsTab)return <ScrollView contentContainerStyle={s.page}><Button text="← Back to cinema" onPress={()=>setDownloadsTab(false)}/><DownloadsScreen/></ScrollView>;
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>ANIGOOD WATCH</Text><Text style={s.title}>{selection?.title.name||'Your private cinema.'}</Text><Text style={s.body}>নিজের বা অনুমতিপ্রাপ্ত ভিডিও চালাও। Source-এ পাওয়া audio/subtitle track-ই দেখানো হবে।</Text><Button text="Downloads" onPress={()=>setDownloadsTab(true)}/>{playback.active&&<Button text="Open active player" onPress={playback.expand}/>}
 {selection&&user&&<SourceBrowser uid={user.uid} title={selection.title} season={selection.season} episode={selection.episode} credential={credential||''} onPlay={playStream}/>}
 <PlayerTestLab/><View style={s.card}><Text style={s.eyebrow}>OPEN ANIMATION · NOT AN ANIME PROVIDER</Text><Text style={s.heading}>Big Buck Bunny</Text><Text style={s.body}>Blender Foundation · CC BY 3.0 · পূর্ণ short film। Source setup/ID লাগবে না। External host তোমার IP পায়। Ending credits রাখো।</Text><Button text="▶ Watch open film" onPress={()=>{music.pause();playback.open({source:{uri:openAnimationStream.url},title:openAnimationStream.name,resume:0});}}/></View><Button text={advanced?'Hide advanced playback':'Advanced playback / offline check'} onPress={()=>setAdvanced(v=>!v)}/>{advanced&&<><View style={s.card}><Text style={s.heading}>Open your video</Text><Text style={s.body}>Public HTTPS MP4 / HLS / DASH · Link save হয় না। Provider তোমার IP পায়।</Text><TextInput accessibilityLabel="HTTPS video URL" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://…" placeholderTextColor="#8f88a6" style={s.input}/><Button text={loading?'Preparing…':'Open video'} disabled={loading} onPress={()=>void load(false)}/></View>
 <View style={s.card}><Text style={s.heading}>Offline playback check</Text><Text style={s.body}>১২ সেকেন্ডের test pattern · দুইটি tone ও English subtitle। বাস্তব dub/movie নয়। Volume কম রাখো।</Text><Button text="Play offline sample" disabled={loading} onPress={()=>void load(true)}/></View>
 </>}{!!message&&<Text accessibilityRole="alert" style={s.error}>{message}</Text>}
 </ScrollView>;
}
function Button({text,onPress,disabled=false}:{text:string;onPress:()=>void;disabled?:boolean}){return <Pressable accessibilityRole="button" accessibilityLabel={text} disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:0.5}]}><Text style={s.buttonText}>{text}</Text></Pressable>;}
const s=StyleSheet.create({page:{padding:18,gap:16,paddingBottom:36},eyebrow:{color:'#67e8f9',letterSpacing:3,fontSize:11},title:{color:'#f3edff',fontSize:30,fontWeight:'800'},body:{color:'#bab3ce',fontSize:13,lineHeight:21},heading:{color:'#f3edff',fontSize:16,fontWeight:'700'},card:{backgroundColor:'#14112a',borderWidth:1,borderColor:'#30284a',borderRadius:20,padding:14,gap:12},input:{color:'#fff',borderColor:'#49405f',borderWidth:1,borderRadius:12,padding:12},button:{backgroundColor:'#29213f',borderRadius:12,paddingHorizontal:14,paddingVertical:12,borderWidth:1,borderColor:'#55436e'},buttonText:{color:'#d6c7ff',fontWeight:'600'},error:{color:'#ffb5c2',lineHeight:21}});
