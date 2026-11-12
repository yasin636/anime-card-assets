# R2 — Shop / Cards / Tracker — Edition 01

Owner accepted R1 and requested the R2 preview before native implementation. This is an offline, interactive design proposal only. No native/backend code changed. All account balances, cards, pity, aura ownership and watchlist entries are sample data; reload resets everything. No real purchases, summons, server calls, Firebase access or persistent changes occur.

## Visual direction
Obsidian shell consistent with approved R1; restrained lilac ritual chamber and soft lime CTA; seven selectable anime auras with explicit Preview/Owned/Equipped states; editorial two-column owned-card grid and compact six-slot rarity-matched management; clean compact watchlist with direct numeric episode editor. Ambient animation and reveal respect reduced motion. Native uses vector icons and safe-area/keyboard-aware components, not this web shell.

## Try on phone
1. Shop → Summon → confirmation → animated fixed sample reveal → collection. Preview flow under “Know your odds” also simulates interruption; switch to success and Retry. Native MUST keep the same pending operation, never generate another summon or show invented results.
2. Aura studio → browse seven previews → buy sample aura → Owned → Equip → Equipped. Previewing never spends Gold. Prices match existing themes catalog.
3. Cards → rarity/name filters, sort, individual duplicate copies → details → matching rarity slot. Manage opens all six existing slots (two per rarity); emptying a slot keeps inventory. Preserve existing multi-slot server policy; no unapproved gameplay rule change. Recycle has explicit destructive confirmation and existing reward semantics.
4. Tracker → search across all 124 sample entries → episode pill → type a count → Save. Add/remove, duplicate-title rejection, list sort, and load-more work locally. Only 20 rows initially render; native proposal uses FlatList windowing, not a giant ScrollView.

## Contract/approval notes
- Summon: 500 Gold, 8% legendary/22% rare/70% common, Rare pity10 and Legendary21 precedence. Native reveal comes ONLY from server receipt; animation is presentation, not a random generator. No new rarity, multi-pull, guaranteed preview card or rewards.
- Catalog artwork and card stats are reused from this repo; no new rights claim. Fixed demo reveal is Sung Jinwoo, not a prediction.
- Six existing slots preserved. R1 Profile presentation remains untouched by this preview.
- Tracker currently supports +1 only. Direct episode setting needs a strict new server command after design approval: ownership, stable tracker ID, integer bounds, idempotent retry, no direct XP/reward. Preview's proposed bound is 1–100000, subject to native validation policy review. No invented total-episode counts, watched/completed statuses, or catalog API dependence.
- No real backend loading/benchmark claim. DOM checks don't prove native keyboard geometry, screen-reader behavior or device performance.
- R3 and Step8 deferred. Approval is for direction before porting to React Native and signed in-place APK.

## Build/tests
`npm ci --prefix design/r1 --no-audit --no-fund` installs the shared jsdom test dependency.
`node --test design/r2/preview.test.cjs` — navigation, single sample debit/reveal, retry/error, aura ownership, rarity slots, six-slot management, 124-entry search, direct episode validation and escaped input/focus.
`node design/r2/bundle.cjs /home/user/output/AnimeMetaHub-R2-Edition01.html` builds a standalone offline HTML, inlining all CSS, JS and artwork. GitHub Actions supplies a downloadable ZIP for mobile; no sandbox preview access required.

## Distribution fix
The initial standalone bundler passed script text as a String.replace replacement string. JavaScript `$$` was interpreted as replacement syntax and collapsed to `$`, causing a duplicate-identifier SyntaxError at startup. Source-only tests missed it. Use callback replacements to preserve script bytes. An additional integration test builds and executes the actual standalone HTML, checks zero script errors, navigates Cards/Tracker/Aura, saves an episode and completes a sample summon. Corrected artifact/HTML uses `Edition01-Fixed` to distinguish from the broken download. No visual direction or native/backend changes.
