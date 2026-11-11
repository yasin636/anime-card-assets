# Parity, defect decisions ও release QA

এই checklist **পরবর্তী implementation-এর acceptance contract**; এখন app তৈরি/এই সব E2E pass হয়েছে এমন দাবি নয়। `tools/test-blueprint-reference.cjs` কেবল extracted catalog ও pure baseline rule fixtures যাচাই করে।

## 1. Traceability workflow — কিছু বাদ না দেওয়ার নিয়ম

`reference/inventory.json` থেকে প্রতিটি named function, arrow declaration, DOM action/data attribute এবং keyframe নিয়ে implementation tracking row তৈরি করো:

```text
Source symbol + line → Feature ID → RN file/component/reducer → server command
→ unit/integration/E2E test → screenshot/video fixture → status/decision ID
```

`bindApp`-এর এক function port মানেই তার ভেতরের সব anonymous action complete নয়; DOM ID/data-attribute inventory প্রত্যেকটির পৃথক mapping লাগবে। View function-এ inline style, empty state, loading/disabled state ও copy-ও mapping-এর অংশ। `style.css` সব repeated selector/keyframe resolve করে effective cascade ধরতে হবে। Source snapshots redacted, line-preserving; code reference হিসেবে পড়বে, production entry হিসেবে import নয়।

|Feature ID|Source anchor (function names)|Acceptance minimum|
|---|---|---|
|AUTH|boot, bindAuth, ensureUserDocs, setupLive, clearLive|restore/signup/login/errors/logout/default/backfill|
|SHELL|viewApp, render, bindApp|৫ nav buttons,৪ More destinations, header/unread/modal layering|
|PROFILE|viewProfile, saveBio, saveUsername, setAvatar, handleProfilePicUpload|all edit paths, presets/gallery/limits/theme/stat display|
|PROGRESS|getLevelInfo, xpForLevel, rankTitle, getUserBadgeInfo, showLevelUpModal|thresholds/cap/rank/badge/glow/one modal|
|DAILY|claimDaily, claimDailyActual|confirm/rolling24h/once-only/retry|
|COLLECT|normalizeCard, renderCardVisual, renderSlots, viewInventory, viewCardDetailModal|১৬ cards/৬ slots/৩-col/detail/shadow gallery|
|GACHA|pickCardWithPity, buyMysteryBox, playBoxShakeAnimation|price/probability/pity/purchase/reveal/error|
|EQUIP|viewEquipModal, equipCardToSlot, unequipSlot|owned instance/rarity/replace/remove|
|RECYCLE|recycleCard|rarity rewards/duplicate flat bonus/equipped cleanup|
|THEMES|viewThemeStore, buyTheme, equipTheme|getTheme helpers +৭ effects/owned/purchase/toggle|
|MISSIONS|loadMissionsFromData, incrementMissionProgress, claimMissionReward, viewDailyMissionsInner|৫ goals/rewards/date/reset/ready/claim|
|WHEEL|drawWheel, runSpin, resolveSpin, spinArenaWheel|৮ slots/fee/free/precise stop/animation/retry|
|LEADERS|updateLeaderboard, renderLeaderboard, claimWeeklyReward, getWeekKey|Top10/XP sort/top3 reward/weekly once|
|BATTLE|makeBattleCard, generateAIDeck, calcTotals, applyDamage, startBattle, playerAttack, aiTakeTurn, endBattle, claimBattleReward, viewBattleScreen|all phases/cards/AI/turns/result/rewards|
|STORY|openStoryMode, startStoryFight, storyApplyDamage, storyPlayerAttack, storyEnemyAttack, storyEndBattle, advanceStoryDialogue, claimStoryReward, exitStoryMode|৫ chapter/১১ enemies/rules/stats/RNG/dialogues/reward|
|ARISE|getShadowArmy, addShadow, openAriseModal, confirmArise, triggerAriseBurst, viewAriseModal|all enemies capture/Ch2/select/50%stats/voice/full effect|
|FEED|createPost, likePost, commentPost, sharePost, deletePost, deleteComment, editPost, editComment, reactToPost, filterActivePosts, viewFeed|complete composer/media/engagement/XP/edit/delete/hide|
|TRACK|importAnime, incEpisode, removeAnime, viewTracker|manual add/duplicate/episode/remove/persistence|
|NEWS|fetchAnimeNews, startNewsReadTimer, claimNewsXp, viewNewsModal|Jikan mapping/10s/5/day/close/empty/external link|
|SENSEI|askSensei, viewChatList|current prompt only/loading/errors/session chat|
|QUIZ|fetchQuizQuestions, judgeAnswer, submitQuizAnswer, skipQuizQuestion, nextQuizQuestion, viewQuizModal|5 questions/typing/hint where rendered/feedback/XP/gems/close|
|DM|openChatWithUser, sendChatMessage, deleteDmMessage, viewChatWindow|search/recent/inbox/participant-only/send/delete/unread|
|GLOBAL|openGlobalChat, sendGlobalMessage, toggleReaction, viewGlobalChatWindow|live/send/mission/own delete/multi-emoji/close/pop|
|PRESENCE|startPresence, stopPresence, setPresence|30s heartbeat/70s expiry/AppState/logout|
|PUBLIC|viewInspectProfile, renderAdminBadge|other-user profile/theme/cards/power/display-only role|
|AUDIO|bgMusic*, sfx*, playPopSound, playAriseAudio, renderMusicPanel|3 tracks/mode/volume/toggle/all SFX/interruption|
|FX|showNeonModal, showFlash, showLevelUpModal + CSS keyframes|confirm/cancel/danger/flashes/107-animation mapping|

