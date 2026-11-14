# Session handoff — MovieBox feasibility checkpoint

Branch: `arena/6f7e15ba-anime-card-assets` · Baseline: `17a5141bba1e4b2b24e5ec9300d8ce971b856a8c` · App: AniGooD v0.23.0 / Android code39 (unchanged)

## Completed

- Baseline verified: assigned branch unchanged, HEAD `17a5141`, working tree clean, app version/versionCode intact. No legitimate changes lost.
- Migration re-applied safely after `.git` refs reverted to clone state between turns (platform persistence quirk): `git fetch origin arena/cd835a4c-anime-card-assets` → HEAD verified `17a5141` → ancestor check → `git add -A` + `git merge --ff-only`. No reset/rebase/force; no other branch touched.
- Upstream review (pinned `walterwhite-69/Moviebox-API@64bcaadfe7246e75f3f86fdbd5dc4df8abf76442`, read-only via GitHub API): confirmed `get_streams` swallows exceptions at three levels while `/api/stream/{subject_id}` always answers HTTP 200; a live 429/blocked request reappears as `count: 0, streams: []`. Recorded as finding 7 in `WATCH-MOVIEBOX-FEASIBILITY.md`.
- Network-free contract/regression tests re-run: `NODE_ENV=test node --test tools/test-watch-moviebox-compat.cjs tools/test-watch-sources.cjs tools/test-watch-downloads.cjs` → **27/27 PASS, 0 fail** (5 compat + 12 source + 10 downloads). Test deps (typescript, react, react-test-renderer) live only in snapshot-excluded `apps/mobile/node_modules`.
- Evidence report updated: verification re-run note + upstream swallowing finding.
- Workspace hygiene checked: ~30 MB total, largest file 1.5 MB, `.git` 9.4 MB, no file >2 MB. No cleanup required; no generated APK/ZIP/log/media left behind.
- Signed test APK built via the existing GitHub Actions `Android test APK` workflow (run `43554471720`, workflow_dispatch on this branch): security/rules ✓ 2m32s, build ✓ 8m47s. versionCode bumped 39 → 40 with package (`com.yasin636.animemetahub`) and signing identity unchanged, so in-place update without uninstall. Pinned foundation expectation updated (`tools/validate-mobile-foundation.cjs`). Artifact: **`AniGooD-v0.23.0-Watch4B`** (37 MB ZIP, signature verified against the pinned private certificate in-workflow). Run URL: https://github.com/yasin636/anime-card-assets/actions/runs/43554471720. Note: the first trigger (run `43554017572`) failed only because the pinned versionCode expectation was still 39; after the pin update the re-run (`43554471720`) succeeded. No local build attempted (sandbox lacks Java/Gradle/Android SDK and Gradle hosts are outside the network allowlist).

## Outstanding (blocked on owner gates)

- **Live access gate (owner approval required):** one correctly identified movie, anime episode and drama episode with HTTP status, actual media bytes (Range/ETag/size), codec, caption bytes/language, dub identity, signed-URL expiry, and native phone playback. Unsupported content must fail honestly. No signed URL/token/cookie stored in repo/report/log.
- **MovieBox adapter:** bounded-contract prototype committed (`movieboxAdapter.ts`); live wiring only after live gate success. Separate catalog with exact string subject IDs; explicit `se`/`ep` + separate captions; distinct error surfacing for upstream empty/non-200/local rejection; allowlisted headers only; no DASH/torrent/DRM/cookie pass-through. No title-first-result guessing.
- **Runtime integration / new signed APK:** only after feasibility, authorization and identity-mapping findings are shown and approved. versionCode bump keeps package + signing identity; no fabricated signing config.
- **DASH/HLS download:** not claimed by the accepted downloader.

## MovieBox integration — selection + own-adapter prototype + Test Lab wiring

