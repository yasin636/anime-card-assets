'use strict';
// Provider error bodies may include signing strings or request identifiers. Only return allowlisted codes.
function providerError(status,body){
 const message=typeof body?.error?.message==='string'?body.error.message.slice(0,2000).toLowerCase():'';
 if(/invalid signature|signature.*(invalid|mismatch)|signature verification/.test(message))return 'media-provider-signature';
 if(/unknown api.?key|invalid api.?key|api.?key.*(invalid|disabled|not found)/.test(message))return 'media-provider-key';
 if(/timestamp.*(stale|expired|invalid)|stale request/.test(message))return 'media-provider-expired';
 if((status===401||status===403)&&/folder/.test(message)&&/permission|denied|not allowed|not authorized/.test(message))return 'media-provider-folder';
 if(status===401)return 'media-provider-auth';
 if(status===403)return 'media-provider-forbidden';
 if(status===413)return 'media-file-invalid';
 if(status===429)return 'media-provider-rate-limit';
 if(status===400)return 'media-provider-request';
 return 'media-provider-unavailable';
}
async function safeBody(response){try{return await response.json();}catch{return null;}}
module.exports={providerError,safeBody};
