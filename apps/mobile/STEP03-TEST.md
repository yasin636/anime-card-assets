# v0.3.0 Collection + Gemini integration test — not complete live Step03

Update over the privately signed v0.2.0; versionCode3. Do NOT uninstall that version just to update (avoid losing local state). Public-key sample v0.1.0 must still be uninstalled first.

## Gemini BYOK (user-requested provider change)

More → Chat → Gemini settings. Paste YOUR Gemini API key, Verify key, choose an available model, Save. Up to six text-capable Gemini models are discovered from Google's actual paginated model API, not an outdated hardcoded model menu. Fewer available models means a shorter list. Listing does not guarantee generation quota. Ask Anime Sensei below; change model/save; relaunch; remove key.

Key + chosen model stored per Firebase UID in Expo SecureStore (Android Keystore-backed encrypted storage / iOS Keychain when iOS is configured). Saved key never appears in the input; Show reveals only a newly typed value. Secret is NOT in APK source, EXPO_PUBLIC variables, Firestore, AsyncStorage, logs, request URL or economy backend. TLS requests go direct to Google's API with x-goog-api-key header. The app must decrypt/use the key to call Google; rooted/compromised devices are not protected by an absolute secrecy guarantee. Users should use restricted/revocable keys, not shared production server keys. Removing from phone does not revoke the key at Google. iOS Keychain may persist across uninstall; explicit remove is provided. Android SecureStore backup exclusion enabled.

Only the current question is sent to Gemini (retains source Sensei's no-history-request behavior). UI messages are session-only, cleared on leaving screen/account switch. Anime/manga/Japanese culture guidance, concise responses, source temperature0.8 retained. Gemini output budget2048 allows modern model thinking/output overhead, not an economy reward change. Unsupported/no-text/quota/key/network errors are shown safely. No Groq/Grok shared key is used, copied or embedded. Original exposed Groq key still needs revocation by its owner; switching provider alone does not revoke it.

Own provider key may incur quota/cost depending on the owner's Google account/settings; no automatic billing or free-usage guarantee. No user key or real Gemini call was used from the sandbox. Tests mock models/responses. Verify real model access/generation, Android persistence and deletion on phone; never send key screenshots to chat.

## Cards/Shop

Live own inventory and old featured slots; details, filters, shadow catalog. Cards are not invented sample ownership. Unknown/ambiguous legacy identities are displayed, not silently deleted. Prepare adds missing IDs only after explicit confirmation; no actual migration executed in sandbox. No destructive actions in test account without backups and deployed integration checks.

Economy commands are wired to a trusted HTTP server, with UUID pending command saved BEFORE network send (AsyncStorage holds command only, not tokens/keys), per-UID replay after timeout/relaunch, server idempotency receipt, ownership/rarity/reward checks and server crypto RNG. Six featured slots; same-instance multi-slot source behavior retained pending policy decision. Recycle preview is advisory; server checks current duplicate state.

Trusted economy hosting/credentials and server-only Firestore Rules have NOT been deployed. Absent reviewed endpoint configuration every mutation is disabled and visibly marked backend setup pending. A correct server does not protect permissive old client-write Rules. Do not enable before review/emulator/concurrency/migration tests. This APK is useful for UI/live-read/Gemini testing; it does NOT mean real gacha/recycle/theme purchases are ready or Step03 accepted.

Seven native aura themes can display an existing equippedTheme; purchase/equip only with server enabled. Effects are native gradient/pulse/wave/steam/snow variants, not a claim of full107-animation parity. Gallery upload explicitly disabled/deferred as user directed; preset avatars and text profile remain functional. DM/global/combat/missions/wheel remain preview.

## Checks

TypeScript, Expo compatible dependency check, Android prebuild, Hermes export; 31 economy/HTTP mock tests, 5 Gemini service/security fixture groups, 23 profile fixtures and61 reference checks. Mock tests are not real Firestore transaction concurrency, Rules or real Gemini API verification. No iOS/device test done in sandbox. Full live Step03 acceptance still pending backend deployment and phone tests.
