const fs=require('fs'),path=require('path');
const manifest=require('../../../docs/react-native-blueprint/android-test-certificate.json');
const file=path.join(__dirname,'../android/app/build.gradle');
if(!process.env.ANDROID_KEYSTORE_PATH||!process.env.ANDROID_KEYSTORE_PASSWORD)throw Error('Private signing environment missing. No debug-key fallback permitted.');
let source=fs.readFileSync(file,'utf8');
for(const text of ["storeFile file('debug.keystore')", "storePassword 'android'", "keyAlias 'androiddebugkey'", "keyPassword 'android'"])if(!source.includes(text))throw Error('Unexpected signing template. Review manually.');
source=source.replace("storeFile file('debug.keystore')", "storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))\n            storeType 'PKCS12'")
.replace("storePassword 'android'", "storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD').trim()")
.replace("keyAlias 'androiddebugkey'", `keyAlias '${manifest.alias}'`)
.replace("keyPassword 'android'", "keyPassword System.getenv('ANDROID_KEYSTORE_PASSWORD').trim()");
fs.writeFileSync(file,source);
console.log('Gradle configured for the verified private test identity; no password persisted in source.');
