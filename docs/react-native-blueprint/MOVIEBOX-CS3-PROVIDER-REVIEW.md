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
- `https://api.themoviedb.org/3` with **hardcoded `?api_key=1865f43a0549ca50d341dd9ab8b29f49&append_to_response=external_ids`**
- `https://image.tmdb.org/t/p/w500`

Cinemeta: `https://v3-cinemeta.strem.io/meta/`

Author telemetry: `https://cncverse.pages.dev/api/stats` (donation/supporters stats ping)

Auth/signing mechanism strings: `fetchAnonymousToken`, `generateXClientToken`, `X-Client-Token`, `X-MB-Token`, `Bearer`, `cookieStr`, `signCookie`, `cachedGuestToken` — the plugin replicates the MovieBox anonymous-token bootstrap + request signing + cookie signing in-process.

## 5. Blockers for direct .cs3 use inside AniGooD (own UI/search/player, no WebView/external launch)

1. **Execution model mismatch.** `.cs3` runs via CloudStream's PluginManager → PathClassLoader → manifest `pluginClassName` → plugin `load(context)`. This is **host-process executable code; the ClassLoader is not a sandbox**. AniGooD has no CloudStream plugin host; embedding PluginManager runs the plugin in AniGooD's own process/UID/data context. Separate thread or same-UID process is **not** isolation.
2. **Hardcoded shared TMDB api_key** (`1865f43a…f49`). A third-party credential embedded in the artifact — cannot be isolated from the host app's accounts/secrets context, and TMDB key-usage terms apply.
3. **Token/cookie signing replication** (`X-Client-Token`, `signCookie`, anonymous token bootstrap) — the same MovieBox engine mechanism already flagged as not an authorized partner API; not to be replicated as a default integration.
4. **Telemetry to author server** (`cncverse.pages.dev/api/stats`) — unexpected network behavior; privacy/consent consideration.
5. **No licence** (`license: null`) and **no source** — legal reuse/redistribution unclear; cannot audit or maintain.

Conclusion: **proper isolation from existing AniGooD accounts/secrets is NOT achievable for direct `.cs3` execution** under the stated constraints. The `.cs3` is therefore **not a candidate for direct integration**.

## 6. Safe path (prototype direction)

If MovieBox access is desired with AniGooD's own UI/search/player:
- **Native bounded source adapter** (own audited code, like the existing `sourceIntegration.ts` data-only boundary) — do **not** execute the `.cs3`.
- No embedded TMDB key; no token/cookie signing replication; no author telemetry; no marketplace/auto-update.
- Opt-in only, isolated Test Lab surface; explicit IDs; no title-first-result guessing.
- Still gated on the **live-access gate** (owner-approved environment): correct title/year/episode, real full video+audio, seek, captions/qualities shown truthfully; notice/trailer or failed stream never reported as success.
- Acceptance evidence from the known playback facts stands: BBB count0, Sintel count5 with failed full Web MP4 playback, HTTP429 on a direct URL, Mobile Native 0.8MB/23sec entry being a service-update notice — **none of these are attributed to this cs3 provider** (untested).

## 7. Status

- Static inspection complete; package **not run**.
- Direct `.cs3` integration: **blocked** (blockers 1–5 above, with evidence).
- Native opt-in Test Lab adapter prototype: **viable**, pending owner go-ahead on scope + live-access gate.
