'use strict';
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');global.IS_REACT_ACT_ENVIRONMENT=true;
let alertCount=0;let appStateListener;let calls=[],econ,tree,prefs=new Map();const player={hp:100,atk:30,def:20,maxHp:100,maxDef:20};const army=[{id:'goblin',name:'Goblin Scout',hp:170,atk:350,def:310}];
const session={id:'session',version:2,chapterId:2,enemyId:'baran',enemy:{...player,id:'baran',name:'Baran'},player,playerName:'Hunter',phase:'fight',first:'player',dialogue:[],dialogueIndex:0,events:[],log:[],shadowIds:[],ariseBonus:{hp:0,atk:0,def:0},ariseUsed:false,heavyCooldown:0,turn:0};
const audio={pause(){},play(){},replace(){},seekTo:async()=>{}};
let audioHook=null;let copied=[],clipboardFails=false;
function load(file=path.join(__dirname,'../apps/mobile/src/social/FeedScreen.tsx')){const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=name=>{
 if(name==='../media/PhotoUploader')return {PhotoUploader:props=>React.createElement('PhotoUploader',props)};
 if(name==='../audio/AudioProvider')return {useSoundGate:(_players,local=true,visible=true)=>({current:local&&visible}),useAppAudio:()=>({prefs:{sfxEnabled:true,sfxVolume:.7,voiceEnabled:true},foreground:true,playSfx(){}})};
 if(name==='react-native')return {useWindowDimensions:()=>({width:400,height:800}),FlatList:props=>React.createElement('FlatList',{testID:'virtual-feed'},props.ListHeaderComponent,...props.data.map(item=>React.createElement(React.Fragment,{key:item.id},props.renderItem({item}))),!props.data.length&&props.ListEmptyComponent,props.ListFooterComponent),Platform:{OS:'android'},KeyboardAvoidingView:'KeyboardAvoidingView',AccessibilityInfo:{isReduceMotionEnabled:async()=>false},Alert:{alert:(_title,_message,buttons)=>{alertCount++;buttons.at(-1).onPress();}},AppState:{currentState:'active',addEventListener:(_event,cb)=>{appStateListener=cb;return {remove(){}}}},Animated:{Value:class{setValue(){} interpolate(){return 1;}stopAnimation(){}},View:'AnimatedView',Image:'Image',Text:'Text',sequence:()=>({start(){},stop(){}}),timing:()=>({start(){},stop(){}}),loop:()=>({start(){},stop(){}})},Linking:{openURL:async()=>{}},TextInput:'TextInput',Image:'Image',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:s=>s}};
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
 await act(async()=>press('Create a post').props.onPress());
 await act(async()=>input('Post caption').props.onChangeText('আমার নতুন post'));
 assert.equal(JSON.parse(prefs.get('feed.draft.v1.alice')).caption,'আমার নতুন post');
 await act(async()=>button('Publish moment').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedCreate',caption:'আমার নতুন post',linkUrl:''});
 // Unknown outcome retains draft; server success clears only matching draft.
 assert.equal(input('Post caption').props.value,'আমার নতুন post');econ.result={type:'feedCreate',socialCapability:'social-v1',post:{...post,id:'new',caption:'আমার নতুন post'},xpDelta:15};
 await act(async()=>tree.update(React.createElement(FeedScreen)));assert.equal(input('Post caption'),undefined);await act(async()=>press('Create a post').props.onPress());assert.equal(input('Post caption').props.value,'');
});
test('Like and emoji are distinct commands and pending disables feed mutations',async()=>{
 await mount(result);await act(async()=>press('Like post').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedLike',postId:post.id,liked:true});
 assert.equal(press('React ❤️'),undefined);await act(async()=>press('Like post').props.onLongPress());await act(async()=>press('React ❤️').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedReact',postId:post.id,emoji:'❤️'});
 econ.pending={operationId:'existing',command:{type:'feedLike'}};await act(async()=>tree.update(React.createElement(FeedScreen)));assert.equal(press('Like post').props.disabled,true);await act(async()=>press('Create a post').props.onPress());assert.equal(button('Publish moment').props.disabled,true);
});
test('Comment sends own text, edit uses correct ownership target, author profile fetches public projection',async()=>{
 await mount(result);const textButton=t=>tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(n=>n.props.children===t));
 await act(async()=>textButton('Comment').props.onPress());await act(async()=>input('Write comment').props.onChangeText('দারুণ'));
 await act(async()=>press('Send comment').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedComment',postId:post.id,text:'দারুণ'});
 await act(async()=>press('Post options').props.onPress());await act(async()=>textButton('Edit post').props.onPress());await act(async()=>input('Edit text').props.onChangeText('এডিট করা post'));await act(async()=>button('Save changes').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedEdit',postId:post.id,caption:'এডিট করা post'});
 await act(async()=>press('Profile Alice').props.onPress());assert.deepEqual(calls.at(-1),{type:'publicProfile',uid:'alice'});
});
test('Copy must succeed before share reward command; links use installed-app route not invented web URL',async()=>{
 await mount(result);const copy=tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(n=>n.props.children==='Share'));
 const baseline=calls.length;clipboardFails=true;await act(async()=>copy.props.onPress());assert.equal(calls.length,baseline);
 clipboardFails=false;await act(async()=>copy.props.onPress());assert.deepEqual(copied,['animemetahub://post/post-1']);assert.deepEqual(calls.at(-1),{type:'feedShare',postId:post.id});
});
test('Missions leave timeline via compact navigation without hidden reward commands',async()=>{
 await mount(result);let opens=0;await act(async()=>tree.update(React.createElement(FeedScreen,{onMissions:()=>opens++})));const trigger=tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(n=>n.props.children==='Missions ↗'));assert(trigger);await act(async()=>trigger.props.onPress());assert.equal(opens,1);assert(!calls.some(c=>c.type==='socialMissionClaim'));assert(!JSON.stringify(tree.toJSON()).includes('DAILY SOCIAL MISSIONS'));
});
test('Feed merge rejects stale versions and link/relative-time helpers are deterministic',()=>{
 const {mergePost,postLink,relativeTime}=load(path.join(__dirname,'../apps/mobile/src/social/types.ts'));
 assert.equal(mergePost([{...post,version:5}],{...post,version:2})[0].version,5);assert.equal(postLink('post-1'),'animemetahub://post/post-1');assert.equal(relativeTime(0,120000),'2 মিনিট আগে');
});
test('R1 fresh scoped feed cache renders immediately without read; explicit Refresh bypasses it',async()=>{
 calls=[];econ={configured:true,ready:true,busy:false,pending:null,result:null,feedCache:{posts:[post],at:Date.now(),missionData:mission},run:async c=>calls.push(c)};await act(async()=>{tree=create(React.createElement(FeedScreen));});assert.equal(calls.length,0);assert(tree.root.findAllByType('Text').some(n=>n.props.children===post.caption));await act(async()=>press('Refresh feed').props.onPress());assert.deepEqual(calls,[{type:'feedView'}]);
});

test('Gallery background transition retains mounted composer and attachment callbacks',async()=>{
 await mount(result);await act(async()=>press('Create a post').props.onPress());
 const uploader=tree.root.findByType('PhotoUploader');
 await act(async()=>appStateListener('background'));
 assert.equal(tree.root.findByType('PhotoUploader'),uploader);
 await act(async()=>appStateListener('active'));
 await act(async()=>uploader.props.onReady('verified-photo'));
 await act(async()=>input('Post caption').props.onChangeText('Gallery caption'));
 await act(async()=>button('Publish moment').props.onPress());
 assert.deepEqual(calls.at(-1),{type:'feedCreate',caption:'Gallery caption',linkUrl:'',mediaId:'verified-photo'});
});
test('Comments use sticky Android keyboard-safe footer and contextual owner menu',async()=>{
 await mount({...result,posts:[{...post,comments:[{id:'c1',uid:'alice',username:'Alice',text:'Content first',createdAtMs:Date.now()}]}]});
 const comment=tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(t=>t.props.children==='Comment'));
 await act(async()=>comment.props.onPress());
 assert.equal(press('Edit comment'),undefined);
 assert(tree.root.findAllByType('KeyboardAvoidingView').some(v=>v.props.behavior==='height'));
 assert(tree.root.findAllByType('Text').some(t=>t.props.children==='Content first'));
 await act(async()=>press('Comment options c1').props.onPress());
 assert(press('Edit comment'));assert(press('Delete comment'));assert(press('Copy comment'));
});
test('Comment reply/react send real commands; lower Delete directly submits without second confirmation',async()=>{
 const c={id:'root',uid:'alice',username:'Alice',text:'Bubble',createdAtMs:Date.now(),reactions:{},parentId:''};
 await mount({...result,posts:[{...post,comments:[c]}]});
 const open=tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(t=>t.props.children==='Comment'));
 await act(async()=>open.props.onPress());
 await act(async()=>press('Reply to comment root').props.onPress());await act(async()=>input('Write comment').props.onChangeText('My reply'));await act(async()=>press('Send comment').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedCommentReply',postId:post.id,commentId:'root',text:'My reply'});
 await act(async()=>press('Cancel reply').props.onPress());
 await act(async()=>press('React to comment root').props.onPress());await act(async()=>press('React ❤️ comment root').props.onPress());assert.deepEqual(calls.at(-1),{type:'feedCommentReact',postId:post.id,commentId:'root',emoji:'❤️'});
 await act(async()=>press('Comment options root').props.onPress());const before=calls.length,alerts=alertCount;await act(async()=>press('Delete comment').props.onPress());assert.equal(alertCount,alerts);assert.equal(calls.length,before+1);assert.deepEqual(calls.at(-1),{type:'feedCommentDelete',postId:post.id,commentId:'root'});
});
test('Comment bubble uses subtle depth, with name/text inside and reply thread indented',async()=>{
 const root={id:'root',uid:'alice',username:'Alice',text:'Root text',createdAtMs:Date.now()},reply={...root,id:'reply',parentId:'root',text:'Nested reply'};
 await mount({...result,posts:[{...post,comments:[root,reply]}]});const open=tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(t=>t.props.children==='Comment'));await act(async()=>open.props.onPress());
 const bubble=press('Comment actions root');assert.equal(bubble.props.style.backgroundColor,'#303139');assert.equal(bubble.props.style.elevation,1);assert(bubble.findAllByType('Text').some(t=>t.props.children==='Alice'));assert(bubble.findAllByType('Text').some(t=>t.props.children==='Root text'));assert(!bubble.findAllByType('Text').some(t=>t.props.children==='Reply'));assert(press('Reply to comment reply'));assert(tree.root.findAllByType('Text').some(t=>t.props.children==='Nested reply'));
});
