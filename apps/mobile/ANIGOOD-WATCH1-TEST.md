# AniGooD v0.19.0 / code31 — Watch phase 1

Install as an update over accepted v0.18.0. Same package/private signing; do not uninstall or clear data.

## Included
More → Watch: native expo-video 3.0.x player, SDK54 compatible; explicit play, native pause/seek and landscape fullscreen; actual audio/subtitle metadata selectors, subtitle Off; loading/error and reload; app background pauses, leaving Watch unloads; existing music is paused on entering Watch (not automatically resumed).

Bundled original synthetic 12-second test-pattern MP4: H.264 video, two AAC test tones 440/880 Hz, English tx3g subtitle. Not Japanese/Hindi dub, not a copyrighted film. It works without network; keep volume low. Tracks may appear with generic metadata labels: two tracks should be selectable. No external subtitle/ASS fidelity claim.

Public HTTPS link input: MP4/HLS/DASH depending on provider/device/codec. No app-auth headers attached; no URL persistence. Provider/CDN sees IP; redirects/DNS are provider-controlled, this is NOT a sandbox for untrusted networks. No arbitrary JavaScript extensions. Private/IP/credential-bearing initial URLs are rejected; signed query links may still be sensitive: only use trusted links. Errors do not echo native URLs/tokens. No proxy/server deploy or billing required.

## Not included / not verified
No production content provider has been approved or live-tested. No guarantee of movie/anime/drama availability, external subtitle imports, arbitrary codecs/DRM, downloads, PiP, catalogs, watch party or rewards. Later phases implement those separately. This APK is the phase-1 playback checkpoint, not the full streaming service.
Automated tests/build do not prove actual hardware playback. Owner device checks below are required before declaring phase accepted.

## Phone acceptance checklist
1. Update in place: account, balances, cards, tracker, feed/chat remain intact.
2. More → Watch → Play offline sample → tap native Play. Moving pattern and audible tone should play. Pause/resume and seek work.
3. Select the second actual audio track: tone changes from 440 to 880 Hz; back switches again. Labels need not be language names because these are synthetic tones.
4. Enable English subtitle: first/second-half cues appear at correct times; Off hides them.
5. Fullscreen rotates landscape; Android Back exits; app returns portrait. Try with auto-rotate both on and off.
6. Home/lock pauses. Return does not unexpectedly autoplay. Navigate away and back: no stale audio/video. Sign out also disposes player.
7. Enter a trusted authorized HTTPS media link: test streaming separately. Invalid URL shows validation; nonexistent video shows error/reload without crashing. No silent sample fallback.
8. Recheck original music playback, private Chat image, Feed share, Sensei, Shop and Adventure after Watch.

If anything fails, send device/Android version, selected sample/link type, exact steps and screenshot. Do not send private signed URLs or keys.

Developer foundation: sources.ts defines a data-only SourceAdapter and bounded JSON `{ "streams": [{ "name": "Own video", "url": "https://…" }] }` parser. It is not exposed as an addon marketplace/UI yet. No manifest fetching, arbitrary code, torrents or provider-auth options. Full Stremio compatibility is not claimed.
