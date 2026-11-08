import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
export const f = StyleSheet.create({
 page: { flex: 1, backgroundColor: '#030014' }, content: { padding: 22, gap: 18, width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: 40 },
 eyebrow: { color: '#a78bfa', fontSize: 10, letterSpacing: 2, fontWeight: '800' }, title: { color: '#f3edff', fontSize: 29, lineHeight: 37, fontWeight: '900' }, body: { color: '#bca8ef', fontSize: 12, lineHeight: 21 },
 panel: { borderWidth: 1, borderColor: '#392950', borderRadius: 18, backgroundColor: '#14112f', padding: 18, gap: 14 }, label: { color: '#ddd6fe', fontSize: 12, fontWeight: '700' },
 input: { color: '#f3edff', borderWidth: 1, borderColor: '#45325e', backgroundColor: '#0b0820', borderRadius: 11, padding: 13, minHeight: 48, fontSize: 14 },
 row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, link: { color: '#c4b5fd', fontSize: 13, fontWeight: '800', paddingVertical: 12 },
 error: { color: '#fda4af', fontSize: 12, lineHeight: 21, backgroundColor: '#4c152733', borderRadius: 10, padding: 12 }, success: { color: '#6ee7b7', fontSize: 12, lineHeight: 20 },
 button: { borderRadius: 12, overflow: 'hidden', minHeight: 48 }, buttonInner: { padding: 15, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: 'white', fontSize: 13, fontWeight: '800', textAlign: 'center' },
 metric: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#09051a' }, metricValue: { color: '#e9d5ff', fontSize: 21, fontWeight: '900' }, metricLabel: { color: '#bca8ef', fontSize: 10, marginTop: 5 },
 section: { color: '#f3edff', fontSize: 18, fontWeight: '800' }, slot: { width: '47%', flexGrow: 1, borderWidth: 1, borderColor: '#45325e', borderRadius: 12, padding: 8, minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
export function ActionButton({ title, onPress, busy = false, disabled = false, secondary = false }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={busy || disabled} onPress={onPress} style={({ pressed }) => [f.button, { opacity: disabled || busy ? .55 : pressed ? .75 : 1 }]}><LinearGradient colors={secondary ? ['#312049', '#221638'] : ['#7c3aed', '#a21caf']} style={f.buttonInner}>{busy ? <ActivityIndicator color="white" /> : <Text style={f.buttonText}>{title}</Text>}</LinearGradient></Pressable>;
}
