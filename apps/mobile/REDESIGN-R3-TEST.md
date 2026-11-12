# R3 owner-directed update — v0.16.0 / Android code28

Signed standalone in-place upgrade. Do NOT uninstall or clear app data.

## Final owner scope supersedes broad R3 preview
- Inbox/Global match approved preview hierarchy; clear own/other bubbles, avatars, contextual Copy/own Delete/global reaction actions. Retain existing secure drafts, pending operations, polling, pagination, sound and profile permissions.
- Green active dots bottom-right on avatars are based on real server heartbeat/presence expiry, not last message time or random/UI sample status. Existing heartbeat30s, inbox refresh15s and thread/global reads6s mean presence is approximate, not instantaneous Messenger infrastructure. Unknown/stale/offline never fabricated active. Public global sender profiles are bounded by returned page≤50, project only existing public fields; private email/inventory never returned. Most recent known presence wins conflicting snapshots.
- Community mission panel moved to separate sheet, existing actual progress/claim conditions preserved; no new reward rules or DM reactions.
- **Arena and Adventure stay exactly as current app.** No changes to their screen/artwork/gameplay files. Preview combat/story is NOT ported.
- **Sensei stays current layout/logic** (not preview redesign). Only bubble color/shape polish and keyboard fix. Current question/model, Stop/Retry, privacy and request safeguards retained.
- Whole Chat shell (header/content/navigation) avoids keyboard using Android height/iOS padding with safe-area offset. One avoidance owner rather than nested/double adjustments. Sensei composer remains outside scrolling answers; no outer ScrollView around Chat. OS resize remains enabled. Physical Android multiline typing/keyboard verification is mandatory; mocks cannot certify geometry.
- R2 summon chamber follow-up: preview-like central sigil, stronger16px idle float/rotation/glow/floor; fast shake and zoom up to1.28 while opening. Minimum850ms visual opening (no delay under reduced motion), button locked until presentation completes. Confirmed result can wait for animation; animation never creates results. Pending retry retains existing operation. Native-driver non-interaction loops stop off-screen/background; Reduce Motion is respected and explained instead of overridden.

## Render deployment
Deploy this APK runtime commit from branch arena/cd835a4c-anime-card-assets to existing economy service for Global sender presence projection. Existing presence/inbox/DM works with old backend; full Global active dots require the new read projection. No new Firebase Rules, keys, Cloudinary permission, billing or enable/allowlist changes. Agent has NOT deployed Render.

## Phone checklist
1. Inbox real peers, correct corner dot only when other phone/account active. Background that account and verify dot expiry; no fake dot for unknown Global senders. Check recent sender heartbeat expiry and offline updates.
2. DM/Global draft, send, pending retry, old-message pagination, profile, Copy failure messaging, own Delete confirmation, multiple Global reactions. Mission sheet not embedded in conversation; claim conditions unchanged.
3. Sensei: multiline question and cursor visible above Android keyboard, Send/Stop/Retry still work, no duplicate requests or key exposure. Also test DM/Global keyboard.
4. Shop: with Reduce Motion OFF/OS animation allowed, idle box visibly floats; summon shakes/zooms then actual receipt reveals. Reduce Motion ON remains static/minimal. Network interruption must not invent card or duplicate charge.
5. R1/R2 retained card details/Equip/Recycle/Tracker; Arena/Adventure unchanged. Step8 deferred.

Automated coverage includes presence TTL/unknown/future/offline/corner geometry, mission isolation, contextual actions, current Sensei response/Stop behavior, root keyboard ownership, idle/opening motion configs and existing server-confirmed summon/recovery/retained-details tests. Firestore emulator adds bounded public Global sender presence/privacy/expiry case. Owner acceptance pending.
