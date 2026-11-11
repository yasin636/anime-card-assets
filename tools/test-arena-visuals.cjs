'use strict';
// Real React rendering; mocked native primitives, not Android screenshots/device QA.
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{create,act}=req('react-test-renderer'),ts=req('typescript');
global.IS_REACT_ACT_ENVIRONMENT=true;
const renderModule=file=>{
 const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));
 m.require=name=>{
  if(name==='react-native')return {Animated:{Value:class {setValue(){} interpolate(){return 1;}},View:'AnimatedView',sequence:()=>({start(){},stop(){}}),timing:()=>({}),delay:()=>({})},Image:'Image',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:v=>v,absoluteFill:{},absoluteFillObject:{}}};
  if(name==='react-native-safe-area-context')return {SafeAreaView:'SafeAreaView'};
  if(name==='expo-linear-gradient')return {LinearGradient:'LinearGradient'};
  if(name==='@expo/vector-icons')return {Ionicons:'Icon'};
  if(name==='../ui/Avatar')return {Avatar:props=>React.createElement('Avatar',props)};
  if(name==='./artwork')return {cardArtwork:{gojo:1,deku:2}};
  if(name==='../domain/profile')return {levelInfo:xp=>({level:Math.floor(xp/50)+1,title:'Hunter (Active)'}),badge:()=>''};
  if(name==='./presentation')return renderModule(path.join(path.dirname(file),'presentation.ts'));
  if(name.startsWith('.'))return req(path.resolve(path.dirname(file),name));
  return req(name);
 };
 m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;
};
const visual=renderModule(path.join(__dirname,'../apps/mobile/src/arena/ArenaVisuals.tsx'));let tree;
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;});
test('real card component renders artwork, rarity/raw stats, selectable state and callback',async()=>{
 let pressed=0;await act(async()=>{tree=create(React.createElement(visual.TradingCard,{card:{id:'gojo',instanceId:'a',hp:111,atk:333,def:222},selected:true,order:2,onPress:()=>pressed++}));});
 const press=tree.root.findByType('Pressable');assert.equal(press.props.accessibilityState.selected,true);assert(press.props.accessibilityLabel.includes('HP 111, ATK 333, DEF 222'));const image=tree.root.findByType('Image');assert.equal(image.props.source,1);assert.equal(image.props.resizeMode,'contain');assert.equal(image.props.style.width,'100%');assert.equal(image.props.style.height,'100%');assert.equal(image.props.style.position,'absolute');assert(JSON.stringify(tree.toJSON()).includes('LEGENDARY'));await act(async()=>press.props.onPress());assert.equal(pressed,1);
});
test('leaderboard is one tappable avatar/name row rather than separate Inspect buttons',async()=>{
 let tapped=0;await act(async()=>{tree=create(React.createElement(visual.BoardIdentity,{row:{uid:'u',rank:1,username:'Hunter',avatar:'https://example.com/a',xp:4234,equippedTheme:''},own:true,disabled:false,onPress:()=>tapped++}));});
 assert.equal(tree.root.findAllByType('Pressable').length,1);assert.equal(tree.root.findByType('Avatar').props.size,42);assert(JSON.stringify(tree.toJSON()).includes('4,234'));await act(async()=>tree.root.findByType('Pressable').props.onPress());assert.equal(tapped,1);
});
test('public profile sheet renders actual avatar/bio/featured card and empty slots; no actions for ownership',async()=>{
 await act(async()=>{tree=create(React.createElement(visual.PublicProfileSheet,{open:true,profile:{uid:'u',rank:1,username:'Hunter',avatar:'https://example.com/a',xp:4000,Bio:'My bio',equippedTheme:'naruto',featuredSlots:{'rare-1':{id:'deku',hp:100,atk:200,def:300}}},loading:false,error:'',onClose:()=>{},onRetry:()=>{}}));});
 const text=JSON.stringify(tree.toJSON());assert(text.includes('My bio'));assert(text.includes('Featured legends'));assert(text.includes('Izuku Midoriya'));assert(text.includes('Empty slot'));assert(!text.includes('Recycle'));assert(!text.includes('Equip theme'));assert.equal(tree.root.findByType('Avatar').props.size,88);
});

test('confirmed duel overlay keeps full artwork, actual damage and shield break; dismisses',async()=>{
 let dismissed=0;await act(async()=>{tree=create(React.createElement(visual.DuelFeedback,{event:{id:'battle-turn-1',player:{id:'gojo',used:true},enemy:{id:'deku',used:true},playerDamage:13,enemyDamage:27,shieldBreak:true},onClose:()=>dismissed++}));});
 const text=JSON.stringify(tree.toJSON());const labels=tree.root.findAllByType('Text').map(n=>n.props.children.flat?.().join('')||n.props.children);assert(labels.includes('−13 HP'));assert(labels.includes('−27 HP'));assert(text.includes('SHIELD BREAK'));assert(!text.includes('USED'));assert.equal(tree.root.findAllByType('Image').length,2);
 await act(async()=>tree.root.findAllByType('Pressable')[0].props.onPress());assert.equal(dismissed,1);
});
