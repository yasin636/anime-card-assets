# v0.5.1 / code9 — Arena visual redesign requested by owner

Owner accepts functioning Wheel/Battle flow but explicitly rejects v0.5.0 UI. Screenshots show win/result/log, header4234XP/358Gems/5918Gold and stale standings4184XP. Do not infer exact Wheel XP math from nonconsecutive screenshots. Stage04 NOT fully accepted. User asks actual art/rarity/stats before selecting, compact grid, avatar/name leaderboard, profile with equipped featured cards.

## New UI

- Cohesive obsidian/violet/gold Arena hero and Battle/Rankings/Wheel/Quiz tabs; no giant diagnostic card by default. Connection diagnostics still available on status chip. Pending/error/retry remains visible (never silently clear pending).
- Actual16 original card images bundled offline, catalog-byte hash checks. Three-column grid in bounded nested scrolling window, rarity chips, ATK sort, numbered selected state, per-card raw HP/ATK/DEF. Long press opens larger card/stat detail. Legacy missing IDs stay disabled (prepare explicitly in Cards); unknown IDs not invented rarity/stats.
- Squad summary shows battle HP2sum, sum of percard rounded strikes, DEFsum, >=3unique required without max3. Selected-order numbers preserved through filtering/sort; no reward/selection/power rebalance.
- Active battle HP/DEF gauges, two art cards in VS layout, actual hand with used state, collapsible battle log, clear Victory/Defeat and net fee/reward. End result clears selection as blueprint intended. No fake progress/chance indicators.
- Rankings use compact real-avatar/name/XP rows, Top3 podium and own-row highlight. Any name/avatar row or podium opens public-profile modal, not an Inspect button list. XP changes refresh standings without resetting battle. Same server ranking/tie/weekly policy, no client-assigned ranks.
- Public sheet: actual avatar/name/Bio, XP-derived level/title, categorical gem badge, equipped theme header, six featured-card slots and art/stat details. Empty slots explicitly empty; old backend missing projection shown as unavailable, not falsely empty. No full inventory, email, balance, instance IDs or private sessions exposed.
- Segmented original8outcome wheel face, same server result/5200ms animation. Quiz restyled, feedback→Next question explicit; server-key gate unchanged. No request for saved phone key.

## Required backend update

Render → Manual Deploy → Deploy latest commit (for whitelisted featuredSlots/profile badge and read-only leaderboardView). Existing credentials, Rules, owner UID allowlist and ECONOMY_ENABLED=false unchanged. No payment/new key/GCP step. Old backend cannot supply featured slots; UI indicates this explicitly. No live mutations by agent.

## Verification / acceptance

Local real React component tests with mocked native primitives cover card artwork/rarity/stats/selection callback, compact avatar row press, profile featured cards/empty slots; not pixel/device screenshots. Pure display helper tests compare shown stats/deck totals against trusted battle engine and all16 original image hashes. Actual emulator API tests ensure six-slot whitelist and private-field stripping. CI also reruns earlier security/transaction/retry tests. Android APK/phone visual acceptance required. No independent iOS/physical render or SFX/full107CSS parity claim.

Owner should update in place (do not uninstall), deploy backend, inspect Battle cards/filters/totals WITHOUT starting a paid battle, tap Rankings identities to inspect actual featured cards. No extra spending/card destruction needed for visual QA. Remaining quiz private server provider, broader battle-motion/SFX refinements and provisional weekly timezone/tie approval are separate open Stage04 items. Deferred Gallery/GCP cleanup unchanged.

## Superseded by v0.5.3
Owner accepted full artwork sizing in v0.5.2. The former separate server-key plan above is obsolete: v0.5.3 uses the single saved Settings provider with explicitly authorized transient HTTPS transmission. Quiz, claimed-state UI, server-confirmed battle animation and original impact SFX are implemented. See STEP04-COMPLETION.md for deployment, tests and outstanding live/phone acceptance (not claimed complete).
