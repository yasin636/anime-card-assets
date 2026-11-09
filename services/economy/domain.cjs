'use strict';
// Server-side pure command planner. Never accepts balances, prices or rewards from a client.
const { createHash } = require('node:crypto');
const catalog = require('../../docs/react-native-blueprint/reference/catalog.json');
const cards = catalog.cardsList, themes = catalog.THEMES;
const slots = ['legendary-1','legendary-2','rare-1','rare-2','common-1','common-2'];
class EconomyError extends Error { constructor(code) { super(code); this.code = code; } }
const fail = code => { throw new EconomyError(code); };
const amount = (data, key) => {
  const n = data[key] ?? 0;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) fail('invalid-profile-number');
  return n;
};
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function stats(card) {
  const embedded = [card.hp, card.atk, card.def].map(Number);
  if (embedded.every(n => Number.isFinite(n) && n > 0)) return {hp:embedded[0],atk:embedded[1],def:embedded[2]};
  const base = cards.find(c => c.id === card.id);
  if (base) return { hp:base.hp, atk:base.atk, def:base.def };
  // Unknown IDs must be audited, not silently turned into a different card/reward.
  fail('unknown-legacy-card');
}
function validateCommand(command) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) fail('invalid-command');
  const fields = {prepare:[],summon:[],equip:['instanceId','slot'],unequip:['slot'],recycle:['instanceId'],buyTheme:['themeId'],equipTheme:['themeId']};
  if (!Object.hasOwn(fields,command.type)) fail('invalid-command');
  if (Object.keys(command).some(k => k !== 'type' && !fields[command.type].includes(k))) fail('unexpected-command-field');
  for (const field of fields[command.type]) if (typeof command[field] !== 'string' || !command[field] || command[field].length > 160) fail('invalid-command-field');
}
function plan(profile, command, entropy) {
  validateCommand(command);
  if (!profile || typeof profile !== 'object') fail('profile-not-found');
  if (profile.inventoryCards != null && !Array.isArray(profile.inventoryCards)) fail('invalid-inventory');
  const list = structuredClone(profile.inventoryCards || []);
  const equipped = structuredClone(profile.equippedSlots || {});
  let result = {type:command.type}, patch = {};
  if (command.type === 'prepare') {
    const seen = new Set();
    for (let index=0; index<list.length; index++) {
      const card = list[index];
      if (!card || typeof card !== 'object') fail('invalid-inventory');
      if (!card.instanceId) {
        // Deterministic within the transaction and persisted exactly once; preserve every other field.
        card.instanceId = `legacy-${hash([entropy.owner,index,card]).slice(0,40)}`;
      }
      if (typeof card.instanceId !== 'string' || seen.has(card.instanceId)) fail('duplicate-instance-id');
      seen.add(card.instanceId);
    }
    // Resolve old slot objects only if identity is unambiguous; never guess among duplicate IDs.
    for (const [slot,card] of Object.entries(equipped)) {
      if (!card || card.instanceId) continue;
      const matches = list.filter(item => item.id === card.id);
      if (matches.length === 1) equipped[slot] = {...card,instanceId:matches[0].instanceId};
    }
    patch = {inventoryCards:list,equippedSlots:equipped};
  } else if (command.type === 'summon') {
    const gold=amount(profile,'gold'), rare=amount(profile,'pityRare'), legendary=amount(profile,'pityLegendary');
    if (gold < 500) fail('insufficient-gold');
    if (![entropy.rarity,entropy.card].every(n => typeof n === 'number' && n >= 0 && n < 1)) fail('invalid-server-entropy');
    const rarity = legendary+1 >= 21 ? 'legendary' : rare+1 >= 10 ? 'rare' : entropy.rarity < .08 ? 'legendary' : entropy.rarity < .30 ? 'rare' : 'common';
    const pool=cards.filter(c=>c.rarity===rarity), base=pool[Math.floor(entropy.card*pool.length)];
    if (!entropy.instanceId || list.some(c=>c.instanceId===entropy.instanceId)) fail('duplicate-instance-id');
    const {id,name,image}=base;
    const card={id,name,image,rarity,instanceId:entropy.instanceId};
    patch={gold:gold-500, inventoryCards:[card,...list],pityRare:rarity==='common'?rare+1:0,pityLegendary:rarity==='legendary'?0:legendary+1};
    result={...result,card};
  } else if (command.type === 'equip' || command.type === 'unequip') {
    if (!slots.includes(command.slot)) fail('invalid-slot');
    if (command.type === 'unequip') delete equipped[command.slot];
    else {
      const matches=list.filter(c=>c.instanceId===command.instanceId);
      if (matches.length!==1) fail('instance-not-unique-or-owned');
      const card=matches[0], base=cards.find(c=>c.id===card.id);
      if (!base) fail('unknown-legacy-card');
      if (base.rarity!==command.slot.split('-')[0]) fail('rarity-mismatch');
      // Retain source multi-slot behavior pending explicit D35 policy approval.
      equipped[command.slot]=structuredClone(card);
    }
    patch={equippedSlots:equipped};
  } else if (command.type === 'recycle') {
    const matches=list.filter(c=>c.instanceId===command.instanceId);
    if (matches.length!==1) fail('instance-not-unique-or-owned');
    const card=matches[0], base=cards.find(c=>c.id===card.id);
    if (!base) fail('unknown-legacy-card');
    const duplicate=list.filter(c=>c.id===card.id).length>1;
    const [gold,xp]={common:[100,50],rare:[300,150],legendary:[600,300]}[base.rarity];
    for (const [slot,value] of Object.entries(equipped)) {
      if (value?.instanceId===card.instanceId) delete equipped[slot];
      else if (value?.id===card.id && !value.instanceId) fail('ambiguous-legacy-slot');
    }
    patch={inventoryCards:list.filter(c=>c.instanceId!==card.instanceId),equippedSlots:equipped,gold:amount(profile,'gold')+gold,xp:amount(profile,'xp')+xp};
    if (duplicate) {
      const raw=stats(card);
      for(const [stat,key] of [['hp','flatBonusHp'],['atk','flatBonusAtk'],['def','flatBonusDef']]) patch[key]=amount(profile,key)+raw[stat];
    }
    result={...result,gold,xp,duplicate};
  } else {
    const theme=themes.find(t=>t.id===command.themeId);
    if (!theme) fail('unknown-theme');
    const inventory=structuredClone(profile.inventory || {});
    if (inventory.themes != null && !Array.isArray(inventory.themes)) fail('invalid-themes');
    const owned=inventory.themes || [];
    if (command.type==='buyTheme') {
      if (owned.includes(theme.id)) fail('theme-already-owned');
      const gold=amount(profile,'gold'); if(gold<theme.price) fail('insufficient-gold');
      patch={gold:gold-theme.price,inventory:{...inventory,themes:[...owned,theme.id]}};
    } else {
      if (!owned.includes(theme.id)) fail('theme-not-owned');
      patch={equippedTheme:profile.equippedTheme===theme.id?'':theme.id};
    }
  }
  for (const [key,value] of Object.entries(patch)) if (typeof value==='number' && (!Number.isFinite(value) || value>Number.MAX_SAFE_INTEGER)) fail('numeric-overflow');
  // Conservative preflight; Firestore's actual wire-size enforcement is still authoritative.
  if(Buffer.byteLength(JSON.stringify({...profile,...patch}),'utf8')>850000) fail('profile-too-large');
  return {patch,result};
}
module.exports={plan,validateCommand,EconomyError,cards,themes,slots,stats};
