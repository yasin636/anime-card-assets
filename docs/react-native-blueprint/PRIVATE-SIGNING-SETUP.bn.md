# ধাপ ২: Private Android signing ও Google Login প্রস্তুতি

## তৈরি হয়েছে

একটি নতুন **private internal-test signing identity** তৈরি করা হয়েছে। এটি আগের v0.1.0 APK-এর public Expo development key নয়। Production/Play Store signing plan-ও নয়। Private key/password public repository বা Actions artifact-এ রাখা হয়নি।

Public certificate manifest: `android-test-certificate.json`.

Package: `com.yasin636.animemetahub`
Firebase project: `anime-meta-hub`

**SHA-1**
```text
01:3A:A8:E1:1F:0C:39:C3:D5:7F:CF:61:EF:B8:BC:0E:EE:7D:80:41
```

**SHA-256**
```text
3E:71:F6:CE:4D:07:90:91:FD:88:AB:54:BA:3A:D6:2A:B9:BB:BC:E9:D2:E5:5C:96:74:4F:64:AC:08:AA:F9:CD
```

## ব্যবহারকারীর কাজ ১ — Firebase

1. Project settings → General → Your apps → Android `com.yasin636.animemetahub` নির্বাচন করো। পুরোনো Web app নয়।
2. SHA certificate fingerprints অংশে Add fingerprint দিয়ে SHA-1 যোগ করে Save।
3. আবার Add fingerprint দিয়ে SHA-256 যোগ করে Save।
4. Google provider enabled রাখো; প্রয়োজন হলে project support email পূরণ করো।
5. Android app থেকে **নতুন করে google-services.json** ডাউনলোড করে দাও। আগের আপলোডে কোনো OAuth client entry নেই; Google login প্রস্তুতির জন্য সেটি যথেষ্ট নয়।
6. Certificate fingerprint আর Firebase client config private signing key নয়। কিন্তু service-account/private-key JSON কখনো দেবে না।

## ব্যবহারকারীর কাজ ২ — Private backup ও Actions secrets

ব্যক্তিগত deliverable: `AnimeMetaHub-PRIVATE-signing-backup.zip` (repository-এর বাইরে)।

**এটি গোপন ফাইল। Public Git, GitHub Releases/Artifacts, chat বা অন্য কারো কাছে upload/share করবে না।** নিরাপদ offline backup রাখো। ZIP-এর মধ্যে keystore এবং তার password দুটোই আছে—তাই ZIP file-টিই secret হিসেবে রক্ষা করতে হবে।

ZIP extract করলে:
- `anime-meta-hub-test.p12`: password-protected private keystore;
- `ANDROID_KEYSTORE_BASE64.txt`: একই keystore-এর secret text encoding;
- `ANDROID_KEYSTORE_PASSWORD.txt`: generated strong password;
- `certificate.pem` / `FINGERPRINTS.json`: public certificate তথ্য;
- `READ-ME-FIRST.txt`: English setup/recovery notes।

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret name | কোন ফাইলের সম্পূর্ণ content paste করবে |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `ANDROID_KEYSTORE_BASE64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | `ANDROID_KEYSTORE_PASSWORD.txt` |

**Secret values আমাকে পাঠাবে না।** এই secret দুটো GitHub UI-তে সরাসরি যোগ করবে। বর্তমান Arena integration-এ Actions secrets public-key API403, তাই আমি API দিয়ে secret encrypt/set করতে পারছি না। Repository push/Actions run করার ক্ষমতা থাকলেও secret manage করার ক্ষমতা আলাদা।

Updated google-services.json পাওয়ার পরে তৃতীয় secret `FIREBASE_ANDROID_CONFIG_BASE64`-এর helper content প্রস্তুত করা যাবে। Android config ইতিমধ্যেই APK-তে থাকা client configuration; এটি service-account key নয়। তবু CI-তে আলাদা supplied config হিসেবে রাখা হবে।

## যাচাইয়ের ব্যবস্থা

`.github/workflows/android-private-setup.yml` একটি manual **configuration check**। প্রয়োজনীয় তিনটি secret না থাকলে fail করবে, public development key-এ fallback করবে না।

Checks:
- Base64/JSON valid, service account নয়;
- project/package exact match;
- Android OAuth certificate SHA-1 exact match, web OAuth client present;
- Java keytool দিয়ে password/alias দিয়ে keystore খুলে pinned SHA-1/SHA-256 মেলে;
- temporary secrets runner temp-এ; job শেষে cleanup;
- কোনো private key/password artifact নয়; output শুধু public certificate summary।

এটি APK build বা Google/Email login test নয়। Native auth code ও live device/provider testing পরের কাজ। Firebase Rules, existing user data বা provider configuration এই tooling পরিবর্তন করে না।

## App update সতর্কতা

v0.1.0 sample APK পুরোনো public key-তে signed। নতুন private key-তে একই package-এর APK ইনস্টল করতে হলে **পুরোনো sample APK uninstall করতে হবে**; signature আলাদা হওয়ায় সরাসরি update হবে না। এখন sample-only data, বাস্তব account/save নেই। পরবর্তী private-key builds-এ একই key রেখে versionCode বাড়াতে হবে।

এই Android fingerprint iOS Google Login সম্পূর্ণ করে না। iOS-এর native Firebase registration/plist, URL scheme ও OAuth configuration পরে আলাদাভাবে প্রয়োজন।

## Current result

- Private identity created and local OpenSSL export/fingerprint/backup integrity checks performed.
- Current received Android JSON has no OAuth clients: updated file still required.
- CI keytool/secret check not run yet: user secret setup pending.
- No authenticated APK produced, no live login/database write, no permission/Rules deployment.
