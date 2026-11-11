'use strict';
const {cert,initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore}=require('firebase-admin/firestore');
const {createServer}=require('./http.cjs');
const fs=require('node:fs');
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS || !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) throw Error('Configure the private hosting credential file before starting. Never put it in Git/APK/chat.');
let credential;
try {
 const config=JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS,'utf8'));
 if(config.project_id!=='anime-meta-hub'||config.type!=='service_account')throw Error('invalid');
 credential=cert(config);
} catch {
 // JSON/PEM parsing errors may contain input excerpts. Never print the raw error.
 console.error('Invalid private hosting credential; verify its project/type/format in the secret manager.');
 process.exit(1);
}
initializeApp({credential,projectId:'anime-meta-hub'});
const stopMediaCleanup=require('./media-cleanup.cjs').startMediaCleanup({db:getFirestore()});
const server=createServer({auth:getAuth(),db:getFirestore(),enabled:process.env.ECONOMY_ENABLED==='true',testUids:(process.env.ECONOMY_TEST_UIDS||'').split(',').map(uid=>uid.trim()).filter(Boolean)});
server.requestTimeout=30000;server.headersTimeout=15000;
server.listen(Number(process.env.PORT)||8080,'0.0.0.0',()=>console.log('Economy API listening; credentials and user data are not logged.'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopMediaCleanup();server.close(()=>process.exit(0));});
