import {EconomyStatus} from '../collection/CollectionScreens';
import {usePresentation} from '../ui/PresentationProvider';
import {AudioPanel} from '../audio/AudioPanel';
import React,{useState} from 'react';
import { Text, View } from 'react-native';
import { f, ActionButton } from '../ui/forms';
import { useAI } from '../ai/AIProvider';
export function SettingsScreen({onAI,onBack}:{onAI:()=>void;onBack:()=>void}){
 const [diagnostics,setDiagnostics]=useState(false);const ai=useAI(),presentation=usePresentation();return <><Text style={f.eyebrow}>APP PREFERENCES</Text><Text style={f.title}>Settings</Text><AudioPanel/><View style={f.panel}><Text style={f.section}>Accessibility & motion</Text><Text style={f.body}>System Reduce Motion: {presentation.systemReduced?'ON':'OFF'}। System setting ON থাকলে app সেটি override করে না।</Text><ActionButton secondary title={`Reduce Motion: ${presentation.reduceRequested?'ON':'OFF'}`} disabled={!presentation.ready} onPress={()=>presentation.setReduceRequested(!presentation.reduceRequested)}/><Text style={f.body}>Theme loops, navigation transition ও Story/Arena presentation-এ motion কমায়। Battle stats/rewards বদলায় না।</Text>{!!presentation.error&&<Text style={f.error}>{presentation.error}</Text>}</View><View style={f.panel}><Text style={f.section}>AI Provider</Text><Text style={f.body}>Gemini · {ai.hasKey?(ai.enabled?'Enabled':'Disabled'):'Key not configured'}{`\n`}Key, model ও বাস্তব connection test এখানে।</Text><ActionButton title="AI Provider →" onPress={onAI}/></View><ActionButton secondary title={diagnostics?'Hide diagnostics':'Connection diagnostics'} onPress={()=>setDiagnostics(v=>!v)}/>{diagnostics&&<EconomyStatus diagnostics/>}<View style={f.panel}><Text style={f.section}>About Anime Meta Hub</Text><Text style={f.body}>Version 0.15.0 · R2{`\n`}Audio preferences এই device/account-এ save হয়।</Text></View><ActionButton secondary title="Back" onPress={onBack}/></>;
}
