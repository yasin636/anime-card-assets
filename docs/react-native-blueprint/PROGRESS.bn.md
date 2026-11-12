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

### Step02 — user phone acceptance reported

User supplied three phone screenshots and explicitly confirmed all requested tests successful: Email/Password and Google login; existing XP/Gold/Gems; username/Bio/avatar persistence after closing/reopening; logout and another-account login. Step02 accepted based on the user's reported device results, not sandbox inference. Screenshot shows live3964XP/318Gems/5418Gold and existing featured inventory rendering.

Caveat: first supplied screenshot also contains a `storage/object-not-found` message under the avatar section. It is not established whether this is a historical failed gallery attempt that was subsequently resolved or a remaining gallery-only failure. Preset/avatar display success does not independently prove Firebase Storage gallery upload. Ask a brief clarification before treating gallery Storage specifically as verified; do not change Rules/billing or assume a backend cause from this code alone. No Step03 implementation started in this turn.

### Gallery upload failure confirmed — Step02 follow-up open

User clarified gallery uploads still fail with storage/object-not-found. Login/profile text/preset/account-switch acceptance stands, but gallery Storage QA is FAILED and Step02 follow-up remains open; do not start Step03 yet.

Inspected pinned RNFirebase23.5.0 modular putFile/getDownloadURL implementation and ProfileScreen: upload is awaited before fetching the URL; no evidence of a missing await. Both supplied Android client configs declare anime-meta-hub.firebasestorage.app. A config bucket name alone does not prove the remote bucket is provisioned, accessible or correctly configured. No authenticated Storage API access is available here and no remote bucket/Rules/billing changes were made. Request Firebase Console Storage screen to distinguish provisioning/billing prompt from an existing Files view before choosing a fix. Do not claim a root cause or ship a speculative fixed APK.

### Step03 started — user-approved Cards + Shop/Gacha + Themes scope

User explicitly deferred gallery upload/Cloudinary setup, and authorized moving on. Gallery remains unresolved/deferred, NOT a Step03 blocker. Login/profile acceptance remains intact. Expanded Step03 agreed scope: real Cards inventory/details/equip/unequip/recycle, single-pull Gacha with source rates/pity, all seven theme purchase/equip/effects; private-signed APK and user testing at completion.

Initial implementation in services/economy: pure immutable command planner and internal Admin Firestore transaction adapter, server-generated randomness and idempotency receipts. 27 offline tests passed covering rates/boundaries/pity, exact rewards/prices, instance identity/legacy-preservation safeguards, unknown/ambiguous data rejection, ownership/rarity, theme toggle, repeated operation receipts and failed writes. Dedicated credential-free CI added. These mock tests do not prove actual concurrent Firestore transactions or deployed Rules.

No live endpoint/deployment/Rules migration or account mutation occurred. Native screen/command wiring, trusted billing-free server hosting, token verification and deployed Rules review remain necessary before enabling real spending/rewards. No completed Step03 APK yet; do not call this phase done or substitute the old Step02 APK as a new deliverable. See services/economy/README.md for deployment/security gates. Same-instance multi-slot source behavior deliberately retained pending D35 approval; unknown legacy cards/ambiguous legacy slots require explicit handling rather than silent reassignment/removal.

### Step03 native integration + user-requested Gemini BYOK (in progress)

- Continued interrupted work without assuming prior unfinished actions completed. Added native Cards/details/3-column owned inventory/filter/slots/recycle confirmations, Shop single summon UI/result, seven themes/aura effects, explicit legacy identity preparation and persistent per-UID pending operation replay. No direct client economy write fallback.
- Added trusted HTTP server with revoked-token check, token-derived UID, bounded body, rate cap and sanitized errors. Node22 firebase-admin14.5.0, lockfile and manual free-plan deployment scaffold; no hosting credentials, live deployment or Rules changes made. Backend audit6moderate/0high/0critical. Live economy is gated OFF without reviewed configured endpoint. User still needs private hosting credential/setup and Rules review; cannot claim full Step03 complete.
- User changed AI requirement from original hardcoded Groq to Gemini with user-provided key inside app and5–6 selectable models. Implemented Chat → Gemini settings with per-UID SecureStore key/model save/remove, hidden saved key, live-discovered up-to6 valid Gemini generateContent model choices, direct TLS/header authentication, account/blur abort/clear, current-question-only Sensei request and safe key/quota/safety errors. No hardcoded/shared Gemini key or Groq key reused. Google real API/key and device persistence remain untested; provider quota/cost belongs to user.
- Local checks:31 economy/HTTP tests,5 Gemini fixture groups, TypeScript, SDK compatibility check, native Android prebuild and Hermes export passed. Gallery upload disabled/deferred, preset unchanged. See apps/mobile/STEP03-TEST.md and services/economy/README.md for precise scope/gates; no new APK success claim yet.

### v0.3.0 Collection/Gemini integration APK — actual CI SUCCESS

- Run **42755919457 SUCCESS**, APK source **a8c405b34eff51baea0a8976a89b8b685e4f55ff**. Locked install/typecheck, foundation/profile/economy/Gemini fixtures, native prebuild, release compile, apksigner + exact pinned PRIVATE certificate/metadata/bundled JS checks, artifact upload and temporary-secret cleanup ALL passed. Separate economy CI42755919193 also success.
- Artifact: https://github.com/yasin636/anime-card-assets/actions/runs/42755919457/artifacts/13736640085
- `AnimeMetaHub-v0.3.0-collection-gemini-test`; archive27,497,786bytes; expires2026-11-24T04:37:40Z. GitHub archive SHA256 `7a2a69324773e1125d88e0dcd092a0488bbfec13004f4d567d6322ba6bd69ef4` (archive, not individual APK checksum; APK checksum file inside ZIP). Same private identity as v0.2.0, versionCode3, update in place.
- Test Gemini: More→Chat→Gemini settings; own key→Verify live models→choose→Save securely→Send; relaunch/model change/remove and account-isolation QA. No key requested in chat; no live Gemini API call or physical device test from sandbox. Fewer than6 returned eligible models produces shorter list; no invented model availability/free-quota claims.
- IMPORTANT: this is an integration APK, NOT full Step03 completion. Backend URL only embedded after explicit reviewed-security release gate; no hosting/credentials/Rules migration was performed. As things stand collection read/details and Gemini BYOK are testable; economy mutation buttons are disabled if backend not configured. Owner must authorize trusted hosting credential setup and review actual legacy Firestore Rules/compatibility before live Gold/reward actions. Gallery remains explicitly deferred by user.

### User feedback — Gemini model menu and Settings redesign requested

User reports current selected models do not work and requests replacing auto-selected top-six menu with these exact seven unique IDs, preserving order: gemini-3.5-flash; gemini-3.5-flash-lite; gemini-3.6-flash; gemini-robotics-er-2-preview; gemini-3.1-flash-lite; gemini-2.5-flash; gemini-2.5-flash-lite. gemini-3.5-flash was supplied twice; show it once. These are user-specified IDs, not independently verified model availability. Existing discovery filter excludes robotics and limits six; both conflict with this updated requirement. Future implementation must keep all requested options, with per-selected-model real connectivity/permission/quota errors rather than inventing a successful probe or hiding entries. Screenshot is user evidence for another UI's reported successful gemini-3.5-flash call, not an agent-executed live call.

User requests a real Settings entry, with AI Provider nested inside; Gemini enabled/provider status, model dropdown, optional replacement key input/show-typed toggle, encrypted saved indicator (never show saved key), save/delete and REAL connection test inspired by supplied screenshot. Capability badges (text/image/streaming) must describe implemented/tested functionality, not be decorative promises. Settings must be extensible for later options; existing main eight destinations retained.

AI Sensei should become a separate clean chat experience similar in layout to familiar assistant apps, with settings/key/model management removed from its conversation surface. Full unspecified ChatGPT/Gemini feature parity is not established; implement and track concrete supported chat controls rather than claiming all voice/media/tools exist. User asks to remember these changes and explain the still-blocked Step03 live economy/Render hosting; no new APK/model call/hosting/Rules change performed while recording this feedback. Gallery stays deferred. Previous v0.3.0 is not user-accepted as completed Step03.

### v0.3.1 app-side Settings / Sensei redesign implemented (build pending)

User authorized app-side work first without blocking on hosting. Added header gear and More→Settings→AI Provider, preserving all eight original destinations plus two preference routes. Exact seven ordered model IDs from user's list, robotics included, duplicate removed; removed old discovery/top-six filter. No claim these IDs exist for all keys. Selection is never silently replaced after an API failure.

Central per-UID AIProvider reuses original SecureStore key, normalizes previously saved models/ prefix and persists enabled/model/key securely. Settings has enabled toggle, modal dropdown, optional replacement input/show-new-only, encrypted-saved indicator, Save/Delete, unsaved-change label and REAL generateContent connection test. Only a nonempty selected-model response can show successful test; failures including404/403/429 and no-text never show success. Draft changes/navigation invalidate the result. No actual Gemini key/call used by agent.

Separate Sensei chat now has user/assistant bubbles, selectable text, scroll/composer, Send/Stop, pending/error/retry, New chat confirmation and settings shortcut. No key form in conversation. Display history remains in-memory while visiting settings, clears on New chat/account unmount; only current question is sent to Google. Abort/stale-response guards on stop/navigation/account lifecycle. Image/audio/streaming NOT implemented or advertised as active. Original source token/prompt behavior otherwise documented in SETTINGS-SENSEI-TEST.md; no economy actions or data changed.

