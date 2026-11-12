# AniGooD — owner-approved two-step scope

R3 accepted. Final exact brand `AniGooD` (A/G/D uppercase). Approved original logo: `approved-logo.png`, uploaded by owner. Preserve package ID/signing/data and existing in-place upgrade.

## Step 1 (authorized, IMPLEMENTED — signed CI build pending)
- [x] Save approved logo and derive mobile icon/header assets; adaptive icon safe margins.
- [x] Initial user-visible branding in shell/auth/public profile/about; branded animated boot respects OS reduced motion/background.
- [x] Header XP/Gold/Gems actual balances (compact three-line wallet, no invented values).
- [x] Move Profile Account & Privacy entry/actions to Settings, keep Google linking/logout confirmations.
- [x] Initial Settings motion help; AI Provider official key button, guide/help sheets and privacy disclosures.
- [x] Audit remaining user-visible old branding (including API/system messages and AI app context), launch icon/build output validation.
- [x] Unified Jinwoo-style app-owned system popup/confirmations; retain behavior, cancellation and destructive safeguards. OS/gallery/permission dialogs excluded.
- [x] Arena Battle/Quiz/Adventure highlighted rules help from real backend rules; move clutter from Quiz main screen, preserve gameplay/rewards.
- [x] Move Daily Mission to Feed top; remove Anime News from app/Tracker reachable UI; preserve watchlist.
- [x] Add Chapter1 enemies to Shadow gallery; highlighted BOSS badges.
- [x] Cards My Shadow Soldiers from authenticated saved Adventure clears; view-only collection, no new reward/equip rules.
- [x] New regression coverage, full app/backend/Rules/typecheck, signed update APK via existing CI; owner device QA and deployment notes.

## Step 2 (NOT started)
Internal feed sharing (Inbox peer picker/Global/Sensei/Copy app-only link), enforce post visibility/deletion; chat image gallery + validation/upload/access/retry; Sensei image discussion and friendly general conversation; versioned full app knowledge guide updated with releases; latest-information grounding only where supported, truthful availability/source/cost reporting. Keep current Sensei layout, keyboard, Stop/Retry/model/key safety.

## Constraints
Exactly two steps; fixes stay in their step, no third stage. Preserve accepted R1–R3/current card Detail/Equip/Recycle/Tracker/gameplay. Arena/Adventure layout only change for approved rules/dialog affordances. Step8 deferred. Do not weaken permissions or change reward rules. Final logo is selected, no more generation needed.

## Validation so far
126 existing app/tool tests PASS after initial edits. Local TypeScript reports only existing missing ignored generated firebase-client module; CI generates it. Real-device boot/header/account/help/icon rendering remains unverified. No signed Step1 APK yet. No version bump or build dispatch until scope complete.

Implementation complete for Step1; 129 mobile/tool and 91 backend tests PASS. Signed CI/phone QA pending. Old News mission omitted from UI because feature removed; existing backend definitions/history preserved, four remaining goals unchanged. Step2 not started.
