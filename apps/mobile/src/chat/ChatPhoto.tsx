import React,{useEffect,useRef,useState} from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {useChat} from './ChatProvider';
import {f} from '../ui/forms';
export function ChatPhoto({messageId,peerId}:{messageId:string;peerId:string}){const chat=useChat(),[url,setUrl]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),controller=useRef<AbortController|null>(null),alive=useRef(true),locked=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[messageId,peerId]);
 const load=async()=>{if(locked.current)return;locked.current=true;setBusy(true);setError('');const ac=new AbortController();controller.current=ac;try{const r=await chat.read({type:'chatImage',messageId,peerId},ac.signal);if(!ac.signal.aborted&&alive.current&&/^https:\/\/api\.cloudinary\.com\//.test(r.imageUrl||''))setUrl(r.imageUrl!);else if(!ac.signal.aborted)throw Error('ছবির access পাওয়া যায়নি।');}catch(e){if(alive.current&&!ac.signal.aborted)setError(e instanceof Error?e.message:'ছবি আসেনি।');}finally{locked.current=false;if(alive.current)setBusy(false);}};
 return <View style={{gap:6}}>{url&&<Image accessibilityLabel="Chat photo" source={{uri:url}} resizeMode="contain" style={{width:220,height:230,borderRadius:12}} onError={()=>{setUrl('');setError('ছবির link-এর মেয়াদ শেষ বা load হয়নি। আবার খোলো।');}}/>}<Pressable accessibilityRole="button" disabled={busy} onPress={()=>void load()} style={{padding:10}}><Text style={f.link}>{busy?'ছবি আসছে…':url?'ছবি আবার লোড করো':'ছবি দেখো ↗'}</Text></Pressable>{!!error&&<Text style={f.error}>{error}</Text>}</View>;
}