Local TypeScript, Android prebuild/Hermes export passed;12 Gemini/security fixture groups +31 economy tests,23 profile fixtures and61 reference checks passed. Version0.3.1/versionCode4; private signing identity unchanged. CI APK build not yet claimed successful. Hosting/Rules gates unchanged, live economy still pending, gallery deferred. Phone tests required, not full Step03 acceptance.

### v0.3.1 APK ready for user phone QA — CI SUCCESS

- Actual run42769472009 SUCCESS, source62a583618ce7839d1ab3ed571f21eb70b1c71af5. Locked install, TypeScript, foundation/profile/Gemini/economy checks, native prebuild/release compile, APK signature and exact pinned private certificate, embedded JS/metadata, artifact upload and always-secret cleanup all passed.
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/42769472009/artifacts/13741124185
- Artifact `AnimeMetaHub-v0.3.1-settings-sensei-test`, archive27,503,341bytes, expires2026-11-24T06:42:50Z; GitHub archive SHA256 `41f3bf2e106f287420a0e7084dbaeeea480b9e76397581ab0e565d70166e161f` (archive, not individual APK checksum). versionCode4 and original private certificate allow update over v0.2/v0.3 without uninstall.
- Ask user to test Settings→AI Provider exact7 dropdown, typed-key show/hide/save/delete/toggle/relaunch, selected-model real probe and separate Sensei Send/Stop/Retry/New chat/keyboard/Back/account switch. Phone and actual Gemini responses NOT verified from sandbox; no user key received/requested. Keep keys hidden in screenshots.
- User authorized app-side work before hosting. Do not ask for Gemini secret or mark Step03 fully complete. Backend hosting/Rules/live economy setup still pending and unchanged; gallery remains deferred. Await phone QA on this Settings/Sensei increment.

### Owner-guided hosting setup and deferred security restoration

User reported v0.3.1 Settings/Sensei successful on phone. Render free web-service configuration screenshots: Node22, current Arena branch, repository root blank, economy npm build/start commands, /health requested, manual/off auto-deploy requested. No successful deployment/live endpoint is yet confirmed. Private credential expected at /etc/secrets/firebase-service-account.json via hosting Secret Files, never Git/APK/chat.

Dedicated anime-meta-hub-economy service account created by owner; project IAM screenshot showed Cloud Datastore User and Firebase Authentication Viewer. Organization key creation restriction iam.disableServiceAccountKeyCreation initially enforced; owner added Organization Policy Administrator to own identity and set a project-only override Off. Owner screenshot confirms one active key and local JSON download; agent has NOT received/read its private contents.

IMPORTANT OPEN SECURITY TASKS: User explicitly chose to defer restoring project policy to Inherit parent's policy/Enforced and asked that this be remembered. Do not represent the project exception as closed. Temporary Organization Policy Administrator role removal is also NOT confirmed and remains pending. Recommend revisiting both before production handoff; do not block the next configuration step solely on the user's deferred restoration or silently change their choice. No organization-wide policy disable was instructed. Existing created key remains a separate secret and would need explicit revocation if exposed; restoring key-creation policy does not revoke it.

Next: owner locally pastes complete downloaded JSON into Render Secret File named firebase-service-account.json; no contents screenshot/upload to chat or public online JSON tools. Keep deployment/live economy blocked pending review/integration requirements; saving a secret alone is not evidence of credential permissions or live readiness. Firestore Rules/legacy compatibility/security review still not performed.

### Staged hosting can now deploy without enabling live economy

Added server-side default-OFF deployment gate. POST /v1/economy returns503 economy-not-enabled before Auth/Firestore access unless server ECONOMY_ENABLED is exactly true. GET /health still works; health is process readiness only, not proof of IAM/Rules/live-economy readiness. Explicit disabled-path and default-off HTTP tests added;33 economy tests pass. Owner can finish Render configuration and deploy with ECONOMY_ENABLED=false without opening transaction endpoint before Rules review. Client-side gate remains separately unchanged. No deployment/credential read/live mutation by agent. Deferred project policy restoration and temporary role removal remain pending.

### Owner confirms first Render deployment Live (source717b23a)

Owner supplied Render screenshots showing Deploy succeeded / Live, source717b23a, public base URL https://anime-meta-hub-economy.onrender.com. No private JSON content was shared with agent. This is owner screenshot evidence of process deployment, NOT an agent-executed live HTTP/Firestore/Auth/Rules/transaction verification. Workspace outbound allowlist does not include this hosting domain. Ask owner to open /health and report result, not to share any credentials.

Keep ECONOMY_ENABLED=false while reviewing actual existing Firestore Rules and legacy client compatibility. Health200 only means process readiness; does not prove IAM permissions, Rules security, or full Step03 completion. Next request: existing Firestore Rules text from owner's console, without publishing changes, then candidate design/emulator/permission/concurrency testing and explicit enablement approval. Render screenshot warns free instances can delay requests50+seconds after inactivity; native25second request timeout retains idempotent pending commands but cold-start UX needs consideration before live release. Deferred key-creation policy restoration and extra temporary role removal remain OPEN as explicitly requested by owner; do not silently consider them completed.

### Existing Rules received; replacement and emulator CI prepared

Owner reports /health returned {"ok":true}. Existing production Rules provided by owner allow every authenticated identity read/write to every document. This exposes cross-account economy, profiles, deletes and receipt forgery; do not enable economy against these rules. Added security/firestore candidate, locked emulator dev tooling and no-secrets/no-deploy CI. Candidate exact native zero-profile initialization, owner-only get, presentation-only edits, no client economy/deletes/receipts, deny unreviewed collections. Existing data not changed. Legacy broader client writes intentionally require future reviewed routes; no claim full blueprint compatibility. Local Java unavailable and emulator download host outside workspace allowlist, so emulator execution delegated to GitHub runner, result pending. No production rule deployment or live mutation performed.

Firestore security emulator CI42897122677 completed SUCCESS, job130113054742 (22s), sourcea1ec39e, including npm ci and npm test per gh run watch. Test source covers6 groups: exact signup, forged initialization, preserved legacy balances/profile edits, protected economy updates, anonymous/cross-account/receipts/queries denial, Admin-equivalent bypass. Detailed log download blocked by outbound host allowlist; no per-assertion log independently downloaded. Production publication and device/new-account QA still unconfirmed. CI URL https://github.com/yasin636/anime-card-assets/actions/runs/42897122677 .

### Production Rules publication reported by owner

Owner explicitly reports Publish completed for supplied strict Rules. Agent has not independently fetched deployed rules. /health success previously reported by owner. Keep server ECONOMY_ENABLED=false and CI economy-review flag disabled: publication alone is not live IAM/transaction/concurrency proof. Next compatibility check on installed accepted APK: existing profile/balances/cards readable, username/Bio save succeeds. No uninstall, resets or reward modifications. Real emulator transaction integration and controlled hosting IAM/transaction verification remain necessary before enabling economy. Deferred organization-policy/temporary-role tasks still OPEN.

### Rules device compatibility accepted; real emulator transactions added

Owner confirms existing balances correct and Bio saves after rule publication. No live spending authorized/executed by agent; server gate stays false. Added actual Admin SDK transaction emulator integration (not mock): concurrent same-ID replay, competing spends cannot overdraw, conflicting replay atomic rejection, per-UID isolation. CI now installs backend locked dependencies and runs Rules+transaction emulator suite. Production IAM/auth-token/Firestore connectivity still separate pending verification; these tests use demo project only.

Emulator Rules + actual Admin transaction CI42898057959 SUCCESS (27s), source d92f2e8, job130116352062. All npm test steps succeeded per gh watcher, demo-only tests. Local33 domain/HTTP tests also pass. https://github.com/yasin636/anime-card-assets/actions/runs/42898057959 . Live service IAM/authenticated transactions and new-signup phone QA remain unverified. Next prepare controlled owner-only live test APK/verification path without marking global ECONOMY_SECURITY_REVIEWED prematurely; no live enablement or new APK built this turn.

### v0.3.2 owner-test implementation (APK CI pending)

Owner authorized next test APK. Added server verified-UID ECONOMY_TEST_UIDS allowlist, global ECONOMY_ENABLED still default false; no email/request-body authorization. Authenticated/revocation-checked rate-limited GET /v1/economy/status only reads caller's own profile, reports no private profile data, no writes. Other users denied mutations even if testers configured. New36 domain/HTTP tests pass. Existing10 emulator groups remain separate.

Native v0.3.2/code5 embeds public test URL using explicit EXPO_PUBLIC_ECONOMY_OWNER_TEST_URL (not global review attestation), read-only check button/selectable own UID, spends UI gated until server permits,90second cold-start timeout, idempotent pending unchanged. Exact7 Gemini/Settings preserved. Owner must manual-deploy backend latest (autoDeploy off), first run no-spend check, then place own UID directly in Render ECONOMY_TEST_UIDS and redeploy; never globally enable economy for test. OWNER-ECONOMY-TEST.md captures sequence and unfinished actual production write/IAM checks. No live mutations or secrets received. Local23 profile/12Gemini/validator36backend pass; local TS blocked only missing private-generated firebase-client module; CI restores Firebase config and generates it before typecheck.

