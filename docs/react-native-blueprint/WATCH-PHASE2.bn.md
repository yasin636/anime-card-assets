# AniGooD Watch phase 2 — v0.20.0/code32

## Scope
WatchHub catalog/search/filters/details/season/episode, local account watchlist/history, immutable source-session resume, existing Tracker add command, encrypted personal TMDB credential settings. Existing phase1 player remains available through Player & offline sample.
No production stream provider, fabricated availability, auto-rewards, downloads/party/PiP/plugin market.

## Provider decision and verification limits
- AniList official terms inspected at https://github.com/AniList/docs/blob/main/docs/guide/terms-of-use.md : competing list/tracker usage prohibited. No permission obtained, so default Anime metadata is Jikan/MyAnimeList, identifiers explicitly jikan/MAL not AniList.
- Movies and TV use TMDB with owner BYOK. Asian-drama discover filters origin KR/CN/JP, search worldwide (explicitly not origin-filtered). Credential API key query / Read Access Token authorization only to fixed TMDB endpoint. No credentials to Jikan/CDNs/video URLs. Save is not connection PASS.
- Sandbox outbound restricts live catalog hosts; real provider calls and phone acceptance NOT verified. Mocked transport and React tests test implementation paths, not availability/authorization.
- TMDB icon source simple-icons CC0; branding/nonendorsement in UI. Provider metadata does not confer content streaming/download rights.

## State/security
Local watch.library.v1.<uid>, credential watch.tmdb.v1.<uid> in SecureStore. Hydration failures disable writes, serial write queue, bounded150 saved/100 history. URLs not persisted: SHA256 comparison requires same exact URL to resume same source. Different/renewed source URL resets; completed entries restart. Approx5s progress + lifecycle flush. Old source cleanup captures immutable selection so offsets cannot migrate into a new source session.
No tracker-progress auto-update; explicit trackerAdd uses existing authorization and user checks actual result. No existing tracker schema/data migration.

## Owner instructions
See apps/mobile/ANIGOOD-WATCH2-TEST.md. TMDB credential is entered only in app, never chat/source/GitHub. No new server deploy/billing.

## Previous checkpoint
Owner phone-confirmed Watch1 original sample playback, two tones, subtitles on/off (screenshots), fullscreen/portrait and background pause. This does not prove Watch2 APIs or resume device behavior.
