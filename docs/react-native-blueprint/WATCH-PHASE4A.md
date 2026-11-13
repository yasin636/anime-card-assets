# Watch Phase4A — implementation in progress

## Accepted scope
Owner accepted all Phase3 phone tests on v0.21.1/code35. Preserve that baseline. Phase4A HTTP source integration only; Phase4B offline downloads only after Phase4A phone acceptance. Step8/Watch Party deferred. No Render deploy or billing authorized/needed for current client-side work.

Owner requests: Stremio-style manifest + stream HTTP subset and configured custom JSON API; response url/name/title/description, subtitles array, explicitly allowed behaviorHints.proxyHeaders.request (Referer/User-Agent); TMDB external_ids/imdb_id and Kitsu mappings; explicit manual ID or clear message if absent. No arbitrary scripts/torrents/DRM bypass, name guesses, fabricated streams/languages or secret forwarding.

## Implemented so far (not released)
- New sourceIntegration.ts data-only model: source validation, exact API-origin requests, explicit prefixes, manifest probe, stream lookup URL builder, custom JSON query contract (type/id/season/episode), response/parser limits, stream metadata, public HTTPS SRT/VTT references, consent+exact playback-origin scoped Referer/User-Agent. API auth remains separate and never goes into stream/subtitle headers. Unsupported stream rows filtered; no code execution.
- catalog.ts sourceIdentities: fixed TMDB external_ids and Kitsu anime/{id}/mappings requests. Native IDs and explicit IMDb/MAL mappings, no name matching. Kitsu external mappings flagged for season/episode confirmation; series identity alone cannot prove episode equivalence. Legacy Jikan not mapped/refreshed.
- Seven new tests cover URL building, schema/bounds, manifest, headers, subtitles, secret redaction, provider mappings. All 165 tool/mobile tests PASS locally. Typecheck only remaining error is baseline absent ignored CI-generated Firebase module.

## Still required before calling Phase4A complete
- SecureStore account-scoped source management UI (save/probe/enable/disable/remove; storage/error handling), settings entry and concise source-selection UI.
- Wire catalog episode selection to mapping, source-supported IDs, explicit manual ID/episode confirmation, abort/timeout/latest-request guards, real stream list, retry/empty/unsupported distinctions.
- Pass validated playback headers and selectable remote subtitle references into Phase3 player. Remote subtitles must be fetched only on explicit selection, bounded/timeout/abort, parsed with existing SRT/VTT parser, no source API credentials attached. Show host/IP disclosure and preserve embedded subtitle/Off/size-delay behavior.
- Validate configured manifest types/resource constraints, documented custom JSON schema, ID namespace and movie-vs-series handling. Do not treat an IMDb series mapping as verified anime episode alignment.
- Harden integration checks, ensure error redaction and React Native redirect behavior before claiming headers cannot leak. Current fetch redirect:error is intended boundary but native runtime behavior requires verification.
- fetch text uses content-length + post-read size checks because RN fetch streaming is not reliably available: not a hard transport-memory cap. Do not claim otherwise.
- Lifecycle/regression tests, accepted Phase3 preservation, app guide/version/CI identity/checklist, signed APK. No new APK produced yet; current installed release remains v0.21.1.

Current new module is NOT connected to normal app UI/playback yet. Legacy sources.ts strict data-only parser remains unchanged until integration migration and tests are ready. No credentials or production source added.

## Integration update — v0.22.0 / 36 candidate
The earlier 'still required' list describes initial groundwork, not current state. SourceSettings now implemented and embedded in existing Watch/app catalog settings. SourceBrowser connects explicit provider/native/manual mapping to configured-source lookups and stream selection. WatchScreen passes source headers/remote subtitle references to app-wide Phase3 player. Remote caption selection fetches with no headers and cancellation, bounded SRT/VTT parser, size/delay/Off. Existing local file/embedded controls retained.

Source HTTP uses `expo/fetch`, not React Native's legacy global fetch: installed NativeRequest.kt disables OkHttp followRedirects/followSslRedirects for redirect:error and omits cookie jar unless credentials include. Integration explicitly sets credentials:omit. Streamed reads are byte-bounded/cancelled before decoding, fallback mocks bounded after text. Native media can follow CDN redirects/segments; Referer/User-Agent are only explicit non-auth header exceptions. No arbitrary playback Authorization/Cookie support.

Manifest global and stream-resource type/prefix constraints enforced. Unsupported prefixes are not silently treated as unrestricted. Remote subtitle URLs need no suffix, but actual content must parse as UTF-8 SRT/VTT. User source supplies captions; no invented third-party subtitle integration. Kitsu Movie vs series explicit choice, external/manual series requires equivalent episode confirmation. Mismatched seasons require compatible native source/own link; no guessed season conversion.

170 tool/mobile tests and92 backend tests PASS locally; foundation PASS. Added UI fixture exercises mapping→lookup→play with headers/subtitles, disable/remove and account-scoped storage. This is not live provider or phone proof. Typecheck only missing baseline ignored CI-generated Firebase client locally; full CI restores config.

Current device checklist and exact custom API contract: apps/mobile/ANIGOOD-WATCH4A-TEST.md. No Phase4B download implementation. Await signed CI and owner device acceptance.

## Signed APK delivered
- v0.22.0/code36, runtime `72cfbd347d39686f2fa4dc2d7169bd8027a857b8`.
- Full CI SUCCESS: https://github.com/yasin636/anime-card-assets/actions/runs/43384340944 . Security/rules/transactions, TypeScript, test suites, native release build, unchanged private signing certificate, APK metadata and embedded JS gates all passed.
- ZIP: https://github.com/yasin636/anime-card-assets/actions/runs/43384340944/artifacts/14018098793
- Artifact AniGooD-v0.22.0-Watch4A, 39,811,675 bytes. GitHub archive metadata SHA256 `41645ad5e3e38814d4e370f06723a5787d5555aa0c1d149061875ae6a47c2fa7` (not separately downloaded APK hash). ZIP includes APK/checklist/SHA256SUMS/original sample subtitle.
- Earlier run43383683925 stopped at npm ci because version text replacement accidentally altered Babel upstream dependency range; corrected to upstream ~0.21.0, clean npm ci locally succeeded, all170 tool/mobile tests passed again, then full CI succeeded. No test/security bypass.
- Update in place; no uninstall/data-clear/Render deployment required. No production source configuration/credentials provided. Real endpoint and device acceptance still pending; source parser and mocked handoff are not universal addon/native-runtime proof.
- Phase4B downloads remains blocked on owner Phase4A phone acceptance.
