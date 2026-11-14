# MovieBox candidate — feasibility gate (not integrated)

## Decision
ADAPTER REQUIRED; LIVE ACCESS/PLAYBACK UNVERIFIED. The accepted v0.23.0/code39 mobile runtime is unchanged. No new APK is justified by this gate alone. Owner authorized starting the previously proposed staged feasibility work, not paid hosting or bypass of upstream restrictions.

## Reviewed upstream
Repository https://github.com/walterwhite-69/Moviebox-API
Pinned revision 64bcaadfe7246e75f3f86fdbd5dc4df8abf76442.
Reviewed README, requirements, engine request flow, search/details/episode projections, stream/caption projections and route handlers through GitHub API. Did not install or execute upstream code. Public README provides self-host instructions; no verified ready-to-use hosted instance was established by this review. MIT code license is not evidence of content rights or permission to impersonate upstream clients.

## Code evidence and compatibility results
1. api.py:254–317: search/details use string subject_id; IMDb rating is not IMDb identity. dubs carry their own subject_id. No normalized TMDB/IMDb ID mapping is exposed by these methods. Do not coerce provider IDs into JavaScript Number: long IDs can lose precision. No title-name-first-result auto-play.
2. api.py:1068–1087: /api/stream/{subject_id}?se=...&ep=... plus separate /captions endpoint. AniGooD sourceIntegration.ts:50–61 sends id/season/episode query fields on a configured fixed URL, not MovieBox's path/parameter contract.
3. api.py:370–410,437–450: raw stream headers, sometimes Origin and separate cookie data. AniGooD sourceIntegration.ts:35–44 rejects raw headers and permits only explicit approved-origin Referer/User-Agent proxy headers. Do not drop required headers blindly, globally relax the allowlist or pass through cookies to make a fixture appear playable.
4. api.py:471–505: captions use language/code and separate endpoint, not inline normalized subtitles. A normalizer would need explicit fetch/validation, credential separation and expiry handling. Upstream fallback to English when language is absent is not verified language evidence.
5. api.py:195–252,319–355: engine bootstraps a bearer token, signs private requests and sends client/restriction-related headers. Repository description advertises Cloudflare bypass. This is not established as an official authorized partner API. Do not deploy/replicate this mechanism as a default integration; confirm a usable authorized service/access path first. No bypass implementation has been added here.
6. MP4/DASH are source-declared labels, not verified codec/playback/download guarantees. DASH/HLS segment download remains unsupported by the accepted downloader.
7. Pinned upstream `api.py` (`get_streams`, lines 319–456) swallows exceptions at three levels while the `/api/stream/{subject_id}` route (1069–1076) still returns HTTP 200 with `{"count": len(streams), "streams": streams}`: a details failure falls back to an empty `detail_path` (322–326); the web CDN loop skips every non-200 response and every exception per domain (`if resp.status_code != 200: continue`, `except Exception: continue`, 338–446); the mobile-native block ends in `except Exception: pass` (449–456). A live HTTP 429 or blocked upstream request therefore reappears to the caller as a successful response with zero streams. `search_suggest` applies the same pattern (`except Exception: raw = []`, ~1046–1050). Consequence: an empty stream list from upstream proves neither absence of content nor successful access; AniGooD must surface upstream status/failure distinctly instead of silently collapsing it to zero rows.

## Reproducible checks
New tools/test-watch-moviebox-compat.cjs runs synthetic, non-network schema compatibility checks against the actual unchanged AniGooD parser. Fixtures use example.com, contain no live media URLs/tokens and are not captured upstream responses.
- Fixed JSON query differs from se/ep contract.
- Raw header rows rejected even with approved origin.
- Origin/Cookie cannot be smuggled through existing allowlist.
- Separate captions response is not automatically consumed; quality-only stream metadata does not become a verified label.
- Long provider IDs must stay strings.

Command: NODE_ENV=test node --test tools/test-watch-moviebox-compat.cjs tools/test-watch-sources.cjs tools/test-watch-downloads.cjs
Result: 27 tests PASS (5 new compatibility + 12 source + 10 downloads). These pass by demonstrating current compatibility boundaries, not successful MovieBox integration.

Verification re-run 2026-11-13 on branch `arena/6f7e15ba-anime-card-assets` (HEAD `17a5141`): same command re-executed, **27/27 PASS, 0 fail**, no network access. Required test dependencies (typescript, react, react-test-renderer) were placed only in the snapshot-excluded `apps/mobile/node_modules`; no live upstream request, token, cookie or signed URL was used.

## Live gate still outstanding
Sandbox outbound access is restricted to GitHub/npm/PyPI-related hosts; MovieBox/CDN hosts are outside that allowlist. No live upstream request/media-byte/native playback success is claimed. No external runner was deployed to work around the restriction. Need a service/access path the owner is permitted to use, and an approved test environment that can reach it. Never ask for credentials in chat; use private settings/secrets if needed.

Required evidence: one correctly identified movie, anime episode and drama episode (including year/season/episode); stream response; actual media bytes/status/codec; caption bytes/language; dub variant identity where available; signed URL expiry; direct-file size/Range/ETag for downloads; native phone playback. Unsupported/absent content must fail honestly.

## Conditional next stage
Only after live gate success: isolated provider catalog using exact string subject IDs; normalized adapter with bounded responses, allowlisted headers and local caption parsing; explicit supported download capability; no automatic TMDB/Kitsu title-name matches. Preserve BYOS/Test Lab/history/Tracker isolation. Stable cross-catalog mapping is a separate verified stage. Keep provider credentials server-side where appropriate. No billing, Render changes, Watch Party or Step8.
