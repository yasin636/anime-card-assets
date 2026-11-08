# Native implementation progress

## Target and working agreement

- React Native Android+iOS, not React web.
- Each implementation step ends with an Android standalone test APK, user testing/feedback, fixes and explicit approval before the next feature step.
- No real account/currency/gameplay claims for sample-only screens.
- Main contract: BLUEPRINT.bn.md + PARITY-AND-QA.bn.md + complete reference.

## Step 01 — Navigation foundation (user phone test successful)

User acceptance recorded 2026-11-08: “ফোনে পরীক্ষা সফল”. Five supplied phone screenshots show Profile, Arena, Feed, Shop and the More sheet rendered on an actual phone. This is user-reported success for the navigation test, not proof of every checklist item or any backend feature. Phone model/Android version and iOS testing remain unspecified. Screenshot filenames: Screenshot_20261108_170537.jpg, Screenshot_20261108_170539.jpg, Screenshot_20261108_170542.jpg, Screenshot_20261108_170531.jpg, Screenshot_20261108_170535.jpg. Uploaded screenshots are not copied into Git.

Next: Step02 Auth/Profile persistence preparation. Native Firebase configuration and a nonpublic test-signing plan must be resolved before real account use; no backend changes made as part of recording acceptance.

Implemented in `apps/mobile`:
- Expo54.0.38 / RN0.81.5 / React19.1 / strict TypeScript.
- Native-stack navigation, safe areas and dark neon shell, boot screen.
- Profile, Arena, Feed, Shop, Cards, Tracker, Chat, Adventure.
- Bottom navigation + More sheet/outside dismiss/native modal Back.
- Header sample balances, test-build information modal, all controls labelled preview/coming next.
- Local card-art samples, chapter preview switching; no external runtime API.
- Reproducible Android prebuild workflow; standalone release-mode test signing, ABI ARM64+ARMv7; signature/embedded bundle verification before artifact publication.
- Expo template public development signing identity pinned by SHA256; **not production signing**. A production signing transition plan is mandatory before real accounts/store release.

Local checks passed:
- `npm run typecheck`
- `EXPO_OFFLINE=1 npx expo install --check`
- `EXPO_OFFLINE=1 npx expo export --platform android --clear` (Hermes bundle + local art)
- `node tools/validate-mobile-foundation.cjs` (structural scope/art/config checks)
- `node tools/test-blueprint-reference.cjs` (61 baseline checks)

Known limitations:
- Not all final visual/animation effects; no Firebase, login, save, gacha, rewards, chat or combat yet.
- No physical device or iOS validation performed.
- Dependency audit residual advisories are documented in `apps/mobile/README.md`; no production security clearance claimed.
- An APK compile success does not prove no runtime/UI bugs. Phone checklist is in the mobile README.

Build attempts:
1. Run42472896934: Gradle wrapper10s download timeout (not TypeScript failure).
2. Run42472982729: upstream GitHub Gradle release download HTTP504 even with120s timeout.
3. Run42473167801: CDN download worked; Android settings evaluation caught an incompatible transitive expo-font58 package. Pinned expo-font14.0.12 and vector-icons15.0.3; added Android autolinking publication validation.
4. **Run42473341865 succeeded**, source commit `2c56cd6e38c860a09568492f7832dc401ce6bf25`. Native compile, fixed test-signing hash, APK signature/metadata/embedded bundle checks, artifact upload all passed.
   - Build: https://github.com/yasin636/anime-card-assets/actions/runs/42473341865
   - Download: https://github.com/yasin636/anime-card-assets/actions/runs/42473341865/artifacts/13614353281
   - Artifact `AnimeMetaHub-v0.1.0-navigation-test`: 21,797,972 bytes (ZIP containing APK, checksum, README); expires2026-11-22T11:00:17Z.
   - Artifact archive digest from GitHub API: `sha256:ab6d559062f5c76ea94204665eb8c44563283288e58ff524fec7d4b4d5650e06` (this is NOT the individual APK checksum; use included SHA256SUMS.txt for the APK).
   - APK filename: `AnimeMetaHub-v0.1.0-navigation-test.apk`. GitHub artifact download may require login; extract ZIP then install APK, no Expo Go/Metro needed.
   - Download into this sandbox was blocked by the artifact blob host network restriction (EOF). The artifact exists and success was verified via GitHub API; no local APK inspection/device test is claimed.

