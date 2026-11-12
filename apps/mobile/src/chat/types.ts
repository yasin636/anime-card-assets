import type {SocialMissions} from '../social/types';
export type ChatUser={uid:string;username:string;avatar:string;xp:number;gems:number;equippedTheme:string;online:boolean;lastSeenMs:number};
export type ChatMessage={id:string;senderId:string;senderName:string;senderAvatar:string;senderGems:number;senderTheme:string;senderAdmin:boolean;text:string;mediaId?:string;postId?:string;createdAtMs:number;reactions:Record<string,number>;selected:string[]};
export type InboxRow={chatId:string;peer:ChatUser;lastText:string;lastSenderId:string;updatedAtMs:number;unread:number};
export type ChatRead={type:'chatPostPreview';postId:string}|{type:'chatImage';peerId:string;messageId:string}|{type:'chatInbox'}|{type:'chatSearch';query:string;cursor:string}|{type:'chatThread';peerId:string;before:string}|{type:'chatGlobal';before:string};
export type ChatMutation={type:'chatPostSend';peerId:string;postId:string}|{type:'chatGlobalPostSend';postId:string}|{type:'chatImageSend';peerId:string;text:string;mediaId:string}|{type:'chatGlobalImageSend';text:string;mediaId:string}|{type:'chatSend';peerId:string;text:string}|{type:'chatGlobalSend';text:string}|{type:'chatDelete';peerId:string;messageId:string}|{type:'chatGlobalDelete';messageId:string}|{type:'chatGlobalReact';messageId:string;emoji:string}|{type:'chatRecentRemove';peerId:string}|{type:'chatMissionClaim'};
export type Presence={type:'chatPresence';online:boolean;sessionId:string;sequence:number};
export type ChatCommand=ChatRead|ChatMutation|Presence;
export type ChatResult={type:string;chatCapability:'chat-v1';serverNow:number;sharedPost?:{id:string;username:string;caption:string};imageUrl?:string;expiresAt?:number;inbox?:InboxRow[];recent?:ChatUser[];totalUnread?:number;users?:ChatUser[];nextSearchCursor?:string;query?:string;messages?:ChatMessage[];hasMore?:boolean;nextCursor?:string;peer?:ChatUser;peerId?:string;message?:ChatMessage;deletedId?:string;missionData?:SocialMissions;reward?:{xp:number;gold:number;gems:number}};
export const globalEmojis=['❤️','😂','👍','🔥','😞'];
const compare=(a:ChatMessage,b:ChatMessage)=>a.createdAtMs-b.createdAtMs||(a.id<b.id?-1:a.id>b.id?1:0);
export function mergeMessages(old:ChatMessage[],incoming:ChatMessage[],latest=false){
 const map=new Map(old.map(m=>[m.id,m]));
 // Fresh latest page is authoritative in its time window, including deleted messages.
 if(latest&&incoming.length){const floor=[...incoming].sort(compare)[0],ids=new Set(incoming.map(m=>m.id));for(const m of old)if(compare(m,floor)>=0&&!ids.has(m.id))map.delete(m.id);}
 if(latest&&!incoming.length)return [];
 for(const m of incoming)map.set(m.id,m);
 return [...map.values()].sort(compare);
}
