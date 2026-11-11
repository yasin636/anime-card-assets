# 6D — in progress, not a phone-test release

Owner accepted 6C. Owner authorized Cloudinary Free for profile photo and Feed photo; video remains deferred to 6E. Owner reports saving CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Render using Save only. No values were obtained by the agent, and no provider call, live deploy or account mutation was performed.

## Implemented so far
- Trusted image-only media prepare / finalize / discard commands through existing authenticated economy endpoint and owner-test gate.
- Server derives UID-scoped public IDs and a fixed application asset folder; signed parameters prohibit overwrite and allow JPG/PNG/WebP only. SHA256 signing secret is server-only.
- Twenty prepares per account per UTC day; operation receipts make retries idempotent. Each session expires after one hour. Avatar limit 1 MiB; Feed image limit 3 MiB; dimensions <=4096 per side and <=16 megapixels; animation/multipage rejected at finalize.
- Finalize inspects provider metadata server-to-server, never trusts a client-supplied URL, bytes, media type or owner. Canonical delivery URL is reconstructed from verified fields.
- Avatar finalize atomically attaches the verified image to the account. Feed images become ready, then are consumed once within the existing Feed create transaction, retaining +15XP/quota/mission rules.
- Discard, replaced avatar and deleted post paths record cleanup work. Cleanup execution is NOT implemented yet; do not publish this as operational media hosting.
- No new APK or mobile upload integration yet. Existing Gallery deferred UI remains unchanged.

## Verification so far
`node --test services/economy/*.test.cjs`: 86/86 pass, including 8 new media tests. Includes strict commands, quota/replay, provider validation, avatar attachment, Feed attachment reuse rejection, expiry/discard and sanitized permission errors. Unit fake DB is not a concurrency/emulator proof.

## Required before signed release
1. Resolve folder-scoped Media Library User permissions for the pre-created `animemetahub` asset folder. No assumption that selecting the role grants access. Do not silently promote the key to Master Admin; do not request root secrets in chat. The exact permission bootstrap needs an explicit safe owner setup workflow.
2. Cleanup worker/provider destroy support for expired/discarded/invalid/replaced/deleted objects, retriable without deleting attached objects; quota/abuse hardening.
3. Native Gallery image compression and direct signed upload, progress/cancel/retry, account scoping and persisted pending upload/drafts.
4. Emulator concurrency and direct-client denial tests, provider sandbox/live owner validation without exposing credentials.
5. Version bump/workflow/docs, complete generated-config TS/regressions, signed standalone APK, owner Render deployment and real-phone acceptance.

Cloudinary uploads and delivery URLs for public Feed media are not private content storage. Client-side validation is UX only, not a security boundary. Signing upload parameters does not attest human behavior or make a signature single-use; overwrite=false and server attachment state prevent replacing or repeatedly attaching the same asset, and provider permissions/quotas remain necessary. Server finalize rejection alone does not prevent an invalid file temporarily using provider storage; cleanup and upload restrictions must be completed before delivery.
