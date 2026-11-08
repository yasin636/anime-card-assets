# Anime Meta Hub — Navigation Test 0.1.0

Step 01 only. Expo SDK54 / React Native0.81.5 / React19.1, TypeScript, React Navigation native stack. Android standalone release-mode **test** APK is built by `.github/workflows/android-apk.yml`. Native folders are generated, not checked in. npm lockfile is authoritative.

## Local validation

```sh
npm ci
npm run typecheck
EXPO_OFFLINE=1 npx expo install --check
EXPO_OFFLINE=1 npx expo export --platform android
```

Expo offline mode avoids cloud compatibility lookups; dependencies are still installed via npm. Android compilation requires JDK17, Android SDK, Maven/Gradle download access. CI supplies these. SDK54 is intentionally pinned rather than upgrading the app across major versions during this test.

## Scope

All eight destinations, More sheet, boot/loading screen, safe-area shell, header sample counters, local card art, about modal, chapter preview selection. No login, account creation, database access, purchases, actual inventory, rewards, messages, wheel RNG, or battle. Coming-next buttons explain the scope instead of silently doing nothing. No real user data or API keys are embedded.

## Android signing / updates

Application ID: `com.yasin636.animemetahub`; display name: Anime Meta Hub Test; version0.1.0/versionCode1. ARM64+ARMv7; compile-generated minimum SDK must be checked from APK metadata (SDK54 expected API24+).

The generated Expo template includes a **public development keystore**. CI pins its SHA256 (`221e0a3106aa4c3ccc154e0a418b55020b3f9ea6e84f92e8749cd9e2f39f5e58`) and uses it for this standalone test APK. It is NOT secret, NOT a production signing identity, and NOT suitable for real accounts/store publication. Pinning avoids accidental new signing identities across regenerations. Native generated files/keystores are not committed. Future test builds must increment versionCode and preserve test key to update this install. A production app must use a separate properly secured signing plan; moving away from this public key may require a separate package or uninstall during test migration.

## Phone checklist (please send model + Android version)

1. Install extracted APK, open without Expo Go/Metro; reopen in airplane mode.
2. Check Profile/Arena/Feed/Shop navigation and all four More destinations.
3. Open/close More by outside tap, close icon, Android Back; test normal screen Back.
4. Scroll every screen, check bottom/system bar and Bengali text clipping.
5. Check local card art and all five Adventure chapter preview tabs.
6. Tap coming-next controls; confirm explanation, no currency changes.
7. Open header info modal; Back/close; kill/relaunch app.
8. Report crashes, screen/layout problems with screenshots. Progress/save testing is not applicable yet.

No Android/iOS device test is implied by a successful JavaScript export. iOS configuration is present, but no signed iOS build was produced.

## Dependency audit note

A PostCSS8.5.32 override removes the known high PostCSS advisory in Expo build tooling. npm still reports advisories including transitive Metro `image-size@1.2.1` (high) and moderate/low build dependencies. This test uses only fixed local PNGs; no untrusted media processing or backend is enabled. Do not call this production-security-cleared; before real uploads/release, upgrade the compatible framework/tooling set or apply a verified upstream patch. A forced image-size2 override changes its API and was deliberately not applied blindly.
