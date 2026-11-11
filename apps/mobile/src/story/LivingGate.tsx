import React,{useEffect,useRef} from 'react';
import {Animated,StyleSheet,View,Text} from 'react-native';
import Svg,{Circle,Line,Path} from 'react-native-svg';
import {StorySession} from './types';
const colors=['#58dbff','#b88aff','#ff7a9a','#6fffc2','#a995ff'];
export function LivingGate({session:s,reduced}:{session:StorySession;reduced:boolean}){
 const drift=useRef(new Animated.Value(0)).current,pulse=useRef(new Animated.Value(0)).current;
 const event=s.events.some(e=>e.shieldBreak)?'shield':s.events.some(e=>e.enrage)?'enrage':s.outcome==='win'?'clear':'';
 const color=s.enraged?'#ff7d9c':colors[s.chapterId-1]||colors[0];
 useEffect(()=>{if(reduced||s.outcome){drift.setValue(0);return;}const a=Animated.loop(Animated.sequence([Animated.timing(drift,{toValue:1,duration:7000,useNativeDriver:true}),Animated.timing(drift,{toValue:0,duration:7000,useNativeDriver:true})]));a.start();return()=>a.stop();},[reduced,s.id,s.outcome,drift]);
 useEffect(()=>{if(!event||reduced){pulse.setValue(0);return;}pulse.setValue(0);const a=Animated.timing(pulse,{toValue:1,duration:1600,useNativeDriver:true});a.start();return()=>a.stop();},[s.id,s.version,event,reduced,pulse]);
 return <View pointerEvents="none" accessibilityElementsHidden style={StyleSheet.absoluteFill}>
 <Animated.View style={{position:'absolute',top:25,left:'50%',marginLeft:-100,width:200,height:200,opacity:s.outcome==='win' ? .18 : reduced ? .25 : drift.interpolate({inputRange:[0,1],outputRange:[.14,.38]}),transform:[{rotate:reduced?'0deg':drift.interpolate({inputRange:[0,1],outputRange:['-8deg','8deg']})}]}}><Svg width="200" height="200" viewBox="0 0 200 200"><Circle cx="100" cy="100" r="87" fill="none" stroke={color} strokeWidth="1"/>{Array.from({length:12},(_,i)=>{const angle=i*Math.PI/6;return <Line key={i} x1={100+Math.cos(angle)*72} y1={100+Math.sin(angle)*72} x2={100+Math.cos(angle)*85} y2={100+Math.sin(angle)*85} stroke={color} strokeWidth={i%3===0?4:1}/>;})}<Path d={s.chapterId===3?'M40 140 L100 40 L160 140 Z':s.chapterId===4?'M40 100 L100 40 L160 100 L100 160 Z':'M65 150 L65 75 Q100 20 135 75 L135 150 Z'} stroke={color} strokeWidth="2" fill={`${color}07`}/></Svg></Animated.View>
 {!reduced&&!s.outcome&&Array.from({length:7},(_,i)=><Animated.View key={i} style={{position:'absolute',left:`${7+i*13}%`,top:70+(i%3)*55,width:3,height:s.chapterId===2?14:3,borderRadius:2,backgroundColor:color,opacity:drift.interpolate({inputRange:[0,.5,1],outputRange:[.1,.45,.1]}),transform:[{translateY:drift.interpolate({inputRange:[0,1],outputRange:[45+i*7,-30-i*4]})}]}}/>)}
 {!!event&&<Animated.View style={{position:'absolute',bottom:110,left:0,right:0,alignItems:'center',opacity:reduced ? .35 : pulse.interpolate({inputRange:[0,.2,1],outputRange:[0,.7,0]}),transform:[{scale:reduced?1:pulse.interpolate({inputRange:[0,1],outputRange:[.8,1.15]})}]}}><Svg width="300" height="90" viewBox="0 0 300 90"><Path d={event==='shield'?'M0 50 L70 48 L85 15 L100 68 L122 30 L145 53 L178 45 L200 70 L220 35 L235 50 L300 50':'M0 50 Q150 0 300 50 M20 65 Q150 25 280 65'} stroke={color} strokeWidth="2" fill="none"/></Svg></Animated.View>}
 {s.outcome==='win'&&<Text style={{position:'absolute',top:7,alignSelf:'center',fontSize:7,color:'#8ef4dc',letterSpacing:2}}>GATE STABILIZED</Text>}
 </View>;
}
