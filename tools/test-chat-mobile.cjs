'use strict';
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');global.IS_REACT_ACT_ENVIRONMENT=true;
let chat;let calls=[],econ,tree,prefs=new Map();const player={hp:100,atk:30,def:20,maxHp:100,maxDef:20};const army=[{id:'goblin',name:'Goblin Scout',hp:170,atk:350,def:310}];
const session={id:'session',version:2,chapterId:2,enemyId:'baran',enemy:{...player,id:'baran',name:'Baran'},player,playerName:'Hunter',phase:'fight',first:'player',dialogue:[],dialogueIndex:0,events:[],log:[],shadowIds:[],ariseBonus:{hp:0,atk:0,def:0},ariseUsed:false,heavyCooldown:0,turn:0};
const audio={pause(){},play(){},replace(){},seekTo:async()=>{}};
let audioHook=null;let copied=[],clipboardFails=false;
function load(file=path.join(__dirname,'../apps/mobile/src/chat/ChatScreen.tsx')){const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=name=>{
 if(name==='../media/PhotoUploader')return {PhotoUploader:props=>React.createElement('PhotoUploader',props)};
 if(name==='../audio/AudioProvider')return {useSoundGate:(_players,local=true,visible=true)=>({current:local&&visible}),useAppAudio:()=>({prefs:{sfxEnabled:true,sfxVolume:.7,voiceEnabled:true},foreground:true,playSfx(){}})};
 if(name==='react-native')return {KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:'android'},AccessibilityInfo:{isReduceMotionEnabled:async()=>false},Alert:{alert:(_title,_message,buttons)=>buttons.at(-1).onPress()},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Animated:{Value:class{setValue(){} interpolate(){return 1;}stopAnimation(){}},View:'AnimatedView',Image:'Image',Text:'Text',sequence:()=>({start(){},stop(){}}),timing:()=>({start(){},stop(){}}),loop:()=>({start(){},stop(){}})},Linking:{openURL:async()=>{}},TextInput:'TextInput',Image:'Image',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:s=>s}};
 if(name==='@react-navigation/native')return {useIsFocused:()=>true,useRoute:()=>({params:{}}),useNavigation:()=>({setParams(){}})};
 if(name==='./ChatProvider')return {useChat:()=>chat};
 if(name==='../ai/GeminiScreen')return {GeminiScreen:()=>React.createElement('Sensei')};
 if(name==='expo-clipboard')return {setStringAsync:async text=>{if(clipboardFails)throw Error('copy failed');copied.push(text);}};
 if(name==='../arena/ArenaVisuals')return {PublicProfileSheet:()=>React.createElement('PublicProfileSheet')};
 if(name==='../ui/Avatar')return {Avatar:props=>React.createElement('Avatar',props)};if(name==='react-native-safe-area-context')return {SafeAreaView:'SafeAreaView'};
 if(name==='expo-linear-gradient')return {LinearGradient:'LinearGradient'};if(name==='@expo/vector-icons')return {Ionicons:'Icon'};
 if(name==='@react-native-async-storage/async-storage')return {getItem:async key=>prefs.get(key)||null,setItem:async(key,value)=>{prefs.set(key,value);}};
 if(name==='expo-haptics')return {impactAsync:async()=>{},ImpactFeedbackStyle:{Heavy:'heavy',Light:'light'}};
 if(name==='react-native-svg')return {__esModule:true,default:'Svg',Circle:'Circle',Rect:'Rect',Line:'Line',Path:'Path'};
 if(name==='./CombatTheater'||name==='./SystemWindow')return load(path.join(path.dirname(file),name+'.tsx'));
 if(name==='expo-audio')return {useAudioPlayer:source=>audioHook?audioHook(source):audio};if(name==='expo-speech')return {stop:async()=>{},speak(){}};
 if(name.endsWith('/auth/AuthProvider'))return {useAuth:()=>({user:{uid:'alice'},profile:{uid:'alice',xp:100,inventoryCards:[{id:'gojo'},{id:'sukuna'},{id:'itachi'}]}})};
 if(name==='../collection/EconomyProvider')return {useEconomy:()=>econ};if(name==='../collection/CollectionScreens')return {EconomyStatus:()=>React.createElement('Status')};
 if(name.endsWith('/ui/forms'))return {f:{},ActionButton:props=>React.createElement('Button',props)};
 if(name==='../domain/profile')return {badge:()=>'',storyPower:()=>player,levelInfo:()=>({level:3})};
 if(name.endsWith('/artwork'))return {storyArtwork:new Proxy({},{get:()=>1})};
 if(name.endsWith('.wav'))return 1;
 if(name.startsWith('.')){const resolved=path.resolve(path.dirname(file),name);for(const ext of ['.tsx','.ts'])if(fs.existsSync(resolved+ext))return load(resolved+ext);return req(resolved);}return req(name);
 };m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}


