# Step03 v0.4.0 / Android code7 — owner release

Implementation and automated release checks for approved Cards + Gacha/Shop + seven-theme scope. This is NOT a statement that the entire blueprint app, iOS build, all107 CSS animation parity, public production rollout or deferred gallery are complete. Signed standalone Android APK; update existing private v0.3.x without uninstalling. Auth/profile/balances preserved, exact-seven-model Settings/Sensei retained.

## Evidence matrix

| Scope | Owner phone evidence | Automated evidence |
|---|---|---|
| Existing Auth/profile/balances | Accepted; Bio save after strict Rules | 23 profile fixtures + Rules emulator |
| Gacha500Gold, saved card/pity | Kiba common,5418→4918Gold,3964XP/318Gems preserved; relaunch balance/pity screenshots | Domain probability boundaries/pity; real transaction concurrency/replay/overdraw emulator |
| Six slots equip/unequip | Owner reports equip save and unequip correct | All6 slot roundtrips in actual emulator; no inventory loss/spend |
| Basic recycle | Owner reports Kiba recycled and correct Gold/XP | Domain rewards3rarities + emulator duplicate cases |
| Duplicate raw flat bonuses and recycle slot cleanup | Not explicitly confirmed live | Real emulator3rarities, all matching slots cleared, raw instance HP/ATK/DEF added once, same-ID replay/concurrency, other copy retained |
| Seven themes purchase | No explicit live purchase evidence | Actual emulator each7 prices/ownership, concurrent different purchase IDs charge once, duplicate denial, equip same-ID retry not toggle twice, remove persistence |
| Theme equip/remove/effects persist | Owner confirmed equip, cold reopen and remove | Domain + emulator toggle persistence; native effect implementation, not full CSS parity |
| Auto connection | v0.3.3 owner accepted | Real React hook tests with mocked native IO and source regression checks |
| Account switch/retry | Controlled owner test only; no physical multi-account failure QA | Real hooks with mocked Auth/storage/network: UID namespace, no cross-account replay, token-switch race, cold relaunch same-ID retry, storage failure fail-closed. Actual Firestore idempotent receipt/UID isolation independently emulator-tested |

## Changes since accepted v0.3.3

- Additional real emulator theme/recycle/6slot transaction verification, not more spending on owner account.
- Real React provider hook tests. Found/hardened account-change race: after asynchronous getIdToken, check current UID again before sending status/mutation.401/403 now disables local mutation controls; uncertain pending operation retained, never silently transferred to another user.
- Build gate requires Firestore security + transaction emulator success before Android compilation; mobile checks include provider regression suite.
- Updated release identity/version. No reward rebalance, account migration/reset, secret collection or global economy enablement.

## Live access / deployment

Existing accepted Render backend already supports owner UID allowlist. No Render update or environment change required for this release's mobile-only hardening. Keep ECONOMY_ENABLED=false and existing owner test UID unchanged. Backend still authorizes every mutation; APK public URL is not a secret and client state grants no authority. Do not set global ECONOMY_SECURITY_REVIEWED or open all-user rollout silently. Permission/access rollout remains an owner decision, not a feature required to spend more gold proving tests.

## Owner acceptance of this final increment

Install update, reopen, confirm auto-connect and unchanged balances/inventory. Switch away/back if desired; never share Google tokens/JSON. No extra purchases/recycle are needed to validate packaging. Report any regression before moving to next blueprint phase. Live purchase/duplicate/multi-account-failure edge cases above remain explicitly unverified on physical device, not disguised by emulator success.

## Outstanding security/operations, separate from feature implementation

- Owner explicitly deferred restoring project key-creation policy and removing temporary Organization Policy Administrator role. Remind before public/production handoff; not performed by agent.
- New-user signup and nonowner denial not phone-QA confirmed (Rules/API automated checks exist).
- Render free cold starts may exceed timeouts;90second request wait, explicit same-operation retry preserved. Rate limit process-local, not distributed WAF.
- Known dependency advisories not comprehensively remediated; no production-security-clear claim.
- Firebase Rules deny unreviewed legacy clients/collections. Broader social/story/daily systems need trusted routes, not a permissive signed-in catch-all.
