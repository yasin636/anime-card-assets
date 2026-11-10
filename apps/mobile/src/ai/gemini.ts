export type GeminiModel={name:string;displayName:string};
export type Message={role:'user'|'model';parts:{text:string}[]};
const base='https://generativelanguage.googleapis.com/v1beta';
export function selectModels(raw:unknown):GeminiModel[]{
 if(!Array.isArray(raw))return [];
 const unique=new Map<string,GeminiModel>();
 for(const model of raw){
  if(typeof model?.name!=='string'||!/^models\/gemini-[a-zA-Z0-9._-]+$/.test(model.name))continue;
  if(!Array.isArray(model.supportedGenerationMethods)||!model.supportedGenerationMethods.includes('generateContent'))continue;
  if(/image|tts|robotic|computer-use|embedding|live|audio|native-audio/i.test(model.name))continue;
  unique.set(model.name,{name:model.name,displayName:typeof model.displayName==='string'?model.displayName:model.name.replace('models/','')});
 }
 return [...unique.values()].sort((a,b)=>b.name.localeCompare(a.name,undefined,{numeric:true})).slice(0,6);
}
export function apiError(status:number){return status===400?'Key, model বা request গ্রহণ হয়নি। Key/model যাচাই করো।':status===401||status===403?'Gemini key বা অনুমতি গ্রহণ হয়নি। AI Studio-তে key restrictions পরীক্ষা করো।':status===429?'এই key/model-এর quota বা rate limit শেষ। অন্য উপলব্ধ model বেছে নাও বা পরে চেষ্টা করো।':status>=500?'Gemini service এখন পাওয়া যাচ্ছে না। পরে চেষ্টা করো।':`Gemini request সফল হয়নি (HTTP ${status})।`;}
export async function discoverModels(key:string,signal:AbortSignal){
 const models:unknown[]=[];let token='';
 for(let page=0;page<10;page++){
  const response=await fetch(`${base}/models?pageSize=100${token?`&pageToken=${encodeURIComponent(token)}`:''}`,{headers:{'x-goog-api-key':key},signal});
  if(!response.ok)throw Error(apiError(response.status));
  const data=await response.json();if(Array.isArray(data.models))models.push(...data.models);
  token=typeof data.nextPageToken==='string'?data.nextPageToken:'';if(!token)break;
 }
 const available=selectModels(models);if(!available.length)throw Error('এই key-তে ব্যবহারযোগ্য Gemini text model পাওয়া যায়নি।');return available;
}
export async function generate(key:string,model:string,messages:Message[],signal:AbortSignal){
 if(!/^models\/gemini-[a-zA-Z0-9._-]+$/.test(model))throw Error('আগে উপলব্ধ model বেছে নাও।');
 const response=await fetch(`${base}/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal,body:JSON.stringify({systemInstruction:{parts:[{text:'You are Anime Sensei in Anime Meta Hub. Help with anime, manga and Japanese culture accurately. Keep answers around four to eight lines when practical. Reply in the user\'s language. Distinguish spoilers and ask before major spoilers. Be honest about uncertainty. Never claim to change account balances, cards, rewards, profiles or app data. Do not request passwords, credentials or API keys.'}]},contents:messages,generationConfig:{maxOutputTokens:2048,temperature:0.8}})});
 if(!response.ok)throw Error(apiError(response.status));
 const data=await response.json();const text=data.candidates?.[0]?.content?.parts?.filter((p:{text?:unknown;thought?:boolean})=>typeof p.text==='string'&&!p.thought).map((p:{text:string})=>p.text).join('\n');
 if(!text)throw Error('Model থেকে text পাওয়া যায়নি—safety restriction বা model limitation হতে পারে।');return text as string;
}
