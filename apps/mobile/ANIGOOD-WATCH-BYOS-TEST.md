# AniGooD v0.22.2 / 38 — Phase4A BYOS acceptance

Owner explicitly changed acceptance: supplied production anime/movie/drama providers are NOT a prerequisite for Phase4A completion or Phase4B Downloads. BYOS contract + controlled fixtures + phone checks are the acceptance boundary. No claim that any manifest means all content works. Downloads/Watch Party/Step8 are not implemented in this build. No Render/billing changes.

Install APK over current app; same package/private signing; do not uninstall/clear data. Previous owner v0.22.1 cinematic UI and open-film/PiP PASS preserved as baseline, regression required after update.

## 1. One URL Check & Save
Watch → Catalog settings (or Settings → Movie & Drama catalog) → Add a source.
Only one URL input initially; paste authorized HTTPS manifest.json URL → Check & Save. Name/movie|series types/prefix restrictions inferred from fetched manifest, account-scoped SecureStore. No manual name/prefix required. Trims whitespace. Safe letters/digits/dot/colon/underscore/hyphen prefixes accepted, bounded40×80chars. Missing prefix restriction remains unrestricted, not forced tt. Resource-specific constraints still enforced when resolving. Custom JSON and API headers stay collapsed under Advanced source settings.

For a known public open-film check use existing saved source or paste:
https://raw.githubusercontent.com/yasin636/anime-card-assets/arena/cd835a4c-anime-card-assets/docs/watch-sources/blender/manifest.json

Save same URL twice: refresh, not duplicate. Bad URL/private-host, nonJSON, missing stream/movie-series capability, HTTP access errors, network timeout and storage failure explain failure; no unchecked config saved, entered URL not cleared. Disable/enable/remove and account isolation preserved. Removing does not revoke remote token. No secret URL/header printed in status. Maximum5 sources.

## 2. IDs
TMDB external_ids → IMDb where available; native TMDB fallback. Kitsu provides native kitsu:{id} immediately while external mappings load. Automatic provider selection respects inferred prefixes/types; no name matching. Kitsu external/manual episode equivalence still requires explicit confirmation. Safe dotted/colon ID namespaces accepted for manual source IDs; does not invent a conversion from a catalog ID to every possible namespace. Stremio HTTP subset uses ID:season:episode for series; not every addon format is supported.

## 3. Player Test Lab
Watch → Open cinema → Enable Player Test Lab.
- Test MP4: openly licensed Big Buck Bunny + original TEST caption overlay. Play then subtitle size/delay/Off. CC BY3.0 Blender Foundation; preserve credits.
- Test remote VTT: MP4, then Audio & subtitles → Source subtitle en-test. Original fixture captions, not a translation. Headers never inherited by subtitle fetch.
- Shaka Angel One multi-audio HLS: actual manifest audio languages/embedded subtitle rendition choices; maximum video576p, not1080p.
- Apple BipBop adaptive HLS: manifest includes1080p; actual selected quality depends on device/network/adaptation. No forced1080p or device-codec guarantee.
- TEST visibly labelled. History/resume/Tracker MUST remain unchanged even after minimize/PiP/close/restart. Test mode hard-strips report/navigation/alternate callbacks at provider. Opt-in Lab makes no background requests until Play.
- Disable hides Lab choices; existing open-film button and advanced own-link/offline sample remain available. Lab is separate from real episode playback and supplies no actual anime content. Future download/watch-party validation can use fixtures after those features exist.

## 4. Verification
Automated HTTP fixtures run a real local HTTP server behind a test transport adapter (not a production host-validation bypass), exercising manifest→Kitsu stream request→proxy-header boundary→subtitle fetch/parsing; explicit Authorization goes only to fixture API and not captions. React tests exercise one visible input, inferred config, duplicate update, failed network/manifest/storage retaining input, Lab opt-in and provider-level history isolation. All existing regressions retained.

Separate credential-free GitHub media diagnostic checks live public JSON fixture, remote VTT, HLS master/child/video-segment bytes (Shaka multi-audio/subtitles and Apple1080p declarations), plus existing MP4 Range/ffprobe checks. Live checks are not native phone/TLS/decoder proof, nor a guarantee all future third-party addons work. Fixture endpoints are TEST-labelled; they do not return real anime or silently substitute for catalog episodes.

Phone acceptance: Easy Save/restart, actual authorized source or controlled fixture contract, Lab MP4/HLS/audio/subtitles/error handling/history isolation, prior player gestures/fullscreen/Back/mini/PiP. After owner accepts BYOS checks, Phase4B may begin WITHOUT requiring assistant to find a production content provider. Still no arbitrary JS/torrents/DRM bypass or paid-service activation.
