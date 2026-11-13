# Watch Phase3 owner-feedback fix — v0.21.1 / 35

Owner observed PASS on v0.21.0: sample, play/pause/timeline/seek, audio/embedded subtitle/Off, landscape/Back, mini-player, Android PiP, collapsible source explanation. Imported SRT/VTT untested (owner had no file). Speed worked but shifted pitch; brightness/volume gestures did not work.

Fix runtime `500cf532f09d9c8fda5ca3467135de5fcea6361c`: explicit expo-video preservesPitch at setup and every speed change (installed Android internal default false despite documented default true); parent-stage vertical capture, stable memoized PanResponder, measured page coordinate bounds, no async brightness-baseline mutation mid-swipe. Initial player volume 100%: test downward swipe first. Changes require owner phone recheck, not claimed phone-verified.

Original four-cue subtitle matching 12-second sample is included as `AniGooD-subtitle-test.srt` inside ZIP. Extract, then import in player; no external subtitle acquisition required. External subtitle size/delay, embedded limits and PiP caption limitations unchanged.

CI https://github.com/yasin636/anime-card-assets/actions/runs/43378194541 full SUCCESS. TypeScript, 158 tool/mobile tests, backend tests, foundation/autolinking, security rules/transactions, native build, private certificate, metadata and embedded JavaScript gates passed. No security assertion weakened.

APK ZIP https://github.com/yasin636/anime-card-assets/actions/runs/43378194541/artifacts/14015388527
- AniGooD-v0.21.1-Watch3, 39,791,916 bytes.
- GitHub archive metadata SHA256 `79e04d02e3194ea201f04ec351938cd9a686e774d6d990afc3e3996ddb234ec7` (not separate APK hash). ZIP contains APK, SHA256SUMS, current checklist and sample SRT.
- Update in place, package/private signing unchanged. No uninstall/data-clear. No Render deployment/billing/backend mutation/Step8/Phase4 work.

Phone follow-up: rate .75/1.5/2 with real speech; left/right vertical swipe with controls visible and hidden (portrait/landscape), brightness restoration; SRT import/size/delay/Off. Preserve prior PASS flows and verify again as needed.
