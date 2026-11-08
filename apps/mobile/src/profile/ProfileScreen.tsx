import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, putFile, getDownloadURL, deleteObject } from '@react-native-firebase/storage';
import { getAuth } from '@react-native-firebase/auth';
import { useAuth } from '../auth/AuthProvider';
import { avatarPresets, badge, errorMessage, levelInfo, storyPower } from '../domain/profile';
import { Avatar } from '../ui/Avatar';
import { f, ActionButton } from '../ui/forms';

export function ProfileScreen() {
  const auth = useAuth(), p = auth.profile;
  const [editing, setEditing] = useState(false), [name, setName] = useState(''), [bio, setBio] = useState('');
  const [message, setMessage] = useState(''), [uploading, setUploading] = useState(false);
  useEffect(() => { if (p && !editing) { setName(p.username); setBio(p.Bio); } }, [p?.username, p?.Bio, editing]);
  if (!p) return <View style={f.panel}><Text style={f.title}>Your profile</Text>{auth.profileLoading && <ActivityIndicator color="#c4b5fd" />}<Text style={f.body}>{auth.profileError || 'Firebase profile পড়া হচ্ছে…'}</Text><ActionButton title="Retry profile" onPress={auth.retry} /><ActionButton secondary title="Sign out" busy={auth.busy} onPress={() => void auth.logout()} /></View>;
  const lv = levelInfo(p.xp), power = storyPower(p), label = badge(p.gems);
  const upload = async () => {
    if (uploading || auth.busy) return;
    const uid = auth.user?.uid; if (!uid) return;
    setMessage('');
    let object: ReturnType<typeof ref> | null = null;
    setUploading(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setMessage('Gallery permission প্রয়োজন। Settings থেকে অনুমতি দিয়ে আবার চেষ্টা করো।'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) { setMessage('Profile image সর্বোচ্চ ২ MB হতে পারে। ছোট ছবি বেছে নাও।'); return; }
      const image = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 512 } }], { compress: .7, format: ImageManipulator.SaveFormat.JPEG });
      if (getAuth().currentUser?.uid !== uid) return;
      object = ref(getStorage(), `avatars/${uid}/${Date.now()}.jpg`);
      await putFile(object, image.uri, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(object);
      if (getAuth().currentUser?.uid !== uid || !await auth.setAvatar(url)) { await deleteObject(object).catch(() => {}); return; }
      setMessage('Profile picture saved.');
    } catch (error) { if (object) await deleteObject(object).catch(() => {}); setMessage(errorMessage(error)); }
    finally { setUploading(false); }
  };
  return <>
    <Text style={f.eyebrow}>PLAYER DASHBOARD · LIVE FIREBASE PROFILE</Text><Text style={f.title}>Your power awakens.</Text>
    <View style={f.panel}><View style={f.row}><Avatar key={p.avatar} uri={p.avatar} /><View style={{ flex: 1 }}><Text style={f.section}>{p.username}</Text><Text style={f.body}>{lv.title}</Text>{!!label && <Text style={f.body}>{label}</Text>}<Text style={f.body}>Level {lv.level} · {p.xp} XP</Text></View></View>
      <Text style={f.body}>{auth.user?.email}</Text><Text style={f.body}>{lv.level === 100 ? 'MAX LEVEL' : `${lv.into} / ${lv.next} XP to next level`}</Text>
      <View style={{ height: 7, borderRadius: 8, backgroundColor: '#352343', overflow: 'hidden' }}><View style={{ height: 7, backgroundColor: '#a78bfa', width: `${lv.level === 100 ? 100 : Math.min(100, lv.into / lv.next * 100)}%` }} /></View>
      <View style={f.row}>{[[p.xp, 'XP'], [p.gems, 'GEMS'], [p.gold, 'GOLD']].map(([value, title]) => <View key={title} style={f.metric}><Text style={f.metricValue}>{value}</Text><Text style={f.metricLabel}>{title}</Text></View>)}</View>
      <Text style={f.body}>{p.Bio || 'No bio yet.'}</Text><ActionButton secondary title={editing ? 'Cancel editing' : 'Edit username & bio'} disabled={auth.busy || uploading} onPress={() => { setEditing(!editing); setName(p.username); setBio(p.Bio); setMessage(''); }} />
      {editing && <><Text style={f.label}>Username</Text><TextInput style={f.input} value={name} onChangeText={setName} editable={!auth.busy} /><Text style={f.label}>Bio</Text><TextInput style={[f.input, { minHeight: 85, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} editable={!auth.busy} multiline /><ActionButton title="Save profile" busy={auth.busy} onPress={() => { void auth.save(name, bio).then(ok => { if (ok) { setEditing(false); setMessage('Profile saved.'); } }); }} /></>}
    </View>
    <View style={f.panel}><Text style={f.section}>Profile picture</Text><View style={f.wrap}>{avatarPresets.map((uri, i) => <Pressable key={uri} accessibilityRole="button" accessibilityLabel={`Choose avatar ${i + 1}`} disabled={uploading || auth.busy} onPress={() => void auth.setAvatar(uri).then(ok => { if (ok) setMessage('Avatar saved.'); })} style={{ borderWidth: 2, borderColor: uri === p.avatar ? '#c4b5fd' : 'transparent', borderRadius: 18, padding: 2 }}><Avatar uri={uri} size={46} /></Pressable>)}</View><ActionButton secondary title="Upload from gallery · max 2 MB" busy={uploading} disabled={auth.busy} onPress={() => void upload()} /><Text style={f.body}>Gallery ছবি Firebase Storage-এ যাবে। Permission/billing বাধা থাকলে error দেখাবে; preset avatar ব্যবহার করতে পারবে।</Text></View>
    {!!auth.error && <Text accessibilityRole="alert" style={f.error}>{auth.error}</Text>}{!!message && <Text style={f.success}>{message}</Text>}
    <View style={f.panel}><Text style={f.section}>Story Mode Power</Text><Text style={f.body}>HP {power.hp} · ATK {power.atk} · DEF {power.def}</Text><Text style={f.body}>Permanent: +{p.permBonusAtk}% ATK / +{p.permBonusHp}% HP / +{p.permBonusDef}% DEF</Text></View>
    <View style={f.panel}><Text style={f.section}>Featured cards</Text><View style={f.wrap}>{['legendary-1', 'legendary-2', 'rare-1', 'rare-2', 'common-1', 'common-2'].map(slot => { const card = p.equippedSlots[slot]; return <View key={slot} style={f.slot}><Text style={f.eyebrow}>{slot}</Text>{card?.image && <Image source={{ uri: card.image }} resizeMode="contain" style={{ width: '100%', height: 150 }} />}<Text style={f.body}>{card?.name || 'Empty slot'}</Text></View>; })}</View><Text style={f.body}>পুরোনো equipped cards দেখানো হচ্ছে। Equip/recycle পরের ধাপে। Inventory: {p.inventoryCards.length} cards.</Text></View>
    <View style={f.panel}><Text style={f.section}>Account</Text><Text style={f.body}>Linked: {auth.user?.providerData.map(provider => provider.providerId).join(', ') || '—'}</Text>{!auth.user?.providerData.some(provider => provider.providerId === 'google.com') && <ActionButton secondary title="Link Google to this account" busy={auth.busy} onPress={() => Alert.alert('Link Google?', 'এই signed-in account-এ নির্বাচিত Google credential যোগ হবে। অন্য Firebase account merge করা হবে না।', [{ text: 'Cancel' }, { text: 'Continue', onPress: () => void auth.google() }])} />}<ActionButton secondary title="Sign out" busy={auth.busy} disabled={uploading} onPress={() => Alert.alert('Sign out?', 'তোমার saved profile থাকবে।', [{ text: 'Cancel' }, { text: 'Sign out', onPress: () => void auth.logout() }])} /></View>
    <Text style={f.body}>Auth/Profile test v0.2.0 · Currency read-only. Daily rewards, purchases ও gameplay এই build-এ চালু নয়।</Text>
  </>;
}
