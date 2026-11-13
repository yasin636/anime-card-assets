# AniGooD v0.22.1 / 37 — Watch UX + source diagnostics follow-up

Update existing APK in place. Same package/private certificate. No uninstall/data-clear/Render deploy/billing. Phase4B/Downloads and Step8 NOT started.

## What this APK does / does not do
- Cinematic title spotlight from real catalog metadata, readable vertical gradient, horizontal poster shelf, compact three-column catalog. Existing Anime/Movies/Drama tabs, search/filter, Watchlist/Tracker/history preserved. Images/titles/ratings do not prove playable availability. No invented dub/quality badges, fake counts/comments or copied competitor logo/art.
- Catalog provider controls collapsed under Catalog source options. Episode playback has Play available source; ID/header/provider setup is hidden behind Advanced source options. Existing source settings not erased.
- Automatic lookup uses only enabled matching configured providers + unambiguous IDs. On request failure tries next compatible provider, global30s timeout. Kitsu external/manual episode mappings still require confirmation in Advanced. No name guesses. Returned alternatives can be selected in player with Try another returned stream; not an unlimited automatic-native-failure resolver.
- Watch → Open cinema → Watch open film launches explicitly labelled Big Buck Bunny directly, no URL/ID/manifest setup. Film link Archive H264/AAC416x240 duration596.416667s verified from CI via actual Range bytes and ffprobe (run43396594295). This is ONE open-licensed animation, NOT Japanese anime coverage and not a silent substitute for another episode. Playback on owner's phone remains unverified. Credits: Blender Foundation, CC BY3.0 https://peach.blender.org/about/ ; keep full ending credits.
- Existing own-link input/offline sample now under Advanced playback / offline check. No synthetic fallback.
- Player displays whitelisted safe HTTP401/403/404/5xx/TLS/DNS/timeout/network/decoder classification only when native error contains evidence, otherwise NATIVE_LOAD_FAILED. No raw signed URL/header/token or falsely precise diagnosis. No invisible debug upload.

## Phone checks — keep short
1. Watch: browse Anime/Movie/Drama, hero opens correct details, search/filter works, old Watchlist/Tracker still present. Catalog source options expands existing selector.
2. Open cinema → Watch open film. No settings/ID entry needed. Check video duration≈9:56, actual picture/audio, seek/fullscreen/mini/PiP. Native media CDN availability on Dhaka Wi-Fi is not guaranteed by CI.
3. If load fails, error now shows safe category/code without credentials. Unknown category remains honest. Owner need only state that code; do not ask repeated reconfiguration or a mobile-data connection.
4. Existing authorized source: episode → Play available source. Real mapped streams open, returned options visible; Advanced retains manual ID/source settings. If unavailable, clear message, not fake movie/sample playback.
5. With multiple returned options: Try another returned stream in player creates replacement with its own resume fingerprint/report. Same-link resume remains unchanged; changed URL starts zero. No automatic Tracker progress.
6. Original Phase3 audio/embedded+external subtitles/Off/size-delay/speed pitch/gestures/Back/fullscreen/mini/PiP preserved. Source remote captions remain opt-in, no API credentials inherited.

## Known incompleteness
No verified production Japanese-anime/movie/drama provider was added. This APK improves UX and diagnosis and adds one explicitly identified open film; it is NOT a completed all-content streaming service. No paid hosting/account activated. Phase4A remains pending actual phone playback/provider acceptance; do not start downloads on source-fixture tests alone.

Automated:174 tool/mobile tests +92 backend tests and foundation/autolinking. Includes native error redaction, exact-film default restrictions, automatic provider-request fallback, actual mocked automatic+advanced UI handoff, source storage and all accepted previous suites. Native full build/signature/security gates are required before delivery. Local TypeScript only lacks ignored CI-generated Firebase config; CI restores verified config first.
