# Session handoff — MovieBox feasibility checkpoint

Branch: `arena/6f7e15ba-anime-card-assets` · Baseline: `17a5141bba1e4b2b24e5ec9300d8ce971b856a8c` · App: AniGooD v0.23.0 / Android code39 (unchanged)

## Completed

- Baseline verified: assigned branch unchanged, HEAD `17a5141`, working tree clean, app version/versionCode intact. No legitimate changes lost.
- Migration re-applied safely after `.git` refs reverted to clone state between turns (platform persistence quirk): `git fetch origin arena/cd835a4c-anime-card-assets` → HEAD verified `17a5141` → ancestor check → `git add -A` + `git merge --ff-only`. No reset/rebase/force; no other branch touched.
- Upstream review (pinned `walterwhite-69/Moviebox-API@64bcaadfe7246e75f3f86fdbd5dc4df8abf76442`, read-only via GitHub API): confirmed `get_streams` swallows exceptions at three levels while `/api/stream/{subject_id}` always answers HTTP 200; a live 429/blocked request reappears as `count: 0, streams: []`. Recorded as finding 7 in `WATCH-MOVIEBOX-FEASIBILITY.md`.
- Network-free contract/regression tests re-run: `NODE_ENV=test node --test tools/test-watch-moviebox-compat.cjs tools/test-watch-sources.cjs tools/test-watch-downloads.cjs` → **27/27 PASS, 0 fail** (5 compat + 12 source + 10 downloads). Test deps (typescript, react, react-test-renderer) live only in snapshot-excluded `apps/mobile/node_modules`.
- Evidence report updated: verification re-run note + upstream swallowing finding.
- Workspace hygiene checked: ~30 MB total, largest file 1.5 MB, `.git` 9.4 MB, no file >2 MB. No cleanup required; no generated APK/ZIP/log/media left behind.

## Outstanding (blocked on owner gates)

- **Live access gate (owner approval required):** one correctly identified movie, anime episode and drama episode with HTTP status, actual media bytes (Range/ETag/size), codec, caption bytes/language, dub identity, signed-URL expiry, and native phone playback. Unsupported content must fail honestly. No signed URL/token/cookie stored in repo/report/log.
- **MovieBox adapter:** only after live gate success; separate catalog with exact string subject IDs; explicit `se`/`ep` + separate captions; distinct error surfacing for upstream empty/non-200/local rejection; allowlisted headers only; no DASH/torrent/DRM/cookie pass-through. No title-first-result guessing.
- **Runtime integration / new signed APK:** only after feasibility, authorization and identity-mapping findings are shown and approved. versionCode bump keeps package + signing identity; no fabricated signing config.
- **DASH/HLS download:** not claimed by the accepted downloader.

## Blockers / notes

- Workspace persistence quirk: `.git` refs revert to clone state between turns while the working tree is kept. Recovery: fetch `origin/arena/cd835a4c-anime-card-assets`, verify HEAD `17a5141`, `git add -A`, then `git merge --ff-only`. Do not run reset/rebase/force.
- Live MovieBox/CDN hosts are outside this sandbox's outbound allowlist; no live request or bypass runner is permitted.
- Synthetic contract tests are boundary checks only; they are not live playback proof. A curl_cffi install changing observed behavior is not accepted as a causal claim.

## Recovery

Last verified local commit: `17a5141bba1e4b2b24e5ec9300d8ce971b856a8c`. If the snapshot limit error recurs, stop retrying tools; restore via the recovery steps above from `origin/arena/cd835a4c-anime-card-assets`.
