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
**A phone-testable real MovieBox search → details → play integration is NOT achievable without the forbidden access-control bypass. Correction to an earlier over-label: the token/signing mechanism itself is client authentication, not bypass; the actual bypass evidence is the `x-vip-restrict` / `x-no-high-risk-restrict` headers.**

### Correction: token/signing is client authentication, not bypass
The `x-client-token` + `x-tr-signature` + anonymous-token (`fetchAnonymousToken`) + device-id mechanism is the API's **client authentication** (a token + signature protocol that any client must present). Calling this "restriction-evasion/bypass" was over-inflated and is corrected here. This part, in isolation, is protocol implementation — not access-control bypass.

### Actual bypass evidence (well-evidenced): the restriction-disabling headers
Method-level dex disassembly of `loadLinks` (the **play / stream-links** step) shows the request header map explicitly includes:
- `x-vip-restrict`
- `x-no-high-risk-restrict`

These are **access-control-restriction-disabling headers**: the client tells the server not to apply VIP / high-risk access restrictions. Sending them is **access-control bypass** — well-evidenced and forbidden by the standing prohibition. They appear **only in `loadLinks` (play)**, not in `search` or `load` (details).

### Header-spoofing evidence (forbidden)
- `search` sets the MovieBox-app user-agent `com.community.mbox.in/50020042 (Linux; U; Android 16; … Cronet/133.0.6876.3)` — client impersonation (header spoofing).
- `loadLinks` sets a browser user-agent `Mozilla/5.0 (Linux; Android 15; Pixel 9) … Chrome/154.0.0.0 Mobile Safari/537.36` + a `Referer` of `/movies/?id=…&type=/movie/detail…` — browser impersonation (header spoofing).

Both are forbidden header spoofing.

### Determination: phone-testable real Test Lab build
**Not possible** to build a real, working MovieBox search → details → play integration without violating the bypass/spoofing prohibitions. The specific required implementations that cannot be done:

1. **Play / stream-links (`loadLinks`):** the community client sends the `x-vip-restrict` / `x-no-high-risk-restrict` access-control-bypass headers. Sending them is forbidden; omitting them means the play step does not match the only known working client behavior, and whether the backend would accept a non-bypassing play request is untestable from this sandbox. **A working play step cannot be implemented without the forbidden bypass headers.**
2. **Client identity:** every step presents a MovieBox-app or browser user-agent (header spoofing). A non-spoofing client identity is not what the known client sends, and whether the backend accepts it is untestable here. **The client-identity header cannot be set without forbidden spoofing.**
3. **Client-auth signing:** `generateXTrSignature` / `generateXClientToken` / `fetchAnonymousToken` are proprietary, undocumented methods. Replicating them means reverse-engineering and reimplementing a proprietary auth mechanism for a backend with no authorization; even with it, the play step still needs the forbidden bypass headers (point 1).

**Environmental blocker (verified):** live MovieBox hosts (`apig.inmoviebox.com`, `api.inmoviebox.com`) are **unreachable** from this sandbox (plain reachability probe → `SSL_ERROR_SYSCALL` on 443), while allowlisted hosts are reachable — so no live request or backend-requirement test can be run from here to resolve points 1–2 empirically.

**Consequence:** a network-free mock/contract test (the own-adapter prototype) is a prototype, NOT MovieBox integration. Per the owner's instruction, **no mock/inert APK will be built** to masquerade as MovieBox integration, and no new permission is requested. The precise blocker is reported above.

## 6. Prototype plan (own adapter, opt-in Test Lab)

- Bounded adapter module implementing the MovieBox data contract (search/details/stream/captions schema, string subject IDs, identity mapping) on the existing source boundary — **no .cs3 execution, no signing replication, no embedded key, no stats call**.
- Network-free contract tests with synthetic fixtures: response parsing, identity mapping, empty/absent handling, no Number coercion of long IDs — explicitly labelled **contract/prototype, not integration**.
- Opt-in Test Lab surface only; main app UI/search/player flows unchanged; accounts/data untouched.
- Integration claims require the live-access gate: correct title/year/episode, real full video+audio, seek, captions/qualities shown truthfully; notice/trailer or failed stream never reported as success. No universal-availability claim beyond successful small tests.

## 7. Status

- Method-level static analysis complete (androguard dex disassembly); package **not run**.
- **Correction (per owner):** the token/signing mechanism (`x-client-token`, `x-tr-signature`, anonymous token, device id) is **client authentication, not bypass** — the earlier "restriction-evasion" label for this part is over-inflated and corrected.
- **Actual bypass evidence:** the `x-vip-restrict` / `x-no-high-risk-restrict` access-control-disabling headers, sent in `loadLinks` (play step) — well-evidenced, forbidden.
- **Determination:** a phone-testable real MovieBox search → details → play Test Lab build is **NOT possible** without the forbidden access-control bypass (play step) and forbidden header spoofing (client identity). The required implementations that cannot be done: working play/stream-links (needs `x-vip-restrict`/`x-no-high-risk-restrict` bypass headers), client identity (needs MovieBox-app/browser user-agent spoofing), and proprietary client-auth signing replication (undocumented; even then play needs the bypass headers).
- **Decision: no mock/inert APK will be built** to masquerade as MovieBox integration; no new permission requested. The own-adapter prototype + opt-in Test Lab wiring (commits `0f43304`, `c681f8c`) remain bounded contract/prototype only.
- Selection: **own adapter (Option B)**; isolated plugin prototype rejected (Option A); **unresolved blocker (Option C)** = forbidden access-control bypass + header spoofing required by the backend, now precisely characterized.
- TMDB key value redacted in this report. Main app/accounts/data unchanged; no paid service or access bypass.
