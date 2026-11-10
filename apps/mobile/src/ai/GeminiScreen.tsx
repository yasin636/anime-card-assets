import React, { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { getAuth } from '@react-native-firebase/auth';
import { useAuth } from '../auth/AuthProvider';
import { f, ActionButton } from '../ui/forms';
import { discoverModels, generate, GeminiModel, Message } from './gemini';
export function GeminiScreen(){
 const {user}=useAuth();const uid=user?.uid||'';const focused=useIsFocused();const focusRef=useRef(focused);focusRef.current=focused;
 const [inputKey,setInputKey]=useState(''),[hasKey,setHasKey]=useState(false),[show,setShow]=useState(false),[model,setModel]=useState(''),[models,setModels]=useState<GeminiModel[]>([]);
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[prompt,setPrompt]=useState(''),[messages,setMessages]=useState<Message[]>([]);
 const savedKey=useRef(''),storeKey=useRef(''),lock=useRef(false),alive=useRef(true),controller=useRef<AbortController|null>(null);
 useEffect(()=>{let mounted=true;alive.current=true;
  (async()=>{if(!await SecureStore.isAvailableAsync())throw Error('Secure storage এই device-এ পাওয়া যাচ্ছে না। Key save করা হয়নি।');
   const name=`gemini.v1.${await digestStringAsync(CryptoDigestAlgorithm.SHA256,uid)}`;if(!mounted)return;storeKey.current=name;
   const value=await SecureStore.getItemAsync(name);if(!mounted)return;
   if(value){const parsed=JSON.parse(value);if(typeof parsed.key!=='string'||typeof parsed.model!=='string')throw Error('Saved configuration পড়া যায়নি।');savedKey.current=parsed.key;setHasKey(true);setModel(parsed.model);}
   setReady(true);
  })().catch(()=>{if(mounted)setError('Secure configuration পড়া যায়নি। Key logs বা অন্য storage-এ লেখা হয়নি।');});
  return()=>{mounted=false;alive.current=false;controller.current?.abort();savedKey.current='';};
 },[uid]);
 useEffect(()=>{if(!focused){controller.current?.abort();setMessages([]);setPrompt('');setInputKey('');setShow(false);}},[focused]);
 const operation=async(fn:(signal:AbortSignal)=>Promise<void>)=>{
  if(lock.current||!ready||!focusRef.current||getAuth().currentUser?.uid!==uid)return;
  lock.current=true;setBusy(true);setError('');setNotice('');const abort=new AbortController();controller.current=abort;
  const timer=setTimeout(()=>abort.abort(),45000);
  try{await fn(abort.signal);}catch(e){if(alive.current)setError(e instanceof Error&&e.name==='AbortError'?'সময় শেষ বা request বাতিল হয়েছে। আবার চেষ্টা করো।':e instanceof Error&&/^Key,|^Gemini |^এই key|^Model |^আগে |^নতুন |^API |^এই model/.test(e.message)?e.message:'কাজটি হয়নি। Internet/secure storage পরীক্ষা করো। কোনো key/error payload log করা হয়নি।');}
  finally{clearTimeout(timer);lock.current=false;if(alive.current)setBusy(false);}
 };
 const valid=()=>alive.current&&focusRef.current&&getAuth().currentUser?.uid===uid;
 const verify=()=>void operation(async signal=>{const key=inputKey.trim()||savedKey.current;if(!key)throw Error('API key লিখো।');if(key.length>256||/\s/.test(key))throw Error('API key-তে whitespace বা অস্বাভাবিক দৈর্ঘ্য আছে।');const available=await discoverModels(key,signal);if(!valid())return;setModels(available);setModel(available.some(m=>m.name===model)?model:available[0].name);setNotice(`${available.length}টি Gemini model পাওয়া গেছে। Model বেছে Save করো।`);});
 const save=()=>void operation(async()=>{const key=inputKey.trim()||savedKey.current;if(!key||!models.some(m=>m.name===model))throw Error('আগে key যাচাই করে উপলব্ধ model বেছে নাও।');await SecureStore.setItemAsync(storeKey.current,JSON.stringify({key,model}),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});if(!valid())return;savedKey.current=key;setHasKey(true);setInputKey('');setShow(false);setMessages([]);setNotice('Key ও model এই ফোনের secure storage-এ saved.');});
 const remove=()=>Alert.alert('Remove Gemini key?','এই ফোনের এই account-এর saved Gemini key ও model সরবে। Google-এ key revoke হবে না।',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>void operation(async()=>{await SecureStore.deleteItemAsync(storeKey.current);savedKey.current='';if(!valid())return;setHasKey(false);setInputKey('');setModels([]);setModel('');setMessages([]);setNotice('Saved Gemini key removed.');})}]);
 const send=()=>{const text=prompt.trim();if(!text)return;void operation(async signal=>{
  if(inputKey.trim())throw Error('নতুন key আগে যাচাই ও Save করো, বা input খালি করো।');
  if(!savedKey.current||!model)throw Error('আগে key ও model Save করো।');
  const contents:Message[]=[...messages.slice(-12),{role:'user',parts:[{text}]}];
  const answer=await generate(savedKey.current,model,[{role:'user',parts:[{text}]}],signal);if(!valid())return;setMessages([...contents,{role:'model',parts:[{text:answer}]}]);setPrompt('');
 });};
 return <><Text style={f.eyebrow}>AI ANIME SENSEI · GEMINI BYOK</Text><Text style={f.title}>Your key. Your model.</Text><View style={f.panel}><Text style={f.section}>Gemini settings</Text><Text style={f.body}>নিজের Gemini API key ব্যবহার করবে। Key এই ফোনে secure storage-এ থাকবে; Firebase profile, APK source বা logs-এ নয়। Requests Google-এ সরাসরি যায়; শুধু বর্তমান প্রশ্ন Google-এর কাছে যাবে (পুরোনো chat history নয়)। নিজের key-এর quota/খরচ প্রযোজ্য। Gemini account data বদলাতে পারে না।</Text><Text style={f.label}>{hasKey?'Saved key আছে · replace করতে নতুন key লিখো':'Gemini API key'}</Text><TextInput style={f.input} value={inputKey} onChangeText={value=>{setInputKey(value);setModels([]);}} secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} autoComplete="off" importantForAutofill="no" editable={ready&&!busy} placeholder={hasKey?'Saved key hidden':'Paste your own API key'} placeholderTextColor="#76688f" maxLength={256}/><Pressable accessibilityRole="button" disabled={busy} onPress={()=>setShow(!show)}><Text style={f.link}>{show?'Hide typed key':'Show typed key'}</Text></Pressable><ActionButton secondary title="Verify key & load available models" busy={busy} disabled={!ready} onPress={verify}/><Text style={f.body}>Live model list থেকে সর্বোচ্চ ৬টি text model দেখানো হয়; কম পাওয়া গেলে যতগুলো পাওয়া যায় ততগুলোই। Listing মানেই generation quota নিশ্চিত নয়।</Text>{models.map(item=><Pressable key={item.name} accessibilityRole="radio" accessibilityState={{checked:model===item.name}} disabled={busy} onPress={()=>setModel(item.name)} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:model===item.name?'#c4b5fd':'#45325e'}}><Text style={f.label}>{model===item.name?'●':'○'} {item.displayName}</Text><Text style={f.body}>{item.name.replace('models/','')}</Text></Pressable>)}{!!model&&<Text style={f.body}>Selected: {model.replace('models/','')}</Text>}<ActionButton title="Save key & selected model securely" disabled={!ready||busy||!models.length} onPress={save}/><ActionButton secondary title="Remove saved key from this phone" disabled={!ready||busy||!hasKey} onPress={remove}/></View>{!!error&&<Text accessibilityRole="alert" style={f.error}>{error}</Text>}{!!notice&&<Text style={f.success}>{notice}</Text>}<View style={f.panel}><Text style={f.section}>Ask Anime Sensei</Text><Text style={f.body}>Chat শুধু বর্তমান screen session-এ থাকে; account বদলালে/এই screen ছেড়ে গেলে মুছে যাবে। Password, key বা ব্যক্তিগত গোপন তথ্য prompt-এ দিও না। উত্তর ভুল হতে পারে।</Text>{messages.map((message,index)=><View key={index} style={{padding:10,borderRadius:10,backgroundColor:message.role==='user'?'#312049':'#09051a'}}><Text style={f.eyebrow}>{message.role==='user'?'YOU':'GEMINI'}</Text><Text selectable style={f.body}>{message.parts.map(p=>p.text).join('\n')}</Text></View>)}<TextInput multiline style={[f.input,{minHeight:90,textAlignVertical:'top'}]} value={prompt} onChangeText={setPrompt} editable={!busy} placeholder="Ask about anime…" placeholderTextColor="#76688f" maxLength={4000}/><ActionButton title="Send to selected Gemini model" busy={busy} disabled={!hasKey||!prompt.trim()||!ready} onPress={send}/><ActionButton secondary title="Clear chat context" disabled={busy||!messages.length} onPress={()=>setMessages([])}/></View></>;
}
