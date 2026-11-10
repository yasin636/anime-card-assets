# Staged native Firestore boundary

Candidate rules for accepted native Auth/Profile plus trusted Step03 economy. Not deployed automatically. No Firebase production credentials needed for tests. `npm ci && npm test` uses demo project emulator only. CI has no production deployment step.

- Own single profile get only; no profile enumeration or cross-account reads.
- Exact native initialization map, authenticated UID/email, zero economy values, server timestamps.
- Existing documents are NEVER migrated/reset/backfilled by these rules. Profile edits can only affect username/Bio/avatar/updated_at; all unknown legacy fields preserved. Text limits100/2000/4096 respectively. Old documents missing required strings need explicit compatibility handling, not overwrite.
- Every client economic mutation/delete and all receipt access denied. Admin SDK bypasses rules; service account/IAM and API authorization remain separate requirements.
- Unreviewed collections deny by default. This intentionally does NOT claim legacy web social/tracker/story/daily/wheel/leaderboard write compatibility. Those require collection-specific permission/trusted reward work before activation. Do not restore an authenticated catch-all to make old clients work.

Before production publication: emulator pass, owner confirms scope, save previous rules privately if needed (not credential), paste complete candidate in Firebase Rules console and Publish. Confirm console publication. Test existing owner login/profile edits and new signup; verify server IAM and idempotent real transactions with controlled owner approval before enabling the app review flag. Health alone is insufficient.

Owner explicitly deferred project key-creation policy restoration and removal of temporary policyAdmin role. Both remain open security follow-ups. ECONOMY_ENABLED must remain false until appropriate verification.