- **Method-level static analysis** of the candidate cs3 provider (androguard dex disassembly; package never run): full CloudStream3 call flow, dependency requirements, token/signing role, stats call sites. Recorded in `MOVIEBOX-CS3-PROVIDER-REVIEW.md` §4b; TMDB api_key value redacted.
- **Selection (evidence-based):** (A) isolated plugin prototype REJECTED — host-process executable code, no ClassLoader sandbox, embedded shared TMDB key, signing replication, third-party stats GET → isolation from AniGooD accounts/secrets not achievable. (B) **own adapter SELECTED**. (C) unresolved blocker = no effective authorized MovieBox backend access path (anonymous-token + x-client-token + x-tr-signature; not an authorized partner API; live access unproven).
- **Own-adapter prototype** (commit `0f43304`): `apps/mobile/src/watch/movieboxAdapter.ts` — bounded data-contract (URL builders + parsers, string subject IDs, empty/absent = failure, no signing/credentials/network/telemetry). `tools/test-watch-moviebox-adapter.cjs` — 9 network-free contract tests.
- **Opt-in Test Lab wiring** (commit `c681f8c`): `apps/mobile/src/watch/movieboxSource.ts` — fail-closed config (no backend ⇒ `not-configured`), distinct error codes (not-configured/config/mapping/network/timeout/http/response/empty/unsupported), string subject IDs, same header/cookie/DASH strictness as the existing boundary (raw headers, cookie-dependent DASH, out-of-origin streams rejected ⇒ `empty`, never success). No network, no signing, no credentials, no telemetry. `tools/test-watch-moviebox-source.cjs` — 12 network-free wiring tests.
- **All prototype, NOT MovieBox integration** — live wiring only after the live-access gate passes.
- **Real search → details → play integration + Test Lab signed APK: BLOCKED — no mock APK built.** Owner requested a real MovieBox search→details→play integration and a phone-testable signed Test Lab APK; if real integration can't be created, don't build a mock APK, report the specific blocker (and don't re-ask for mock/permission). **Correction applied:** the token/signing mechanism (`x-client-token`, `x-tr-signature`, anonymous token, device id) is **client authentication, not bypass** — the earlier "restriction-evasion" label for this part was over-inflated and is corrected. **Actual bypass evidence (well-evidenced):** `loadLinks` (play step) sends the `x-vip-restrict` / `x-no-high-risk-restrict` access-control-disabling headers (forbidden access-control bypass); `search`/`loadLinks` also impersonate MovieBox-app/browser user-agents (forbidden header spoofing). **Determination:** a phone-testable real Test Lab build is **not possible** without the forbidden access-control bypass (play step) and header spoofing (client identity); the proprietary client-auth signing is also undocumented and, even replicated, play still needs the forbidden bypass headers. Environmental blocker verified: MovieBox hosts (`apig.inmoviebox.com`, `api.inmoviebox.com`) unreachable from this sandbox (`SSL_ERROR_SYSCALL`). Per instruction, **no mock APK was built**; the precise blocker is reported in `MOVIEBOX-CS3-PROVIDER-REVIEW.md` §5 Option C.
- Tests: adapter 9/9, wiring 12/12; full network-free suite **48/48 PASS**. Approved APK (run `43554471720`, artifact `AniGooD-v0.23.0-Watch4B`) unchanged; TMDB/Kitsu/BYOS/player/downloads/accounts/data untouched.

## Blockers / notes

- Workspace persistence quirk: `.git` refs revert to clone state between turns while the working tree is kept. Recovery: fetch `origin/arena/cd835a4c-anime-card-assets`, verify HEAD `17a5141`, `git add -A`, then `git merge --ff-only`. Do not run reset/rebase/force.
- Live MovieBox/CDN hosts are outside this sandbox's outbound allowlist; no live request or bypass runner is permitted.
- Synthetic contract tests are boundary checks only; they are not live playback proof. A curl_cffi install changing observed behavior is not accepted as a causal claim.

## Recovery

Last verified pushed commit: `66bfeba` (branch `arena/6f7e15ba-anime-card-assets`; parent chain `b538b89` → `c681f8c` → `143206b` → `0f43304` → `ac9c7d8`). If the snapshot limit error recurs, stop retrying tools; restore via the recovery steps above from `origin/arena/6f7e15ba-anime-card-assets` and re-apply the committed work.
