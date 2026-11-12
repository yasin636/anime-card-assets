# R1 — Profile + Feed visual direction

Interactive HTML/CSS concept, not a React Native replacement and not an APK. Native implementation intentionally waits for owner visual feedback, as agreed. Existing account/backend/mobile code has not been modified by this preview. Sample name, balances, cards, posts, comments and counts are illustrative and are not fetched from Firebase. Reload resets interactions. No credentials, analytics, remote fonts or external network calls.

## Open / test

From repository root: `python3 -m http.server 8080 --bind 0.0.0.0 --directory design/r1`.
From this directory: `npm ci --no-audit --no-fund && npm test`.

Four jsdom tests cover local image references, navigation/profile editing and escaped input, composer/delete, comments/focus restoration and like toggle. JS syntax validation passes. These are DOM tests, NOT rendered Android/iOS/browser screenshots, native integration or accessibility certification.

## Try

- Bottom Profile / Feed switch; For you / Following filter (sample discussion visibility only).
- Create entry, caption count, local image preview, publish a sample, own post menu/delete.
- Like tap; hold 450ms or right-click for reactions; keyboard ArrowUp opens picker.
- Comment sheet and local comment submission; edit sample profile; tap showcase cards.
- Outside tap/Escape closes dialog; keyboard focus trap/return. Reduced-motion CSS respects OS preference.
- Other nav entries explain their R2/R3 scope rather than pretending functional screens exist.

Visual: obsidian #101113, lilac #beadfa, restrained acid #dcfa89; editorial anime artwork only where it earns space, clean social hierarchy elsewhere. Art copied unchanged from existing repository assets. No new rights claim. Actual native user showcases must use owned/equipped cards, not these sample picks. Unicode icons are concept placeholders: native implementation should use consistent vector icons (no emoji navigation). Save/Follow are interaction concepts, not claims of existing backend support: defer or explicitly scope them before native build, never invent persistence. Counts and sample authors are illustrative; Following filter is not a real recommendation engine.

## Next / approval gate

Owner review of visual direction first. Then port to real RN components; preserve existing identity, account isolation, pending-command receipts, rewards, media validation and read permissions. No paid hosting, no video, no Step8, no new feature-step approval assumed.