The table groups responsibility; exhaustive symbol list is `inventory.json`, not only this table.

## 2. Known source defects, ambiguities ও explicit decisions

Implementation repairs below do **not** authorize deleting features or changing prices/stats/rewards. `Required` means safe implementation condition. `Approval` means baseline behaviour must remain available in tests until a specific resolution is agreed.

|ID|Observed baseline|Native plan / approval requirement|
|---|---|---|
|D01 Required|Groq secret in client|Revoke/rotate, backend secret only; never reproduce old key|
|D02 Required|Admin username equals editable `Yasin Arafat`|Immutable admin UID/custom claim for authority; legitimate display badge preserved; cannot auto-authorize every matching name|
|D03 Required|Some Firestore transactions write before later reads (like/comment/share/delete)|Read all required docs first, then writes; server command owns cross-user XP|
|D04 Required|deletePost failure fallback can delete without XP penalty|Atomic owner-validated delete+−15, no bypass fallback|
|D05 Required|Post quota checked only cached activity; `postActivity` is never populated by live subscription|Read/date/count enforce in same server transaction, preserve10/admin exempt|
|D06 Required|8MiB media/2MiB avatar base64 Firestore doc|Storage uploads, same accepted file sizes; legacy data URL renderer|
|D07 Required|DM unread derives missing raw counter from transformed inbox; repeated sends often reset to1|Atomic recipient increment; active read clear; no loss on concurrent sends|
|D08 Required|Inbox reads latest50 chats globally then filters user|participants query + security Rules; don't leak unrelated private chats|
|D09 Approval|DM asc limit300/global asc limit200 returns oldest pages|Recommended latest-window pagination with ascending presentation; approved deviation, test both query semantics|
|D10 Required|First-clear/shadow/device avatar keys shared across accounts; local-only progress|UID-scoped server records + explicit legacy import; no automatic trustworthy first-clear replay|
|D11 Required|Story marks clear before reward transaction; failure loses first reward|Clear+reward atomic; operationId retry safe|
|D12 Required|Reward claims rely on local booleans/client winner/client rank/client RNG|Server verifies session/event/eligibility; durable once-only op ledger|
|D13 Approval|Social text says5 likes+5 comments but counter total10; community says1 global+2 quiz but total3|Baseline uses aggregate counts; changing to distinct subgoals needs approval/data migration|
|D14 Approval|Mission/news dates UTC; reset countdown local; week local Sunday→ISO|Default preserve UTC mission/day; correct label countdown to same boundary. Select explicit weekly timezone rather than silently Dhaka reset|
|D15 Approval|Heavy says3 turns but Guard doesn't decrement|Default exact attack-only cooldown; if actual all turns desired, update rules/tests with approval|
|D16 Approved by owner|ARISE can repeat-stack; flags missing resets|Owner explicitly approved once per battle + full ARISE state reset for every new battle. Enforce server-side; same-operation replay must not apply stats twice. Implementation/QA pending in Step05.|
|D17 Required|Timers/callbacks survive exit/navigation and multiple button taps|Phase/turn lock, cancellation registry, session generation guard, no stale mutation|
|D18 Approval|Shield-down Story HP subtracts5% but displayed dmg says2%|Preserve5% actual damage; recommended display actual delta; golden test captures defect|
|D19 Approval|A hit can trigger boss mid dialogue before lethal victory check; later re-entry may allow dead enemy actions|Priority death→victory before rage/mid; don't silently add enemy damage|
|D20 Required|Some claim flags set early/failed reward closes UI (battle)/early mission optimism|Durable server states, rollback local pending on error, retry same opID|
|D21 Approval|Self-like no actual XP but +5 toast/mission; self-comment+10 and self-share+5|Correct misleading toast; economic self-comment/share rules change only by approval|
|D22 Approval|Unlike doesn't claw back creator+1; relike awards again; share can farm rewards|Baseline numbers remain; abuse limits need explicit approved policy, no invented daily cap|
|D23 Approval|Same feed reaction popup calls likePost, not reaction removal|Use distinct like vs single-emoji state; selecting same emoji toggles off; don't double credit|
|D24 Required|Many edit/delete checks are UI-only (comment owner not enforced by function)|Server ownership checks, preserve owner actions; no arbitrary user deletion|
|D25 Approval|News claimedIds resets every reopen; same item can pay until daily5|Baseline allows repeat after reopen; per-article/day prevention needs approval|
|D26 Required|AI quiz accepts fewer than5 questions, trusts JSON shape|Validate exactly5 with bounded retry/failure UI; keep no gems until complete|
|D27 Approval|Judge fallback checks only first answer word, weak grading|Preserve fallback fixture; stronger matching requires explicit scoring decision|
|D28 Required|Repeated render adds click listeners; inputs can lose focus/drafts|Declarative handlers, cleanup subscriptions, controlled drafts; no duplicate writes|
|D29 Approval|Admin reset comment says2840→Lv21 but actual function→Lv26|Do not run on login; admin-only audited one-time migration if requested|
|D30 Required|Baruka filename date differs, pop.mp3 absent in repo|Verified approved art mapping; licensed pop asset/fallback, no crash|
|D31 Approval|ARISE/pop bypass sfxEnabled; bgMusicPlay resets src|Document effective behaviour; consistent mute/resume needs approved audio UX|
|D32 Required|Anonymous live user_meta read includes public and private account fields in same docs|Public projection for discovery/leaderboard, own full profile only; no email exposure|
|D33 Approval|Catalog titles exist but only dungeonConqueror bool is saved|Keep chapter reward copy; no fake generalized earned-title system|
|D34 Approval|All chapters available despite requirement metadata; startStoryFight no gate itself|Preserve all unlocked after globalLv3/3-card gate; enforce global entry at server, not new sequential locks|
|D35 Approval|Equip UI filters rarity; command doesn't enforce, same instance can appear twice|Enforce rarity; decide same-instance multi-slot. Never pretend source already blocks both|
|D36 Required|Auth signup document writes can race onAuthStateChanged ensure defaults|Single transactional/on-create initialization, no overwriting earned profile state|
|D37 Approval|Share copies #post link but no source hash router|Copy exact canonical format; functional native post deep link additive, not existing requirement|
|D38 Required|News snapshot/profile listener + local dailyCount increment can double UI count|Single derived committed count; preserve actual5/day, don't display6/5|

