# Step03 economy work in progress — NOT deployed

This is internal, server-side logic, not an enabled economy endpoint or a completed APK feature. No live Firebase account, currency, inventory, Rules, billing or data migration was modified.

## Implemented and offline-tested

- Canonical 16-card / 7-theme reference; no changed prices/rewards/rates.
- 500 Gold single summon, 8/22/70 rarity thresholds, exact Rare10/Legendary21 pity precedence/reset, newest-first inventory.
- Six-slot equip ownership/rarity checks, unequip without consuming cards.
- Recycle exact Gold/XP; 100% raw duplicate stats once; clear matching slots atomically.
- Theme purchase once, exact price, owned-only equip/toggle; preserve other inventory fields.
- Transaction receipt under `user_meta/{uid}/economy_receipts/{operationId}`. Same operation+command returns recorded result; reusing ID for another command rejects. Server RNG/instance UUID generated once before retryable transaction callback. Profile patch and receipt commit together.
- Explicit legacy preparation preserves existing IDs and all card fields, assigning persisted deterministic IDs only when absent. Existing ambiguous slot references and unknown cards are blocked rather than guessed/recycled. This migration has NOT run against any account. Native UI must surface remediation, not hide such cards.
- Source same-instance multi-slot behavior retained; D35 approval is still required before imposing a new no-duplicate-slot restriction.
- Conservative 850KB JSON-size preflight prevents silently trimming a large profile; Firestore actual document-size validation remains authoritative.

Run `node --test services/economy/domain.test.cjs` (no network/dependencies/credentials).

## Required before live enablement

1. Firebase ID-token verification on a trusted server. `verifiedUid` in transaction.cjs is an INTERNAL parameter, never a client-supplied identity. Do not expose execute directly as an HTTP handler.
2. Choose authorized billing-free backend hosting, deploy with least-privilege server credentials kept outside APK/Git/chat; Firebase Functions/Storage Blaze upgrade is not authorized.
3. Review existing live Rules and web-client compatibility before any change. Server receipts, inventory/slots/currencies/pity/bonuses/theme ownership must not be forgeable by direct client writes. A correct server does NOT make permissive existing Rules safe. Do not blanket replace Rules or break legacy features.
4. Emulator/integration tests for real concurrent transactions, retries, offline timeout/resume, forged UID/token/receipt and security rules. Current mock tests cover planner and sequential idempotency plus HTTP auth/body/error gates, NOT actual Firestore concurrency or permissions.
5. Native Cards/Shop UI, confirmed destructive actions, animation/effects, live receipt-based command service, duplicate-submit/pending operation recovery and account-switch guards. No fake success/offline rewards.
6. Private-signed version-bumped APK, device tests and user approval. Gallery upload stays explicitly deferred, not silently removed or marked fixed.


## Current implementation / deployment handoff

- `http.cjs`: POST `/v1/economy`, verified/revocation-checked Firebase ID token, token-derived UID only, 8KiB JSON body cap, command allowlist, process-local UID rate cap, no-store replies and sanitized errors. GET `/health`. No credentials or token logging.
- `server.cjs`: Node22 + firebase-admin14.5.0, private hosting `GOOGLE_APPLICATION_CREDENTIALS` file; startup rejects wrong project/type. Bound to0.0.0.0 and hosting PORT. Optional manual `render.yaml` scaffold requests a free plan, NOT an automatic deployment or assurance of provider eligibility. Stop if payment/paid upgrade required; no billing authorized.
- 31 built-in Node tests pass (27 domain/adapter +4 HTTP). SDK import/initialization smoke passed without authenticated calls. Admin dependency audit currently6moderate/0high/0critical; force-major transitive overrides deliberately avoided. Production review remains required.
- Native Cards/Shop supports own inventory, details/rarity filters, six slot UI, explicit legacy prepare, confirmations, receipt replay after app kill, summon result, seven themes and global native aura effects. Existing same-instance multi-slot behavior retained.
- Build only embeds `vars.ECONOMY_API_URL` when `vars.ECONOMY_SECURITY_REVIEWED` is exactly `true`. Otherwise every economy action is disabled with an explicit setup message, not a fake success. Set those variables only AFTER real endpoint, reviewed/deployed Rules, old-web compatibility decisions and integration tests. This variable is an explicit release gate, NOT proof that a security review happened.
- Repository owner still must authorize/deploy hosting and privately configure credentials; no live backend, Firestore Rules, migration or service account was created by the agent. Do not send credential JSON in chat. Native integration APK alone cannot complete this live setup.
