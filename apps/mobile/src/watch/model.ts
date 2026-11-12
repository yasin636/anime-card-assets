// Accept only explicit HTTPS public-host links. No app credentials are attached.
export function mediaUrl(raw:string):string {
 const value=raw.trim();
 if(value.length>4096)throw Error('Link is too long.');
 let u:URL;try{u=new URL(value);}catch{throw Error('Enter a valid HTTPS video link.');}
 const host=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!host.includes('.')||host.includes(':')||/^\d+[.]/.test(host)||host.endsWith('.local')||host==='localhost'||host.endsWith('.localhost'))throw Error('Use a public HTTPS link without embedded credentials.');
 return u.toString();
}
export function trackLabel(track:{label:string;language:string},index:number):string {
 return track.label?.trim()||track.language?.trim()||`Track ${index+1}`;
}