## 3. Golden rule fixtures (baseline, offline)

|Case|Expected|
|---|---|
|XP0 /49 /50|Lv1 /Lv1 /Lv2|
|XP500 /1300 /2840|Lv11 /Lv21 /Lv26 (40 into next)|
|XP44300 / huge XP|Lv100; raw XP retained, next/into=0|
|Badge99/100/299/300/600/1000/2000|none/copper/copper/silver/gold/diamond/mythic|
|Normal gacha rolls .079/.08/.299/.30|legendary/rare/rare/common|
|pityRare9,pityLegendary0|next Rare exactly, irrespective roll|
|pityRare9,pityLegendary20|Legendary precedence, counters0/0|
|Legendary normal pull|both counters reset|
|Rare normal pull|rare0, legendary increments|
|Paid lose starting100XP|80XP|
|Paid bankrupt starting100XP|60XP|
|Free bankrupt starting100XP|80XP; freeSpins−1|
|Paid x2 starting100XP|120XP, not200|
|Free→FREE slot|consume1 then award1, unchanged count|
|Arena deck Gojo+Denji+Yuji|HP4540, DEF1915|
|Arena damage300 at HP1000 DEF10|HP800 DEF0 (no shield overflow)|
|Arena damage300 at HP1000 DEF0|HP700|
|Arena equal remainingHP at deck exhaustion|player win|
|Story all same three inventory cards|HP2270 ATK7250 DEF1915 before bonuses|
|Story ATK1000 vsHP1000 DEF100|HP980 DEF90|
|Story ATK1000 vsHP1000 DEF0|HP950; baseline returned display dmg20 (D18)|
|Perm ATK5%, flat ATK100, base7250|round(7612.5)+100=7713|
|Guard then enemy base1000 crit|guard500→crit1000 before damage calculation|
|Heavy roll .04/.05/.149/.15|miss/crit/crit/regular|
|ARISE Gojo-like shadow850/5500/950|+425HP/+2750ATK/+475DEF|
|First Goblin|5XP/15Gold/0Gems|
|Repeat Goblin|2XP/0/0 (round1.5)|
|First Baran|20000XP/10000Gold/25Gems,+8%ATK/+8%HP/+5%DEF|
|Repeat Baran|6000XP/0Gold/0Gems/no%|
|All five first bosses percent totals|ATK68%, HP68%, DEF48% (additive)|
|Quiz5 correct|+50XP &10Gems|
|Quiz4 correct1 wrong|+30XP &5Gems|
|Quiz5 skips starting0|balance0; signed quiz summary−75|
|Fresh external like then unlike|actor net0XP, creator retains+1|
|Self comment|actor+10XP, no extra creator+3|

