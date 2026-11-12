import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Svg,{Circle,Path} from 'react-native-svg';
export function HeaderBalances({xp,gold,gems,compact,onPress}:{xp?:number;gold?:number;gems?:number;compact:boolean;onPress:()=>void}){
 const size=compact?11:13;
 return <View style={{flexDirection:'row',gap:4}}>{([[xp,'XP','flash','#d2baff'],[gold,'Gold','coin','#ead194'],[gems,'Gems','diamond','#d6f896']] as const).map(([value,label,icon,color])=><Pressable key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${value??'loading'}. View balances`} onPress={onPress} style={{flexDirection:'row',alignItems:'center',gap:3,paddingVertical:9,paddingHorizontal:compact?5:8,borderWidth:1,borderColor:'#3a363f',borderRadius:24}}>{icon==='coin'?<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2"/><Circle cx="12" cy="12" r="7" fill="none" stroke={color} strokeWidth="1"/><Path d="M14.5 8.5h-3a2 2 0 000 4h1a2 2 0 010 4h-3M12 7v11" fill="none" stroke={color} strokeWidth="1.6"/></Svg>:<Ionicons name={icon} size={size} color={color}/>}<Text numberOfLines={1} style={{fontSize:compact?10:12,color,fontVariant:['tabular-nums']}}>{value==null?'—':Intl.NumberFormat('en',{notation:value>=100000?'compact':'standard',maximumFractionDigits:1}).format(value)}</Text></Pressable>)}</View>;
}
