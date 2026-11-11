import React, { useEffect, useState } from 'react';
import { Alert, Image, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { GeminiScreen } from './src/ai/GeminiScreen';
import { AIProvider } from './src/ai/AIProvider';
import { SettingsScreen } from './src/settings/SettingsScreen';
import { AIProviderScreen } from './src/settings/AIProviderScreen';

type Route = 'Profile' | 'Arena' | 'Feed' | 'Shop' | 'Cards' | 'Tracker' | 'Chat' | 'Adventure' | 'Settings' | 'AIProvider';
type Routes = Record<Route, undefined>;
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
const notice = () => Alert.alert('পরের ধাপে আসছে', 'এটি Step04 Arena Test v0.5.2। Login/Profile বাস্তব Firebase-এ save হয়। Collection/Shop actions-এর জন্য trusted backend setup প্রয়োজন। এই অন্য feature এখনো চালু হয়নি।');
function go(route: Route) { if (navigation.isReady()) navigation.navigate(route); }
function IconBubble({ icon, color = C.violet }: { icon: Icon; color?: string }) {
  return <View style={[s.iconBubble, { borderColor: `${color}44`, backgroundColor: `${color}12` }]}><Ionicons name={icon} color={color} size={24} /></View>;
}
function Panel({ children }: { children: React.ReactNode }) {
  return <LinearGradient colors={['#181233', '#100c25']} style={s.panel}>{children}</LinearGradient>;
}
function Title({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <View style={s.titleBlock}><Text style={s.eyebrow}>{eyebrow}</Text><Text accessibilityRole="header" style={s.pageTitle}>{title}</Text><Text style={s.description}>{description}</Text></View>;
}
function Button({ label, onPress = notice, icon = 'arrow-forward' }: { label: string; onPress?: () => void; icon?: Icon }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.buttonTouch, pressed && s.pressed]}><LinearGradient colors={['#7c3aed', '#a21caf']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.button}><Text style={s.buttonText}>{label}</Text><Ionicons name={icon} size={18} color="white" /></LinearGradient></Pressable>;
}
function Feature({ icon, title, body, tag, color = C.violet, onPress = notice }: { icon: Icon; title: string; body: string; tag?: string; color?: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && s.pressed}><Panel><View style={s.row}><IconBubble icon={icon} color={color} /><View style={s.flex}><Text style={s.featureTitle}>{title}</Text><Text style={s.description}>{body}</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted} /></View>{tag && <Text style={[s.tag, { color }]}>{tag}</Text>}</Panel></Pressable>;
}
function CardArt({ card }: { card: typeof cards[number] }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${card.name}, ${card.rarity}, sample card`} onPress={notice} style={[s.card, { borderColor: `${card.color}99` }]}><Image source={card.art} style={s.cardImage} resizeMode="contain" /><LinearGradient colors={['transparent', '#090417']} style={s.cardCaption}><Text style={[s.cardRarity, { color: card.color }]}>{card.rarity}</Text><Text style={s.cardName}>{card.name}</Text></LinearGradient></Pressable>;
}
function Profile() { return <ProfileScreen />; }

function Arena() { return <ArenaScreen />; }
function Feed() {
  return <><Title eyebrow="THE ANIME COMMUNITY" title="Your world. Connected." description="Share a moment. Discover a new obsession." /><Panel><View style={s.row}><IconBubble icon="create-outline" /><Text style={[s.description, s.flex]}>What’s on your anime mind?</Text></View><View style={s.divider} /><View style={s.row}><Text style={s.smallMuted}>Photo  ·  Video  ·  Link</Text><Pressable accessibilityRole="button" onPress={notice}><Text style={s.link}>Create post →</Text></Pressable></View></Panel><Feature icon="newspaper-outline" title="Anime News Hub" body="Discover airing anime and earn reading XP." color={C.cyan} /><Empty icon="planet-outline" title="A new community awaits" body="এই build-এ live feed নেই। Post, reactions, comments ও media পরের ধাপে যুক্ত হবে।" /></>;
}
function Shop() { return <ShopScreen />; }
function Cards() { return <CardsScreen />; }
function Tracker() {
  return <><Title eyebrow="ONE EPISODE AT A TIME" title="Keep your story going." description="Your personal anime watchlist." /><Button label="Add anime · Coming next" icon="add" /><Empty icon="tv-outline" title="Your watchlist is a blank canvas" body="Anime যোগ করা, episode progress ও save system পরের ধাপে যুক্ত হবে।" /></>;
}
function Chat() { return <GeminiScreen onSettings={() => go('AIProvider')} />; }
function Settings() { return <SettingsScreen onAI={() => go('AIProvider')} onBack={() => navigation.canGoBack() ? navigation.goBack() : go('Profile')} />; }
function AISettings() { return <AIProviderScreen onBack={() => navigation.canGoBack() ? navigation.goBack() : go('Settings')} />; }
function Adventure() {
  const [chapter, setChapter] = useState(1);
  const titles = ['The Dungeon Awakens', 'The Knight Baran', 'The Red Gate — Igris', 'The High Orc King Tusk', 'The Ant King Beru'];
  return <><Title eyebrow="SOLO LEVELING · STORY MODE" title="Arise, hunter." description="Five chapters. An army waiting in the shadows." /><LinearGradient colors={['#251349', '#0d0a21']} style={s.adventureHero}><Text style={s.eyebrow}>THE SYSTEM HAS CHOSEN YOU</Text><Ionicons name="flame" size={76} color={C.violet} style={{ marginVertical: 22 }} /><Text style={s.heroTitle}>From the weakest…{`\n`}to the Shadow Monarch.</Text><Text style={s.heroDescription}>A first look at your next adventure.</Text></LinearGradient><Text style={s.sectionTitle}>Explore the chapters</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chapterTabs}>{titles.map((_, i) => <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: chapter === i + 1 }} onPress={() => setChapter(i + 1)} style={[s.chapterTab, chapter === i + 1 && s.chapterActive]}><Text style={chapter === i + 1 ? s.chapterSelected : s.smallMuted}>CH {i + 1}</Text></Pressable>)}</ScrollView><Panel><Text style={s.eyebrow}>CHAPTER {chapter} · PREVIEW</Text><Text style={s.featureTitle}>{titles[chapter - 1]}</Text><Text style={s.description}>Requires Level 3 + 3 owned cards when gameplay launches.</Text><View style={s.divider} /><Button label="Enter dungeon · Coming next" icon="arrow-forward" /></Panel><Text style={s.footnote}>Combat, Bengali dialogues, rewards এবং ARISE এই build-এ চালু নয়।</Text></>;
}
function Empty({ icon, title, body }: { icon: Icon; title: string; body: string }) {
  return <View style={s.empty}><IconBubble icon={icon} /><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyBody}>{body}</Text></View>;
}
const pages: Record<Route, React.ComponentType> = { Profile, Arena, Feed, Shop, Cards, Tracker, Chat, Adventure, Settings, AIProvider: AISettings };
function Screen({ route }: { route: { name: Route } }) {
  const session = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const Page = pages[route.name];
  const moreSelected = more.some(item => item.route === route.name) || route.name === 'AIProvider';
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}><StatusBar style="light" /><View style={s.shell}><ThemeAura /><View style={s.header}><View style={s.brandLine}><Ionicons name="flash" size={18} color={C.violet} /><Text style={s.brand}>ANIME META HUB</Text><Pressable accessibilityRole="button" accessibilityLabel="Open app Settings" onPress={() => go('Settings')} style={s.infoButton}><Ionicons name="settings-outline" size={21} color={C.muted} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="About this test build" onPress={() => setInfoOpen(true)} style={s.infoButton}><Ionicons name="information-circle-outline" size={21} color={C.muted} /></Pressable></View><View style={s.currencyRow}><View style={s.testBadge}><View style={s.testDot} /><Text style={s.testText}>STEP 04 / ARENA</Text></View><View style={s.chips}>{[[`${session.profile?.xp ?? '—'} XP`, C.violet], [`◆ ${session.profile?.gems ?? '—'}`, C.cyan], [`● ${session.profile?.gold ?? '—'}`, C.gold]].map(([value, color]) => <View key={color} style={[s.chip, { borderColor: `${color}44` }]}><Text style={[s.chipText, { color }]}>{value}</Text></View>)}</View></View></View><View style={{flex:1}}>{route.name === 'Chat' ? <Page /> : <ScrollView key={route.name} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}><Page /><Text style={s.buildStamp}>ANIME META HUB  /  v0.5.2  /  STEP 03</Text></ScrollView>}</View><View style={s.nav}>{primary.map(item => <Pressable key={item.route} accessibilityRole="tab" accessibilityState={{ selected: route.name === item.route }} onPress={() => go(item.route)} style={s.navItem}><View style={[s.navIcon, route.name === item.route && s.navSelected]}><Ionicons name={item.icon} size={22} color={route.name === item.route ? '#ddd6fe' : '#877aab'} /></View><Text style={[s.navLabel, route.name === item.route && s.navLabelSelected]}>{item.route}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel="More destinations" onPress={() => setMoreOpen(true)} style={s.navItem}><View style={[s.navIcon, moreSelected && s.navSelected]}><Ionicons name="ellipsis-horizontal" size={24} color={moreSelected ? '#ddd6fe' : '#877aab'} /></View><Text style={[s.navLabel, moreSelected && s.navLabelSelected]}>More</Text></Pressable></View></View><Modal visible={moreOpen} transparent animationType="slide" onRequestClose={() => setMoreOpen(false)}><Pressable accessibilityLabel="Close More menu" onPress={() => setMoreOpen(false)} style={s.scrim}><Pressable style={s.sheet} onPress={event => event.stopPropagation()}><View style={s.handle} /><View style={s.row}><Text style={s.sectionTitle}>Explore your hub</Text><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setMoreOpen(false)} style={s.infoButton}><Ionicons name="close" size={22} color={C.text} /></Pressable></View><View style={s.moreGrid}>{more.map(item => <Pressable key={item.route} accessibilityRole="button" onPress={() => { setMoreOpen(false); go(item.route); }} style={[s.moreItem, route.name === item.route && s.moreActive]}><IconBubble icon={item.icon} /><Text style={s.moreTitle}>{item.route}</Text><Text style={s.smallMuted}>{item.description}</Text></Pressable>)}</View><Text style={s.footnote}>STEP 03 · STEP 04 / ARENA</Text></Pressable></Pressable></Modal><Modal visible={infoOpen} transparent animationType="fade" onRequestClose={() => setInfoOpen(false)}><View style={s.infoScrim}><View style={s.infoCard}><IconBubble icon="construct-outline" /><Text style={s.emptyTitle}>Step04 Arena Test · v0.5.2</Text><Text style={s.emptyBody}>এটি তৃতীয় ধাপের Collection/Shop test app।{`\n\n`}সব screen ঘুরে দেখো, More menu ও Android Back পরীক্ষা করো।{`\n\n`}Login, profile, collection ও header balance বাস্তব Firebase account থেকে আসে। Shop/Equip/Recycle commands শুধুমাত্র configured trusted backend দিয়ে চলে; setup না থাকলে disabled। Gemini Sensei Chat screen-এ নিজের key দিয়ে চলে। DM/combat/rewards preview। Gallery upload স্থগিত।</Text><Button label="বুঝেছি" icon="checkmark" onPress={() => setInfoOpen(false)} /></View></View></Modal></SafeAreaView>;
}
function AppRoot() {
  const auth = useAuth();
  const [booting, setBooting] = useState(true);
  useEffect(() => { const id = setTimeout(() => setBooting(false), 1100); return () => clearTimeout(id); }, []);
  if (booting || !auth.ready) return <View style={s.boot}><StatusBar style="light" /><IconBubble icon="flash" /><Text style={s.bootTitle}>SYSTEM REBOOTING</Text><Text style={s.description}>Extracting Shadow Files... ⚡</Text><Text style={s.buildStamp}>STEP 04 / ARENA · v0.5.2</Text></View>;
  if (!auth.user || auth.pendingEmail) return <AuthScreen />;
  return <AIProvider key={auth.user.uid}><EconomyProvider key={auth.user.uid}><NavigationContainer key={auth.user.uid} ref={navigation}><Stack.Navigator initialRouteName="Profile" screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: C.bg } }}>{(Object.keys(pages) as Route[]).map(name => <Stack.Screen key={name} name={name} component={Screen} />)}</Stack.Navigator></NavigationContainer></EconomyProvider></AIProvider>;
}
export default function App() { return <SafeAreaProvider><AuthProvider><AppRoot /></AuthProvider></SafeAreaProvider>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, shell: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }, flex: { flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#241a39', backgroundColor: '#09051a' }, brandLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brand: { fontSize: 15, fontWeight: '900', letterSpacing: 1.2, color: C.text, flex: 1 }, infoButton: { padding: 10, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 }, testBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 }, testDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.violet }, testText: { fontSize: 8, fontWeight: '800', letterSpacing: .8, color: C.muted }, chips: { flexDirection: 'row', gap: 5 }, chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#18102b' }, chipText: { fontSize: 10, fontWeight: '800' },
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
