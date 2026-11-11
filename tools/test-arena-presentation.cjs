'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),Module=require('node:module'),crypto=require('node:crypto');
const ts=require('../apps/mobile/node_modules/typescript'),filename=path.join(__dirname,'../apps/mobile/src/arena/presentation.ts');
const compiled=new Module(filename);compiled.filename=filename;compiled.paths=Module._nodeModulePaths(path.dirname(filename));compiled._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
const {displayCard,deckTotals,slotOrder}=compiled.exports;
test('displayed raw card stats and selected deck totals match battle engine without story bonus',()=>{
 const {startBattle}=require('../services/economy/arena.cjs');const cards=require('../apps/mobile/src/domain/cards.json').slice(0,3).map((c,i)=>({...c,instanceId:'owned_'+i}));cards[0].hp=111;cards[0].atk=333;cards[0].def=222;
 const ids=cards.map(c=>c.instanceId),total=deckTotals(cards,ids),battle=startBattle({inventoryCards:cards,flatBonusAtk:99999},ids,'presentation',()=>0);
 assert.equal(total.hp,battle.player.hp);assert.equal(total.def,battle.player.def);assert.equal(total.atk,battle.player.cards.reduce((n,c)=>n+Math.round(c.atk*.5),0));assert.equal(displayCard(cards[0]).atk,333);
});
test('legacy stats fallback exactly as server; unknown cards do not invent rarity/power',()=>{
 const {stats}=require('../services/economy/domain.cjs');const raw={id:'gojo',hp:-1,atk:20,def:30};const shown=displayCard(raw);assert.deepEqual({hp:shown.hp,atk:shown.atk,def:shown.def},stats(raw));const unknown=displayCard({id:'unknown',name:'Legacy'});assert.equal(unknown.rarity,'unknown');assert.equal(unknown.hp,undefined);
 assert.equal(slotOrder.length,6);assert.equal(deckTotals([{id:'gojo',instanceId:'a'},{id:'gojo',instanceId:'b'}],['b']).hp,1700);
});
test('all16 original artworks bundled offline, explicit Metro requires, catalog source bytes preserved',()=>{
 const catalog=require('../apps/mobile/src/domain/cards.json'),source=fs.readFileSync(path.join(__dirname,'../apps/mobile/src/arena/artwork.ts'),'utf8');
 for(const c of catalog){const relative=`../../assets/cards/${c.id}.png`;assert(source.includes(`require('${relative}')`));const local=path.join(__dirname,`../apps/mobile/assets/cards/${c.id}.png`),original=path.join(__dirname,'..',decodeURIComponent(c.image.split('/').pop()));
 assert.deepEqual(crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'));}
});
test('UI includes compact card selection, avatar rows, tappable identity and featured profile sheet',()=>{
 const screen=fs.readFileSync(path.join(__dirname,'../apps/mobile/src/arena/ArenaScreen.tsx'),'utf8'),visuals=fs.readFileSync(path.join(__dirname,'../apps/mobile/src/arena/ArenaVisuals.tsx'),'utf8');
 assert(screen.includes('nestedScrollEnabled'));assert(screen.includes('selectedIds.length<3'));assert(screen.includes("type:'leaderboardView'"));assert(screen.includes('PublicProfileSheet'));assert(screen.includes('openProfile(row)'));
 assert(visuals.includes('featuredSlots'));assert(visuals.includes('slotOrder.map'));assert(visuals.includes('Avatar'));assert(visuals.includes('accessibilityLabel={`${c.name}, ${c.rarity}, HP'));assert(!screen.includes('title={`Inspect ${row.username}`}'));
});
