# Phase4A BYOS acceptance — v0.22.2/code38

## Scope change explicitly authorized
Owner accepts Bring Your Own Source. Finding/supplying a production anime/drama/movie provider is NO LONGER a prerequisite for Phase4A completion or Phase4B. After owner accepts URL save + mapping + isolated Test Lab + fixture/phone checks, Phase4B Downloads may begin. No automatic all-content or full Stremio compatibility claim. Downloads/Watch Party/Step8 remain unimplemented in this build. No Render/billing changes.

Owner phone accepted v0.22.1 cinematic UI and setup-free Big Buck Bunny playback, including PiP screenshot. Preserve it; do not repeatedly ask owner to reconfigure manifest/IMDb.

## Shipped changes
- SourceSettings default one URL, Check & Save validates/fetches first; reads name/media types/global or resource-derived prefix restrictions. Whitespace trim; same URL refreshes existing source. Missing restriction stays unrestricted. Bounded safe alphanumeric/dot/colon/underscore/hyphen prefixes support e.g. tt1254207, kitsu:, org.example:. Failed fetch/schema/storage does not clear input or save unchecked config; contextual Bengali failure. API/playback headers and custom JSON settings under Advanced. Serialized storage namespace unchanged.
- Automatic selection respects inferred types/prefixes. Native kitsu:{id} usable while external mappings are pending; explicit native ID remains available even if mappings endpoint fails. Existing TMDB external_ids IMDb and native fallback preserved. Kitsu external season/episode equivalence not guessed; manual confirmation remains required.
- Watch → Open cinema → Enable Player Test Lab. TEST-labelled MP4/local caption overlay, remote fixture VTT, Shaka Angel One multi-audio/embedded-subtitle HLS (manifest max576p), Apple BipBop adaptive HLS (includes1080p). No fabricated dub/forced quality. Test mode strips report/episode/alternate callbacks at account playback provider even if supplied, keeping library/Tracker untouched. No media requests until explicit Play, no secrets inherited by captions.
- Real local HTTP server behind test-only transport bridge covers manifest→Kitsu stream URL→request headers→stream payload→subtitle download/parse. Does not weaken production HTTPS/public-host checks. React tests exercise Easy Save/error retention/duplicate refresh and test-session isolation.

## Verification
181 tool/mobile +92 backend tests PASS locally, foundation/autolinking PASS. Local typecheck lacks ignored generated Firebase module only; CI restores verified Firebase config before typecheck.
Full signed APK CI https://github.com/yasin636/anime-card-assets/actions/runs/43408480817 SUCCESS. Security/rules/transactions, TypeScript, locked dependencies, test gate, native release, unchanged private certificate, package/version metadata and embedded JavaScript PASS.
Live public fixture/media CI https://github.com/yasin636/anime-card-assets/actions/runs/43408480820 SUCCESS: manifest/dotted-prefix stream JSON/VTT, both HLS master/child/video-segment bytes, Shaka audio/subtitle declarations and Apple1080p declaration, MP4 ftyp + ffprobe H264416x240/AAC596.416667s. These are not native-phone playback/codec acceptance proof.

## Signed delivery
Runtime fc6a1a7a7579d3d664bc5228520ccc3d7896b8ed.
ZIP https://github.com/yasin636/anime-card-assets/actions/runs/43408480817/artifacts/14028682812
AniGooD-v0.22.2-Watch4A,39,823,532bytes. GitHub archive metadata SHA256 3f2e7fd24dd3e91353b22dd6608225a649bace8490edb41f3c9e0ffc8f7019ef (not independently downloaded APK hash).
ZIP includes APK/SHA256SUMS/current BYOS device checklist/original sample subtitle. Update in place, no uninstall/data-clear. Device checklist apps/mobile/ANIGOOD-WATCH-BYOS-TEST.md. Await owner phone acceptance; do not claim it already passed.
