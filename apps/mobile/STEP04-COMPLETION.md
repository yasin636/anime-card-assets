# Step04 v0.5.3 / Android code 11

Implementation complete for owner acceptance; live Google/provider and physical-device acceptance are not inferred from automated tests.

## One saved provider
Settings → AI Provider remains the sole per-account SecureStore key/model. Sensei uses Google directly. Quiz sends that same enabled saved key/model transiently in HTTPS headers to the fixed trusted Render economy endpoint, only for generation/judgment. Credentials are not put in commands, AsyncStorage retry records, Firestore sessions, receipts or application logs. Hosting necessarily receives the request credentials. No second server AI key is needed. Disabling/deleting the key prevents subsequent credential transmission, including stale broker callbacks. Already completed operation receipts can still be recovered without a key. Account ownership is checked before sending. Selection stays on the specified seven-model list; no silent model substitution. Availability/quota of each Google model remains provider-dependent.

## Arena completion
- Quiz: five validated questions, hidden expected answers, hints, explicit answer/skip feedback and next question; close/restart/resume; server-owned XP and completion Gems; stale-index rejection and idempotent receipts. Permission/quota/model errors are sanitized and visible. Only transient judgment failure uses the original first-word fallback (not strong semantic grading or prompt-injection protection).
- Weekly: server-reported claimed state disables duplicate claim, concurrent claims grant once. Existing balances/progress are preserved. Current policy is Sunday 00:00 Asia/Dhaka, raw-XP Top10, document-ID tie ordering; shown in UI, still provisional pending owner acceptance.
- Battle: server-confirmed full-artwork exchange animation, real HP damage and shield break, bundled original synthesized impact sound with on/off toggle. Sound is cosmetic, respects system audio and does not affect rewards. It is not a claim of pixel-identical animation/audio reproduction. No Gemini call for game-engine opponents.
- Accepted Wheel, Battle economy, original art, Cards/Shop/Gacha/themes, authentication and direct Sensei remain intact.

## Deploy and install
1. Render existing economy service → Manual Deploy → Deploy latest commit on the current branch. Preserve existing Firebase service account, UID owner allowlist and ECONOMY_ENABLED=false. No new key, Rules publish, Firebase config or billing required. Remove obsolete QUIZ_GEMINI_API_KEY if previously set; it is unused.
2. Install signed v0.5.3 APK over the accepted app; do not uninstall.
3. Arena → Refresh / resume. Old backend deliberately leaves Quiz disabled and explains deployment.

## Owner phone acceptance (not run by agent)
With your existing saved key/model, start an anime quiz, answer/skip through five questions, check XP/Gems, restart and reopen app to resume. Provider quota/errors should leave pending retry recoverable; never clear pending blindly. Check weekly claim once if eligible and that refresh shows claimed; don't reset owner data. Check battle sound/animation on your next intended battle, not an extra paid test. A live Google key/model and physical device were not available to agent.

## Automated checks
Server unit tests, real-React broker/provider/visual tests with mocked native/network IO, Gemini/display/autoconnect tests and foundation/autolinking validator run locally. CI additionally generates private Firebase client config, runs TypeScript and Firestore emulator security/transaction/HTTP tests, then builds/signs/verifies standalone APK. Consult the successful workflow for final counts/status; mocks do not establish live provider access.

## Explicitly deferred, not fixed here
Gallery/Cloudinary, temporary project-only GCP policy exception/extra-role restoration, old Groq credential revocation and global economy rollout. Existing owner-only gate remains. No live mutations or owner spending by agent.
