import {WatchScreen} from './src/watch/WatchScreen';
import {HeaderBalances} from './src/ui/HeaderBalances';
import {SystemAlertHost} from './src/ui/SystemAlert';
import {BrandBoot} from './src/ui/BrandBoot';
import {PresentationProvider,usePresentation} from './src/ui/PresentationProvider';
import {AudioProvider,useAppAudio} from './src/audio/AudioProvider';
import {CommunityScreen} from './src/community/CommunityScreen';
import {ChatProvider,useChat} from './src/chat/ChatProvider';
import {ChatScreen} from './src/chat/ChatScreen';
import {FeedScreen} from './src/social/FeedScreen';
import {StoryScreen} from './src/story/StoryScreen';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { AuthScreen } from './src/auth/AuthScreen';
import { ProfileScreen } from './src/profile/ProfileScreen';
import { EconomyProvider } from './src/collection/EconomyProvider';
import {ArenaScreen} from './src/arena/ArenaScreen';
import { CardsScreen, ShopScreen } from './src/collection/CollectionScreens';
import { ThemeAura } from './src/collection/ThemeAura';
import { AIProvider } from './src/ai/AIProvider';
import { SettingsScreen } from './src/settings/SettingsScreen';
import { AIProviderScreen } from './src/settings/AIProviderScreen';

type Route = 'Watch' | 'Profile' | 'Arena' | 'Feed' | 'Shop' | 'Cards' | 'Tracker' | 'Chat' | 'Adventure' | 'Settings' | 'AIProvider';
type Routes = Omit<Record<Route, undefined>,'Chat'|'Tracker'|'Feed'>&{Feed:{postId?:string}|undefined;Chat:{peerId?:string;senseiPostId?:string}|undefined;Tracker:{tab?:'tracker'|'news'|'missions'}|undefined};
type Icon = React.ComponentProps<typeof Ionicons>['name'];
const Stack = createNativeStackNavigator<Routes>();
const navigation = createNavigationContainerRef<Routes>();
const C = { bg: '#030014', panel: '#14112f', edge: '#30234d', text: '#f3edff', muted: '#bca8ef', violet: '#a78bfa', gold: '#ffd166', cyan: '#67e8f9' };
const cards: { name: string; rarity: string; art: ImageSourcePropType; color: string }[] = [
  { name: 'Gojo Satoru', rarity: 'LEGENDARY', art: require('./assets/cards/gojo.png'), color: C.gold },
  { name: 'Sukuna', rarity: 'LEGENDARY', art: require('./assets/cards/sukuna.png'), color: C.gold },
  { name: 'Izuku Midoriya', rarity: 'RARE', art: require('./assets/cards/deku.png'), color: C.violet },
  { name: 'Yuji Itadori', rarity: 'COMMON', art: require('./assets/cards/yuji.png'), color: C.cyan },
];
const more: { route: Route; icon: Icon; description: string }[] = [
  { route: 'Watch', icon: 'play-circle-outline', description: 'Your video player' },
  { route: 'Cards', icon: 'albums-outline', description: 'Your collection' },
  { route: 'Tracker', icon: 'tv-outline', description: 'Your anime journey' },
  { route: 'Chat', icon: 'chatbubbles-outline', description: 'Find your people' },
  { route: 'Adventure', icon: 'flame-outline', description: 'Enter the dungeon' },
  { route: 'Settings', icon: 'settings-outline', description: 'App & AI preferences' },
];
const primary: { route: Route; icon: Icon }[] = [
  { route: 'Profile', icon: 'person-outline' }, { route: 'Arena', icon: 'aperture-outline' },
  { route: 'Feed', icon: 'megaphone-outline' }, { route: 'Shop', icon: 'bag-handle-outline' },
];
function go(route: Route) { if (navigation.isReady()) navigation.navigate(route); }
function Profile() { return <ProfileScreen />; }

