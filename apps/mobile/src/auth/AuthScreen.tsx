import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './AuthProvider';
import { f, ActionButton } from '../ui/forms';

export function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState('');
  const [visible, setVisible] = useState(false), [validation, setValidation] = useState('');
  const linking = !!auth.pendingEmail;
  const submit = () => {
    setValidation('');
    const address = linking ? auth.pendingEmail : email.trim();
    if (!address || !password) { setValidation('Email ও password লিখো।'); return; }
    if (mode === 'signup' && !linking && password.length < 6) { setValidation('Password অন্তত ৬ অক্ষরের হতে হবে।'); return; }
    if (mode === 'signup' && !linking) void auth.signup(address, password, name);
    else void auth.login(address, password);
  };
  return <SafeAreaView style={f.page}><StatusBar style="light" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[f.content, { flexGrow: 1, justifyContent: 'center' }]}>
    <Text style={f.eyebrow}>ANIME META HUB · AUTH TEST 0.3.1</Text>
    <Text accessibilityRole="header" style={f.title}>{linking ? 'Connect your account.' : mode === 'login' ? 'Welcome back, hunter.' : 'Your story starts here.'}</Text>
    <Text style={f.body}>{linking ? 'একই email-এর existing password দিয়ে login করলে Google credential link করা হবে। আলাদা account merge করা হবে না।' : 'পুরোনো Firebase account দিয়ে login করতে পারবে। নতুন account-এর balance শুরু হবে শূন্য থেকে।'}</Text>
    <View style={f.panel}>
      {mode === 'signup' && !linking && <><Text style={f.label}>Username (optional)</Text><TextInput style={f.input} placeholder="Your hunter name" placeholderTextColor="#7e6b9b" value={name} onChangeText={setName} editable={!auth.busy} autoCapitalize="words" /></>}
      <Text style={f.label}>Email</Text><TextInput accessibilityLabel="Email" style={f.input} value={linking ? auth.pendingEmail : email} onChangeText={setEmail} editable={!auth.busy && !linking} placeholder="you@example.com" placeholderTextColor="#7e6b9b" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
      <Text style={f.label}>Password</Text><TextInput accessibilityLabel="Password" style={f.input} value={password} onChangeText={setPassword} editable={!auth.busy} secureTextEntry={!visible} placeholder="At least 6 characters" placeholderTextColor="#7e6b9b" autoCapitalize="none" autoCorrect={false} textContentType={mode === 'signup' ? 'newPassword' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} onSubmitEditing={submit} />
      <Pressable accessibilityRole="button" onPress={() => setVisible(v => !v)}><Text style={f.link}>{visible ? 'Hide password' : 'Show password'}</Text></Pressable>
      {(validation || auth.error) ? <Text accessibilityRole="alert" style={f.error}>{validation || auth.error}</Text> : null}
      <ActionButton busy={auth.busy} title={linking ? 'Login & securely link Google' : mode === 'login' ? 'Login with email' : 'Create account'} onPress={submit} />
      {!linking && <><Text style={[f.body, { textAlign: 'center' }]}>— or continue with —</Text><ActionButton secondary disabled={auth.busy} title="Google" onPress={() => void auth.google()} /></>}
      <Pressable accessibilityRole="button" disabled={auth.busy} onPress={() => { setValidation(''); setPassword(''); if (linking) void auth.cancelLink(); else setMode(m => m === 'login' ? 'signup' : 'login'); }}><Text style={[f.link, { textAlign: 'center' }]}>{linking ? 'Cancel linking' : mode === 'login' ? 'New here? Create an account' : 'Already have an account? Login'}</Text></Pressable>
    </View>
    <Text style={f.body}>এটি ধাপ ২-এর test build। Login/Profile বাস্তব Firebase ব্যবহার করে। Gacha, rewards, chat ও battle এখনো preview। Password app-এর নিজস্ব storage বা logs-এ রাখা হয় না।</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
