# AniGooD v0.23.0 / code39 — Phase4B Offline Downloads

Install the signed APK as an UPDATE over v0.22.2. Do not uninstall or clear data. Package/signing certificate unchanged. Phase4A was accepted by owner on phone; this release needs its own device acceptance.

## Phone checklist
1. Confirm account, Watchlist/history, Tracker and saved sources remain.
2. More → Watch → Open cinema → Enable Player Test Lab → Test remote VTT · MP4 + source subtitle. In player choose Download offline. Close/minimize player → Watch Downloads.
3. Confirm TEST label, increasing bytes/percent. Pause, wait, Resume. Some hosts omit a strong ETag or refuse Range: safe Resume must explain failure; Restart download is then needed. Never append a full response to a partial file.
4. Background the app mid-download: it must pause. Return and Resume manually. Force close/reopen mid-download: entry remains paused and resumes safely, or explains server limitation. No background/system downloader promised.
5. Finish video and subtitle download (1/1 subtitles). Close player, enable airplane mode, reopen app → Watch → Downloads → Play offline. Check video/audio, seeking, saved caption overlay, Off/on, size and delay without network. Watch history/resume/Tracker must remain unchanged for TEST entries.
6. For an authorized direct file with SRT, repeat and verify offline SRT. MKV/AVI playback depends on device codec support; download does not guarantee decoding.
7. Test Shaka/Apple HLS → Download offline: clear Bengali unsupported reason, no completed tiny playlist masquerading as video. DASH/live not supported.
8. Cancel an in-progress test: entry and partial files removed. Delete completed test: local video/subtitles removed. Repeat download/play after delete.
9. Subtitle failure: video remains available but warning and Retry subtitles appear. Retry online, then recheck airplane mode. No caption credentials inherited from video/API headers.
10. Recheck ordinary online MP4, HLS audio selection, mini-player/PiP and one-URL source save. Existing cinematic UI unchanged.

## Intentional limits
- App-private, per-account storage. Uninstall removes files. No gallery/export, background service, HLS segment downloader, torrent or DRM bypass.
- One active job, 20 entries, 2 GiB/video. Requires known size, actual supported video signature, enough disk space and HTTPS public host.
- Strong ETag plus exact Range needed for interrupted-file resume. Restart is explicit when unsafe. Partial files never offered as offline playback.
- Subtitle responses bounded UTF-8 SRT/VTT; failed captions are not claimed saved. React caption overlays do not appear in Android PiP.
- Signed build/tests are not airplane-mode or native codec proof. Report the steps that PASS/FAIL and any Bengali error text; do not send secret source URLs/headers.
