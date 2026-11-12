export type Message={role:'user'|'model';parts:{text:string}[]};
const base='https://generativelanguage.googleapis.com/v1beta';
// Exact user-requested menu, not a claim that every ID is available to every API key.
export const MODEL_IDS: readonly string[] = [
 'gemini-3.5-flash','gemini-3.5-flash-lite','gemini-3.6-flash',
 'gemini-robotics-er-2-preview','gemini-3.1-flash-lite','gemini-2.5-flash','gemini-2.5-flash-lite',
];
export function apiError(status:number){return status===400?'Key, model বা request গ্রহণ হয়নি। Key/model যাচাই করো।':status===401||status===403?'Gemini key বা অনুমতি গ্রহণ হয়নি। AI Studio-তে key restrictions পরীক্ষা করো।':status===404?'এই model এই API/key-তে পাওয়া যায়নি। তালিকা থেকে অন্য model বেছে নিয়ে বাস্তব test করো।':status===429?'এই key/model-এর quota বা rate limit শেষ। অন্য উপলব্ধ model বেছে নাও বা পরে চেষ্টা করো।':status>=500?'Gemini service এখন পাওয়া যাচ্ছে না। পরে চেষ্টা করো।':`Gemini request সফল হয়নি (HTTP ${status})।`;}
export async function generate(key:string,model:string,messages:Message[],signal:AbortSignal){
 const id=model.replace(/^models\//,'');
 if(!MODEL_IDS.includes(id))throw Error('তালিকা থেকে Gemini model বেছে নাও।');
 const response=await fetch(`${base}/models/${id}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal,body:JSON.stringify({systemInstruction:{parts:[{text:'You are Anime Sensei in AniGooD. Help with anime, manga and Japanese culture accurately. Keep answers around four to eight lines when practical. Reply in the user\'s language. Distinguish spoilers and ask before major spoilers. Be honest about uncertainty. Never claim to change account balances, cards, rewards, profiles or app data. Do not request passwords, credentials or API keys.'}]},contents:messages,generationConfig:{maxOutputTokens:2048,temperature:0.8}})});
 if(!response.ok)throw Error(apiError(response.status));
 const data=await response.json();const text=data.candidates?.[0]?.content?.parts?.filter((p:{text?:unknown;thought?:boolean})=>typeof p.text==='string'&&!p.thought).map((p:{text:string})=>p.text).join('\n');
 if(!text)throw Error('Model থেকে text পাওয়া যায়নি—safety restriction বা model limitation হতে পারে।');return text as string;
}
