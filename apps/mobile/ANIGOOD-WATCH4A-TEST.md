# AniGooD v0.22.0 / 36 — Phase4A HTTP source integration

Install over existing signed app. Do not uninstall or clear data. Same package/certificate. No Render deploy, billing, economy/Tracker mutation, Step8, Watch Party or downloads. Phase4B only after owner phone accepts Phase4A.

## Setup
Watch → Catalog settings OR app Settings → Movie & Drama catalog → Watch sources.
- Give a source name, choose Stremio HTTP or Custom JSON, paste your authorized public HTTPS endpoint URL. No built-in production streaming provider or content rights supplied.
- Stremio URL must end in /manifest.json. Only HTTP stream resource supported, not full Stremio client. Check probes manifest; it does not prove every video playable.
- Custom JSON: GET configured endpoint with query `type=movie|series&id=...&season=...&episode=...`. Return `{"streams":[...]}`. Arbitrary REST formats are not auto-adapted. Use an API you control/are authorized to use matching this contract.
- Supported ID prefixes comma-separated: `tt` (default), `kitsu:`, `tmdb:`, `mal:`. Configure only prefixes your source actually supports. Stremio series request uses ID:season:episode; some anime addons use different formats and are outside this subset.
- Optional API headers JSON e.g. {"Authorization":"Bearer YOUR_TOKEN"} or {"X-API-Key":"YOUR_KEY"}; values hidden. Never put real secrets in chat/screenshots. Optional Accept/User-Agent allowed; Cookie/Host etc rejected.
- For stream behaviorHints.proxyHeaders.request Referer/User-Agent: explicitly opt in AND list exact allowed media origins, e.g. https://media.example.com. Other headers and response-header rewriting rejected. API auth never inherited by media/subtitles.
- Max5 sources, account/device SecureStore; enable/disable/remove. Storage load failure prevents overwrite. Remove does not revoke remote token. Provider sees your IP, requested ID and episode. API redirects refused with Expo native fetch; native video can follow redirects/segments on CDN, trust only authorized providers/CDNs. No IP/DNS pinning claim.

## Play
1. Catalog details → episode/movie → Find streams / My video.
2. Choose enabled source. Choose explicit supported mapping: TMDB external_ids IMDb, Kitsu native or mappings (IMDb/MAL when present), or manual ID. No name guesses.
3. For Kitsu external/manual series mapping explicitly confirm same season/episode. If not equivalent, do not confirm: use native compatible source or own-link path. Kitsu anime movies can explicitly choose Movie and verify source ID.
4. Find streams → actual returned stream choices → Play selected stream. Empty, unsupported, wrong type/prefix, timeout, bad config and HTTP errors stay contextual. No synthetic/sample fallback.
5. title/name/description/language/quality are source-reported, not independently verified. No guarantee all titles/codecs/DRM/private URLs/addons work.
6. Remote subtitles array becomes Source subtitle choices in player settings. Explicit selection fetches public UTF-8 SRT/VTT (up to512KiB/5000 cues); no API/playback headers sent. Endpoint may have no file extension. Size/delay/Off applies to rendered external text. Selecting Off/another track aborts pending remote request. No automatic subtitle provider search. External captions absent in native PiP, as before.
7. Same exact playback URL resume retained; changed/expiring signed URL starts zero (no wrong-edition resume guessing). Raw returned stream URL/headers/subtitles not persisted. Source configuration URL/credentials are saved in SecureStore.

## Regression/device acceptance (not claimed phone-tested yet)
- Save/Check source, disable/enable/remove, restart persistence, account isolation. No credentials printed in UI/errors.
- Real configured Stremio stream and custom JSON endpoint: mapping → choices → actual video. Test no result/bad ID/server error and Retry (Find streams again). User must supply authorized endpoints; no production source configured during build.
- Actual source headers/subtitle passed and rendered; invalid subtitle/over-limit failure, size/delay/Off. File import and embedded subtitles still work.
- Phase3 sample/play/pause/timeline/double-tap/speed pitch/gestures/fullscreen/Back/mini/PiP remain working.
- Watchlist/history restart and same-real-stream resume; Tracker unchanged, no automatic progress/rewards.

Automated fixtures test protocol, mapping, header consent/origin boundary, native redirect policy wiring, streaming byte cap/cancel, response validation and source-browser-to-playback handoff. Fixtures are not third-party service or native phone acceptance proof. Source responses max128KiB/50 streams/24 subtitles per stream; API request timeouts15–20s; bounded decoded response text. APK ZIP includes previous original 12-second sample subtitle file for local regression.
