// Offline golden baseline tests. This does not test a React Native implementation.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const dir=path.join(__dirname,'../docs/react-native-blueprint/reference');
const src=fs.readFileSync(path.join(dir,'script.redacted.js'),'utf8');
const cat=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'),'utf8'));
const inv=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'),'utf8'));
const context=vm.createContext({...cat,LEVEL_CAP:100,PITY_RARE:10,PITY_LEGENDARY:21});
function extract(name){
 const start=src.indexOf('function '+name+'('); assert(start>=0,name);
 const next=src.indexOf('\n    }',start); assert(next>start,name);
 return src.slice(start,next+'\n    }'.length);
}
for(const n of ['xpForLevel','rankTitle','rankClass']){
 const start=src.indexOf('function '+n+'('); const end=src.indexOf('\n',start);
 vm.runInContext(src.slice(start,end),context);
}
for(const n of ['getLevelInfo','getCardStats','pickCardWithPity','calcTotals','applyDamage','storyApplyDamage','resolveSpin']) vm.runInContext(extract(n),context);
let count=0;
function eq(expr,expected){const actual=JSON.parse(JSON.stringify(vm.runInContext(expr,context)));assert.deepEqual(actual,expected,expr);count++;}
eq('cardsList.length',16); eq('STORY_CHAPTERS.length',5);
eq('STORY_CHAPTERS.reduce((n,c)=>n+c.enemies.length,0)',11);
eq('THEMES.length',7);eq('MISSIONS.length',5);eq('WHEEL_SLOTS.length',8);
for(const [xp,level] of [[0,1],[49,1],[50,2],[500,11],[1300,21],[2840,26],[43799,99],[43800,100],[1e8,100]]) eq(`getLevelInfo(${xp}).level`,level);
eq('getLevelInfo(2840).xpIntoLevel',40);eq('getLevelInfo(1e8).xpIntoLevel',0);
eq('calcTotals([cardsList[0],cardsList[7],cardsList[12]])',{hp:4540,def:1915});
eq('applyDamage(300,1000,10)',{hp:800,def:0,shieldBroken:true});
eq('applyDamage(300,1000,0)',{hp:700,def:0,shieldBroken:false});
eq('storyApplyDamage(1000,1000,100)',{hp:980,def:90,shieldBroken:false,dmg:20});
eq('storyApplyDamage(1000,1000,0)',{hp:950,def:0,shieldBroken:false,dmg:20});
for(const [roll,rarity] of [[.079,'legendary'],[.08,'rare'],[.299,'rare'],[.30,'common']]){
 vm.runInContext(`Math.random=()=>${roll}`,context);eq('pickCardWithPity(0,0).card.rarity',rarity);
}
eq('pickCardWithPity(9,0).card.rarity','rare');
eq('pickCardWithPity(9,20).card.rarity','legendary');
eq('pickCardWithPity(9,20).newPityRare',0);eq('pickCardWithPity(9,20).newPityLegendary',0);
for(const [key,xp] of [['lose',0],['x2',40],['xp10',10],['jackpot',100],['bankrupt',-20],['xp50',50],['x3',60],['free',0]]) eq(`resolveSpin('${key}').xpD`,xp);
eq("resolveSpin('free').fsD",1);
eq('STORY_CHAPTERS.reduce((n,c)=>n+c.reward.permAtk,0)',68);
eq('STORY_CHAPTERS.reduce((n,c)=>n+c.reward.permDef,0)',48);
assert.equal(inv.functions.length,193);assert.equal(inv.keyframes.length,107);count+=2;
assert(!/gsk_[A-Za-z0-9]+/.test(src),'Groq secret must not be retained');count++;
const ids=cat.cardsList.map(c=>c.id);assert.equal(new Set(ids).size,16);count++;
for(const card of cat.cardsList){
 const filename=decodeURIComponent(new URL(card.image).pathname.split('/').pop());
 assert(fs.existsSync(path.join(__dirname,'..',filename)),`Missing card art: ${filename}`);count++;
}
console.log(`PASS: ${count} offline catalog/rule/reference checks. No network or live account access.`);