### v0.3.2 signed standalone APK CI SUCCESS

APK source af2fdb3e25eea536ebca0ff609a592cf4f2062c0; Android CI42898971625 SUCCESS8m11s/job130119521472. CI generated private Firebase config, passed TS/validators/profile/Gemini/backend tests, prebuild, release compile, pinned private cert verification and artifact upload/secret cleanup. Economy CI42898971441 SUCCESS. Artifact13802567429 `AnimeMetaHub-v0.3.2-owner-economy-test`,27,504,583bytes, expires2026-11-24T20:56:51Z; archive SHA25665a5edbc2f9f61cf6a239197f47a7b094428b3290931ba16a8b4cc29385a6c98 (not individual APK checksum). Download https://github.com/yasin636/anime-card-assets/actions/runs/42898971625/artifacts/13802567429 . Same private key versionCode5, update without uninstall.

No Render deployment change performed by agent (no Render credentials/API connector); currently known deployed backend remains717b23a until owner manual Deploy latest commit. First safe owner action: manual update backend with ECONOMY_ENABLED=false, install APK, Cards Check server connection no spend. Status404 means old backend; no claim IAM verified until actual authenticated200. Owner UID not yet configured in test allowlist. Never globally enable economy or set reviewed flag yet. Phone v0.3.2 QA and live writes pending; accepted v0.3.1 unchanged baseline.

### Owner phone QA: first real summon succeeds

Owner confirms v0.3.2 installed in place. Render screenshot confirms manual deployment ca294a5 succeeded/Live; later app screenshot confirms authenticated own Firestore read with spending initially disabled, then connection verified/account economy permitted after owner configured test UID. Global ECONOMY_ENABLED=false was instructed throughout; environment full value not independently read by agent.

Owner performed explicitly confirmed500Gold summon and reports everything worked. Screenshot shows Gold5418→4918, XP3964 and Gems318 unchanged, common Kiba Inuzuka, server-confirmed inventory-save message, displayed Rare pity1/10 and Legendary pity3/21. Screenshot is live owner evidence, not agent direct database access. Original13cards observed before summon; post-summon total14 and cold-relaunch persistence still need confirmation. No private key/token received, no agent-triggered spending. No claim real retry/exactly-once/concurrency independently tested in production; emulator evidence remains separate.

Next low-risk QA: cold-close/reopen, Cards total14/new Kiba/balances persist; optionally one common-slot equip/unequip of new instance with explicit confirmation and no spend. Recycle destroys a card and theme purchase spends Gold: neither tested/accepted yet, do not perform silently or mark all Step03 done. Keep owner test access only, global review flag off pending remaining evidence. Deferred key-creation policy restoration and temporary policyAdmin removal remain OPEN, not forgotten.

### v0.3.3 automatic connection feedback fix

Owner reports each restart requires manual check and misleading red backend-setup alarm. Implemented automatic read-only status check after own profile and persisted-pending recovery ready, plus foreground recheck, locked against overlapping checks/mutations; server remains authority, no persisted permission bypass, no auto-spend/replay. Neutral checking text and optional Retry connection for real errors; updated visible old v0.3.1 labels to v0.3.3/code6. Render settings/backend need no change for this mobile-only fix. Added3 source-level regression checks (not lifecycle device proof).48 backend/Gemini tests,23profile/validator pass locally; TS locally blocked only absent generated Firebase client config, CI generates private config before checking. Pending new APK CI/device QA. Owner screenshot after reopening shows4918Gold/3964XP/318Gems and persisted pity1/3;14card total not independently shown yet.

v0.3.3/code6 signed APK CI42909533548 SUCCESS9m1s/job130156219408, source3cf0183. TS/config generation/validators/profile/Gemini/backend3autoconnect structural checks/prebuild/release compile/pinned signature/upload/cleanup succeeded. Artifact13807620839 `AnimeMetaHub-v0.3.3-owner-economy-test`,27,504,899bytes, expires2026-11-24T22:02:53Z; archiveSHA25686287a62a8f092666d9257a79785b95d812fe364b54834c477f7ce0f0bcd2b2a (archive not APK checksum). https://github.com/yasin636/anime-card-assets/actions/runs/42909533548/artifacts/13807620839 . Update over v0.3.2, no uninstall/Render changes necessary. Owner phone QA should cold reopen and foreground return without pressing Retry, see connection auto-authorized and Summon enabled WITHOUT pressing/spending. Do not claim physical behavior verified until owner confirms. Remaining14card/recycle/theme/slot/newsignup/nonowner tests and deferred org security tasks stay open.

### Step03 completion increment: v0.4.0/code7 prepared

Owner accepted v0.3.3 auto-connect and reports equip save, unequip correct, owned-theme equip/relaunch/effect/remove correct, Kiba basic recycle correct Gold/XP. Exact post-recycle balances not screenshot-confirmed; do not assert inferred values as independently observed. Owner requests finish Step03 and authorized automated edge-case work, no new live spending.

Added actual Firestore emulator7theme purchase/concurrent ownership/toggle tests,3rarity duplicate recycle raw stats/allmatching-slot cleanup/replay tests,6slot roundtrip and invalid theme/no-write test. Added7 actual React hook tests with mocked native Auth/storage/network: cold/foreground automatic GET, pending persisted-before-send/cold restart same ID, account isolation, storage fail-closed, switch during token lookup,403/409 semantics, malformed pending. Hardened current-UID recheck after async token retrieval and disable controls on401/403. No backend code change/global access enablement. Release workflow now requires emulator job success before APK build. v0.4.0/code7, release labels/artifact names; STEP03-RELEASE.md separates implementation/automated/phone evidence and security/public rollout limitations. APK/source tests and CI pending at this entry; gallery remains deferred, Settings/Sensei retained, user signoff still required.

Release CI42928211469: emulator gate SUCCESS1m6s (all new purchase/recycle/slot transactions included); Android TS passed, validation failed because React hook tests inherited workflow NODE_ENV=production, where React deliberately omits act. Reproduced locally (act is not a function), fixed ONLY hook-test command to NODE_ENV=test; release build remains NODE_ENV=production. No tests skipped/bypassed; isolated provider URL from repository production env. Re-run required, no APK delivered from failed attempt.

### Step03 v0.4.0 owner release APK ready — gated CI SUCCESS

Final source088c90a03f9e6f0794042816decb4bb37740c8c7 (implementation9991636 + hook test environment fix). CI42928593704 SUCCESS: emulator security job1302213087081m1s, Android job1302217907329m40s. Requires actual Rules+transaction emulator tests before Android;58 node groups (36domain/HTTP+12Gemini+3autoconnect-source+7real-React-hook/mocked-native-IO),23profile fixtures, TS/config generation/validator/prebuild/release compile/pinned private signature/upload/cleanup passed. Emulator suite source comprises6Rules+16transaction groups; no direct production write by agent.61offline reference checks pass locally. Test-renderer deprecated warning and CI action runtime deprecation warnings are nonblocking; no broad dependency-security-clear claim.

Artifact13816175791 `AnimeMetaHub-v0.4.0-step03-release`,27,504,893bytes, expires2026-11-25T00:15:36Z. ArchiveSHA256811fabb424a51f97845a20da035c9cc592f982eb431f78783d3dd0a95551d917 (archive, not APK checksum). Download https://github.com/yasin636/anime-card-assets/actions/runs/42928593704/artifacts/13816175791 . Signed code7 updates private v0.3.3 without uninstall. Current docs HEAD may be newer than APK without runtime differences.

Stage status: approved native Cards/Gacha/Recycle/7themes implementation and expanded automated verification complete for owner release. Accepted phone flows cover auto connection, real Gacha+basic recycle, equip save/unequip and owned-theme equip/relaunch/remove. Do not claim live theme purchase/duplicate-bonus/multi-account-network-failure phone QA done; automated evidence matrix in STEP03-RELEASE.md records these distinctions. Final v0.4.0 packaging/device acceptance remains pending owner install. No additional Gold spending/card destruction requested. Keep current Render configuration; no backend redeploy needed, owner-only access retained as authorized, no global review flag/public rollout enabled. Deferred org-policy protection/temporary-role cleanup and gallery remain explicit separate outstanding tasks. Do not advance next feature stage before owner's release acceptance.

### Step03 v0.4.0 owner release ACCEPTED on phone

Owner explicitly confirms previous balances/cards and normal usage correct, and reports success on delivered v0.4.0 release. Close approved owner-use Step03 (Cards/Gacha/Recycle/7themes) implementation + automated verification + final release acceptance. Artifact13816175791 / CI42928593704 / source088c90a, versionCode7 remain release evidence. No more Step03 Gold spending or destructive QA requested. Do not reopen accepted features unnecessarily.

Acceptance does NOT independently establish all physical failure-mode/duplicate/theme-purchase tests: evidence boundaries in STEP03-RELEASE.md remain valid. No public all-user rollout authorized; keep ECONOMY_ENABLED=false with existing verified-UID owner allowlist, no global reviewed flag change. Gallery deferred; project key-creation restriction restoration and temporary policyAdmin removal still explicitly deferred/open. iOS/public-production and remaining blueprint systems not completed by this acceptance. Next phase requires scope agreed with owner, not automatic deployment of new features.

