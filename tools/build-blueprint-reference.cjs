// Offline inventory only: never execute the application or contact its services.
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),path=require('path');
const input=process.argv[2]||'/tmp/arena-coding-uploads';
const out=path.join(__dirname,'../docs/react-native-blueprint/reference');
fs.mkdirSync(out,{recursive:true});
const raw=fs.readFileSync(path.join(input,'script.js'),'utf8');
const clean=raw.replace(/(const API_KEY\s*=\s*)"[^"]*"/g,'$1"REDACTED_ROTATE_BEFORE_USE"').replace(/(apiKey:\s*)"[^"]*"/g,'$1"REDACTED_FIREBASE_CONFIG"');
fs.writeFileSync(path.join(out,'script.redacted.js'),clean);
for(const name of ['index.html','style.css']) fs.copyFileSync(path.join(input,name),path.join(out,name));
const names=['AVATARS','cardsList','SLOT_IDS','RARITY_STATS_FALLBACK','THEMES','BADGE_LEVELS','MISSIONS','WHEEL_SLOTS','MUSIC_PLAYLIST','JINWOO_IMAGES','STORY_CHAPTERS','BOSS_DIALOGUES','CHAPTER_RANKS','FEED_EMOJIS','FEED_REACTIONS','REACTION_EMOJIS'];
const data={};
for(const name of names){
 const start=raw.search(new RegExp('const '+name+'\\s*='));
 const eq=raw.indexOf('=',start);
 // These reference constants contain only literals; locate statement terminator.
 const end=raw.indexOf(';',eq);
 data[name]=vm.runInNewContext('('+raw.slice(eq+1,end)+')',Object.create(null),{timeout:1000});
}
fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(data,null,2)+'\n');
const funcs=[]; const re=/\b(?:async\s+)?function\s+(\w+)\s*\(/g;let m;
while(m=re.exec(raw)) funcs.push({name:m[1],line:raw.slice(0,m.index).split('\n').length});
const arrows=[]; for(const [i,line] of raw.split('\n').entries()) if(/\bconst\s+\w+\s*=.*=>/.test(line)) arrows.push({name:line.match(/const\s+(\w+)/)[1],line:i+1});
const css=fs.readFileSync(path.join(input,'style.css'),'utf8');
const inventory={sourceFiles:['index.html','style.css','script.js'].map(name=>{const b=fs.readFileSync(path.join(input,name));return {name,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),lines:b.toString().split('\n').length}}),functions:funcs,arrowDeclarations:arrows,domIds:[...new Set([...raw.matchAll(/getElementById\("([^"\n]+)"\)/g)].map(m=>m[1]))],dataAttributes:[...new Set([...raw.matchAll(/data-[a-z][a-z0-9-]+/g)].map(m=>m[0]))].sort(),cssVariables:Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;}{]+)/g)].map(m=>[m[1],m[2].trim()])),keyframes:[...new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m=>m[1]))],mediaQueries:[...css.matchAll(/@media\s*([^\{]+)/g)].map(m=>m[1].trim()),urls:[...new Set([...clean.matchAll(/https?:\/\/[^\s"'`<>]+/g)].map(m=>m[0]))].sort()};
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');
console.log(`Extracted ${data.cardsList.length} cards, ${data.STORY_CHAPTERS.length} chapters, ${funcs.length} functions, ${inventory.keyframes.length} animations.`);
