# v0.3.2 / code5 — controlled backend verification APK

Update v0.3.1 in place with same private signing key; never uninstall/reset to test. Accepted exact-seven Settings/Sensei UI and auth/profile retained. Gallery still deferred.

Build includes public owner-test URL https://anime-meta-hub-economy.onrender.com, NOT any private JSON/token/UID allowlist. Does not assert global ECONOMY_SECURITY_REVIEWED. Server requires verified Firebase UID for test writes. Global enablement remains false. No client fallback rewards.

## Required manual Render update (Auto-Deploy remains Off)

Manual Deploy → Deploy latest commit on current Arena branch to pick up /v1/economy/status and test UID gate. Never enable ECONOMY_ENABLED globally for this test. Existing Secret File unchanged; no new key. New status route is authenticated, revocation checked, reads only caller's own profile; no transaction/write/receipt or data dump.

## Owner phone sequence

1. Install APK update. Cards → Check server connection · no spend. This does not auto-prepare legacy cards or spend. First result should report Auth + own Firestore read verified, spending disabled. Free-instance cold start timeout now90seconds for status and mutation; pending-ID replay remains intact.
2. UID displayed as selectable text. Owner copies their own UID directly into Render environment variable ECONOMY_TEST_UIDS (single UID, no quotes). This is an identifier, NOT a password; never use email/display name. Keep ECONOMY_ENABLED=false. Save/redeploy. Agent does not know/pin a production UID yet.
3. Check connection again. Owner should see allowed account; others get owner-test-only (403). Changes to allowlist require another connection check; server authorization still authoritative.
4. FIRST mutating command requires user confirmation. Prepare legacy identities is a real inventory write, not connection diagnosis. Summon spends500Gold; recycle permanently removes selected card. Do not execute for owner silently. Confirm balances, instance IDs, receipts/retry behavior and theme affordability/owned status on phone. Do not mint balances just to test purchases.
5. Recheck new-account signup and nonallowlisted-user denial. Emulator proves rules/concurrency isolation; production health/status read does NOT prove live transaction write/IAM correctness. Keep global review flag off until live evidence.

After test remove ECONOMY_TEST_UIDS to close test access (redeploy). Existing deferred project key-creation restriction restoration and temporary policyAdmin removal remain outstanding owner decisions.