### Step04 first implementation authorized and prepared, not accepted/complete

Owner explicitly requested starting Step04 and APK. Implemented trusted Arena server module dispatched behind existing verified UID owner gate and idempotency receipts:8segment XP wheel/free priority, atomic400Gold persistent card battle/turns/rewards/no-refund forfeit, rawXP Top10/safe public projection/transactional weekly claim, quiz sessions with private server generation/judgment/indexed answer/skip/close/rewards. Exactly5quiz schema, source fallback on judge error; optional private QUIZ_GEMINI_API_KEY required live, no phone key upload/reuse. No real Gemini quiz call/credential/deployment/live mutation by agent. Stage03 remains preserved.

Native v0.5.0/code8 Arena UI, source5200ms result-bound wheel, battle multi-select/hand/used/AI next/HPDEF/log/results/resume, quiz controls/visible config gate, leaderboard/public inspect/weekly claim. Provisional week Sunday Asia/Dhaka and native Firestore tie order explicitly shown; owner approval of source ambiguity still pending (do not pretend approved). Full duel SFX/motion/public-profile parity polish not finished; test increment not full Step04. STEP04-TEST.md states scope/QA/setup/limitations.42backend unit groups locally pass. New actual emulator groups cover wheel replay, battle fee/reward/ownership/forfeit/resume, weekly query/once, quiz provider mocked endtoend/replay/private answers and no-key failclosed. CI/APK/device/live quiz still pending. Keep global ECONOMY_ENABLED=false and owner allowlist; manual Render latest deployment needed for Arena, existing Rules/private Secret File unchanged.

### Step04 first signed APK delivered-ready; CI verified

Android CI42932854353 SUCCESS: security gate1302356195871m2s, build1302360734517m48s. APK source40e9fc1832e146df31038f77625e606dbb76121b, v0.5.0/code8; TS/config generation/regression checks/prebuild/private certificate/release compile/artifact upload/cleanup succeeded. Artifact13818090379 `AnimeMetaHub-v0.5.0-step04-arena-test`,27,511,492bytes, expires2026-11-25T00:46:01Z; archiveSHA256962721159b81b41c99440fccc88cee154f33f7f39ed799dae3f8a2a56e2f9a27 (archive, not APKchecksum). Download https://github.com/yasin636/anime-card-assets/actions/runs/42932854353/artifacts/13818090379 . Update accepted private v0.4.0 in place, no uninstall.

Latest backend sourceb0eb1a69d0baa0b54d2e63852bb07239009b9fe0 adds immediate enemy-first lethal opening finish/reward and quiz4correct/staleanswer/skipfloor/close tests, no mobile JS changes from APK source. Backend unit CI42932979180 SUCCESS; full latest emulator CI42932979298/job130236034417 SUCCESS, now6Rules+16Step03transactions+7Arena groups. Local43backend +12Gemini+3autoconnect-source+7hook groups pass;23profile/validator passed and CI TS passed. Backend/API gate retains verified owner UID; no global rollout/secret receipt/live mutation by agent.

Owner next actions: download/install APK, Render manual Deploy latest commit (existing ECONOMY_ENABLED=false/test UID/private credential unchanged; no Rules modification), wait Live, open bottom Arena for read-only auto load. Do not instruct new fee/claim without explicit warning: wheel20XP/freepriority, battle400Gold, weekly reward changes balances. Trusted server QUIZ_GEMINI_API_KEY still NOT configured/received; quiz visibly gated, Settings/Sensei key never uploaded. Stage04 NOT fully complete/phone accepted: no actual wheel/battle/weekly/quiz phone QA, no real server Google quiz call, provisional timezone/tie and limited public profile/duel polish remain documented in STEP04-TEST.md. Deferred gallery/org-policy cleanup unchanged.

### Owner rejects Arena visual quality; redesign v0.5.1/code9 prepared

Owner reports Wheel succeeded and Battle system working. Screenshots show win+800Gold/10Gems/30XP/log and current4234XP/358Gems/5918Gold; standings displayed4184XP (stale read). Owner explicitly rejects plain serial name buttons, missing rarity/stats/art, avatarless leaderboard, and profile without featured cards. Do not treat Stage04 as accepted based on engine feedback.

Implemented compact cohesive Arena tabs/hero, offline16original-art cards/rarity/rawstats/numbered selection/filter/sort/large details/deck totals, real VS/hand/gauges/result/log treatment, compact avatar/name/XP rows+podium, pressable identity opens public sheet with avatar/Bio/theme/level/badge/six actual featured slots. Server featured whitelist never includes fullinventory/email/gold/exactgems/privateinstance/session. New read-only leaderboardView refreshes standings on XP change without discarding battle. Public profile no longer falsely assigns rank1 to every identity. Main diagnostics collapsed by default but pending/errors retained. Wheel segmented SVG, Quiz feedback Next added; reward math/trusted gates/Settings/Step03 unchanged. Bundled originals total6.6MB, new assets expected APK increase. No generated character art/new external rights assumption.

ARENA-REDESIGN-TEST.md captures owner visual QA and mandatory manual Render latest deployment for featured projection; no Rules/env/key change required. Added4 presentation/hash/source checks and3 actual React visual tests with mocked native primitives, plus public projection unit/emulator privacy checks. CI/newAPK pending; no physical visual acceptance or independent Android screenshots yet. No live spend, no global access enabling, Quiz still lacks trusted server provider. Stage04 remains partial/unaccepted pending visual fix and remaining scope.

### v0.5.1 redesign signed APK CI SUCCESS, owner visual QA pending

Source69d36a2382df00ae15ab723875608390435c76f2. Android CI42999634690 SUCCESS: security30emulator groups job1304522749501m6s, build1304527919937m52s. CI TS/private config,23profile fixtures/validator,73node groups (44backend+12Gemini+3autoconnect-source+4presentation/hash+7providerhooks+3rendered-component tests), prebuild/release compile/private pinned certificate/upload/cleanup succeeded. Separate backend CI42999634573 and emulator CI42999634574 also SUCCESS. Component/native IO mocks are NOT Android pixel tests. No user live account mutated by agent; all server transaction tests demo emulator only. No new paid service/credential/billing.

Artifact13846575074 `AnimeMetaHub-v0.5.1-arena-redesign-test`,32,564,942bytes, expires2026-11-25T10:06:34Z; archiveSHA256d41206b72058622891441c2f98d100cf8ba4b7aaf4606f37a0b8b5256cb82ef8 (archive, not individual APKchecksum). https://github.com/yasin636/anime-card-assets/actions/runs/42999634690/artifacts/13846575074 . Same private certificate/code9 updates installedv0.5.0, no uninstall. APK larger because original16card images now offline. Render manual Deploy latest commit required for projected featuredSlots/badge and leaderboardView; no env/Rules/key change. Final handoff should direct owner to Arena tabs Battle and Rankings, tap avatar/name for public profile, longpress card for details. No new battle/spin/weekly claim needed for visual acceptance.

Owner has NOT yet accepted redesigned appearance or run new APK. Step04 remains open: live quiz trusted key/config/QA, remaining source duel SFX/motion parity and provisional timezone/tie approval unresolved; Season01 text in hero is cosmetic, NOT implemented seasonal rank reset/reward system. Preserve accepted Step03 and Settings/Sensei. Deferred gallery and project key-policy/temporary-role removal still open per owner. Do not claim world-best design or physical visual QA; owner decides after install.

### v0.5.2/code10 card artwork frame-size hotfix

Owner says redesign partly acceptable but screenshot IMG_20261111_161759.jpg shows artwork zoomed/clipped to top corner. TradingCard Image used absolute edge offsets without explicit dimensions; native intrinsic bitmap sizing could exceed clipped frame. Replace with named cardImage style position:absolute/left0/top0/width100%/height100% and contain resizeMode, preserving aspect-ratio parent and original image bytes. Shared card component fixes selection/VS/detail/public showcase image sizing. Real React visual regression now asserts explicit image width/height/contain. This test does not prove native pixel fit; owner phone QA required. Mobile-only patch, no backend/Rules/env/key change and no live spending. v0.5.2/code10/APK CI pending; do not claim image fit verified on physical phone before owner confirms.

v0.5.2/code10 CI43002803307 SUCCESS: security1304628109011m10s and Android1304633826177m32s. Source4ddb501aab45a99f4279c1a7dcfd8554b7627d9c. TS/config/validator/regression tests/prebuild/release/pinned signature/upload/cleanup passed. Artifact13847272978 `AnimeMetaHub-v0.5.2-arena-redesign-test`,32,564,675bytes, expires2026-11-25T10:28:35Z; archiveSHA25664957b6ee0b7f3649c9a18a7a944821816ee2b4af42597fad2c8100deaa20ef4 (archive not APK checksum). https://github.com/yasin636/anime-card-assets/actions/runs/43002803307/artifacts/13847272978 . Mobile-only hotfix: update installed private APK without uninstall; no Render/backend/Rules/env changes required for this fix. Owner must confirm actual image fit after install; local rendered-prop assertions are not a native pixel test. No new Gold spending needed. Owner partially likes redesign but final visual acceptance and broader Stage04 pending unchanged.

