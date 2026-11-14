# CNCVerse MovieBoxProvider.cs3 — static inspection (no package run)

Candidate: `https://github.com/NivinCNC/CNCVerse-Cloud-Stream-Extension` @ `08d9aa87ed551efe9604e52ece7a2bfb45426aef`
Target: `MovieBoxProvider.cs3` (v53, declared fileSize 94649)

## 1. Pinned download + hash verification

- Downloaded `MovieBoxProvider.cs3` from the pinned revision via GitHub API.
- Actual size: **94649 bytes** — matches declared fileSize.
- Actual SHA256: **`aa8e3d1f09ce9988419d3bfacae3fa9d919cc28bc89779ffcc3248eed1a1b0fc`** — matches declared hash.
- `plugins.json` entry for MovieBoxProvider: version 53, fileSize 94649, fileHash `sha256-aa8e3d1f…b0fc` — all consistent.
- **Hash match confirms byte-identity to the pinned artifact, NOT safety or author authenticity.**

## 2. Archive / manifest / dependency inspection

- `.cs3` archive contains exactly two files: `manifest.json` + `classes.dex`. No native libs, no assets.
- `manifest.json`: `{"requiresResources":false,"version":53,"pluginClassName":"com.cncverse.MovieBoxProviderPlugin","name":"MovieBoxProvider"}`
- Plugin is a **CloudStream3 (lagradost) Kotlin plugin** — strings reference `com/lagradost/cloudstream3/MainAPI`, OkHttp networking.
- Repo distribution: compiled `.cs3` only. **No source code** for the providers in the repo.

## 3. Source / licence availability

- **No LICENSE file** at the pinned revision; GitHub repo metadata `license: null`.
- No README at the pinned revision. Repo description markets it as a CloudStream extension for various OTT services.
- CloudStream (upstream host app) is GPLv3, but **this candidate repo declares no licence** — reuse/redistribution terms are unclear/unauthorized.

## 4. Provider host API requirements (from classes.dex strings)

MovieBox backend family (same wefeed API family as pinned `walterwhite-69/Moviebox-API`):
- `https://movie-box.co/wefeed-h5api-bff/detail?detailPath=` and `/wefeed-h5api-bff/subject/play` (web BFF)
- `https://api3.aoneroom.com` + `/wefeed-mobile-bff/subject-api/list`, `/subject-api/search/v2`, `/subject-api/get?subjectId=`, `/subject-api/season-info?subjectId=`, `/subject-api/get-ext-captions?subjectId=`, `/subject-api/get-stream-captions?subjectId=`, `/tab/ranking-list?...` (native BFF)
- `https://apig.inmoviebox.com/wefeed-mobile-bff/tab/ranking-list?...` (alternate host)

TMDB (metadata/logos):
- `https://api.themoviedb.org/3` with a **hardcoded shared `api_key`** (value redacted in this report; present in `classes.dex`, used by `MovieBoxProviderKt.fetchTmdbLogoUrl`, `searchAndPick`, `searchAndPick$doSearch`) + `append_to_response=external_ids`
- `https://image.tmdb.org/t/p/w500`

Cinemeta: `https://v3-cinemeta.strem.io/meta/`

Donation stats endpoint: `https://cncverse.pages.dev/api/stats`

## 4b. Method-level static analysis (androguard dex disassembly, no runtime)

**Call flow (CloudStream3 Plugin API → endpoints):**
- `search(String,int)` → `/wefeed-mobile-bff/subject-api/search/v2` (MovieBox native BFF search)
- `load(String)` → `/wefeed-mobile-bff/subject-api/get?subjectId=` (details) + `/subject-api/season-info?subjectId=` (episodes) + TMDB (`api.themoviedb.org`) for metadata
- `loadLinks(...)` / `loadLinks$emitNetStream(...)` → `/wefeed-h5api-bff/subject/play` (web play) + `/subject-api/get?subjectId=` + captions (`/subject-api/get-ext-captions?subjectId=`, `/subject-api/get-stream-captions?subjectId=`)
- `getMainPage(...)` → `/wefeed-mobile-bff/subject-api/list` + `/tab/ranking-list`
- `MovieBoxProviderKt.searchAndPick` / `fetchTmdbLogoUrl` → TMDB with the hardcoded shared key

**Dependency requirements (host must provide):** `com.lagradost.cloudstream3.*` (`MainAPI`, `MovieLoadResponse`, `TvSeriesLoadResponse`, `MovieSearchResponse`, `Episode`, `ExtractorLink`, `ExtractorLinkType`, `MainPageRequest`, `TvType`), `com.fasterxml.jackson.databind.*` (`ObjectMapper`, `JsonNode`), OkHttp, Android `Context`/`SharedPreferences`, Kotlin coroutines. The plugin **cannot run without a CloudStream3 host supplying these classes**.

**Token/signing role (method-level):**
- `fetchAnonymousToken(force)` performs a **signed GET probe** to `https://apig.inmoviebox.com/wefeed-mobile-bff/tab/ranking-list?tabId=0&categoryType=4516404531735022304&page=1&perPage=1`, building `generateXClientToken(currentTimeMillis)` + `generateXTrSignature(...)` and sending MovieBox app user-agent + `application/json`. This is the MovieBox anonymous-token bootstrap + request-signing mechanism, replicated in-process (same family as the pinned Python `Moviebox-API` engine). Called from `load`/`loadLinks` flows (4 call sites).
- `generateDeviceId()` runs in the constructor; `signCookie`/`cookieStr`/`cachedGuestToken` handle DASH cookie signing.

