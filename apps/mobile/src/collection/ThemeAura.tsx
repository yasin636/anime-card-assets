import {usePresentation} from '../ui/PresentationProvider';
import {useIsFocused} from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth/AuthProvider';
import themes from '../domain/themes.json';
export function ThemeAura(){
 const presentation=usePresentation(),focused=useIsFocused();
 const {profile}=useAuth();const theme=themes.find(t=>t.id===profile?.equippedTheme);const value=useRef(new Animated.Value(0)).current;
 useEffect(()=>{if(!theme)return;if(presentation.reduced||!focused){value.setValue(.25);return;}value.setValue(0);const effect=Animated.loop(Animated.sequence([Animated.timing(value,{toValue:1,duration:theme.id==='opm'?450:1800,useNativeDriver:true}),Animated.timing(value,{toValue:0,duration:theme.id==='opm'?250:1800,useNativeDriver:true})]));effect.start();return()=>effect.stop();},[theme?.id,presentation.reduced,focused]);
 if(!theme)return null;
 const gradient=theme.gradient.match(/#[0-9a-f]{6}/gi) as [string,string,...string[]];
 const translateY=value.interpolate({inputRange:[0,1],outputRange:theme.id==='vinland'?[-10,45]:theme.id==='onepiece'?[-5,5]:[10,-15]});
 const translateX=value.interpolate({inputRange:[0,.5,1],outputRange:theme.id==='aot'?[-3,3,-3]:theme.id==='onepiece'?[-20,0,20]:[0,3,0]});
 return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={StyleSheet.absoluteFill}><Animated.View style={[StyleSheet.absoluteFill,{opacity:value.interpolate({inputRange:[0,1],outputRange:[.06,.20]}),transform:[{translateY},{translateX}]}]}><LinearGradient colors={gradient} style={StyleSheet.absoluteFill}/>{[0,1,2,3,4].map(i=><Text key={i} style={{position:'absolute',top:100+i*130,left:`${8+i*17}%`,fontSize:theme.id==='vinland'?30:45,color:'#fff'}}>{theme.id==='vinland'?'❄':theme.emoji}</Text>)}</Animated.View></View>;
}
