'use strict';
// Source-level regression checks; foreground/device behavior still needs phone QA.
const {test}=require('node:test');const assert=require('node:assert/strict');const {readFileSync}=require('node:fs');
const provider=readFileSync(require('node:path').join(__dirname,'../apps/mobile/src/collection/EconomyProvider.tsx'),'utf8');
const ui=readFileSync(require('node:path').join(__dirname,'../apps/mobile/src/collection/CollectionScreens.tsx'),'utf8');
test('automatic check waits for loaded profile/pending recovery and checks on foreground',()=>{
 assert(provider.includes("if(!ready||profile?.uid!==uid||!uid||!endpoint)return"));
 assert(provider.includes("AppState.addEventListener('change'"));assert(provider.includes("if(state==='active')void check()"));assert(provider.includes('subscription.remove()'));
});
test('auto check is read-only and authorization is fresh, never persisted across sessions',()=>{
 const check=provider.slice(provider.indexOf(' const check=useCallback'),provider.indexOf(' const run=async'));
 assert(check.includes('/v1/economy/status'));assert(!check.includes("method:'POST'"));assert(!check.includes('AsyncStorage.setItem'));assert(!check.includes('randomUUID()'));
 assert(check.includes('setAllowed(false)'));assert(check.includes('getAuth().currentUser?.uid===uid'));assert(check.includes('checkLock.current||lock.current'));
});
test('checking has neutral feedback and optional retry, not missing setup alarm',()=>{
 assert(ui.includes('title="Retry connection · no spend"'));assert(ui.includes('e.checking?f.body:f.error'));assert(!ui.includes('Backend setup বাকি।'));
});
