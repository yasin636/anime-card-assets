import {MODEL_IDS} from './gemini';
export type QuizOperation={operationId:string;command:{type:string;skip?:boolean}};
// Explicit credential trust boundary approved by owner. Not a caller-supplied URL.
export const QUIZ_BACKEND='https://anime-meta-hub-economy.onrender.com/v1/economy';
export async function postSavedQuiz(operation:QuizOperation,token:string,signal:AbortSignal,provider:{key:string;model:string}|undefined,stillOwner:()=>boolean){
 if(!stillOwner())throw Error('Account বদলেছে। আগের account-এর AI key পাঠানো হয়নি।');
 if(operation.command.type!=='quizStart'&&!(operation.command.type==='quizAnswer'&&operation.command.skip===false))throw Error('এই request-এ AI key পাঠানো যাবে না।');
 const headers:Record<string,string>={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
 if(provider){
  if(!MODEL_IDS.includes(provider.model)||!provider.key||provider.key.length>256||/\s/.test(provider.key))throw Error('Saved AI settings যাচাই হয়নি।');
  headers['x-amh-ai-key']=provider.key;headers['x-amh-ai-model']=provider.model;
 }
 // Missing/deleted/disabled credentials still allow same-ID receipt recovery.
 // Server returns a missing-provider error before NEW AI work if no receipt exists.
 return fetch(QUIZ_BACKEND,{method:'POST',headers,body:JSON.stringify(operation),signal,redirect:'error'});
}