**Phone feedback required before Step02:** model/Android version, install/launch result, all eight destinations, More dismiss/native Back, scrolling/safe areas/Bengali text, local artwork, airplane-mode relaunch, chapter preview tabs, about/coming-next messages. Report screenshots/crashes. No login or real rewards should be expected in this APK.

## Step 02 — Firebase/Auth preparation (in progress)

Firebase/Auth/Profile persistence, secure schema/defaults and account lifecycle. Do not implement actual economy before server-side reward rules and idempotency are in place. Obtain authorized native Firebase app configuration without putting service-account/AI secrets into mobile source.


Native Android Firebase configuration received and validated: project `anime-meta-hub`, Android package `com.yasin636.animemetahub`. Saved locally as `apps/mobile/google-services.json` and excluded from Git. No service-account private key present. Android registration does not configure iOS; iOS plist remains outstanding. No live Firebase request, database write, Rules deployment or provider-state verification performed. Email/Password enabled status and secure CI configuration/private test signing still need verification before authenticated APK testing.

### Step02 signing / Google Login prerequisite work

- User confirmed Email/Password and Google providers enabled; requests both in Step02.
- Created new private Android internal-test signing identity; public fingerprints in `android-test-certificate.json` and setup guide in `PRIVATE-SIGNING-SETUP.bn.md`.
- Private backup delivered separately outside the repository. Private key/password/base64 never committed or printed. User must keep the backup and add its two values directly to Actions secrets; current integration cannot access repository secret public-key endpoint (403).
- Supplied Android Firebase config has zero OAuth client entries. User must register new SHA-1 and SHA-256, then supply freshly downloaded config. No config was fabricated for use in the app.
- Added manual fail-closed private signing/Firebase OAuth preflight workflow. It checks three secrets, pinned certificate, project/package, Android OAuth SHA-1 and web OAuth client, then deletes runner temp material. It does not build an APK or perform login.
- Local checks: actual PKCS12 export/fingerprint match, backup ZIP integrity; positive validator using explicitly synthetic OAuth metadata; negative original-config and missing-secret checks; Python syntax. Java keytool/CI checks are pending secret setup. No authenticated APK produced and no live Firebase changes.
- First new private-key APK requires uninstalling old sample-only v0.1.0 due to certificate change. Future private-key APKs must preserve this identity and increment versionCode.

Updated Android configuration `google-services (3).json` received: project/package match; pinned SHA-1 Android OAuth client and web OAuth client are present. Local ignored config replaced. This validates configuration only, not a successful Google login. User requests mobile-friendly guidance for manually adding two signing secrets; values must never be posted in chat.


### Secret setup verification follow-up

User reports both signing secrets added. Actual signing-only CI run42517783944 failed: decoded ANDROID_KEYSTORE_BASE64 does not match the original backup keystore SHA256. Password correctness remains unverified (check intentionally stops at data mismatch). No auth APK produced. Mobile copy whitespace handling was added; missing/invalid/mismatching data still fails closed. User should edit the existing first secret with the exact Base64 helper, not regenerate the key. An owner-only standalone helper was uploaded to the user's Drive; secret values are not logged or committed.

Updated real Firebase JSON was validated locally with the original backup (OpenSSL, no Java/live login). FIREBASE_ANDROID_CONFIG_BASE64 helper was prepared and uploaded owner-only to Drive; user has not yet reported adding the third secret. Native Java/keytool and complete CI config checks remain pending first-secret repair and third-secret setup. No Firebase Rules/data/provider mutations.