## v0.5.3 — Step04 implementation completion, owner acceptance pending
একই Settings Gemini key/model: Sensei direct, Quiz trusted HTTPS backend transient headers; কোনো দ্বিতীয় key নয়। Server-validated five-question/restart/resume/reward/retry, weekly claimed state, confirmed battle artwork/damage/shield animation ও original toggleable SFX। Existing artwork/economy unchanged; owner-only access retained. Render latest deploy required, no new Firebase/Rules/config. See apps/mobile/STEP04-COMPLETION.md. Live Google/quota and phone acceptance not performed. Gallery ও temporary GCP exception/role cleanup deferred.

### v0.5.3 signed APK delivered
- Source: c44481729066b0f47b8dc9c6b0716138b1af5e5f (implementation 9e1051c).
- CI 43009924762 SUCCESS: Firestore emulator security/transactions/HTTP checks, TypeScript, mobile/provider tests, native build and pinned signature/bundle verification passed.
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/43009924762/artifacts/13851046239
- Artifact: AnimeMetaHub-v0.5.3-arena-redesign-test, 34,604,633 bytes; archive SHA256 0efa9e5ea447c7013b9bbb1e2fb3d411a43f60f5c4c21a7b06ef0d609b3e7b57.
- Local: 49 server tests, 19 Gemini/autoconnect/presentation tests, 16 provider/broker/visual tests, 23 profile checks and foundation/autolinking validator passed. Local TypeScript lacked ignored generated Firebase config; CI securely generated it and TypeScript passed.
- Needs existing Render service Manual Deploy latest commit, then install update and Arena refresh. No extra AI key/config/Rules. Live Google/provider/phone/weekly acceptance still pending; implementation complete does not mean owner acceptance complete.

## Step04 owner acceptance + Step05 approvals
Owner explicitly confirmed all successful and Quiz working; Step04 accepted. This is owner-reported phone acceptance, not an independent agent device test.

Step05 scope discussed: complete Adventure/Solo Leveling Story (5 chapters/11 enemies, source dialogues, dedicated server-authoritative combat/rewards/clears/shadows and ARISE presentation). Owner explicitly approved D16: once per battle ARISE, reset every new battle. Enforce authoritative persisted state, no repeated stat stacking on retries/concurrent operations. Story implementation is not complete and no Step05 APK exists yet.

Owner praised existing Quiz question quality and requested Bengali questions alongside Step05. Implemented backend instructions for fluent Bengali questions/hints/explanations, original proper names allowed, unchanged factual quality/variety, and Bengali/English/transliterated answer judging. Increased output budgets for Bengali JSON. Added two mocked provider-contract tests; all51 economy tests pass locally. This tests instructions/transport, not live Gemini language compliance or translation quality. Existing active Quiz sessions retain their stored questions; new generation after deploying latest backend uses Bengali instructions. No extra Gemini key, translation request or client credentials change. Transient first-word grading fallback remains source behaviour and is not claimed bilingual semantic grading. Bengali fallback explanation added. Backend deployment not performed by agent; include with Step05 release unless owner requests earlier deployment.

## Step05 v0.6.0 implementation — owner APK requested
Story engine services/economy/story.cjs + Adventure StoryScreen: five chapters/11 original enemies/dialogues/art, source stats/combat, explicit transactional first/repeat rewards, persistent sessions, shadows, D16 once-per-battle ARISE/reset, no Story Gemini call. Bengali Quiz prompt change included. See apps/mobile/STEP05-RELEASE.md for native audio/motion equivalents, D18/D19 safety resolutions, deployment and phone acceptance. Gallery/GCP cleanup deferred. No live mutation or reset by agent. Tests/build acceptance recorded below only when actually successful.

### Step05 signed owner APK — v0.6.0 / code12
- Source 2c6e59ddadb52e777ca11d10d9397fe79b44d51f; Android CI43018182017 SUCCESS, economy domain CI43018181982 SUCCESS.
- CI security/emulator (including Story API ownership, same-ID/concurrent ARISE/claim, failed-transaction first-clear recovery and Rules tampering denial), TypeScript, all configured React/unit checks, native compile, pinned private signature and embedded bundle verification passed.
- Artifact download: https://github.com/yasin636/anime-card-assets/actions/runs/43018182017/artifacts/13853473838
- Artifact AnimeMetaHub-v0.6.0-story-test, 36,088,418 bytes; archive SHA256 ad760a9b36229a0a95af63f3ce0a922f2a2792a185066349a39f4a19f4c65e59.
- Local: 62 economy unit tests (11 new Story), 21 real-React provider/broker/visual/Story tests with mocked native/network IO, 19 Gemini/autoconnect/presentation tests, 23 profile checks, 61 offline reference fixtures and foundation/autolinking validator passed. Local TypeScript lacked ignored generated Firebase client config; CI securely generated it and TypeScript passed.
- Handoff: existing Render Manual Deploy latest branch, no new keys/Firebase config/Rules/billing. Install over accepted app without uninstall. More → Adventure; begin Chapter1 normal enemy, dialogue/combat/resume/claim, verify reward+Shadow, repeat XP-only; Chapter2 ARISE once then reset next battle. New Quiz after backend deploy should request Bengali.
- Owner phone acceptance, live Bengali Google output, intended Baruka artwork confirmation and optional device TTS quality pending. Not independently tested on Android device/iOS; native effects/audio equivalents rather than exact original external voice/107-keyframe closure. Deferred Gallery/GCP cleanup and legacy-browser import remain explicit in STEP05-RELEASE.md.

## Step05 accepted; v0.6.1 visual upgrade requested
Owner confirmed all Step05 tests successful with screenshot showing Chapter2 Archer turn5, ARISE active/used, balances4286XP/365Gems/5748Gold. User now authorizes combat presentation proposal plus anime-style System screens from five attached examples. Implemented mobile-only navy/cyan holographic notifications, Story/arena/weekly/Quiz/Wheel settlement displays with real values/no invented penalties, chapter vector battlefields, confirmed attack/damage effects, compact dock/cooldown, visible summoned formation and persisted reduced/sound/haptic controls. No backend/economy/rule changes. See apps/mobile/SYSTEM-COMBAT-TEST.md. Physical-device visual acceptance pending; deferred Gallery/GCP tasks unchanged.

### v0.6.1 signed visual-test APK ready
- Source233fa1fdc5db75faa7a5f1b0794eb56a1fde20b8; Android CI43028695510 SUCCESS: emulator security/transactions, securely generated Firebase client + TypeScript, configured unit/React/foundation checks, native release compile and pinned private certificate/embedded bundle verification passed.
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/43028695510/artifacts/13858963655
- Artifact AnimeMetaHub-v0.6.1-system-combat-test, 36,109,730 bytes; archive SHA256 e6046e664d31e09c8d878dbdd3ead1538cefc40fd45a6c17d3f4342e41860509.
- Local 62 server unit tests,26 mocked-native React provider/broker/visual/Story tests (9 Story/System),19 Gemini/autoconnect/presentation tests,23 profile checks and foundation/autolinking validator passed. Local TS lacked ignored generated Firebase client config; CI generated it and TS passed.
- Mobile-only: keep accepted Step05 backend; no Render deploy/config/Rules/key/billing changes required. Install over previous app, don't uninstall. Native effects inspired by supplied references; physical-device appearance/smoothness acceptance pending, no exact screenshot-parity guarantee. Owner should inspect free-entry Story victory→explicit claim→verified acquired popup, loss0 deductions, compact controls/formation and reduced/sound/haptic preferences. Extra paid Arena/Wheel actions not required just for UI testing.

## Narrative expansion authorized — Part1 v0.7.0 / code14
Owner confirmed v0.6.1 System reward/claim flow via two Goblin screenshots. Owner approves all8 concepts plus earlier natural Bengali opening/aftermath/skip/replay plan; wants work started. Implemented first incremental mobile-only part:5 authored chapter openings/anomaly clues,11 enemies' slot-compatible natural Bengali dialogue/aftermath/Echoes, state-based boss reaction, cosmetic chapter choices and account-scoped device-local Archive/recap with honest locality/failure labels. Not official anime canon. No AI/quota/backend/rule/economy changes. See apps/mobile/NARRATIVE-PART1-TEST.md for exact included vs pending scope. New Living Gate choreography, Signature Boss Moments, expanded Chronicle, later branching and cloud Archive remain pending; do not call all8 complete. Physical-device narrative acceptance required.

### Narrative Part1 signed APK v0.7.0 / code14
- Source0cef5cde3f5609464ae6b00af9bd06345f01b55e; Android CI43041816716 SUCCESS: emulator security/transaction suite, TypeScript with securely generated client Firebase config, all configured native-mocked React/unit/foundation checks, native release compile and private pinned signature/embedded bundle verification passed.
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/43041816716/artifacts/13866537175
- Artifact AnimeMetaHub-v0.7.0-narrative-part1-test,36,125,872bytes; archiveSHA256 63a9e9cab0c8071224ec61a79d3a6ec1d3a6aafa012083b9598ab79b2d7fa568.
- Local30 React tests (13 Story/System/Narrative),62 economy unit tests,19 Gemini/autoconnect/presentation tests,23 profile checks and foundation/autolinking checks passed. No physical-device story/visual acceptance or new live provider test performed.
- Initial CI43041195538 failed dependency installation: app version string replacement also touched dependency metadata. Corrected all eight mismatched dependency version fields to the already-pinned resolved tarball versions; URLs/integrity/dependency selections unchanged, no major upgrades. Production npm ci now passes; added invariant to reject lockfile metadata/version drift on future bumps. Failed/old run not delivered.
- Mobile-only, no Render deploy/key/config/Rules/billing. Update in place. Existing players get full new opening on first narrative visit even if enemy was previously cleared; subsequent visits shortened, replay always available. Archive remains device-local per UID, not cloud; account data/economy unchanged. First-part owner acceptance pending. Full eight-feature upgrade remains incomplete per NARRATIVE-PART1-TEST.md; Gallery/GCP cleanup still deferred.

