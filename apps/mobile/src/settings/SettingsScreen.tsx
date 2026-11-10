import React from 'react';
import { Text, View } from 'react-native';
import { f, ActionButton } from '../ui/forms';
import { useAI } from '../ai/AIProvider';
export function SettingsScreen({onAI,onBack}:{onAI:()=>void;onBack:()=>void}){
 const ai=useAI();return <><Text style={f.eyebrow}>APP PREFERENCES</Text><Text style={f.title}>Settings</Text><View style={f.panel}><Text style={f.section}>AI Provider</Text><Text style={f.body}>Gemini · {ai.hasKey?(ai.enabled?'Enabled':'Disabled'):'Key not configured'}{`\n`}Key, model ও বাস্তব connection test এখানে।</Text><ActionButton title="AI Provider →" onPress={onAI}/></View><View style={f.panel}><Text style={f.section}>About this test build</Text><Text style={f.body}>v0.3.1 · Settings / AI Sensei redesign{`\n`}Gallery upload স্থগিত। Economy actions-এর trusted backend setup বাকি। নতুন preference এখানে পরের ধাপে যুক্ত করা যাবে।</Text></View><ActionButton secondary title="Back" onPress={onBack}/></>;
}
