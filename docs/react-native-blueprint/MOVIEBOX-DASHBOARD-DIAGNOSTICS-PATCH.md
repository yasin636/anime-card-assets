# MovieBox dashboard — minimal diagnostic patch

Target: `walterwhite-69/Moviebox-API` pinned revision `64bcaadfe7246e75f3f86fdbd5dc4df8abf76442`, file `api.py` (inline dashboard HTML/JS).

## What the patch changes

The dashboard's `play()` previously set `player.src = stream.url`, called `player.play().catch(() => {})` (error swallowed), and set the status line to "Playing: ..." immediately on button click.

The patch keeps the same playback behavior but adds diagnostics only:

- **Video `error` event:** status line shows `MediaError` `code`, `message`, plus `networkState` and `readyState`.
- **`play()` rejection:** status line shows the rejection `name` and `message` (instead of being silently swallowed).
- **"Playing" label:** shown only when the real `playing` event fires; on button click the status shows `Starting: <quality> <format>` instead.

## What the patch does NOT do

- No URL, token or cookie logging.
- No headers, cookies, proxy or retry logic added.
- No change to fetch/stream behavior, no bypass of access restrictions.
- No app integration; this only touches the MovieBox dashboard served by the pinned upstream server.

## Apply — method A (recommended, from the MovieBox repo root)

```bash
git apply tools/moviebox-dashboard-diagnostics.patch
# or, if git apply complains:
patch -p1 < tools/moviebox-dashboard-diagnostics.patch
```

Then restart the MovieBox server (`uvicorn api:app` / `python main.py`) and reload the dashboard page.

## Apply — method B (manual)

In `api.py`, replace the exact `play()` function block with the patched block shown in `tools/moviebox-dashboard-diagnostics.patch` (the `+` lines), then restart the server.

## Verify

1. Open the dashboard, search a subject, click **Play**.
2. Status line should show `Starting: ...` on click, then `Playing: ...` only if playback actually starts.
3. If playback fails, the status line shows either `Play rejected: <name>: <message>` (autoplay/blocked) or `Media error: code=... message=... networkState=... readyState=...` (media/network error).

## Notes

- The patch is generated against the pinned revision; line numbers match that revision exactly.
- This patch is diagnostic evidence tooling for the owner's MovieBox checkout only. It is not part of the AniGooD app and produces no APK.
