# AniGooD v0.21.0 / 34 — Watch Phase3 device acceptance

Install signed APK **over the existing app**. Do not uninstall/clear data. Package and private certificate unchanged. No backend deployment, billing, Step8, source adapters, downloads or Watch Party changes.

## Automated gate
157 tool/mobile tests (includes subtitle parser and playback-provider lifecycle), 92 backend tests; foundation/autolinking validation. Full signing/security/native build in GitHub Actions. Local typecheck lacks ignored CI-generated Firebase client; CI restores verified configuration before checking.

## Phone checklist (not claimed tested by CI)
1. Confirm previous Watchlist/Tracker entries remain after update and app restart. Source explanation defaults collapsed; expand/collapse. All three existing catalog choices and details still work.
2. Watch → Player & offline sample → Play offline sample. Explicit Play starts; pause/play, timeline, ±10s and left/right double-tap; controls hide after four seconds, tap returns them. Check two actual audio tracks/embedded English subtitle and Off. No fabricated language label.
3. Import your UTF-8 SRT/VTT via Audio & subtitles. Select .srt/.vtt, ≤512KiB / ≤5000 cues. File stays local, URI/text not persisted/uploaded. Check multiline/overlap, size12–40, delay−30…+30s (positive=later), reset. Unsupported/invalid/large files show an error. Embedded track selection clears external text. ASS/SSA and embedded size/delay are not available; Android caption settings apply to embedded text.
4. Speed .75/1/1.25/1.5/2×. Landscape button; Back exits landscape without closing playback. Imported caption overlay follows in-app landscape. Settings remain available in landscape. Portrait Back closes player.
5. Vertical left swipe brightness; right swipe player volume (not system volume). Brightness restores on close/background/minimize. Device-dependent brightness failure stays contextual.
6. Minimize and browse Watch catalog, Feed/Profile/Tracker; playback/session and report identity stay intact. Expand/close works; open a different video replaces session. No app-music overlap. Logout closes/unloads video.
7. PiP button on supported Android; grant Android app PiP permission if required. Verify playback continues only in PiP, restore to player, close PiP/background stays paused. Imported React captions do NOT render in native PiP; embedded subtitles depend on native engine. No automatic Home-to-PiP promised. PiP unsupported/denied shows error.
8. With an authorized actual HTTPS video opened from title episode, play beyond 30s, minimize/browse, close, force-stop/reopen app. Continue Watching + SAME link resumes; different link starts at zero. Link is not stored. Check Tracker is NOT auto-mutated.
9. Previous/next shown only inside known episode bounds. Opens requested episode's link prompt, no reuse of wrong video or sample. No automatic playback/source discovery yet. Sample has no episode controls.
10. Interrupt network/background: no unrestricted background audio; explicit Play/Reload after return. Error/reload releases old player and retains last offset when same duration/source. Unsupported codecs/DRM/private links are not guaranteed.

Skip Intro intentionally absent without verified episode/edition timestamp data. Phone validation is required for PiP, gestures, codecs, orientation, system Back and actual-video resume; automated source/model tests are not native runtime proof.

## Signed delivery
- Runtime commit: `98c0fddd6a351ac2c31e833ebfaf1de5ee31cee5`.
- CI run: https://github.com/yasin636/anime-card-assets/actions/runs/43372064925 — full SUCCESS on attempt 2. First attempt encountered unchanged Firestore-emulator `Transaction is invalid or closed` in rare-duplicate recycle test; rerun retained every gate/assertion and passed.
- APK ZIP: https://github.com/yasin636/anime-card-assets/actions/runs/43372064925/artifacts/14013198297
- Artifact: `AniGooD-v0.21.0-Watch3`, 39,790,236 bytes; GitHub archive metadata digest `sha256:38659aef1a0fc9bb2288a026f8a39b653b39ca4782003873864e19b0327a72a1` (not separately downloaded APK hash). ZIP includes APK and SHA256SUMS.
- TypeScript, tests, native release build, unchanged private-certificate signature, package/version metadata and embedded JavaScript checks passed in CI. Phone checklist above remains unverified until owner testing.
- Initial build `43371612771` found React `act` unavailable under production NODE_ENV. Fixed test-command environment (not app behavior or assertions); React lifecycle tests now execute alongside existing NODE_ENV=test integration tests.
- Shared account-root library keeps mini-player progress persistence alive across Watch navigation; logout unmounts both playback/library providers.