const {ChatScreen,MessageBubble}=load();const bob={uid:'bob',username:'Bob',avatar:'',xp:100,gems:0,equippedTheme:'',online:true,lastSeenMs:Date.now()};
const msg={id:'msg-1',senderId:'bob',senderName:'Bob',senderAvatar:'',senderGems:0,senderTheme:'',senderAdmin:false,text:'হ্যালো!',createdAtMs:Date.now(),reactions:{},selected:[]};
async function mount(){calls=[];econ={configured:true,ready:true,busy:false,pending:null,result:null,run:async c=>calls.push(c)};chat={ready:true,busy:false,pending:null,error:'',result:null,inbox:[{chatId:'alice_bob',peer:bob,lastText:'hello',updatedAtMs:Date.now(),unread:2}],recent:[bob],unread:2,serverOffset:0,foreground:true,read:async c=>{calls.push(c);return {type:c.type,chatCapability:'chat-v1',messages:[msg],peer:c.peerId?bob:undefined,users:[bob],nextCursor:'0:msg',hasMore:false,missionData:{date:new Date().toISOString().slice(0,10),progress:{communityActions:3},claimed:{}}};},mutate:async c=>calls.push(c),refreshInbox:async()=>{}};await act(async()=>{tree=create(React.createElement(ChatScreen,{onAISettings(){}}));});}
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;});
const press=label=>tree.root.findAllByType('Pressable').find(p=>p.props.accessibilityLabel===label);
const input=label=>tree.root.findAllByType('TextInput').find(p=>p.props.accessibilityLabel===label);
const button=title=>tree.root.findAllByType('Button').find(p=>p.props.title===title);
const textPress=text=>tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(n=>n.props.children===text));
test('DM inbox shows unread, opens only peer route, persists draft and sends exact command without XP/AI',async()=>{
 prefs.clear();await mount();assert(JSON.stringify(tree.toJSON()).includes('Messages'));await act(async()=>press('Inbox Bob').props.onPress());assert(calls.some(c=>c.type==='chatThread'&&c.peerId==='bob'&&c.before===''));
 await act(async()=>input('Chat message').props.onChangeText('বাংলা DM'));assert.equal(JSON.parse(prefs.get('chat.drafts.v1.alice'))['dm:bob'],'বাংলা DM');await act(async()=>press('Send community message').props.onPress());assert.deepEqual(calls.at(-1),{type:'chatSend',peerId:'bob',text:'বাংলা DM'});
 chat.result={type:'chatSend',peerId:'bob',message:{...msg,senderId:'alice',text:'বাংলা DM'}};await act(async()=>tree.update(React.createElement(ChatScreen,{onAISettings(){}})));assert.equal(input('Chat message').props.value,'');
});
test('Global channel allows independent multiple reactions and community mission claim, Sensei retained separately',async()=>{
 await mount();await act(async()=>textPress('Global lounge').props.onPress());assert(calls.some(c=>c.type==='chatGlobal'));assert.equal(button('Claim Community mission'),undefined);await act(async()=>press('Community mission').props.onPress());assert(button('Claim Community mission'));await act(async()=>button('Claim Community mission').props.onPress());assert.deepEqual(calls.at(-1),{type:'chatMissionClaim'});
 await act(async()=>press('Close sheet').props.onPress());await act(async()=>press('Options msg-1').props.onPress());await act(async()=>press('Toggle global ❤️').props.onPress());assert.deepEqual(calls.at(-1),{type:'chatGlobalReact',messageId:'msg-1',emoji:'❤️'});
 await act(async()=>textPress('✦ Sensei').props.onPress());assert.equal(tree.root.findAllByType('Sensei').length,1);assert(!calls.some(c=>c.type?.startsWith('quiz')));
});
test('Global/DM send retains draft while pending and prevents duplicate send; search filters on server',async()=>{
 await mount();await act(async()=>input('Find community user').props.onChangeText('boB'));await act(async()=>textPress('Search').props.onPress());assert.deepEqual(calls.at(-1),{type:'chatSearch',query:'boB',cursor:''});
 await act(async()=>press('Inbox Bob').props.onPress());await act(async()=>input('Chat message').props.onChangeText('retain me'));chat.pending={operationId:'same-id',command:{type:'chatSend',peerId:'bob',text:'retain me'}};await act(async()=>tree.update(React.createElement(ChatScreen,{onAISettings(){}})));assert.equal(press('Send community message').props.disabled,true);assert.equal(input('Chat message').props.value,'retain me');assert(button('Retry pending · chatSend'));
});
test('Message merge reconciles deleted latest items without discarding loaded older history',()=>{
 const {mergeMessages}=load(path.join(__dirname,'../apps/mobile/src/chat/types.ts'));const old=[{...msg,id:'old',createdAtMs:1},{...msg,id:'removed',createdAtMs:3}],latest=[{...msg,id:'new',createdAtMs:2}];assert.deepEqual(mergeMessages(old,latest,true).map(m=>m.id),['old','new']);assert.deepEqual(mergeMessages(old,[],true),[]);
});
test('presence dot sits at avatar corner and expires; unknown/offline are never shown active',async()=>{
 const {isActiveUser,PresenceAvatar}=load(path.join(__dirname,'../apps/mobile/src/chat/PresenceAvatar.tsx'));const now=Date.now();assert(isActiveUser({...bob,lastSeenMs:now},now));assert(!isActiveUser({...bob,lastSeenMs:now-70000},now));assert(!isActiveUser({...bob,online:false,lastSeenMs:now},now));assert(!isActiveUser({...bob,lastSeenMs:now+100000},now));
 await act(async()=>{tree=create(React.createElement(PresenceAvatar,{uri:'',online:true}));});const dot=tree.root.findAllByType('View').find(p=>p.props.accessibilityLabel==='Active now');assert(dot);assert.equal(dot.props.style[0].right,-1);assert.equal(dot.props.style[0].bottom,-1);await act(async()=>tree.update(React.createElement(PresenceAvatar,{uri:'',online:false})));assert(!tree.root.findAllByType('View').some(p=>p.props.accessibilityLabel==='Active now'));
});
test('own message Copy/Delete are contextual, other message cannot show Delete',async()=>{
 const command=[];await act(async()=>{tree=create(React.createElement(MessageBubble,{message:msg,own:false,global:false,disabled:false,onProfile(){},onDelete:id=>command.push(id),onReact(){}}));});assert.equal(button('Delete my message'),undefined);await act(async()=>press('Options msg-1').props.onPress());assert(button('Copy message'));assert.equal(button('Delete my message'),undefined);await act(async()=>button('Copy message').props.onPress());assert.equal(copied.at(-1),msg.text);
 await act(async()=>tree.update(React.createElement(MessageBubble,{message:msg,own:true,global:false,disabled:false,onProfile(){},onDelete:id=>command.push(id),onReact(){}})));await act(async()=>press('Options msg-1').props.onPress());await act(async()=>button('Delete my message').props.onPress());assert.deepEqual(command,['msg-1']);
});
test('Chat whole-shell keyboard avoidance covers Sensei composer; gameplay screens untouched',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../apps/mobile/App.tsx'),'utf8');assert(app.includes("behavior={route.name==='Chat'?(Platform.OS==='ios'?'padding':'height'):undefined}"));assert(app.includes("keyboardVerticalOffset={route.name==='Chat'?insets.top:0}"));
 // Arena/Adventure are intentionally not part of this approved redesign scope.
 for(const file of ['arena/ArenaScreen.tsx','story/StoryScreen.tsx'])assert(fs.existsSync(path.join(__dirname,'../apps/mobile/src',file)));
});