## Narrative Part2 v0.7.1 / code15 — verified handoff
- Owner accepted Part1 and authorized next part. Part2 adds Living Gate rune/particle/environment movement and confirmed event reactions; five individual boss motifs + original synthesized stingers; skippable signature input locks with background/focus/sound/reduced preferences; authoritative optional Chronicle counters and explicit complete/partial/unavailable labels; cosmetic choice reactions in later intro; local Archive expansion. Rewards, RNG, power and once-per-battle ARISE unchanged. Cloud journal remains out of scope; Gallery/GCP cleanup still deferred.
- Source3d3632a0af224973ab80ef0ccb6802f4c3e4c17f. Android CI43051356033 SUCCESS including emulator security/transactions, generated-config TypeScript, configured unit/mocked-native suites, release compilation, pinned private signature and embedded JS verification. Independent security43051339206 SUCCESS; economy43048809443 SUCCESS. Local64 economy and16 Story mobile tests pass, foundation validation passes. Device QA pending.
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/43051356033/artifacts/13869398799
- Artifact AnimeMetaHub-v0.7.1-narrative-part2-test;36,322,849bytes; archiveSHA256 9de21750530e5239c9821af3dedc0df2a99e9f158ce49204f4e02b8d488e5846.
- Required: manual latest-commit deploy to existing Render economy service (autodeploy off), then NEW battle for complete Chronicle. No new key/Rules/billing. Old backend remains playable with capability warning; old active battles partial, no reconstruction. Update app in place, do not uninstall.
- CI43048809651 compiled/verified APK but failed packaging README due to working-directory path; fixed. Subsequent43050574339 (including retry) and43051073684 failed security tests; downloadable remote logs unavailable, generic diagnostic output was truncated. Added focused failing-assertion Checks diagnostics without bypass/relaxation; both final independent/security reuse runs passed unchanged tests. Earlier intermittent failures not root-caused; don't misrepresent as fixed security defect or deliver failed artifacts.
- See apps/mobile/NARRATIVE-PART2-TEST.md for scope and phone QA. Eight narrative categories now have implementations; this does not establish exhaustive design parity or owner acceptance. Await feedback before further implementation.

## Owner-reported boss entry exit / missing ARISE — v0.7.2 code16 hotfix
- Owner reports v0.7.1 exits on boss entry; on relaunch battle resumes. ARISE presentation also absent. Part2 physical-device acceptance is NOT complete.
- Fixed concrete shared-object lifecycle bug: SignatureMoment changed useAudioPlayer source on cue transitions, releasing old native player during render before effect cleanup paused it. Stable null-source player now explicitly replaces tracks; synchronous native audio errors and async play/seek rejection contained. Exact owner-device crash cause remains unconfirmed without logcat; no claim of on-device verification.
- ARISE picker and presentation share one native modal, avoiding simultaneous picker dismissal and second-modal show. Full cinematic retained for normal effects; Reduced mode now gives static confirmation instead of silently skipping presentation. Background/focus cancellation and tap/Back preserve server once-per-battle behavior.
- Regression19 Story tests include all five source transitions/released cleanup and normal/reduced single-modal ARISE visibility/input lock. Local36 React tests +64 economy unit tests and foundation validator PASS. No backend/economy/Rules/config/key changes for hotfix; no Render redeploy needed if Part2 counters already deployed.
- Source02429b430694a874ab5401bdbfe41d335724705e; Android CI43057932821 SUCCESS (security/transactions, generated-config TypeScript, configured automated suites, release compile, pinned private signature and embedded bundle verification).
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/43057932821/artifacts/13873256743
- Artifact AnimeMetaHub-v0.7.2-story-animation-fix-test;36,322,908bytes; archiveSHA256 a1bef950030ad734e7606e3fb132cd590bd697153bb87bc5d4026bd51d9e549b. Update in place. See apps/mobile/STORY-ANIMATION-FIX-TEST.md; owner should retry boss entry and ARISE in a NEW chapter2+ battle. Device verification/feedback pending.

## Step5 owner acceptance / Step6A authorized and delivered for phone QA
- Owner confirmed v0.7.2: “হ্যা এবার সব ঠিকাছে”, then accepted Step5 scope and explicitly authorized first6A Text Feed/comments/reactions/trusted XP. No new6B/6C implementation authorized before incremental APK QA. Step5 device acceptance recorded; cloud journal/gallery/GCP cleanup deferrals unchanged.
-6A v0.8.0/code17 source8551d6d4954d6013f34b6eae59005c5b01a8c5c4: required-caption text composer + optional HTTP(S) link, per-UID device draft, newest60 visible feed with refresh/entry/resume (not push subscription), author avatar/badge/theme/public profile, post/comment own-only edit/delete, independent Like and6emoji reactions, actual XP/creator receipt. Daily10UTC quota enforced in transaction (delete no refund),7day normal hide/admin old visibility retained. Verified token admin claim only for new exemption, never mutable username.
- All social reads/writes/XP/progress/claim via existing authenticated owner-test API. Strict Firestore client Rules unchanged; direct social/quota/receipt access remains denied. Atomic persisted operation receipts, ownership validation and rollback; source re-like/repeated-copy economics preserved and explicitly disclosed (no silent per-post reward cap). Social missions2posts/10combined like-comments and exact50G/15or20XP/5Gems once/date. Other mission progress retained; other claim surfaces not part6A.
- Copy uses actual native clipboard then trusted share command; functional installed-app scheme animemetahub://post/{id}, not invented HTTPS host. No web universal-link support. Legacy unknown fields and timestamps retained; gallery/uploads/video player deferred explicitly. Unsent comment text retained over refresh only; composer persisted locally per account. See apps/mobile/SOCIAL-6A-TEST.md for exact boundaries/phone tests.
- Android CI43064349320 SUCCESS: reused emulator security/transactions incl new social tests, generated-config TypeScript, configured regression suites, native release compile, pinned private signature and embedded JS verification. Economy43064349221 SUCCESS. Local67economy unit tests,42native-mocked React tests incl6social/19Story,23profile and61reference checks, foundation/autolinking checks PASS. Physical-device/two-account/live social acceptance NOT yet performed.
- Independent security43064349467 failed an existing weekly-concurrency assertion (zero successes; no social assertion failed), while Android reused suite passed. Prior suites shared one emulator project while leaderboard query ran beside unrelated fixture writes. Commit4be777305835cab5c00418964e0efa1d5bd928d2 isolates admin test suite namespaces and adds rejection detail to the weekly assertion; no production logic/test assertions bypassed. Independent43065115018 SUCCESS. Contention suspected, exact earlier rejection code unavailable; avoid overstating root cause. APK runtime code unchanged by test-only commit.
- Download: https://github.com/yasin636/anime-card-assets/actions/runs/43064349320/artifacts/13875912062
- Artifact AnimeMetaHub-v0.8.0-social-feed-6A-test;36,354,350bytes; archiveSHA256 f5bcfe977a502b6a92307a685c1f394b45656b2c0b3362cf73fea1a05c01d2ba.
- Owner action: manually deploy latest current-branch commit on EXISTING Render service (autodeploy off), update APK in place, Feed Refresh. Agent has NOT deployed Render or modified real posts/balances. No new key/billing/Rules publish/composite index. Existing UID allowlist retained, not a public-community rollout. Await phone acceptance before6B; media decision separate.

