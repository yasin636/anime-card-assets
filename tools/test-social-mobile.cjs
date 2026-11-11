'use strict';
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');global.IS_REACT_ACT_ENVIRONMENT=true;
let calls=[],econ,tree,prefs=new Map();const player={hp:100,atk:30,def:20,maxHp:100,maxDef:20};const army=[{id:'goblin',name:'Goblin Scout',hp:170,atk:350,def:310}];
const session={id:'session',version:2,chapterId:2,enemyId:'baran',enemy:{...player,id:'baran',name:'Baran'},player,playerName:'Hunter',phase:'fight',first:'player',dialogue:[],dialogueIndex:0,events:[],log:[],shadowIds:[],ariseBonus:{hp:0,atk:0,def:0},ariseUsed:false,heavyCooldown:0,turn:0};
const audio={pause(){},play(){},replace(){},seekTo:async()=>{}};
let audioHook=null;let copied=[],clipboardFails=false;
function load(file=path.join(__dirname,'../apps/mobile/src/social/FeedScreen.tsx')){const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=name=>{
 if(name==='react-native')return {AccessibilityInfo:{isReduceMotionEnabled:async()=>false},Alert:{alert:(_title,_message,buttons)=>buttons.at(-1).onPress()},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Animated:{Value:class{setValue(){} interpolate(){return 1;}stopAnimation(){}},View:'AnimatedView',Image:'Image',Text:'Text',sequence:()=>({start(){},stop(){}}),timing:()=>({start(){},stop(){}}),loop:()=>({start(){},stop(){}})},Linking:{openURL:async()=>{}},TextInput:'TextInput',Image:'Image',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:s=>s}};
 if(name==='@react-navigation/native')return {useIsFocused:()=>true,useRoute:()=>({params:{}})};
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
 };m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}

const {FeedScreen,FeedPostCard}=load();
const post={id:'post-1',uid:'alice',username:'Alice',avatar:'',gems:0,equippedTheme:'',caption:'বাংলা anime আলোচনা',linkUrl:'',mediaUrl:'',mediaType:'',hasLegacyMedia:false,created_at_ms:Date.now(),isAdmin:false,edited:false,version:1,likesCount:0,liked:false,shareCount:0,reaction:'',reactions:{},comments:[]};
const mission={date:new Date().toISOString().slice(0,10),progress:{postsCreated:2,socialActions:3},claimed:{}};
async function mount(result){calls=[];copied=[];clipboardFails=false;econ={configured:true,ready:true,busy:false,pending:null,result,run:async c=>calls.push(c)};await act(async()=>{tree=create(React.createElement(FeedScreen));});}
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;});
const button=title=>tree.root.findAllByType('Button').find(b=>b.props.title===title);
const input=label=>tree.root.findAllByType('TextInput').find(b=>b.props.accessibilityLabel===label);
const press=label=>tree.root.findAllByType('Pressable').find(b=>b.props.accessibilityLabel===label);
const result={type:'feedView',socialCapability:'social-v1',posts:[post],missionData:mission,dailyPosts:1};
test('Feed loads real data, scoped draft and exact create command without client XP/admin',async()=>{
 prefs.clear();await mount(result);assert(calls.some(c=>c.type==='feedView'));assert(JSON.stringify(tree.toJSON()).includes(post.caption));
 await act(async()=>input('Post caption').props.onChangeText('আমার নতুন post'));
 assert.equal(JSON.parse(prefs.get('feed.draft.v1.alice')).caption,'আমার নতুন post');
 await act(async()=>button('Publish post · +15 XP').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedCreate',caption:'আমার নতুন post',linkUrl:''});
 // Unknown outcome retains draft; server success clears only matching draft.
 assert.equal(input('Post caption').props.value,'আমার নতুন post');econ.result={type:'feedCreate',socialCapability:'social-v1',post:{...post,id:'new',caption:'আমার নতুন post'},xpDelta:15};
 await act(async()=>tree.update(React.createElement(FeedScreen)));assert.equal(input('Post caption').props.value,'');
});
test('Like and emoji are distinct commands and pending disables feed mutations',async()=>{
 await mount(result);await act(async()=>press('Like post').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedLike',postId:post.id,liked:true});
 await act(async()=>press('React ❤️').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedReact',postId:post.id,emoji:'❤️'});
 econ.pending={operationId:'existing',command:{type:'feedLike'}};await act(async()=>tree.update(React.createElement(FeedScreen)));assert.equal(press('Like post').props.disabled,true);assert.equal(button('Publish post · +15 XP').props.disabled,true);
});
test('Comment sends own text, edit uses correct ownership target, author profile fetches public projection',async()=>{
 await mount(result);const textButton=t=>tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(n=>n.props.children===t));
 await act(async()=>textButton('Comment').props.onPress());await act(async()=>input('Write comment').props.onChangeText('দারুণ'));
 await act(async()=>button('Send comment · +10 XP').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedComment',postId:post.id,text:'দারুণ'});
 await act(async()=>textButton('Edit post').props.onPress());await act(async()=>input('Edit text').props.onChangeText('এডিট করা post'));await act(async()=>button('Save edit · 0 XP').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedEdit',postId:post.id,caption:'এডিট করা post'});
 await act(async()=>press('Profile Alice').props.onPress());assert.deepEqual(calls.at(-1),{type:'publicProfile',uid:'alice'});
});
test('Copy must succeed before share reward command; links use installed-app route not invented web URL',async()=>{
 await mount(result);const copy=tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(n=>n.props.children==='Copy link'));
 const baseline=calls.length;clipboardFails=true;await act(async()=>copy.props.onPress());assert.equal(calls.length,baseline);
 clipboardFails=false;await act(async()=>copy.props.onPress());assert.deepEqual(copied,['animemetahub://post/post-1']);assert.deepEqual(calls.at(-1),{type:'feedShare',postId:post.id});
});
test('Mission ready/claimed gating uses server progress and commands contain only mission ID',async()=>{
 await mount(result);assert.equal(button('Claim · 50 Gold / 15 XP / 5 Gems').props.disabled,false);assert.equal(button('Claim · 50 Gold / 20 XP / 5 Gems').props.disabled,true);
 await act(async()=>button('Claim · 50 Gold / 15 XP / 5 Gems').props.onPress());assert.deepEqual(calls.at(-1),{type:'socialMissionClaim',missionId:'m_posts'});
});
test('Feed merge rejects stale versions and link/relative-time helpers are deterministic',()=>{
 const {mergePost,postLink,relativeTime}=load(path.join(__dirname,'../apps/mobile/src/social/types.ts'));
 assert.equal(mergePost([{...post,version:5}],{...post,version:2})[0].version,5);assert.equal(postLink('post-1'),'animemetahub://post/post-1');assert.equal(relativeTime(0,120000),'2 মিনিট আগে');
});
