import React from 'react';
import {View,StyleSheet} from 'react-native';
import {Avatar} from '../ui/Avatar';
import {ChatUser} from './types';
export function isActiveUser(user:ChatUser,now:number){const age=now-user.lastSeenMs;return user.online===true&&user.lastSeenMs>0&&age>=-5000&&age<70000;}
export function PresenceAvatar({uri,size=44,online=false}:{uri:string;size?:number;online?:boolean}){return <View style={{width:size,height:size}}><Avatar uri={uri} size={size}/>{online&&<View accessibilityLabel="Active now" style={[s.dot,{width:Math.max(12,size*.27),height:Math.max(12,size*.27)}]}/>}</View>;}
const s=StyleSheet.create({dot:{position:'absolute',right:-1,bottom:-1,borderRadius:20,backgroundColor:'#44ce72',borderWidth:2.5,borderColor:'#101214'}});