Signing-only CI recheck after user updated first secret: **SUCCESS**, run42518111503 (https://github.com/yasin636/anime-card-assets/actions/runs/42518111503). The actual GitHub secrets decoded to the pinned keystore; password/alias worked in Java keytool and certificate SHA-1/SHA-256 matched. Firebase configuration was intentionally NOT checked in this run; third secret remains pending user setup. No new APK or live login test performed.


Full private setup CI after user added third secret: **SUCCESS**, run42518442960 (https://github.com/yasin636/anime-card-assets/actions/runs/42518442960), signing_only=false. All three actual repository secrets passed: pinned keystore bytes/certificate, Java keytool password/alias, Firebase project/package, matching Android OAuth SHA-1 and web OAuth client present. Temporary material cleaned by workflow. This is configuration validation only: no live Email/Google login, Firestore Rules/data mutation, iOS test or new authenticated APK. Step02 native auth/profile implementation remains next.

### Step02 implementation — v0.2.0 Auth/Profile (build in progress)

- Added native Firebase app/auth/firestore/storage23.5.0 and Google Sign-In16.0.0; SDK54-compatible picker/manipulator/SVG modules. Google web client config generated from the real verified Android JSON, not committed.
- Email signup/login, Google account selection/cancel/signin, explicit current-account Google link and credential-conflict password verification. No custom cross-UID merge.
- SDK-persisted session, UID-keyed main navigation, listener cleanup and profile owner guards. Metadata-aware profile subscription supports confirmed-missing initialization; create transaction never resets an existing document.
- Live own profile/currencies/XP rank/gem badge/story power/featured slots; username/Bio edit/save/cancel, preset avatars, resized gallery upload via Storage with failure cleanup, sign out.
- Auth/Profile is live; all gameplay/community/economy commands remain disabled previews. Storage permissions/billing and live Firebase Rules are not bypassed or changed.
- Build pipeline now validates all three secrets and signs the release-mode APK with the pinned private certificate (no public debug fallback); apksigner result must match pinned SHA256. Key/password never written into Gradle source, only environment references; always cleanup after build.
- Local checks passed: TypeScript, Expo Android prebuild (Google services plugin applied), Android Hermes export, native dependency/autolinking checks, 23 profile/domain/legacy-preservation fixtures and 61 blueprint baseline fixtures.
- PostCSS/grpc-js transitive advisories patched; audit remains13 issues (1high Metro image-size build tool,11moderate,1low). Not production-security-cleared. No live login, device test, iOS signed build or production Rules/data mutation from sandbox.
- First attempt42519135169 had a workflow context-expression issue (not an app compile failure); corrected runtime signing path. Superseded42519213101 was cancelled by the dependency-patch build. Current build42519312318 targets commit732b906.
- User must uninstall old sample-only v0.1.0 before first private-key APK; no direct update across different certificates. Later private-key updates keep this identity and increment versionCode.
- Await actual build result and user phone tests before marking Step02 accepted or starting Step03.

### Step02 APK delivered for phone QA — build SUCCESS

- Actual native release compile succeeded on run42519312318 and42520354349; publication was correctly blocked by an overly specific certificate-output parser. Safe annotation isolated the parser issue. Updated parser accepts Build Tools signer label variations while requiring ALL reported certificate SHA256 digests to equal the pinned private certificate; no verification bypass.
- Final run **42521169233 SUCCESS**, source **64c2071e7196fef18f2ac18175f4e27ec8cb1497**: secret validation, npmci/typecheck, foundation/profile fixtures, Android prebuild, private release signing/compile, apksigner verification + exact pinned certificate, metadata/embedded JS checks, artifact upload and always-secret-cleanup ALL successful.
- Run: https://github.com/yasin636/anime-card-assets/actions/runs/42521169233
- APK artifact ZIP: https://github.com/yasin636/anime-card-assets/actions/runs/42521169233/artifacts/13633274850
- Name `AnimeMetaHub-v0.2.0-auth-profile-test`; archive27,370,513bytes; expires2026-11-22T20:48:39Z. GitHub archive digest `sha256:61a659a9a2e05184a2cbc332696d0f93a56346b76734e08664dac10eeef1b269` (archive digest, NOT APK checksum). ZIP includes APK, APK SHA256SUMS.txt and README.txt.
- CI verification is real; device email/Google login, profile write, Storage permissions and offline/relaunch/account-switch QA are NOT yet completed. No production/iOS readiness claim. Step02 remains awaiting user's phone test/acceptance. Do not start Step03 yet.
