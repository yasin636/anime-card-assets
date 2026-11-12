# R2 — Shop + Cards + Tracker — native owner-test APK

Version 0.15.0 / Android code27. In-place signed upgrade: do NOT uninstall or clear data. Package and private signing unchanged.

## Approved design and explicit exception
Based on approved offline R2 Edition01-Fixed. Obsidian/lilac/lime chamber, aura studio, collection and compact tracker. Owner explicitly required the existing full-screen Card Details (Itachi screenshot) rather than preview's bottom sheet: **existing title/image/stats/instance/Equip/Recycle screen preserved byte-for-byte apart from exported function name** in ExistingCollectionUI.tsx; protected by regression test. Existing server rarity slots, multi-slot policy and rewards unchanged.

## Phone acceptance
- Shop gold header, real pity/balances. Confirm one 500 Gold summon; chamber animates only active/foreground/reduced-motion-off. Only new server-confirmed result reveals card; historical result does not pop on opening Shop. No animation-generated results, fake card/rarity or optimistic wallet deductions.
- Interrupt network during summon: persisted pending operation blocks another pull. Recover pending summon uses run() without a new command/operation ID. Confirm no duplicate charge. Settings Reduce Motion/system setting stops ambient motion; minimal reveal under reduced motion.
- Aura tab: previews seven real themes independent of equipped state; own username, prices, Owned/Equipped labels. Preview does not buy/equip; confirm Buy then explicit Equip. Insufficient funds disables Buy. Returned server profile remains authority. No effect on balances merely browsing.
- Cards: two-column FlatList, rarity/name filters, sort, separate duplicate instances, Equipped badge. Six rarity-matched slots in compact panel; Manage/Change/Clear retains inventory. Existing legacy identity preparation kept. Card details and destructive Recycle confirmation are unchanged. Shadow Soldier catalog retained; not proof of ownership.
- Tracker: FlatList (12 initial/batch, window7), title search across whole loaded list, Added/Title/Episode sort, Add, Refresh and Remove. Episode pill opens keyboard-aware Sheet; direct integer1–100000 Save, no XP/Gold. Invalid input blocks Save. Keep draft on error/pending; close only matching server result. Typed number/string legacy IDs and unknown entry metadata retained, ambiguous IDs fail rather than overwrite. Correcting episode downward is allowed. News/Missions navigation and active reading safeguards preserved.
- R1 social/profile behavior unchanged; R3/Step8 deferred.

## Backend deployment REQUIRED before direct episode Save
Deploy this APK's runtime commit from branch arena/cd835a4c-anime-card-assets to the existing Render economy service. New strict `trackerEpisodeSet` command accepts trackerId + integer episode only. Verified token owner, profile field preservation, transactional idempotent receipts, mission progress and rewards safeguards remain; no direct XP. Existing trackerEpisode +1 command remains compatible.
No Firebase Rules change, Cloudinary permission change, paid service or billing activation. Preserve Render owner-only allowlist/global ECONOMY_ENABLED=false setup. Agent has NOT deployed Render.

## Validation boundaries
Automated component tests cover server-only summon reveal/recovery, real aura state, legacy detail preservation, collection filtering/virtualized configuration and 400-entry Tracker search/direct Save. Backend unit and Firestore emulator tests exercise strict bounds, concurrent replay, verified-owner isolation and metadata/no-reward preservation. These are not physical performance benchmarks or Android keyboard certification. Owner phone feedback required before R2 acceptance.
