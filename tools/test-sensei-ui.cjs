'use strict';
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const req=Module.createRequire(path.join(__dirname,'../apps/mobile/package.json')),React=req('react'),{act,create}=req('react-test-renderer'),ts=req('typescript');global.IS_REACT_ACT_ENVIRONMENT=true;let tree,finish,signal;
const ai={ready:true,hasKey:true,enabled:true,model:'selected-model',ask:(_q,s)=>{signal=s;return new Promise(resolve=>{finish=resolve;});}};
const file=path.join(__dirname,'../apps/mobile/src/ai/GeminiScreen.tsx'),m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=n=>{
 if(n==='./AIProvider')return {useAI:()=>ai};if(n==='../ui/PresentationProvider')return {usePresentation:()=>({reduced:true})};if(n==='@react-navigation/native')return {useIsFocused:()=>true};if(n==='react-native')return {ActivityIndicator:'Spinner',Alert:{alert(){}},View:'View',ScrollView:'ScrollView',Text:'Text',TextInput:'TextInput',Pressable:'Pressable',StyleSheet:{create:s=>s}};if(n==='../ui/forms')return {f:{},ActionButton:p=>React.createElement('Button',p)};return req(n);
};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);const Screen=m.exports.GeminiScreen;
const press=label=>tree.root.findAllByType('Pressable').find(p=>p.props.accessibilityLabel===label);
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;});
test('Sensei retains selected model/request/Stop behavior and polished own/answer bubbles',async()=>{
 await act(async()=>{tree=create(React.createElement(Screen,{onSettings(){}}));});const input=tree.root.findByType('TextInput');await act(async()=>input.props.onChangeText('My question'));await act(async()=>press('Send AI question').props.onPress());assert(press('Stop AI reply'));await act(async()=>press('Stop AI reply').props.onPress());assert(signal.aborted);await act(async()=>finish('late answer'));assert(!JSON.stringify(tree.toJSON()).includes('late answer'));assert(JSON.stringify(tree.toJSON()).includes('My question'));assert(JSON.stringify(tree.toJSON()).includes('Retry'));
});
test('completed answer uses real response, not preview content; composer remains multiline',async()=>{
 await act(async()=>{tree=create(React.createElement(Screen,{onSettings(){}}));});await act(async()=>tree.root.findByType('TextInput').props.onChangeText('Explain'));await act(async()=>press('Send AI question').props.onPress());await act(async()=>finish('Actual answer'));assert(JSON.stringify(tree.toJSON()).includes('Actual answer'));assert.equal(tree.root.findByType('TextInput').props.multiline,true);assert(press('AI Provider settings'));
});
