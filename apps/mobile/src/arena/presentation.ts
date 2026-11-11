import catalog from '../domain/cards.json';
export type DisplayCard={id:string;instanceId?:string;name?:string;rarity?:string;hp?:number;atk?:number;def?:number;image?:string;used?:boolean};
export const rarityColors:Record<string,string>={legendary:'#f8ce75',rare:'#b89bff',common:'#79dded',unknown:'#a6adc4'};
export const slotOrder=['legendary-1','legendary-2','rare-1','rare-2','common-1','common-2'];
export function displayCard(raw:DisplayCard):DisplayCard{
 const base=catalog.find(c=>c.id===raw.id);
 if(!base)return {id:raw.id,instanceId:raw.instanceId,name:raw.name||raw.id,rarity:'unknown',used:raw.used};
 const valid=[raw.hp,raw.atk,raw.def].every(n=>Number.isFinite(Number(n))&&Number(n)>0);
 return {...base,instanceId:raw.instanceId,used:raw.used,...(valid?{hp:Number(raw.hp),atk:Number(raw.atk),def:Number(raw.def)}:{})};
}
export function deckTotals(cards:DisplayCard[],ids:string[]){
 return cards.filter(c=>c.instanceId&&ids.includes(c.instanceId)).reduce((sum,c)=>{
  const value=displayCard(c);return {hp:sum.hp+2*(value.hp||0),atk:sum.atk+Math.round((value.atk||0)*.5),def:sum.def+(value.def||0)};
 },{hp:0,atk:0,def:0});
}
