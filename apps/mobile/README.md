# Current integration build: v0.3.0 Collection + Gemini

See [STEP03-TEST.md](STEP03-TEST.md) for current scope, Gemini key/model setup and backend deployment gates. Step03 economy is NOT complete/live until trusted hosting and Rules review are done. Gallery upload explicitly deferred. The v0.2 notes below are historical baseline evidence.

# Anime Meta Hub — Auth/Profile Test 0.2.0

Step02 Android test build. Expo54.0.38 / RN0.81.5 / React19.1; strict TypeScript; native Firebase23.5.0 and native Google Sign-In16.0.0. This is not a store/production release or a completed game.

## Implemented

- Email/password signup/login, optional signup username, mapped error states and duplicate-submit lock.
- Native Google account selection/login; cancelled selection returns without creating a Firebase account.
- Credential conflict offers same-email existing-password login followed by `linkWithCredential`; no custom account merge or copying balances between UIDs. Signed-in users can explicitly link Google to their current account. Already-used credentials fail instead of merging accounts.
- Firebase SDK session persistence; UID-keyed navigation resets account UI on switch; profile subscription cleanup and stale UID guards.
- Live own `user_meta/{uid}` profile and read-only currencies; original Bio casing; computed XP rank, badge and Story Power; existing featured slots displayed.
- Existing documents are read without resets/backfills. Only a missing document gets zero-balance defaults in a transaction after a server-confirmed missing snapshot. A race re-reads before creation. Original named-admin XP correction is NOT ported.
- Username/Bio edit/save/cancel, five DiceBear avatar presets, gallery JPEG resize/upload to `avatars/{uid}/...` in Firebase Storage followed by profile URL save. Failed profile write attempts cleanup the new object. Gallery max2MiB input. Storage permission/billing failure is shown, not bypassed by opening Rules or storing oversized base64 in Firestore.
- Sign-out with confirmation; all other navigation destinations remain explicitly marked previews. No rewards, gacha, purchases, chat or battle commands enabled.

## Build configuration and signing

`google-services.json` and generated `src/generated/firebase-client.ts` are not committed. CI validates the three existing repository secrets using the pinned public certificate manifest, restores config, runs `npm run prepare:firebase`, and performs Expo Android prebuild. The generated file contains a web OAuth CLIENT ID, not a service-account credential or OAuth client secret.

`app.config.js` registers native Firebase and Google plugins. Android is configured; iOS still needs its own Firebase app/plist/OAuth URL configuration before signed iOS testing.

CI requires `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `FIREBASE_ANDROID_CONFIG_BASE64`. No public debug-key fallback: Gradle must use the validated private PKCS12 identity and the output APK certificate must match SHA256 in `docs/react-native-blueprint/android-test-certificate.json`. Private material is cleaned in an always step; no key/password artifact is uploaded. The Expo-generated public debug keystore is not the release signing identity.

ApplicationId `com.yasin636.animemetahub`; version0.2.0/versionCode2. ARM64+ARMv7. The first private-key build CANNOT update public-key v0.1.0: uninstall sample v0.1.0 first. Later test updates must preserve private identity and increase versionCode. These are internal-test credentials, not the production/Play signing plan.

## Local validation

```sh
npm ci
# Supply your authorized Android client JSON locally (NOT a service-account file):
npm run prepare:firebase
npm run typecheck
EXPO_OFFLINE=1 npx expo install --check
EXPO_OFFLINE=1 npx expo prebuild --platform android --no-install
EXPO_OFFLINE=1 npx expo export --platform android
node ../../tools/validate-mobile-foundation.cjs
node ../../tools/test-mobile-profile.cjs
```

Native build additionally needs JDK17/Android SDK/Maven/Gradle access and the verified private signing environment. `.github/workflows/android-apk.yml` implements that path. APK signature and embedded JS checked before publication.

## Phone checklist (do not send passwords/tokens)

1. Uninstall sample v0.1.0, install new private-key APK, verify auth screen opens without Expo Go/Metro.
2. Try incorrect/empty credentials and signup validation; no crash or duplicate submit.
3. Prefer a test account first. Test email signup/login, username fallback, zero new balances and profile creation.
4. Test an existing account: old XP/Gold/Gems, name/Bio, inventory count and featured slots must be retained. Do NOT change/reset balances to test this build.
5. Edit username/Bio; cancel; save; relaunch; verify updates and real header counters.
6. Choose preset avatars. Try permitted gallery image, oversized image, denied permission, interrupted upload; report Storage permission/billing errors without opening Rules.
7. Kill/relaunch: session retained. Try offline relaunch with cached profile; if unavailable, Retry/sign-out actions remain available.
8. Google login: account picker, cancellation, success with desired account. If Google OAuth app is in testing, the account may need consent-screen test-user registration; this is not proven by static config checks.
9. Same-email provider conflict: authenticate existing password before linking. Explicit profile link; credential-already-in-use error must not merge separate UIDs.
10. Sign out, sign into another account: no previous profile/drafts/featured cards visible. Android Back/More/modal/keyboard/scroll/safe-area tests.
11. Gameplay previews must not spend/award currency. Report model/Android version, screenshots and error codes, never passwords/secrets.

## Security/testing limits

No live login, Firestore or Storage Rules verification/deployment, Firebase data migration, account creation or deletion was performed from the sandbox while developing this build. Device/provider tests are required. The current Firebase project's existing Rules remain in effect; client-only edit whitelists are NOT a server security boundary. Existing permissive legacy Rules must be reviewed before production (separate authorized task). Native auth uses SDK persistence; plaintext password is not written to custom local storage or logs.

23 domain/profile fixtures and structural/autolinking checks do not prove successful Google login or correct UI on every phone. No signed iOS test performed. Production readiness is not claimed.

Dependency audit: PostCSS8.5.32 and grpc-js1.14.7 overrides address those transitive advisories. Current audit still reports13 issues (1high image-size in Metro build tooling,11moderate,1low). Builds process fixed local PNGs; uploaded avatars are resized on-device and never sent into Metro. Compatible toolchain upgrade/verified upstream patches and full security review remain release gates; no blind major downgrade/force fix applied.
