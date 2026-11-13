# AniGooD v0.20.0 / code32 — Watch Hub (phase 2)

Install over v0.19.0, same package/private signing. Do not uninstall/clear data. Phase1 offline sample playback, audio/subtitle toggling, fullscreen and background pause were owner-confirmed on phone; recheck after update.

## Included
- More → Watch: Anime / Movies / Drama, spotlight, posters, title search, discover year/genre, KR/CN/JP drama origin filters, paged catalogs (max240 per browse), details and episode selection.
- Anime metadata uses Jikan/MyAnimeList, NOT AniList. AniList's published API terms prohibit competing anime/manga list/tracker use; no permission has been obtained. See https://github.com/AniList/docs/blob/main/docs/guide/terms-of-use.md . Jikan is an unofficial third-party metadata API, not a licensed film provider or uptime guarantee.
- Movie/TV metadata uses TMDB; requires user's own API key or API Read Access Token. TMDB search is worldwide; discover origin/year/genre filters do not apply during search, Apply clears search. Drama is origin-filtered TV, not guaranteed exclusively dramatic fiction. Existing noncommercial API terms/limits apply; approval for commercial usage is not claimed.
- TMDB setup in Watch → Catalog settings OR Settings → Movie & Drama catalog. Secret saved account-scoped in SecureStore, never displayed/logged/added to video requests. Saving does not prove API access. API key goes as TMDB query credential; Read Access Token goes as Authorization header, only to fixed api.themoviedb.org endpoint. Remove is local deletion, NOT provider revocation.
- Movie/TV seasons/episodes from metadata. Anime uses known episode count (numbered labels, not verified episode availability/titles), unknown counts remain empty. No estimated SUB/DUB badges.
- Local account-scoped Watchlist (150) and Continue Watching history (100), not cloud sync. Existing Anime Tracker remains authoritative and unchanged. Explicit Add to existing Anime Tracker uses existing backend command; check actual server result in Tracker. No automatic progress/reward mutations.
- Details → Use my video: user supplies authorized public HTTPS link. No default production movie streams exist. Resume requires entering the SAME EXACT link; only its SHA256 fingerprint is saved, never raw URL. Different/renewed URL starts at zero to avoid wrong-edition playback. Progress checkpoints approx5s plus lifecycle flush. Completed/near-end entries restart. History can be removed; Watchlist toggled. Offline sample never records film progress.
- Player & offline sample retains phase1. Loading/error/retry, request abort/timeouts; no fake catalog results/offline fallback. External provider sees query/IP; poster CDN sees IP. Native/device access still requires live verification.

## Owner setup needed only for Movies/Drama
1. Open https://www.themoviedb.org/settings/api in your browser, use own account and follow their application/terms flow. No billing is activated by this build; if their process offers paid/commercial terms, stop and review first.
2. Copy API key or API Read Access Token into APP'S secure input, Save. Never paste it into chat, screenshots, source code or GitHub.
3. Open Movies/Drama to verify real access. Anime does not need this credential.
4. Do not share APK with embedded shared keys; none supplied here.

## Phone acceptance
- Existing login/cards/balances/tracker/feed/chat/Sensei remain intact.
- Anime loads actual posters or honest network/rate-limit message; query/filter, paging, details work. Unknown episodes not invented. Close/back works.
- Add/remove Watchlist; restart app; verify device/account isolation. Another login must not inherit it.
- Missing TMDB credential shows setup, not blank fake catalog. Save own credential; Movies and Drama load; season list and episode list work. Bad credential shows error/retry, no key echo.
- Details → episode → Use my video → enter own authorized matching link → Open → Play. Pause/seek, leave/return; Continue Watching asks for same link and resumes. Different link must NOT resume prior file offset. Finish/sample must not create bogus rewards.
- Recheck English sample subtitles/audio tones and landscape Back/background pause.

## Limits / tests
No production content provider approved. No claim that all metadata posters can play, no downloads/PiP/addon market/watch party in this release. Live APIs cannot be reached from the build sandbox's restricted outbound network; unit fetch tests are mocked, UI tests are mocked React tests, native CI build is real. Owner's network/device checks are required. No new server deploy or billing needed for this phase.

TMDB brand icon via simple-icons CC0: https://github.com/simple-icons/simple-icons/blob/develop/icons/themoviedatabase.svg ; TMDB trademarks remain TMDB's. Non-endorsement attribution included in UI.
