# AniGooD v0.20.1/code33 — Watch2 catalog fix
Install over v0.20.0 with same package/private signature. Do NOT uninstall or clear data.

## Fix
Public Jikan API requests removed from all mobile source. Anime source selector:
- TMDB Series (default): Japanese-original-language Animation TV metadata.
- TMDB Films: Japanese-original-language Animation film metadata.
- Kitsu: experimental public read-only anime catalog, independent IDs. No TMDB key sent to Kitsu.
TMDB sources use your existing saved TMDB credential. No new key, billing or Render deploy needed. Kitsu requires no API key. Explicit switching, not silently mixing catalogs or relabeling IDs. TMDB filtered search may have empty pages; Load more can find later matching results. Provider coverage not equivalent.

Legacy jikan:<MAL_ID> saved titles/history remain valid and unchanged in existing watch.library.v1.<uid>. Details show legacy saved metadata, no request/refresh. New kitsu:<ID>, tmdb:tv:<ID>, tmdb:movie:<ID> cannot collide. No automatic cross-provider conversion/deduplication. Existing Anime Tracker server data/code/schema untouched.

HTTP status (401/403/429/etc), timeout, connection failure and malformed response now produce provider-specific redacted messages. No native error/URL/token echoed. Kitsu failure offers TMDB Series button.

## Provider documentation/terms review
Official Kitsu API docs: https://github.com/hummingbird-me/api-docs/tree/openapi3 (api/kitsu.yml, media/anime paths, category/year/text filters). Public GET API; no authentication needed for these metadata requests. Source client now uses kitsu.app: official web repo config/environment.js on the-future branch identifies production/current domain. Media URLs allowlisted media.kitsu.app and media.kitsu.io. No official live-endpoint uptime test possible in sandbox.
Official terms source reviewed: https://github.com/hummingbird-me/kitsu-web/blob/the-future/markdown/terms.md (version1.0,2016). Restrictive service/content/commercial provisions exist; software/docs open-source licensing is NOT blanket dataset permission. No claim of commercial redistribution approval or current legal clearance; live current terms https://kitsu.app/terms linked in UI, verify/obtain permission before public/commercial distribution. Kitsu is optional/experimental; working TMDB remains default. Only small per-user browsing, no bulk mirror, remote writes, account credentials, or code plugins. Query/IP goes to selected catalog; poster CDN sees IP.
Retired public Jikan notice: https://github.com/Ervie/jikan.net README. AniList unchanged: not used without needed permission.

## Phone tests
1. Update in place; TMDB credential and all account/balances/cards/Tracker/Watchlist intact.
2. More → Watch → Anime → TMDB Series: posters or specific error. Switch TMDB Films, search and genre/year filters. Labels must remain distinct from Kitsu.
3. Select Kitsu: catalog/search/details/known numbered episodes. If unavailable, show Kitsu HTTP/network/timeout message; Use TMDB Series instead must recover. Do not assume current API uptime from build success.
4. Open any old saved Jikan title/history: preserved name/metadata/position and legacy label, no endless network retry. Existing progress still requires same video link.
5. Movie/Drama catalog, season selection, Watchlist/restart, matching-source Resume and offline sample audio/subtitle/fullscreen/background remain correct.

No production movie streams, downloads, PiP, addon market or Watch Party introduced. Native build/test success is not live provider or device acceptance. Mock transport/React tests verify mappings, redaction and ID preservation, not live availability.
