import {usePresentation} from '../ui/PresentationProvider';
import {AudioPanel} from '../audio/AudioPanel';
import React from 'react';
import { Text, View } from 'react-native';
import { f, ActionButton } from '../ui/forms';
import { useAI } from '../ai/AIProvider';
export function SettingsScreen({onAI,onBack}:{onAI:()=>void;onBack:()=>void}){
 const ai=useAI(),presentation=usePresentation();return <><Text style={f.eyebrow}>APP PREFERENCES</Text><Text style={f.title}>Settings</Text><AudioPanel/><View style={f.panel}><Text style={f.section}>Accessibility & motion</Text><Text style={f.body}>System Reduce Motion: {presentation.systemReduced?'ON':'OFF'}। System setting ON থাকলে app সেটি override করে না।</Text><ActionButton secondary title={`Reduce Motion: ${presentation.reduceRequested?'ON':'OFF'}`} disabled={!presentation.ready} onPress={()=>presentation.setReduceRequested(!presentation.reduceRequested)}/><Text style={f.body}>Theme loops, navigation transition ও Story/Arena presentation-এ motion কমায়। Battle stats/rewards বদলায় না।</Text>{!!presentation.error&&<Text style={f.error}>{presentation.error}</Text>}</View><View style={f.panel}><Text style={f.section}>AI Provider</Text><Text style={f.body}>Gemini · {ai.hasKey?(ai.enabled?'Enabled':'Disabled'):'Key not configured'}{`\n`}Key, model ও বাস্তব connection test এখানে।</Text><ActionButton title="AI Provider →" onPress={onAI}/></View><View style={f.panel}><Text style={f.section}>About this test build</Text><Text style={f.body}>7A Audio controls · in progress{`\n`}Profile/Feed photo চালু; video স্থগিত। Media cleanup-এর live যাচাই pending। Audio preferences শুধু এই device/account-এ থাকে।</Text></View><ActionButton secondary title="Back" onPress={onBack}/></>;
}
