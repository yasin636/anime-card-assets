import React,{useEffect,useState} from 'react';
import {Alert as NativeAlert,AlertButton,AlertOptions,Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {SystemFrame} from '../story/SystemWindow';
type Request={title:string;message?:string;buttons?:AlertButton[];options?:AlertOptions};
const queue:Request[]=[];let notify:(()=>void)|undefined;
const enqueue:typeof NativeAlert.alert=(title:string,message?:string,buttons?:AlertButton[],options?:AlertOptions)=>{queue.push({title,message,buttons,options});notify?.();};
export function SystemAlertHost(){const [request,setRequest]=useState<Request|null>(null);
 useEffect(()=>{const next=()=>setRequest(queue[0]||null);const original=NativeAlert.alert;NativeAlert.alert=enqueue;notify=next;next();return()=>{NativeAlert.alert=original;notify=undefined;queue.length=0;};},[]);
 const finish=(button?:AlertButton,dismiss=false)=>{queue.shift();setRequest(queue[0]||null);if(dismiss)request?.options?.onDismiss?.();else button?.onPress?.();};
 if(!request)return null;const cancel=()=>{const button=request.buttons?.find(b=>b.style==='cancel');if(button)finish(button);else if(request.options?.cancelable)finish(undefined,true);};
 return <Modal transparent visible animationType="none" onRequestClose={cancel}><SafeAreaView style={s.backdrop}><ScrollView contentContainerStyle={s.scroll}><View style={{width:'100%',maxWidth:500}}><SystemFrame danger={request.buttons?.some(b=>b.style==='destructive')}><Text style={s.kicker}>◈ AniGooD / SYSTEM</Text><Text accessibilityRole="header" style={s.title}>{request.title}</Text>{!!request.message&&<Text style={s.body}>{request.message}</Text>}{(request.buttons?.length?request.buttons:[{text:'ঠিক আছে'}]).map((b,i)=><Pressable key={i} accessibilityRole="button" onPress={()=>finish(b)} style={[s.button,b.style==='destructive'&&{borderColor:'#ff8c9f'}]}><Text style={[s.buttonText,b.style==='destructive'&&{color:'#ffb2bc'}]}>{b.text||'ঠিক আছে'}</Text></Pressable>)}</SystemFrame></View></ScrollView></SafeAreaView></Modal>;
}
const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:'#020814ed'},scroll:{flexGrow:1,justifyContent:'center',alignItems:'center',padding:24},kicker:{fontSize:9,color:'#84c6dc',letterSpacing:1.5},title:{fontSize:23,fontWeight:'800',color:'#d9faff',textAlign:'center'},body:{color:'#d2e5ef',fontSize:14,lineHeight:25},button:{padding:15,borderWidth:1,borderColor:'#67dcff66',backgroundColor:'#1385a222'},buttonText:{textAlign:'center',color:'#c2f5ff',fontWeight:'700'}});
