# Phase4B — direct-file Offline Downloads (v0.23.0/code39)

Owner accepted all v0.22.2 Phase4A phone checks and authorized this phase without provider-discovery gating. Preserve BYOS, cinematic Watch UI, accepted BBB/PiP and app data. No Watch Party/Step8/Render/billing change.

## Implementation
- Watch Hub and cinema Downloads entry; online player Download offline passes actual URL, title, allowed Referer/User-Agent and external subtitles. Explicit Test Lab jobs keep testMode; offline sessions contain only local files/captions, no history/report/Tracker callbacks.
- Per-user private document directory (SHA256 user namespace), SecureStore source/headers/metadata and AsyncStorage ID index. No source URL logging. Serialized metadata saves, bounded entry count and sizes; missing/invalid index/metadata fails closed instead of overwriting it.
- expo/fetch streaming → modern expo-file-system FileHandle writes. Legacy native DownloadResumable was deliberately not used because Android appends before validating HTTP Range. Response status/type/known size/encoding, exact Range, unchanged strong ETag/size, actual MP4/MKV/AVI signature and available disk are checked before append. Ignored Range/changed ETag cannot corrupt partial file; explicit Restart required.
- Foreground single-job downloads, throttled progress, Pause/Resume, Cancel/remove, Delete, local playback, subtitle save/validation/retry. AppState background pauses, account lifecycle shuts down job. Restart reload marks interrupted entries paused and reconciles disk size. Offline Play verifies completion and local signature, parses only saved captions.
- Reject HLS/DASH URL or playlist MIME/body, HTML/text and unsupported signatures; never offer downloaded playlist as a video. Native supported codec still device-dependent. 2GiB/video, 20 entries, 24 caption tracks; no background service/export/DRM/torrents.

## Evidence before signed build
- 191 tool/mobile tests PASS, including 10 download tests: complete bytes+VTT, paused app-restart Range resume, unsupported/HTML rejection, Range/ETag validation and integration preserving partial bytes, cancel cleanup, disk-space failure, subtitle failure/retry/SRT offline reload, security/bounds/missing local files, Test Lab wiring.
- 92 backend tests PASS; mobile foundation/autolinking checks PASS.
- Local TypeScript: only absent ignored generated Firebase module. Signed CI restores private verified Firebase config before full typecheck; no credentials fabricated.
- CI download suite is now a required APK gate; artifact includes dedicated phone checklist and sample SRT.

## Acceptance
Pending signed CI and phone checks. See apps/mobile/ANIGOOD-WATCH-DOWNLOADS-TEST.md. Automated fake-stream tests do not prove Android streaming/FileHandle behavior, native offline decoder playback, storage performance or airplane-mode caption display. Do not call Phase4B accepted until owner reports these.
