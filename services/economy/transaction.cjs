'use strict';
const {randomInt,randomUUID,createHash}=require('node:crypto');
const {plan,validateCommand,EconomyError,txRun}=require('./domain.cjs');
/** Internal server adapter; verifiedUid MUST come from verified Firebase ID token,
 * never from request JSON. Firestore is an Admin SDK instance, not mobile SDK.
 * Receipts and economy fields must be server-only under deployed Firestore Rules.
 */
async function execute({db,verifiedUid,operationId,command,ai,verifiedAdmin=false}) {
  if(typeof verifiedUid!=='string'||!verifiedUid||verifiedUid.includes('/')) throw new EconomyError('unauthenticated');
  if(typeof operationId!=='string'||!/^[a-zA-Z0-9_-]{20,100}$/.test(operationId)) throw new EconomyError('invalid-operation-id');
  const media=require('./media.cjs');
  if(media.types.includes(command?.type))return media.executeMedia({db,verifiedUid,operationId,command});
  const community=require('./community.cjs');
  if(community.types.includes(command?.type))return community.executeCommunity({db,verifiedUid,operationId,command});
  const chat=require('./chat.cjs');
  if(chat.types.includes(command?.type))return chat.executeChat({db,verifiedUid,verifiedAdmin,operationId,command});
  const social=require('./social.cjs');
  if(social.types.includes(command?.type))return social.executeSocial({db,verifiedUid,verifiedAdmin,operationId,command});
  const story=require('./story.cjs');
  if(story.types.includes(command?.type))return story.executeStory({db,verifiedUid,operationId,command});
  const arena=require('./arena.cjs');
  if(arena.types.includes(command?.type))return arena.executeArena({db,verifiedUid,operationId,command,ai});
  validateCommand(command);
  const fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(command).sort()))).digest('hex');
  const userRef=db.collection('user_meta').doc(verifiedUid);
  const receiptRef=userRef.collection('economy_receipts').doc(operationId);
  // Draw on server once, outside retryable transaction callback. Never Math.random or client input.
  const entropy={owner:verifiedUid,rarity:randomInt(0,2**32)/2**32,card:randomInt(0,2**32)/2**32,instanceId:randomUUID()};
  return txRun(db,async tx=>{
    const receipt=await tx.get(receiptRef);
    if(receipt.exists){
      const saved=receipt.data();
      if(saved.fingerprint!==fingerprint) throw new EconomyError('operation-id-conflict');
      return saved.result;
    }
    const snapshot=await tx.get(userRef);
    if(!snapshot.exists) throw new EconomyError('profile-not-found');
    const {patch,result}=plan(snapshot.data(),command,entropy);
    tx.update(userRef,patch);
    tx.create(receiptRef,{fingerprint,result,createdAt:new Date()});
    return result;
  });
}
module.exports={execute};
