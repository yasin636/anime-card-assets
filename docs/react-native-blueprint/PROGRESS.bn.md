# Native implementation progress

## Target and working agreement

- React Native Android+iOS, not React web.
- Each implementation step ends with an Android standalone test APK, user testing/feedback, fixes and explicit approval before the next feature step.
- No real account/currency/gameplay claims for sample-only screens.
- Main contract: BLUEPRINT.bn.md + PARITY-AND-QA.bn.md + complete reference.

## Step 01 — Navigation foundation (APK ready; awaiting user device testing/approval)

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

## Next step (locked until user approves Step 01)

Firebase/Auth/Profile persistence, secure schema/defaults and account lifecycle. Do not implement actual economy before server-side reward rules and idempotency are in place. Obtain authorized native Firebase app configuration without putting service-account/AI secrets into mobile source.
