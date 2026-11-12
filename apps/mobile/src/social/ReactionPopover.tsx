import React from 'react';
import {Modal,Pressable,View,Text,StyleSheet,useWindowDimensions} from 'react-native';
import {emojis} from './types';
export type ReactionAnchor={x:number;y:number};
export function ReactionPopover({visible,anchor,onClose,onSelect,disabled}:{visible:boolean;anchor:ReactionAnchor;onClose:()=>void;onSelect:(emoji:string)=>void;disabled:boolean}){
 const {width,height}=useWindowDimensions();
 if(!visible)return null;
 const w=Math.min(320,width-24),left=Math.max(12,Math.min(anchor.x,w<width?width-w-12:12)),top=Math.max(12,Math.min(anchor.y-65,height-80));
 return <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={onClose}><Pressable accessibilityRole="button" accessibilityLabel="Close reactions" onPress={onClose} style={StyleSheet.absoluteFill}/><View accessibilityViewIsModal style={[s.pill,{width:w,left,top}]}>{emojis.map(emoji=><Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`React ${emoji}`} disabled={disabled} onPress={()=>onSelect(emoji)} style={s.emoji}><Text style={{fontSize:29}}>{emoji}</Text></Pressable>)}</View></Modal>;
}
const s=StyleSheet.create({pill:{position:'absolute',flexDirection:'row',alignItems:'center',backgroundColor:'#302a3b',borderWidth:1,borderColor:'#786b87',borderRadius:40,paddingHorizontal:6,paddingVertical:7,elevation:12,shadowColor:'#000',shadowOpacity:.25,shadowRadius:12,shadowOffset:{width:0,height:5}},emoji:{flex:1,minHeight:44,alignItems:'center',justifyContent:'center'}});
