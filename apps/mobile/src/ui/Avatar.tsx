import React, { useState } from 'react';
import { Image, View, Text } from 'react-native';
import { SvgUri } from 'react-native-svg';
export function Avatar({ uri, size = 72 }: { uri: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) return <View style={{ width: size, height: size, borderRadius: size / 3, backgroundColor: '#39225a', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ddd6fe', fontSize: size / 3 }}>✦</Text></View>;
  return <View style={{ width: size, height: size, borderRadius: size / 3, overflow: 'hidden', backgroundColor: '#25153f' }}>
    {uri.includes('/svg') ? <SvgUri uri={uri} width={size} height={size} onError={() => setFailed(true)} /> : <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} />}
  </View>;
}
