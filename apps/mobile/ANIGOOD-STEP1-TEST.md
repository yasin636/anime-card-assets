# AniGooD Step 1 — v0.17.0 / Android code29

Install over existing app. Do NOT uninstall/clear data. Same com.yasin636.animemetahub identity/private signing.

## Completed owner scope
- Approved uploaded AG logo (original retained under design/anigood), safe-inset adaptive icon, header icon, static native launch image plus reduced-motion/background-aware animated branded JS loading screen. Visible brand AniGooD, preserved internal IDs/URLs/storage/signing.
- Header actual XP/Gold/Gems (compact stack, tap full balances). Account & Privacy moved Profile→Settings with original sign-out/Google-link behavior and errors.
- Settings motion help; AI Provider removes long main-screen implementation prose, official https://aistudio.google.com/apikey button, friendly setup guide and privacy/cost help sheets. SecureStore/trusted Quiz boundary/revoke/rooted-device limitations retained. Sensei knows brand AniGooD; full app knowledge/images/grounding belong to Step2.
- App Alert.alert calls presented centrally as Jinwoo-style system frames, queued without automatic destructive actions. Preserve buttons/callbacks/cancel behavior; app sheets system-themed. OS permission/gallery/native platform UI excluded. Existing bespoke game reward windows retained.
- Battle/Quiz/Adventure highlighted rules help from existing server rules; Quiz long reward/provider main-screen prose moved to help, missing-key/errors retained. Story rewards per chapter visible, ordinary first/repeat clear formulas explained. No game/economy formula changes.
- Daily Missions at Feed top, expands inline with actual server progress/UTC freshness/claim checks. Four retained goals. Removed Anime News reader/navigation from mobile, including legacy Tracker route params (no hidden news start/claim). The old News Reader mission is omitted because its feature is removed; its backend definition/history is NOT migrated/deleted, preserving existing data/reward rules. Remaining four rewards unchanged. Tracker watchlist retained. News backend routes remain for compatibility, no mobile entrypoint.
- Stats catalog now includes Chapter1, highlighted BOSS badge. My Shadow Soldiers opens authenticated storyView, showing only earned shadows, original stats and ARISE bonus; no new equip/reward functionality. Current original Card Detail/Equip/Recycle untouched.

## Tests & deployment
Existing mobile/tool regression suite plus new dialog queue/cancellation/branding tests, updated removed-News/Feed mission tests, catalog/earned-shadow checks. Backend tests and CI Rules/transactions mandatory. Local TS missing ignored generated Firebase module; CI generates it. Only backend change is public badge branding Mythic Meta Hub→Mythic AniGooD (no reward change). Render deploy APK runtime for matching public badge; no new rules/secrets/billing required. Agent has not deployed Render.

## Phone acceptance checklist (not certified by mocks)
1. In-place install keeps login/account/inventory. Launcher icon not clipped; native launch and animated boot show AniGooD. Reduced Motion remains static/minimal.
2. 320–400dp width and larger text: header name/XP/Gold/Gems readable, tap balances accurate. Account actions only in Settings, Google link and sign-out Cancel do nothing.
3. Shop odds and action confirmations system-themed; cancel leaves balances unchanged; queue/error actions work. Check modal-over-sheet dialogs on Android.
4. Battle/Quiz/Adventure rules open/close, game behavior same; Quiz missing key actionable. Rewards match server, not prose alone.
5. Feed top Daily Missions expands, claims only completed current UTC goals, midnight refresh. News absent from Tracker/Feed. Watchlist add/episode/remove unchanged.
6. Chapter1 catalog, gold BOSS badges, My Shadow Soldiers reflects real server victories only, empty/error/retry state. Original card detail/equip/recycle preserved.
7. AI Provider key guide/button opens official site; Help contains privacy/cost info, key save/test/delete unchanged. No full AI knowledge/web/image claims in Step1.

Step2 internal sharing, chat/Sensei images, friendly broad Sensei/full versioned app knowledge/latest grounding are NOT included. Step8 deferred.