function openDM(peerId:string){if(navigation.isReady())navigation.navigate('Chat',{peerId});}
function Arena() { return <ArenaScreen onMessage={openDM}/>; }
function openCommunity(tab:'news'|'missions'){if(navigation.isReady())navigation.navigate('Tracker',{tab});}
function Feed() { return <FeedScreen onMessage={openDM} onSensei={postId=>{if(navigation.isReady())navigation.navigate('Chat',{senseiPostId:postId});}}/>; }
function Shop() { return <ShopScreen onCollection={()=>go('Cards')} />; }
function Cards() { return <CardsScreen />; }
function Tracker() { return <CommunityScreen/>; }
function Chat() { return <ChatScreen onAISettings={() => go('AIProvider')} onPost={postId=>{if(navigation.isReady())navigation.navigate('Feed',{postId});}}/>; }
function Settings() { return <SettingsScreen onAI={() => go('AIProvider')} onBack={() => navigation.canGoBack() ? navigation.goBack() : go('Profile')} />; }
function AISettings() { return <AIProviderScreen onBack={() => navigation.canGoBack() ? navigation.goBack() : go('Settings')} />; }
function Adventure(){return <StoryScreen/>;}
const pages: Record<Route, React.ComponentType> = { Watch: WatchScreen, Profile, Arena, Feed, Shop, Cards, Tracker, Chat, Adventure, Settings, AIProvider: AISettings };
function Screen({ route }: { route: { name: Route } }) {
  const insets=useSafeAreaInsets();
  const chat=useChat(),audio=useAppAudio(),presentation=usePresentation();const {width}=useWindowDimensions();
  const session = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const Page = pages[route.name];
  const moreSelected = more.some(item => item.route === route.name) || route.name === 'AIProvider';
  const clean=['Watch','Profile','Feed','Shop','Cards','Tracker','Chat'].includes(route.name);
  return <SafeAreaView style={r.safe} edges={['top','bottom']}><StatusBar style="light"/><KeyboardAvoidingView style={r.shell} behavior={route.name==='Chat'?(Platform.OS==='ios'?'padding':'height'):undefined} keyboardVerticalOffset={route.name==='Chat'?insets.top:0}>{!clean&&<ThemeAura/>}<View style={r.header}><Image source={require('./assets/brand/logo.png')} accessibilityLabel="AniGooD logo" style={{width:30,height:30,borderRadius:8}}/><Text accessibilityLabel="AniGooD" numberOfLines={1} adjustsFontSizeToFit style={r.brand}>AniGooD</Text><HeaderBalances xp={session.profile?.xp} gold={session.profile?.gold} gems={session.profile?.gems} compact={width<380} onPress={()=>setInfoOpen(true)}/><Pressable accessibilityRole="button" accessibilityLabel="Open app Settings" onPress={()=>go('Settings')} style={r.icon}><Ionicons name="settings-outline" size={23} color="#b0aab9"/></Pressable></View><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'&&route.name!=='Chat'?'padding':undefined}>{(['Watch','Chat','Feed','Shop','Cards','Tracker'].includes(route.name))?<Page/>:<ScrollView key={route.name} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={clean?r.clean:[s.content,width<360&&{padding:12}]}><Page/></ScrollView>}</KeyboardAvoidingView><View style={r.nav}>{primary.map(item=><Pressable key={item.route} accessibilityRole="tab" accessibilityLabel={item.route} accessibilityState={{selected:route.name===item.route}} onPress={()=>{audio.playSfx('click');go(item.route);}} style={r.navItem}><View style={[r.navIcon,route.name===item.route&&r.selected]}><Ionicons name={item.route==='Feed'?'newspaper-outline':item.icon} size={23} color={route.name===item.route?'#d6f896':'#817c89'}/></View><Text style={[r.navLabel,route.name===item.route&&{color:'#d6f896'}]}>{item.route}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel="More destinations" onPress={()=>setMoreOpen(true)} style={r.navItem}><View style={[r.navIcon,moreSelected&&r.selected]}><Ionicons name="ellipsis-horizontal" size={24} color={moreSelected?'#d6f896':'#817c89'}/></View><Text style={[r.navLabel,moreSelected&&{color:'#d6f896'}]}>More{chat.unread?` · ${chat.unread}`:''}</Text></Pressable></View></KeyboardAvoidingView><Modal visible={moreOpen} transparent animationType="none" onRequestClose={()=>setMoreOpen(false)}><Pressable accessibilityLabel="Close More menu" onPress={()=>setMoreOpen(false)} style={s.scrim}><Pressable style={r.menu} onPress={e=>e.stopPropagation()}><Text style={r.menuTitle}>Explore your world.</Text><ScrollView>{more.map(item=><Pressable key={item.route} accessibilityRole="button" onPress={()=>{setMoreOpen(false);go(item.route);}} style={r.destination}><Ionicons name={item.icon} size={23} color="#c3b1f7"/><View style={{flex:1}}><Text style={r.destinationTitle}>{item.route}</Text><Text style={r.destinationSub}>{item.description}</Text></View><Ionicons name="arrow-forward" size={18} color="#8f879c"/></Pressable>)}</ScrollView></Pressable></Pressable></Modal><Modal visible={infoOpen} transparent animationType="none" onRequestClose={()=>setInfoOpen(false)}><Pressable onPress={()=>setInfoOpen(false)} style={s.infoScrim}><View style={r.menu}><Text style={r.menuTitle}>Your balance</Text><View style={s.row}>{[[session.profile?.xp,'XP'],[session.profile?.gems,'GEMS'],[session.profile?.gold,'GOLD']].map(([v,k])=><View key={k} style={{flex:1,gap:8}}><Text style={{color:'#d6f896',fontSize:23}}>{v??'—'}</Text><Text style={r.destinationSub}>{k}</Text></View>)}</View><Pressable accessibilityRole="button" onPress={()=>setInfoOpen(false)} style={r.destination}><Text style={r.destinationTitle}>Close</Text></Pressable></View></Pressable></Modal></SafeAreaView>;

}
function AppNavigation({uid}:{uid:string}){const presentation=usePresentation();return <NavigationContainer key={uid} ref={navigation}><Stack.Navigator initialRouteName="Profile" screenOptions={{ headerShown: false, animation: presentation.reduced?'none':'fade', contentStyle: { backgroundColor: C.bg } }}>{(Object.keys(pages) as Route[]).map(name => <Stack.Screen key={name} name={name} component={Screen} />)}</Stack.Navigator></NavigationContainer>;}
function AppRoot() {
  const auth = useAuth();
  const [booting, setBooting] = useState(true);
  useEffect(() => { const id = setTimeout(() => setBooting(false), 1100); return () => clearTimeout(id); }, []);
  if (booting || !auth.ready) return <BrandBoot/>;
  if (!auth.user || auth.pendingEmail) return <AuthScreen />;
  return <PresentationProvider key={auth.user.uid} uid={auth.user.uid}><AudioProvider key={auth.user.uid} uid={auth.user.uid}><AIProvider key={auth.user.uid}><EconomyProvider key={auth.user.uid}><ChatProvider key={auth.user.uid}><AppNavigation uid={auth.user.uid}/></ChatProvider></EconomyProvider></AIProvider></AudioProvider></PresentationProvider>;
}
function AccountAlerts(){const auth=useAuth();return <SystemAlertHost key={auth.user?.uid||'signed-out'}/>;}
export default function App() { return <SafeAreaProvider><AuthProvider><AppRoot /><AccountAlerts/></AuthProvider></SafeAreaProvider>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, shell: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }, flex: { flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#241a39', backgroundColor: '#09051a' }, brandLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brand: { fontSize: 15, fontWeight: '900', letterSpacing: 1.2, color: C.text, flex: 1 }, infoButton: { padding: 10, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 }, testBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 }, testDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.violet }, testText: { fontSize: 8, fontWeight: '800', letterSpacing: .8, color: C.muted }, chips: { flexDirection: 'row',flexWrap:'wrap',flexShrink:1, gap: 5 }, chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#18102b' }, chipText: { fontSize: 10, fontWeight: '800' },
  content: { padding: 18, gap: 16, paddingBottom: 28 }, titleBlock: { gap: 8, paddingTop: 8, paddingBottom: 5 }, eyebrow: { fontSize: 9, letterSpacing: 1.8, color: C.violet, fontWeight: '800' }, pageTitle: { color: C.text, fontSize: 29, fontWeight: '900', letterSpacing: -.8, lineHeight: 35 }, description: { fontSize: 12, color: C.muted, lineHeight: 19 }, panel: { padding: 18, borderRadius: 18, borderWidth: 1, borderColor: C.edge, gap: 10 }, iconBubble: { width: 48, height: 48, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, avatar: { width: 67, height: 67, borderRadius: 24, borderWidth: 1, borderColor: '#9e72eb', alignItems: 'center', justifyContent: 'center' }, onlineDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#34d399', bottom: -2, right: 0, borderWidth: 3, borderColor: C.panel }, playerName: { color: C.text, fontSize: 18, fontWeight: '800', flex: 1 }, demoPill: { borderWidth: 1, borderColor: '#a78bfa44', borderRadius: 5, padding: 4 }, demoText: { fontSize: 7, fontWeight: '900', color: C.violet }, rank: { color: '#c4b5fd', fontSize: 11, fontWeight: '700', marginTop: 4 }, smallStrong: { color: C.text, fontSize: 11, fontWeight: '700' }, smallMuted: { color: C.muted, fontSize: 10, lineHeight: 16 }, progressTrack: { height: 6, backgroundColor: '#302143', borderRadius: 9 }, progressFill: { width: 0, height: 6, backgroundColor: C.violet }, statRow: { flexDirection: 'row', marginTop: 12, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#322343' }, stat: { flex: 1, alignItems: 'center', gap: 5 }, statValue: { fontSize: 23, fontWeight: '900' }, statLabel: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.3 }, footnote: { fontSize: 10, color: '#9585b7', textAlign: 'center', lineHeight: 18, marginTop: 4 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, sectionTitle: { fontSize: 17, color: C.text, fontWeight: '800' }, link: { color: C.violet, fontSize: 10, fontWeight: '800', paddingVertical: 12 }, cardRow: { flexDirection: 'row', gap: 12 }, card: { flex: 1, aspectRatio: .68, backgroundColor: '#100a23', borderWidth: 1, borderRadius: 15, overflow: 'hidden' }, cardImage: { width: '100%', height: '100%' }, cardCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 35, gap: 4 }, cardRarity: { fontSize: 7, letterSpacing: 1.2, fontWeight: '900' }, cardName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  featureTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 4 }, tag: { fontSize: 8, fontWeight: '800', letterSpacing: .7, marginTop: 3 }, buttonTouch: { borderRadius: 12, overflow: 'hidden' }, button: { minHeight: 48, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, buttonText: { color: '#fff', fontSize: 12, fontWeight: '800', flexShrink: 1 }, pressed: { opacity: .7 }, divider: { height: 1, backgroundColor: '#322343', marginVertical: 4 },
  wheel: { alignItems: 'center', paddingVertical: 20 }, wheelRing: { width: 178, height: 178, borderRadius: 89, borderWidth: 2, borderColor: '#7952b8', alignItems: 'center', justifyContent: 'center', backgroundColor: '#24123e' }, wheelWord: { position: 'absolute', color: '#fff', fontSize: 12, fontWeight: '900', backgroundColor: '#32135d', borderRadius: 22, padding: 12, overflow: 'hidden' }, centerTitle: { color: C.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }, centerDescription: { color: C.muted, fontSize: 12, textAlign: 'center' }, boxStage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 35 }, boxGlow: { width: 95, height: 12, backgroundColor: '#ffd16612', borderRadius: 50, marginTop: 12 }, pityRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 12, flexWrap: 'wrap' }, pity: { fontSize: 10, color: C.muted, borderWidth: 1, borderColor: C.edge, borderRadius: 8, padding: 9 },
  empty: { paddingVertical: 30, paddingHorizontal: 16, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#2c2045', borderStyle: 'dashed', borderRadius: 18 }, emptyTitle: { color: C.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }, emptyBody: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 22 }, adventureHero: { borderRadius: 18, borderWidth: 1, borderColor: '#57357c', padding: 24, alignItems: 'center' }, heroTitle: { color: C.text, fontSize: 25, lineHeight: 33, fontWeight: '900', textAlign: 'center' }, heroDescription: { fontSize: 11, color: C.muted, marginTop: 14 }, chapterTabs: { gap: 8 }, chapterTab: { paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: C.edge, borderRadius: 10 }, chapterActive: { backgroundColor: '#6d28d955', borderColor: '#a78bfa' }, chapterSelected: { color: '#e9d5ff', fontSize: 10, fontWeight: '800', lineHeight: 16 },
  nav: { flexDirection: 'row', paddingTop: 8, paddingBottom: 6, backgroundColor: '#0d081e', borderTopWidth: 1, borderTopColor: '#302044' }, navItem: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 5, minHeight: 57 }, navIcon: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12 }, navSelected: { backgroundColor: '#7c3aed33' }, navLabel: { color: '#877aab', fontSize: 9, fontWeight: '700' }, navLabelSelected: { color: '#ddd6fe' }, buildStamp: { color: '#6e5c8e', fontSize: 8, letterSpacing: 1.2, textAlign: 'center', marginTop: 8 },
  scrim: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }, sheet: { backgroundColor: '#100b24', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 38, borderWidth: 1, borderColor: '#44315f', width: '100%', maxWidth: 560, alignSelf: 'center' }, handle: { width: 36, height: 4, backgroundColor: '#62507c', borderRadius: 3, alignSelf: 'center', marginBottom: 15 }, moreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 18 }, moreItem: { width: '47%', flexGrow: 1, padding: 15, gap: 8, borderRadius: 15, borderWidth: 1, borderColor: '#322344', backgroundColor: '#1a1230' }, moreActive: { borderColor: C.violet }, moreTitle: { color: C.text, fontSize: 15, fontWeight: '800' }, infoScrim: { flex: 1, backgroundColor: '#000c', alignItems: 'center', justifyContent: 'center', padding: 24 }, infoCard: { padding: 24, backgroundColor: C.panel, borderRadius: 20, gap: 20, borderWidth: 1, borderColor: '#584077', width: '100%', maxWidth: 440 },
  boot: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 18 }, bootTitle: { color: '#ddd6fe', fontWeight: '900', fontSize: 21, letterSpacing: 2 },
});

