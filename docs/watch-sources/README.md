# Phase4A source investigation and one-film open-animation source

This is NOT a production anime provider, endorsement of a third-party anime scraper, or proof of native playback. No paid service/deployment enabled. No APK change required. Static public JSON on this working branch serves exactly one explicitly identified movie; unsupported IDs return404 (not misleading sample fallback).

## Ready-to-paste configuration
- Name: Open Animation
- Kind: Stremio HTTP
- URL: https://raw.githubusercontent.com/yasin636/anime-card-assets/arena/cd835a4c-anime-card-assets/docs/watch-sources/blender/manifest.json
- Prefix: tt
- API headers: empty
- Proxy headers: OFF
- Approved playback origins: empty

Watch Movies: find Big Buck Bunny (2008), choose movie, choose source, use IMDb tt1254207 (manual if catalog lookup fails), Find streams, Play. Use only with matching movie, not any arbitrary anime episode. Film is open-licensed, not public-domain and not Japanese anime. Current static subset has only this one film. The media is externally hosted; no guaranteed uptime or Dhaka routing/native playback claim. Prefix/resource constraints in manifest prevent lookup of unrelated titles. Static GitHub endpoint404 for an unsupported ID is expected.

License primary source: https://peach.blender.org/about/ — CC BY3.0, including commercial redistribution with attribution. Credit Blender Foundation | www.blender.org, preserve full credits roll. No logos/posters or binaries copied into this repo. Metadata labels preserve attribution. Google sample bucket link is a full short film, not our synthetic12s sample; endpoint is not represented as rights-holder endorsement.

## Checked candidates (research-session observations, not permanent availability statements)
- https://aniliststream.edmit.in/manifest.json — fetch returned Cloudflare525 origin TLS handshake failure, not usable JSON at test time. Search references to old instance are not proof of present availability. GitHub repository lookup also404.
- https://stremio-archive-org-addon.fly.dev/manifest.json — fetch tool returned HTTP500 error; origin-vs-fetch infrastructure cause not established. Do not call permanently discontinued.
- https://webstreamr.hayd.uk/manifest.json — redirected to public instance retirement notice. Redirects disallowed by our API policy; not a usable manifest.
- https://dev.nebulawp.org/stremio/pluto-tv-addon/manifest.json — JSON responds, resources include stream but types=[tv]. Current app supports movie/series, not live-TV IDs/catalog. Not recommended as current compatible source; no claim of official affiliation/licensing beyond observed manifest.
- Official Stremio index.json: Public Domain Movies advertises torrents; not accepted by Phase4A. Cinemeta catalogs only; OpenSubtitles subtitles only. These cannot supply our direct movie streams.
- WatchHub stream/movie/tt1254207.json returns externalUrl (Plex), not direct url; response also states written client authorization requirement. Not integrated/recommended.
- Stremio/addon-helloworld is a development example: many torrents, one old HTTP-not-HTTPS BBB URL, no verified ready public deployment. Not recommended as a usable hosted source.
- gorumehra/Stremio-legal-addon README calls itself legal/public-domain template but actual addon.js has been changed to a provider-list placeholder and fixed sample. Not treated as a real anime provider.

## Evidence and verification limits
Inspected live manifest/error responses with web fetch tool; repository code via authenticated GitHub API. Runtime shell has outbound access restricted to GitHub/npm/PyPI, so cannot directly ffprobe or Range-read external media hosts. Browser fetch of a movie is not native-player playback proof. Source JSON is validated using the actual Phase4A parser. Need owner's phone to confirm CDN access/decoding and actual playback. Do not mark Phase4A phone PASS or start4B from these checks.

## Owner playback failure and follow-up
Owner screenshots confirmed enabled source, explicit IMDb tt1254207, stream list and handoff to player. Player then showed 00:00/00:00 and load error. External fetch of both commondatastorage.googleapis.com and storage.googleapis.com sample/BigBuckBunny.mp4 returned AccessDenied XML, so old media URL is not a valid public playback link now. Do NOT blame owner Wi-Fi or call this a codec failure based on screenshot alone.

Archive metadata https://archive.org/metadata/BigBuckBunny_328 lists BigBuckBunny_512kb.mp4:43,315,070bytes,596.41seconds,427x240. File metadata is not byte/codec proof. New manual/push GitHub diagnostic tests real Range bytes and ffprobe from CI network; no credentials, paid service or media binary committed. Native phone playback remains a separate check.

### Corrected source v1.0.1
Public media diagnostics https://github.com/yasin636/anime-card-assets/actions/runs/43396594295 SUCCESS. Actual HTTP Range bytes validated MP4 ftyp; ffprobe against exact Archive playback URL confirmed H.264 video416x240, AAC audio, duration596.416667s. Archive catalog metadata width427 differs from actual codec width416; label uses actual probe result. Source URL replaced with https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4 and row now says 'Big Buck Bunny — Archive 240p'. The first byte-only run43396516157 also succeeded but ffprobe was unavailable; later run explicitly installed ffmpeg and required codec/duration assertions. No native phone success claim yet.

Existing installed v0.22.0 APK and saved manifest URL unchanged: close errored player → Find streams again → choose newly labelled Archive240p row → Play. Reload video on old player would retry old denied URL; must re-resolve source first. If raw GitHub response cached, allow cache expiry and re-resolve. No reinstall, settings reset, data clear, mobile-data change or Render deployment.
