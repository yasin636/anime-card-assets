# 7A Audio owner-test candidate — v0.12.0 / Android code22

Owner authorized 7A. Owner reports 6D profile/Feed uploads work after local folder-role setup, and persist after closing/reopening the app. Live media cleanup verification is still pending (owner deleted test post at 10am); do not declare it passed. Video remains deferred and is not implemented here.

## Included
- Settings → Music & sound: Play/Pause, Restart, Repeat/native loop, Continue/playlist wrap, volume0..1 in10% steps and music mute.
- Three bundled ORIGINAL 12-second ambient DEMOS, clearly labeled: System Drift, Quiet Orbit, Neon Steps. Reproducible generator and audio-specific CC0 provenance notice included. These are NOT the reference anime recordings.
- Dark Aria / Kamado Tanjiro / Suzume recordings are NOT bundled or remotely fetched. Their approved source/license, and owner approval of any native alternative, remain unresolved. Do not call exact music parity complete.
- Per-device/account settings at `audio.preferences.v1.{uid}`; stored preferences do not restore autoplay. Corrupt settings fail closed until explicit Reset.
- Background/inactive stops music and SFX; foreground requires explicit Play again. Pause/resume within foreground preserves current source position; track change and Restart start at zero. No background audio service, recording permission or lockscreen controls requested.
- Global SFX enabled/volume gates existing Story, boss signatures, Arena impact, Chat pop and Story ARISE TTS, in addition to local screen toggles. Global mute wins. Local toggles remain separate.
- Added original ActionButton/common navigation clicks, confirmed reward/summon chime and accelerating/decelerating wheel ticks + completion cue. No reward/RNG/server balance changes. Cosmetic cues never block a command and repeated local receipts are deduplicated by operation ID within the mounted provider.
- Existing Story/Chat native players remain stable; guards prevent late seek completion starting muted/hidden sounds. Cosmetic native failures caught.

## Boundaries / remaining gates
- No claim of all107 animation/keyframe closure or exact source Web Audio envelope equivalence. Not every custom Pressable has a click cue; broader UI parity belongs to the visual/polish audit.
- No new paid dependency/provider or backend command; backend deploy is not required for this audio-only APK update.
- Expo native audio focus/interruption mode is configured, but real calls/headphone unplug/Bluetooth/OS interruption behavior requires physical-device tests. No claim of that validation from mocked hooks.
- Music/sound preferences are local, not synced across devices. Voice is device TTS, not the original ARISE actor recording.

## Phone acceptance checklist
1. Update over accepted 6D without uninstalling. Login/profile/photo posts/Chat/Story/Tracker/News and balances must stay intact.
2. Settings → Music & sound: Play each original demo, Pause/resume, Restart, volume/mute. Music must remain controlled across screen navigation.
3. Repeat one demo (>12s). Continue must advance once per finish and wrap third→first. Pause during switching must not start a late track.
4. Background/lock app then return: no unwanted automatic music resume. Test phone call, wired/Bluetooth unplug and another audio app; report actual behavior.
5. Global SFX OFF: clicks/reward/wheel/Story/Chat/ARISE voice silent even if local switches ON. Restore ON: old events must not replay; test volume zero and local mute too.
6. Force-close/reopen: settings retained but music paused. Sign out/switch account: old account audio must stop; preferences remain isolated.
7. Test reset/error recovery without changing account, balances or server state.
8. Confirm whether original demo tracks are acceptable for testing only. Final reference music selection still requires approval; 7A is not fully accepted until phone feedback.