const r=StyleSheet.create({safe:{flex:1,backgroundColor:'#101214'},shell:{flex:1,width:'100%',maxWidth:760,alignSelf:'center'},header:{minHeight:64,paddingHorizontal:10,gap:5,flexDirection:'row',alignItems:'center',backgroundColor:'#111315',borderBottomWidth:1,borderColor:'#2d2c33'},brand:{fontSize:21,fontWeight:'600',letterSpacing:-1,color:'#f4f2ed',flex:1},wallet:{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:8,paddingHorizontal:12,borderWidth:1,borderColor:'#3a363f',borderRadius:24},walletText:{fontSize:13,color:'#d6f896'},icon:{padding:10,minHeight:44,minWidth:44},clean:{width:'100%',maxWidth:600,alignSelf:'center',paddingBottom:15},nav:{flexDirection:'row',borderTopWidth:1,borderColor:'#302e35',backgroundColor:'#111315',paddingTop:6,paddingBottom:8},navItem:{flex:1,alignItems:'center',gap:4,minHeight:53,justifyContent:'center'},navIcon:{paddingVertical:4,paddingHorizontal:10,borderRadius:11},selected:{backgroundColor:'#d6f8960d',borderWidth:1,borderColor:'#d6f89622'},navLabel:{fontSize:9,color:'#8d8795'},menu:{maxHeight:'80%',padding:23,gap:15,backgroundColor:'#1b1d23',width:'100%',maxWidth:560,alignSelf:'center',borderRadius:24,borderWidth:1,borderColor:'#45404d'},menuTitle:{fontSize:23,color:'#f4f2ed',fontWeight:'600',letterSpacing:-.6},destination:{flexDirection:'row',gap:15,paddingVertical:16,alignItems:'center',borderBottomWidth:1,borderColor:'#343039'},destinationTitle:{fontSize:15,color:'#eee8f2'},destinationSub:{fontSize:10,color:'#97909f',marginTop:4}});
