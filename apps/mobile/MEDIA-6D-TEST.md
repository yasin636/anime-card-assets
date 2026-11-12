# 6D Gallery Photo — v0.11.1 / Android code 21 owner-test candidate

Profile Gallery + one Feed photo implemented. Video remains deferred. This is a signed owner-test build, not certification that the owner's Cloudinary key has working permissions.

## Owner setup / release gate
- Existing Render service must be manually deployed to this release commit or a descendant. Keep Firebase credentials, package identity, owner allowlist and ECONOMY_ENABLED settings unchanged.
- Owner reported saving CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET using Save only. That does not activate them in the running service until deployment/restart. Agent does not possess or inspect secrets.
- The `Media Library User` app key MUST have appropriate read/upload/delete access to the `animemetahub` asset folder. Merely selecting that global role is insufficient. Cloudinary documents API-key folder assignment via Admin API (not the Console folder-sharing dialog): https://cloudinary.com/documentation/admin_api#assign_folder_roles . Folder manager may be needed for deletion/cleanup; confirm actual permissions before enabling for more users.
- Do not silently promote the key to Master Admin. A safe one-time owner-side Admin API setup or Cloudinary support assistance is still needed if folder permission has not been granted. Do not put a root/master secret in chat, APK or repository. This is an explicit remaining setup gate, not something the agent has completed.
- If the app reports `Cloudinary key-এর animemetahub folder permission যাচাই প্রয়োজন`, keep the screenshot with only the error (no credentials) and report it; do not weaken Rules or change billing.

## Behavior
- Profile: Gallery crop and JPEG compression, max finalized image 1 MiB; no Firebase Storage billing. Existing preset avatars remain usable.
- Feed: one compressed JPEG per captioned post, max finalized image 3 MiB. Verified photo preview is retained per account until publish or remove. Text/link-only posting remains supported.
- Selected photos are resized to <=1600px long side for Feed, 512px width after square avatar crop. Input selection >20 MiB is rejected when picker exposes size. Server validates canonical provider metadata: image resource, upload delivery type, allowed JPEG/PNG/WebP, nonanimated/single-page, dimensions <=4096 and <=16 MP.
- Signed preparation returns only public API key + signature; secret stays in Render. SHA256 signed public ID, fixed folder, overwrite=false, allowed formats; twenty preparations/account/UTC day. No media upload XP; only existing post reward/mission rules apply.
- Upload progress is phase-based, not byte percentage. Stop/background/navigation abort network requests; retry uses persisted operation IDs and verifies provider state first, so a lost upload response does not automatically create another object. Gallery picker navigation itself is exempt from network-abort handling.
- Pending state: `media.pending.v1.{uid}.{avatar|feed}`. Cache file may be evicted by OS; remove and choose another photo if the file is no longer available. Signatures/sessions expire after an hour; expired pending upload must be removed/reselected.
- Feed attachment is consumed transactionally with post creation. Retry preserves post/XP idempotency. Another command cannot consume the same attachment again. Delete post queues its media for cleanup without reversing creator-earned interaction rewards beyond existing post rules.
- Public profile/Feed images are public CDN assets, NOT confidential file storage.

## Cleanup / free-plan limitations
- Trusted cleanup queue is created at prepare and requeued for replaced avatar/deleted post. Worker checks references transactionally, blocks further attachment before destroy, and preserves live profile/post assets. Provider destroy is retriable/idempotent.
- Waits >=2h after signing (and after replacement/delete) to avoid deleting while an upload signature can still be used. Runs in the backend process once after one minute and every ten minutes, bounded ten jobs per pass. Free Render sleeping/downtime delays cleanup; this is NOT an external always-on scheduler.
- Invalid uploads can temporarily consume Cloudinary storage before finalize rejects them. Server validation is not a pre-upload byte limit; provider free-tier limits still apply. No unlimited-hosting guarantee and no automatic paid upgrade.
- Provider permission failures also prevent cleanup. Verify both successful upload AND deletion before treating setup as operational.

## Automated checks
- Backend 86 tests pass locally, including media auth/strict fields/receipt/quota/provider validation/atomic attachment unit tests.
- Native/tool regression suite plus seven photo tests cover gallery permission, account switch, persisted retry IDs, lost response recovery, remove, background abort and permission errors.
- Dedicated emulator tests added for concurrent prepare/finalize replay, quota races, attach/discard race, cleanup preservation/failure/retry, and direct client session/queue forgery denial. CI result is authoritative.
- Generated Firebase TS configuration is intentionally absent locally; signed CI generates it securely before complete typecheck.

## Phone acceptance
1. Install over accepted 6C, without uninstall; verify account/balances/cards/chat/Story/News still work.
2. Existing Render backend deploy, then Profile → Choose Gallery photo. Crop/select a small image, verify upload and profile update survives reopen.
3. Feed → Choose Gallery photo, wait for verified preview, enter caption and publish. Expect exactly +15 XP and existing mission progress once.
4. Stop/background during upload; reopen/retry same upload. No duplicate attachment/post reward. Remove photo and text-only publish still work.
5. Permission denial, offline/retry, oversized image, expired pending and changed account must fail safely. Never expose key/secret in error screenshots.
6. Delete test post, replace profile photo and verify eventual cleanup with provider permissions (allow for worker delay/Render sleep).
7. Owner phone acceptance is required before 6E video. No live Cloudinary upload, provider access bootstrap or Render deployment has been performed by the agent.

## Upload error diagnostic patch
v0.11.0 conflated upload/inspect 401/403 as a folder-permission error. v0.11.1 classifies only allowlisted evidence-specific codes, displays stage (prepare/inspect/upload/discard) and never renders/logs the provider raw error body. Generic 401/403 remain explicitly inconclusive. Backend must also be deployed to obtain updated inspect/destroy errors.
Owner-only optional folder Editor setup tool and Bengali guide: docs/react-native-blueprint/CLOUDINARY-FOLDER-SETUP.bn.md. No real credentials used or folder changes performed by agent. Default tool is dry-run; actual grant requires explicit local consent and hidden admin-secret input on owner's trusted device. App key remains Media Library User; no global role/billing change. If owner is phone-only, diagnose first and use support assistance rather than asking for secrets.