## Step6A accepted; Step6B implementation — APK BLOCKED by GitHub email verification
- Owner: “Ok সফল হইছে এবার 6B শুরু করো”.6A accepted,6B authorized. Implemented source93fe48d893f17f136f91cee4311d9b34ac235b35 v0.9.0/code18 on current branch. No6B APK delivered; do NOT mark6B accepted/complete or proceed6C.
- Chat Messages/Global/Sensei tabs retain GeminiScreen single saved provider. Server-projected case-insensitive search with explicit100-user scan batches, public-profile→DM entry (Feed/Arena/chat), avatar/badge/level/theme, own-delete, DM membership/collision/orphan checks, atomic unread and recent30 shortcuts, newest50 stable timestamp+docID history pagination. Global multi-emoji independent toggles; Global sends0XP, combined Global/Quiz communityActions capped3 and trusted once/date250G/40XP/10Gems claim. No OS push/E2EE/typing/read-receipt/DM reactions/media claims.
- API polling ~6s active messages/~15s foreground inbox;30s presence heartbeat70s expiry, background/logout best effort; sequence/lease guards and cleanup. Separate per-UID persisted chat pending IDs (retry/relaunch/token-switch safety), local per-peer drafts and original short pop. Strict direct client Rules unchanged; same existing owner allowlist and service account. Dedicated /v1/chat budget avoids spending gameplay quota; nonchat commands rejected at chat route. Read/privacy/ownership/clock/reward derivation server-side. No real messages/accounts/balances modified by agent.
- Local69 economy unit tests +51 native-mocked React tests (9chat) PASS; foundation/autolinking validator PASS. Local TypeScript reports only missing ignored generated Firebase config; full CI generated-config TypeScript/build unverified. New emulator6chat cases + explicit Rules-denial test added; independent security43070869161 SUCCESS and economy43070868932 SUCCESS.
- Initial reused security43070868891 failed Global concurrent test with Firestore emulator `3 INVALID_ARGUMENT: Transaction is invalid or closed`; independent same-commit suite passed. Exact transient cause not confirmed; failed gate not bypassed. Attempt to rerun failed jobs then fresh dispatch43071215976 both now conclude startup_failure with NO jobs/artifacts.
- CONFIRMED external blocker from actual GitHub Actions run page https://github.com/yasin636/anime-card-assets/actions/runs/43071215976 : annotation **“Please verify your email address to run GitHub Actions workflows. https://github.com/settings/emails”**. No APK/artifact ID exists. Do NOT invent link or claim signed/build verification. User lacks old-email access per prior context: suggest accessible email addition/verification through official GitHub Settings→Emails if available; never ask for password/token/OTP, never promise account-verification bypass. No code/signing changes can legitimately bypass this account gate.
- Next: after owner confirms GitHub email verification, dispatch Android test APK workflow on CURRENT branch, wait for security+generated-config TS+regressions+release compile+private signature/embedded bundle+artifact upload SUCCESS; fix actual failures, then verify artifact metadata and deliver actual link. Same code17 app stays usable until tested code18 replaces it. New6B backend requires manual latest-commit deploy to EXISTING Render (not done), no new key/billing/Rules/composite index; await APK readiness before directing owner tests. Full6B limits/test plan in apps/mobile/CHAT-6B-TEST.md; owner two-authorized-account phone QA required after APK delivery.
- Follow-up: documentation commit aea77ce saved locally, but `git push origin arena/cd835a4c-anime-card-assets` also failed HTTP403 with explicit remote message “You must verify your email address.” This is the same confirmed account gate, not a request for credentials. Runtime source93fe48d was already pushed successfully; later local documentation remains preserved. After email gate resolution, push pending commits to this SAME branch before workflow dispatch. Do not repeatedly retry unchanged blocked push.

## Step6B email gate resolved — verified signed APK v0.9.0 / code18
- Owner confirmed email verification and authorized continuation. Push of previously local documentation to SAME active branch succeeded; workflow dispatch accepted and ran. No further email/credential request required. Prior GitHub email gate is resolved based on observed push+runner success, not a promise that future service failures cannot occur.
- Android CI43076588278 SUCCESS, source5407953ce85e3a82ae047d38b6c2baec34e9cfc7 (runtime code93fe48d unchanged): reused security/emulator transactions including chat tests, securely generated Firebase client TypeScript, all configured regression/foundation/native checks, standalone release compile, pinned PRIVATE signature/embedded JS verification and artifact upload PASS. Earlier failed/startup-blocked runs are not the delivered build.
- Actual download: https://github.com/yasin636/anime-card-assets/actions/runs/43076588278/artifacts/13883365930
- Artifact AnimeMetaHub-v0.9.0-community-chat-6B-test;36,380,215bytes; archiveSHA256 05974d24940722c07776f8bc42f3b5d781b27cd2bea34d589600b6045a62a54d; API verified exists/not expired. This digest describes the artifact archive, not the APK file inside (use bundled SHA256SUMS.txt).
- Owner handoff: update in place; manually deploy latest current-branch commit on EXISTING Render economy service, then More→Chat (Messages/Global/Sensei). Agent has NOT deployed Render or touched real chat/account data. No new key, billing, Rules publish or composite index needed. Same owner UID test allowlist retained. Use already-authorized test accounts for actual two-way DM/unread checks; no public rollout/allowlist expansion inferred.
-6B runtime/physical-phone/two-account acceptance still pending. Live view refresh ~6s and foreground inbox~15s, not OS push. See apps/mobile/CHAT-6B-TEST.md; retain older APK app data/key/journal/drafts. Wait for phone feedback before6C. Previously deferred gallery/cloud journal/GCP cleanup remain deferred.


## 6C release candidate — 2026-11-08
- Owner accepted 6B; authorized Tracker/News/community integration, media deferred.
- Checkout provenance resolved by safe backup + fast-forward to existing remote 4aa3b07 on the same branch.
- Trusted Tracker, Jikan airing catalog, ten-second reading sessions, UTC five-read cap and shared five-mission reward claims implemented. Native tabs + Feed entry points added.
- v0.10.0/code19 candidate; backend 78/78, tools 75/75 locally. Generated Firebase configuration typecheck and security emulator run are CI gates, not claimed locally.
- Phone acceptance remains required after signed build; owner manually deploys existing Render backend. See apps/mobile/COMMUNITY-6C-TEST.md.

### 6C signed APK delivered for phone acceptance
- Runtime/build source: `63dc709` (v0.10.0/code19), Android run `43086308838` rerun **SUCCESS**. Security emulator, generated-config TypeScript, full regression checks, release compile and pinned private signature/embedded JS checks all passed.
- Artifact `13887506992`: AnimeMetaHub-v0.10.0-community-6C-test; archive 36,390,258 bytes, SHA256 `3a5dd1f61b5758dc38f6dbf862d4c248536412a2d0d115d351328119c9bf1eb0` (archive, not APK; APK digest is included in SHA256SUMS).
- https://github.com/yasin636/anime-card-assets/actions/runs/43086308838/artifacts/13887506992
- Local backend 78/78; tool/native 76/76; foundation validation passed.
- Initial runs exposed old pinned version assertion (fixed) and intermittent existing concurrent recycle emulator INVALID_ARGUMENT. Serializing test files did not fully eliminate that transient error: the unchanged final-source rerun passed. No test was removed, reward gate bypassed or live account mutated.
- Agent did not deploy Render. Owner must deploy source 63dc709 or descendant to the existing service, retain existing configuration, then update APK in place and perform COMMUNITY-6C-TEST.md checklist. Media remains deferred; awaiting phone acceptance.

## 6D started — Cloudinary Free image media
- Owner explicitly accepted 6C and authorized profile Gallery + Feed photo (not video). Cloudinary Image and Video Free/$0/25 credits confirmed by owner's screenshot; owner reports saving three environment variables in Render (Save only). Agent never received or requested full secret.
- Current branch safely fast-forwarded to existing remote 65e1f32 before starting; no local differences lost.
- Added media signed preparation, provider-verified finalization, UID-scoped sessions, per-day prepare quota and idempotent receipts. Feed attachment consumption occurs atomically with existing post/XP/quota/mission transaction.
- Backend local 86/86 passed. Added Rules denial coverage; emulator not run yet. No mobile UI enabled, no new APK/deployment claimed.
- Remaining: folder-permission bootstrap, real cleanup execution, native upload retry/cancellation/draft lifecycle, emulator/security and signed release. Details: apps/mobile/MEDIA-6D-TEST.md.

### 6D signed owner-test candidate v0.11.0/code20
- Added native Gallery/resize/JPEG preview, persisted account-scoped signed upload workflow, retry/stop/background handling, Profile photo and one-photo Feed composer. Video deferred.
- Added provider destroy + bounded delayed server cleanup worker. Reference checks/attachment locks prevent deletion of linked media; failed jobs retry. Free Render sleeping delays cleanup, and invalid uploads can temporarily consume storage before finalize rejects them.
- Added seven native photo tests and emulator concurrency/cleanup/Rules denial coverage. Backend 86/86 locally; tool suite expected 83 after new photo cases, signed CI authoritative for full generated-config TS/security/build.
- Critical remaining owner setup: Media Library User key needs explicit API-assigned folder permission on animemetahub; selection of role alone is insufficient. No root credentials requested, no silent Master Admin promotion, no live provider upload or Render deployment performed. APK is an owner-test candidate, not proof that Cloudinary permissions work.

### 6D signed APK verification result
- Build/runtime source `625e19a8ac7a629a24e6b62a2a3f16155e9e8f50`, v0.11.0/code20.
- Android run `43101239269` **SUCCESS** on first attempt: security/emulator (including new media concurrency/cleanup/Rules tests), generated-config TypeScript, foundation/native/backend regressions, release compile, pinned private signature/metadata/embedded JavaScript verification, artifact upload.
- Artifact `13891489210`, `AnimeMetaHub-v0.11.0-gallery-photo-6D-test`, 36,388,434 bytes, not expired at verification. Archive SHA256 `bdbe6e7d490b2f13fa804f995d48df6c3c53d47313f5926e7cc0fde5c5078599` (archive, not APK; bundled SHA256SUMS is APK digest).
- https://github.com/yasin636/anime-card-assets/actions/runs/43101239269/artifacts/13891489210
- Local full checks: backend 86/86, tool/native 83/83, foundation PASS.
- Deliver as owner-test APK. Actual Cloudinary upload/delete and folder permissions are NOT live-verified. Media Library User role still requires explicit folder access bootstrap; do not present this as completed configuration. Agent did not deploy Render or access owner credentials.
- Owner: deploy latest branch to existing Render service, update APK in place (no uninstall), test profile/Feed photo and existing feature regressions. If permission error appears, report error-only screenshot; do not send secrets, alter billing or auto-promote Master Admin. Video remains deferred, waiting for phone feedback.

