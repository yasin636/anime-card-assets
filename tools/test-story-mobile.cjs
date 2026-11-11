'use strict';
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');global.IS_REACT_ACT_ENVIRONMENT=true;
let calls=[],econ,tree;const player={hp:100,atk:30,def:20,maxHp:100,maxDef:20};const army=[{id:'goblin',name:'Goblin Scout',hp:170,atk:350,def:310}];
const session={id:'session',version:2,chapterId:2,enemyId:'baran',enemy:{...player,id:'baran',name:'Baran'},player,playerName:'Hunter',phase:'fight',first:'player',dialogue:[],dialogueIndex:0,events:[],log:[],shadowIds:[],ariseBonus:{hp:0,atk:0,def:0},ariseUsed:false,heavyCooldown:0,turn:0};
const audio={pause(){},play(){},seekTo:async()=>{}};
function load(){const file=path.join(__dirname,'../apps/mobile/src/story/StoryScreen.tsx'),m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=name=>{
 if(name==='react-native')return {Alert:{alert:(_title,_message,buttons)=>buttons.at(-1).onPress()},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Animated:{Value:class{setValue(){} interpolate(){return 1;}stopAnimation(){}},View:'AnimatedView',Image:'Image',Text:'Text',sequence:()=>({start(){},stop(){}}),timing:()=>({start(){},stop(){}}),loop:()=>({start(){},stop(){}})},Image:'Image',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:s=>s}};
 if(name==='@react-navigation/native')return {useIsFocused:()=>true};if(name==='react-native-safe-area-context')return {SafeAreaView:'SafeAreaView'};
 if(name==='expo-linear-gradient')return {LinearGradient:'LinearGradient'};if(name==='@expo/vector-icons')return {Ionicons:'Icon'};
 if(name==='expo-audio')return {useAudioPlayer:()=>audio};if(name==='expo-speech')return {stop:async()=>{},speak(){}};
 if(name==='../auth/AuthProvider')return {useAuth:()=>({profile:{xp:100,inventoryCards:[{id:'gojo'},{id:'sukuna'},{id:'itachi'}]}})};
 if(name==='../collection/EconomyProvider')return {useEconomy:()=>econ};if(name==='../collection/CollectionScreens')return {EconomyStatus:()=>React.createElement('Status')};
 if(name==='../ui/forms')return {f:{},ActionButton:props=>React.createElement('Button',props)};
 if(name==='../domain/profile')return {storyPower:()=>player,levelInfo:()=>({level:3})};
 if(name==='./artwork')return {storyArtwork:new Proxy({},{get:()=>1})};
 if(name.endsWith('.wav'))return 1;
 if(name.startsWith('.'))return req(path.resolve(path.dirname(file),name));return req(name);
 };m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}
const {StoryScreen,ShadowTile}=load();
async function mount(result){calls=[];econ={configured:true,ready:true,busy:false,pending:null,result,run:async c=>calls.push(c)};await act(async()=>{tree=create(React.createElement(StoryScreen));});}
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;});
const button=title=>tree.root.findAllByType('Button').find(b=>b.props.title===title);
test('Story map uses original full artwork, first-clear reward previews and no-fee entry confirmation',async()=>{
 await mount({type:'storyView',storyCapability:'story-v1',story:null,shadows:[],cleared:[]});assert(calls.some(c=>c.type==='storyView'));
 const text=JSON.stringify(tree.toJSON());assert(text.includes('Kasaka'));assert(text.includes('FIRST CLEAR AVAILABLE'));assert(text.includes('100 XP'));
 for(const image of tree.root.findAllByType('Image'))assert.equal(image.props.resizeMode,'contain');
 const start=tree.root.findAllByType('Button').find(b=>b.props.title==='Enter battle · no fee');assert.equal(start.props.disabled,false);await act(async()=>start.props.onPress());assert.deepEqual(calls.at(-1),{type:'storyStart',enemyId:'goblin'});
});
test('combat sends server-version actions; Heavy cooldown disabled and ARISE selection preview/once gating',async()=>{
 await mount({type:'storyView',storyCapability:'story-v1',story:{...session,heavyCooldown:2},shadows:army,cleared:[]});assert.equal(button('Heavy · 2').props.disabled,true);
 await act(async()=>button('⚔ Strike').props.onPress());assert.deepEqual(calls.at(-1),{type:'storyAction',sessionId:'session',version:2,action:'strike'});
 await act(async()=>button('⚫ ARISE · summon your shadows').props.onPress());
 const checkbox=tree.root.findAllByType('Pressable').find(p=>p.props.accessibilityRole==='checkbox');await act(async()=>checkbox.props.onPress());
 const text=tree.root.findAllByType('Text').map(n=>[n.props.children].flat(Infinity).join('')).join(' ');assert(text.includes('HP +85'));assert(text.includes('ATK +175'));
 await act(async()=>button('ARISE · 1 selected').props.onPress());assert.deepEqual(calls.at(-1),{type:'storyArise',sessionId:'session',version:2,shadowIds:['goblin']});
});
test('used ARISE disabled, dialogue tap version locked, explicit victory claim does not auto-award',async()=>{
 await mount({type:'storyView',storyCapability:'story-v1',story:{...session,ariseUsed:true},shadows:army,cleared:[]});assert.equal(button('ARISE used this battle').props.disabled,true);
 econ.result={type:'storyAdvance',story:{...session,version:3,phase:'dialogue',dialogue:[{speaker:'enemy',text:'তুমি কে?'}],dialogueIndex:0}};await act(async()=>tree.update(React.createElement(StoryScreen)));
 const dialogue=tree.root.findAllByType('Pressable').find(p=>p.props.accessibilityLabel==='Next story dialogue');await act(async()=>dialogue.props.onPress());assert.deepEqual(calls.at(-1),{type:'storyAdvance',sessionId:'session',version:3});
 econ.result={type:'storyAdvance',story:{...session,version:4,phase:'victory',outcome:'win'}};await act(async()=>tree.update(React.createElement(StoryScreen)));assert(!calls.some(c=>c.type==='storyClaim'));
 await act(async()=>button('Claim verified reward').props.onPress());assert.deepEqual(calls.at(-1),{type:'storyClaim',sessionId:'session',version:4});
});
test('shadow checkbox exposes original stats and checked accessibility state',async()=>{
 let n=0;await act(async()=>{tree=create(React.createElement(ShadowTile,{shadow:army[0],selected:true,onPress:()=>n++}));});const p=tree.root.findByType('Pressable');assert(p.props.accessibilityState.checked);assert(p.props.accessibilityLabel.includes('ATK 350'));await act(async()=>p.props.onPress());assert.equal(n,1);
});