## 4. End-to-end acceptance checklist

### Identity/session
- [ ] Fresh install→boot→signup→defaults→Profile; existing login restores balances/inventory.
- [ ] Invalid login/duplicate email/weak password/busy submit states accurate.
- [ ] Logout→different user: no old profile/shadow/news/chat/reward state leakage.
- [ ] App killed/reopened; foreground/background; expired token/offline startup recover.
- [ ] Legacy default/backfill does not reset any existing fields; derived level correct.

### Visual/navigation
- [ ] Screens320/360/390/430/560 width plus tablet centred; Android/iOS safe areas.
- [ ] Full reference screenshots for each screen/modal empty/loading/populated/error state.
- [ ] Header chips don't overlap on large balances; Bengali/Korean/emoji wrap/render correctly.
- [ ] Main4+More4, selected states/unread9+, outside dismiss, native Back.
- [ ] Every107 keyframe mapped; source duration/easing/crop/glow/hologram verified in video.
- [ ] Inputs survive incoming snapshots; keyboard never covers composer/action.

### Economy/collection
- [ ] Exactly16 art/stat records; no swapped name/file/rarity.
- [ ] Buy with499Gold rejects;500 succeeds once; retry after timeout no second spend.
- [ ] Pity boundary10/21 and Legendary precedence; correct counters after each rarity.
- [ ] Recycle common/rare/legendary, last-copy vs duplicate, featured-slot cleanup.
- [ ] Recycle concurrent double press/duplicate user devices cannot mint rewards.
- [ ] All7 theme prices/effects, purchase/equip/unequip/owned state persisted.
- [ ] All5 missions show correct events/thresholds/claim once/reset boundary/countdown.
- [ ] Daily23h59m denied/24h allowed; clock tamper can't bypass.
- [ ] Wheel all8 outcomes, paid/free/lowXP/drift/spin interruption/restart.
- [ ] Top10 sort and all3 weekly rewards, non-top3 denied server-side, week boundary.

