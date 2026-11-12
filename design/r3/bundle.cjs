'use strict';
// A single offline file, built outside Git; no hosting or account access needed.
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const images={};for(const name of fs.readdirSync(path.join(dir,'assets'))){if(!/\.(png|jpg)$/.test(name))continue;images[name]=`data:image/${name.endsWith('.png')?'png':'jpeg'};base64,${fs.readFileSync(path.join(dir,'assets',name)).toString('base64')}`;}
let html=read('index.html').replace('<link rel="stylesheet" href="style.css">',()=>`<style>${read('style.css')}</style>`).replace('<script src="app.js"></script>',()=>`<script>${read('app.js')}</script>`);
for(const [name,data]of Object.entries(images))html=html.replaceAll(`assets/${name}`,data);
const map=Object.fromEntries(Object.entries(images).filter(([name])=>name.endsWith('.png')).map(([name,data])=>[name.slice(0,-4),data]));
html=html.replace('src="assets/${id}.png"','src="${'+JSON.stringify(map)+'[id]}"');
if(/src="assets\//.test(html)||html.includes('href="style.css"')||html.includes('src="app.js"'))throw Error('Unbundled dependency');
const out=process.argv[2];if(!out)throw Error('Provide output HTML path');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);console.log('Standalone HTML:',out,Buffer.byteLength(html),'bytes');
