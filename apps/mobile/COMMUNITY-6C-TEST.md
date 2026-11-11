# 6C — signed test release candidate v0.10.0 (code 19)

6B phone acceptance was reported by the owner. Media uploads remain deferred.

## Implemented in this workspace
- Trusted community commands routed through the existing authenticated economy adapter.
- Tracker: trimmed manual titles, case-insensitive duplicates, preserved legacy IDs/fields, prepend Episode 1, episode increment and remove without mission reversal. Ambiguous legacy IDs fail closed rather than mutate multiple entries.
- News: Jikan SFW airing-anime catalog, not journalism. Canonical external MAL links, 15 bounded records, five-minute cache, provider timeout, at most 24h stale fallback.
- One server-active reading session per account, minimum 10 seconds and two-minute expiry. Start replaces an old session; cancel grants nothing. Transactions atomically award 10 XP, UTC daily count (max 5), mission progress and retry receipt. Same article is permitted again with a new read session: no durable article deduplication.
- Native Tracker / Anime News / Missions tabs, Feed entry points, all five mission rewards sharing existing trusted mission state. News reader uses a foreground monotonic clock, cancels on navigation/background/close and automatically attempts claim at 10 seconds; explicit retry remains available.
- Daily mission state and rewards preserve existing Feed and Global/Quiz integration.

## Local checks performed
- `node --test services/economy/*.test.cjs`: 78/78 passed (9 new community/catalog tests).
- `node --test tools/test-*.cjs`: 76/76 passed (including four community native tests).
- Mobile typecheck: only missing ignored `src/generated/firebase-client` module reported. Production generated-config CI typecheck still required; do not claim a complete typecheck pass.

## Delivery gates / limitations
- Owner Render deploy (autodeploy off), then phone acceptance remains required.
- External Jikan availability is not live-tested from this network-restricted workspace.
- Initial APK security gate hit an existing recycle test's emulator INVALID_ARGUMENT error; independent same-source security run passed. File-level emulator execution is now serialized to reduce emulator contention; concurrency inside individual tests is retained. No security test was removed.
- Signed APK CI is authoritative for generated-config typecheck, emulator, release compile and private signature.

## Workspace provenance resolved
Remote branch was verified at 4aa3b07. Local files were backed up, the current branch fast-forwarded to that existing remote HEAD, and only the five differing implementation files reapplied. No branch switch or destructive reset was used. Existing untracked 6C files were preserved.

## Release candidate v0.10.0 / Android code 19
Backend tests 78/78 and tool tests 76/76 pass locally. Added native tests cover manual add, five mission controls, foreground cancellation and late start cancellation. Added emulator tests cover concurrent duplicate add, receipt replay, concurrent reading/mission claims and numeric overflow; Rules tests deny direct client forgery. These are included in the signed APK CI gate; CI result is authoritative.

## Phone acceptance checklist
1. Owner deploys this release's backend commit to the existing Render service (autodeploy off); keep existing secrets/owner allowlist.
2. Install signed APK over 6B without uninstalling; verify account, balances, cards, chat, Sensei and Story are intact.
3. More → Tracker: add a manual title, reject same title with different case, +1 episode, remove; reopen and verify persistence.
4. Feed → Anime News Hub: load/refresh, open external MAL link, run one reader. Close/background before ten seconds: no reward. Complete foreground ten seconds: exactly +10 XP. Retry does not double reward; five/day limit applies.
5. Within one News Hub visit a claimed article is disabled; switch out/back to reopen the hub and the same article may be read again subject to daily cap. There is no durable per-article restriction.
6. Missions: verify all five progress rows, exact displayed rewards and only one claim/day. Feed and Global/Quiz advance their existing combined counters.
7. Test offline/retry and provider failure; no balances are client-authored. Do not continue to media or another feature step until owner phone acceptance.

Foreground gating is a native-client UX property, not proof a human read or an attestation of foreground state against modified clients. Server enforces minimum elapsed time, one active session, expiry, daily cap and idempotent rewards. No push, media or paid provider added.

## Verified build
Android run 43086308838 (rerun) succeeded from source 63dc709. Security emulator, generated-config TS, regression checks, standalone release compilation and pinned private signature/embedded JS verification passed.
Artifact: https://github.com/yasin636/anime-card-assets/actions/runs/43086308838/artifacts/13887506992
Archive SHA256: 3a5dd1f61b5758dc38f6dbf862d4c248536412a2d0d115d351328119c9bf1eb0 (not the APK hash).
An existing concurrent recycle emulator test intermittently returned INVALID_ARGUMENT even with serialized files; the final unchanged-source rerun passed without removing tests.
Backend deploy and real-phone acceptance are still owner actions, not completed by the agent.