**Stats endpoint call sites (method-level):**
- `DonationManager.fetchStats(SharedPreferences)` builds `https://cncverse.pages.dev/api/stats` and issues a **plain `java.net.URL` GET with no parameters/body** — it downloads donation progress JSON (`totalUsd`, `targetGoalUsd`, `percent`, `supporterCount`, `month`) and caches it in SharedPreferences (`cncverse_donation_cached_*`). Caller falls back to `readCache` on failure. **No user data is sent**; it is an unexpected third-party network call as part of the plugin's donation feature, not data exfiltration.

## 5. Evidence-based selection

**Option A — isolated plugin prototype (run the .cs3): REJECTED.**
Evidence: (1) the plugin requires host-supplied `com.lagradost.cloudstream3.*` classes and runs via CloudStream PluginManager → PathClassLoader → `load(context)` — host-process executable code, ClassLoader is not a sandbox; (2) it embeds a shared TMDB `api_key` (redacted) and replicates the MovieBox token/signing mechanism in-process; (3) it performs a third-party stats GET. Running it inside AniGooD shares AniGooD's process/UID/data context and its embedded credential — **proper isolation from existing accounts/secrets is not achievable** (separate thread or same-UID process is not isolation). A separate-UID sandbox is not available within a single app.

**Option B — own adapter (native, bounded, own code): SELECTED as the integration direction.**
The provider's API surface is now fully mapped at method level (call flow, endpoints, dependencies, signing role). An own adapter reuses the existing `sourceIntegration.ts` data-only boundary, uses explicit string subject IDs, no title-first-result guessing, no embedded key, no signing replication, no stats call. It keeps TMDB/Kitsu/BYOS/player/downloads/accounts/data untouched and is opt-in Test Lab only.

**Option C — specific unresolved blocker (must be named, not hidden):**
**No effective, authorized backend access path to the MovieBox backend — every step of the requested search → details → play flow requires the same restriction-evasion mechanism, so a real integration cannot be built here without violating the no-bypass constraint.**

Precise evidence (method-level dex disassembly, call-site mapping of `fetchAnonymousToken` / `generateXTrSignature`):

| Flow step | Method | Token/signing required? | Evidence |
|---|---|---|---|
| Search | `search(String, int, Continuation)` | **Yes** | Calls `generateXTrSignature$default` + `fetchAnonymousToken$default`, sets MovieBox app user-agent `com.community.mbox.in/…` |
| Details | `load(String, Continuation)` | **Yes** | 2 `fetchAnonymousToken` call sites inside the method body |
| Play / stream links | `loadLinks(String, boolean, Function1, Function1, Continuation)` | **Yes** | 2 `fetchAnonymousToken` call sites inside the method body |

So the entire data flow depends on the anonymous-token + `x-client-token` + `x-tr-signature` mechanism plus MovieBox-app user-agent spoofing — a restriction-evasion / Cloudflare-bypass mechanism, **not an authorized partner API**. There is no endpoint in search → details → play that can be used without it. Replicating it is forbidden (no rate-limit/access-control bypass, no cookie/header spoofing, no credential storage). No official/partner API exists in any evidence gathered.

**Environmental blocker (verified):** live MovieBox hosts (`apig.inmoviebox.com`, `api.inmoviebox.com`) are **unreachable** from this sandbox (plain reachability probe → `SSL_ERROR_SYSCALL` on 443), while allowlisted hosts (e.g. `github.com`) are reachable. So even a signed-URL/playback test cannot be run from here.

Consequence: **a network-free mock/contract test (the own-adapter prototype) is a prototype, NOT MovieBox integration** and must not be labelled as integration. No signed APK containing only the inert prototype will be built to masquerade as MovieBox integration — per the owner's instruction, the blocker is reported instead. Until an owner-approved, authorized access path exists (or the evasion constraint is explicitly revised), real MovieBox search → details → play integration is not achievable in this environment.

## 6. Prototype plan (own adapter, opt-in Test Lab)

- Bounded adapter module implementing the MovieBox data contract (search/details/stream/captions schema, string subject IDs, identity mapping) on the existing source boundary — **no .cs3 execution, no signing replication, no embedded key, no stats call**.
- Network-free contract tests with synthetic fixtures: response parsing, identity mapping, empty/absent handling, no Number coercion of long IDs — explicitly labelled **contract/prototype, not integration**.
- Opt-in Test Lab surface only; main app UI/search/player flows unchanged; accounts/data untouched.
- Integration claims require the live-access gate: correct title/year/episode, real full video+audio, seek, captions/qualities shown truthfully; notice/trailer or failed stream never reported as success. No universal-availability claim beyond successful small tests.

## 7. Status

- Method-level static analysis complete (androguard dex disassembly); package **not run**.
- Selection: **own adapter (Option B)**; isolated plugin prototype rejected (Option A, evidence above); **unresolved blocker = no authorized MovieBox backend access path (Option C)**, now refined with per-step evidence: search, details, and play ALL require the forbidden token/signing + user-agent spoofing, and the hosts are unreachable from the sandbox.
- **Decision: no mock APK will be built to masquerade as MovieBox integration.** The own-adapter prototype + opt-in Test Lab wiring (commits `0f43304`, `c681f8c`) remain as bounded contract/prototype only. Real search → details → play integration is blocked until an authorized access path is established or the evasion constraint is explicitly revised.
- TMDB key value redacted in this report. Main app/accounts/data unchanged; no paid service or access bypass.