### 6D upload failure diagnostics patch v0.11.1/code21
- Owner screenshot showed generic permission error after direct upload started. Exact cause unconfirmed: previous code conflated HTTP401/403 and did not distinguish credential/signature/folder causes.
- Added safe allowlisted provider error codes on native direct upload and backend inspect/destroy, plus request stage labels; raw provider error bodies never returned/logged.
- Added optional owner-run folder Editor grant/revoke tool: default offline dry-run, interactive exact-folder consent, separate local admin credential with hidden secret prompt; never sends secret to agent/backend, never grants global Master Admin or changes billing. Provider role request not live-verified; owner-only action still required if actual folder access is missing. Bengali guide included.
- Native regression and setup/error tests added; full generated-config TS/security/signed build is CI gate. No real Cloudinary request or Render deploy performed.

### v0.11.1 diagnostics APK verified
- Runtime/build source `d5dd997e5c6e86826e688b0cc845d3ede6345551`; Android `43125659015` **SUCCESS**: security/emulator, generated Firebase TS, regressions, compile, pinned signature/metadata/embedded JS checks and artifact upload.
- Artifact `13902213823` / `AnimeMetaHub-v0.11.1-gallery-photo-6D-test`; archive 36,390,031 bytes, SHA256 `35a2ad8bdfaa0943a6032cff3c0a095c46cb7246c7500844802c576497bc3a68` (archive, not APK).
- https://github.com/yasin636/anime-card-assets/actions/runs/43125659015/artifacts/13902213823
- Local backend 87/87; native/tool 89/89; foundation PASS.
- This fixes misleading error classification, NOT proven live upload failure resolution. Owner still needs backend deploy + APK update and a fresh upload/error-only screenshot. Existing pending sessions may have expired; remove/reselect as needed.
- Optional folder-scoped setup tool prepared and mock-tested, but not run against owner's Cloudinary. Root credentials remain on owner device; no key privilege change, billing change or live deployment performed by agent.

## 7A authorized — Audio controls / owner-test candidate
- Owner explicitly authorized 7A. 6D profile and Feed images accepted including persistence after app reopen; owner reports test post deleted at 10am for cleanup check, but live cleanup has NOT been verified. Video stays deferred.
- Safe checkout fast-forward to existing remote 8ab0b4c before implementation; no branch switch or owner files lost.
- Added account-scoped AudioProvider, Music & sound settings, Play/Pause/Restart, Repeat/Continue wrap, independent music/SFX volume and global SFX/voice gate over local Story/Arena/Chat toggles. No autoplay on startup/foreground; background/inactive stops playback. Stable players and late-seek guards.
- Added common clicks, confirmed-operation reward/summon cues, timed wheel ticks/end. No balance/RNG/backend-command changes; no backend deploy needed for this audio-only update.
- Three original ambient DEMOS generated reproducibly + CC0 provenance notice, clearly NOT Dark Aria/Kamado Tanjiro/Suzume recordings. Source/license and owner acceptance of native music alternatives remain open; exact soundtrack/Web Audio/107-keyframe parity NOT claimed complete.
- v0.12.0/code22 candidate. Local tool/native 97/97, backend87/87 and foundation PASS. Generated Firebase config absent locally; full TS/security/release/signature gates to run in CI.
- Phone call/headphone/Bluetooth/OS audio focus and actual audio quality require owner physical-device feedback. 7B not started. Checklist apps/mobile/AUDIO-7A-TEST.md.

### 7A signed test APK verified
- Source `a0dd59bb32a08c8b3dc351106c4d6558aa68e307`, v0.12.0/code22. Android run `43153766165` **SUCCESS**: security/emulator, generated-config full TypeScript, foundation/regressions, release compile, pinned private signature/metadata/embedded JS and artifact upload all passed.
- Artifact `13915516972`: `AnimeMetaHub-v0.12.0-audio-7A-test`, 37,886,862 bytes; archive SHA256 `6ae6697c4b93d8d89ace48d8e862d69f4a44414f472ba04af29ca95cf3da2889` (archive, not APK; bundled SHA256SUMS gives APK digest).
- https://github.com/yasin636/anime-card-assets/actions/runs/43153766165/artifacts/13915516972
- Local tool/native97/97 (8 new audio tests), backend87/87, foundation PASS.
- Deliver for phone acceptance: Settings → Music & sound; no Render deploy required, no backend/service/credential or Cloudinary change. Update in place without uninstall.
- Remaining: physical sound quality/interruptions/headphones/Bluetooth/account/background verification and approval of music choices. Three original ambient demos are clearly labeled; reference anime recordings not licensed/approved/bundled. Do NOT call original soundtrack parity complete. Cleanup still pending; video deferred; 7B not started.

## Step 7B — signed delivery; phone acceptance pending

Owner explicitly authorized 7B plus restoration of the original three-song playlist before 7A phone acceptance. Runtime source `6cd5a1dd3eaab1835832b16998814668d01cc13f`, v0.13.0 / Android code23. Exact source URLs for Dark Aria, Kamado Tanjiro and Suzume are restored as external streaming defaults, not copied recordings. Offline demos remain explicit opt-in, never automatic fallback. Source reachability/recording identity/usage permission were not independently verified in this environment.

Account-scoped effective OS/user Reduce Motion, foreground/focus theme gating, Story/Arena/navigation reduced presentation, keyboard resize/avoidance, More/About scrolling, small-width padding/currency wrapping, button/form accessibility metadata and avatar URI fallback reset implemented. See `apps/mobile/POLISH-7B-TEST.md` for phone steps and limits. No claim of complete visual/accessibility parity or physical-device acceptance.

Validation: 102/102 tool/native tests, 87/87 backend tests, foundation checks. Signed CI run **43158252628** SUCCESS on unchanged rerun: first security emulator attempt failed with `Transaction is invalid or closed`; no security checks bypassed. Generated Firebase TypeScript, security emulator, release build and pinned private signature/embedded-JS checks passed. Artifact **13917337438**, `AnimeMetaHub-v0.13.0-polish-7B-test`, 37,891,984 bytes; ZIP digest `dbed1850d1302ff2c3abe146e479e07276d48e23eb64457669d806a33fedcf56` (APK hash is separately in bundled SHA256SUMS).

Download: https://github.com/yasin636/anime-card-assets/actions/runs/43158252628/artifacts/13917337438

Install in place, do not uninstall/clear data. Phone tests of original streaming, settings, reduced effects, keyboard/font-size/rotation/TalkBack and update/data preservation remain pending. No Render deployment or Cloudinary changes needed. Cleanup provider deletion still unverified; video remains deferred. Wait for owner feedback before another feature step.

## R1 — native Profile/Feed redesign delivered; owner phone acceptance pending

Owner postponed Step8 and requested redesign in R1–R3. R1 Edition02 visual preview reviewed on owner's phone; owner then authorized native implementation, including full-width feed media/tall screenshot viewer. R2/R3, video and Step8 are not started by this delivery.

Native source `4a4a8bdc346ac6681e89b3f9a510932d3719485f`, version **0.14.0 / Android code24**. New neutral shell/vector nav, actual account identity/avatar/equipped-card horizontal showcase, edit/photo/account/power sheets; ordinary screen step/build/connection/UID success clutter removed. Diagnostics stays in Settings. Feed virtualized, compact composer, comments sheet, long-press reactions and accessible menu, owner Edit/Delete. Ordinary media measured full width; very tall screenshots bounded with full image and explicit zoom viewer. Secure upload/drafts/operation-ID retry paths preserved. Memory-only server-confirmed UID-scoped feed cache60s; rapid foreground check throttled60s; established availability maintained during read-only revalidation, explicit server denial revokes it. No claim of zero Render Free cold-start latency or measured scroll performance; server authorization is unchanged.

Validation: **109/109 app/tool tests**, **87/87 backend tests**, foundation validation. Signed Android workflow **43184286606 SUCCESS**: security/emulator, generated Firebase TypeScript, release compile, pinned private signature/embedded-JS checks and upload passed. Artifact **13927827836**, `AnimeMetaHub-v0.14.0-redesign-R1-test`, **37,898,607 bytes**. ZIP SHA256 `3b082d02a231a5a41c5083f9423ef557957b01552a47f0c826a32ee043d44c30`; APK SHA256 separately inside SHA256SUMS.

Download: https://github.com/yasin636/anime-card-assets/actions/runs/43184286606/artifacts/13927827836

Phone checklist: `apps/mobile/REDESIGN-R1-TEST.md`. Install in-place; do not uninstall/clear data. Actual phone layout/keyboard/scroll/media zoom, upload/consumption, account isolation, pending recovery and prior feature regression need owner acceptance. Native design intentionally uses real equipped cards, not sample signature-three ownership or fake handles/verified/Follow/Save controls. Profile/Feed suppress global backdrop so text remains clear; theme ownership is not removed. No Render/Cloudinary permission/billing changes. Cleanup deletion still pending independent verification, video deferred. Wait for feedback before R2.