### Combat
- [ ] Arena<3 cards/selection<3 blocked; select>6 supported;400Gold debit once.
- [ ] AI same rarity distribution; totals, coin both outcomes, each chosen card used once.
- [ ] DEF-positive/zero/shield-break, decks exhausted/tie/death, exact reward/claim once.
- [ ] Exit battle prevents late AI timers damaging later session; no refund invented.
- [ ] AdventureLv2 blocked;Lv3+3 cards allowed; all5 chapters+11 enemies available.
- [ ] All boss dialogues4 stages and generic enemy lines verified verbatim.
- [ ] Coin initiative, strike/heavy/guard, crit/miss thresholds, cooldown decision.
- [ ] 50% dialogue,20% enrage every boss, lethal-hit ordering, no repeated pending action.
- [ ] First/repeat boss/normal reward formulas, percent vs flat power isolated from XP.
- [ ] ARISE deniedCh1, selectableCh2+, empty selection, multi-shadows, correct50% rounding.
- [ ] ARISE reset/stack policy approved; burst+voice+HP/maxHP/DEF/maxDEF updates.
- [ ] Every defeated unique enemy captured once; cross-device first reward once.
- [ ] Defeat/retry/map/exit no stale flags, enemy turn or reward loss.

### Social/media/community
- [ ] Text/image/video/link combinations; caption required; preview/remove/edit drafts.
- [ ] 8MiB media/2MiB avatar boundary; nonadmin video60s vs>60s; admin policy.
- [ ] Camera/gallery permission denial/cancel/upload fail/cleanup; legacy base64 rendering.
- [ ]10posts/day server enforced; admin exemption; deletes don't refund quota.
- [ ] Full XP table: own vs other, like/unlike/re-like, comments/edit/delete, shares/post delete.
- [ ] Feed single reaction/change/remove independent of likes; source defect resolution signed off.
- [ ]7day auto-hide not delete; admin exempt; latest60 semantics recorded.
- [ ] Tracker case duplicate, starts episode1,+1/remove, mission count.
- [ ] News API fixture mapping;10s/one timer/close cancel/5daily/date reset/reopen policy.
- [ ] Sensei current-only request/loading/error, no client secret in APK/IPA/source maps.
- [ ] Quiz exactly5/questions+judging/fallback/skip/per-answer XP/4-or5 correct gems/early close.
- [ ] DM discovery/recent30/remove not delete; inbox query secure; unread two clients.
- [ ] DM send own-delete; incoming snapshot order/pagination; no duplicate send after retry.
- [ ] Global message mission and multi-emoji toggle/count/own delete/profile/pop dedup.
- [ ] Presence30s heartbeat/70s expiry, offline/logout/background/reconnect.

### Audio and production
- [ ]3 tracks all load, Repeat/Continue/wrap, volume/mute/interruptions, selected mode.
- [ ] All generated SFX envelopes and ARISE/pop clips; approved consistent mute policy.
- [ ] Missing network image/audio degrades gracefully, doesn't block paid action or fight.
- [ ] Emulator Rules: cannot read another user's DM/private email, forge admin/currency/winner/rank.
- [ ] Request replay/session stale actions/double claim/concurrency reject or return same result.
- [ ] Migration rehearsed with backup, partial upload, local-progress import and rollback.
- [ ] Physical Android+iOS evidence; UI screenshots/videos and test report attached.

## 5. Coverage evidence ও current status

Current deliverable: documentation + secret-redacted reference + catalog/inventory + offline baseline validation script. No RN dependency install, native build, emulator integration, screenshot capture, live Firebase/Groq/Jikan test or physical-device E2E was performed as part of writing the blueprint. These remain required implementation gates. A filled checkbox must link real evidence; source existence alone is not a passing app test.
