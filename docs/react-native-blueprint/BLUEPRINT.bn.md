# Anime Meta Hub — React Native পূর্ণাঙ্গ পোর্টিং ব্লুপ্রিন্ট

**ভাষা:** বাংলা · **Baseline:** ব্যবহারকারীর দেওয়া `index.html`, `style.css`, `script.js` · **পরিসর:** Android + iOS native app, WebView wrapper নয়।

## 0. এই ডেলিভারেবল কী এবং কী নয়

এটি বাস্তব সোর্স বিশ্লেষণভিত্তিক implementation specification; তৈরি হয়ে যাওয়া React Native app নয়। কোনো backend, live account বা paid API পরিবর্তন/কল করা হয়নি। ১৬টি কার্ড, ৫টি chapter/১১টি enemy, ৭টি theme, ৫টি mission এবং সোর্সে থাকা সব UI/interaction-এর reference সংরক্ষিত। সোর্সে ১৯৩টি named function ও ১০৭টি unique CSS keyframe নাম পাওয়া গেছে; anonymous handler/arrow helper-ও inventory-তে আলাদা আছে।

**কোনো ফিচার বাদ দেওয়া যাবে না।** নিচের specification এবং `reference/` একসঙ্গে contract। সারাংশে উল্লেখ না থাকলেও reference-এর দৃশ্যমান UI, dialogue, action, animation বাদ দেওয়া যাবে না। প্রতিটি function/action/animation implementation অথবা documented non-native replacement পাবে।

**তিনটি স্তর আলাদা রাখো:**
1. **Parity contract:** বর্তমান UI, সংখ্যা, formula, content, navigation এবং supported interaction অক্ষুণ্ণ।
2. **Implementation repair:** security, transaction ordering, duplicate claim ও lifecycle bug সারাতে হবে; feature কমিয়ে নয়।
3. **Product decision:** অসংগত আচরণের ক্ষেত্রে current executable behaviour এবং intended rule আলাদা পরীক্ষা ও approval পাবে। চুপিচুপি gameplay rebalance করা যাবে না।

### Reference পড়ার ক্রম
- এই নথি: architecture, feature, rule ও migration plan।
- `PARITY-AND-QA.bn.md`: release checklist, bugs/decisions, golden test cases।
- `reference/catalog.json`: **হুবহু** card stats/image URL, enemy stats, rewards, Bengali dialogues, themes, avatars, wheel ও reactions।
- `reference/inventory.json`: source hash/line count, named functions ও line numbers, arrow declarations, DOM IDs, data actions, CSS variables, keyframe নাম, media queries, external URL inventory।
- `reference/script.redacted.js`: পূর্ণ executable-behaviour reference, secret মুছে ফেলা; import/run করার জন্য নয়। মূল line numbering অক্ষুণ্ণ।
- `reference/style.css`: সম্পূর্ণ visual source; শেষের override-সহ cascade ধরে পড়তে হবে।
- `reference/index.html`: boot screen, metadata ও font reference।

---

## 1. প্রযুক্তিগত ভিত্তি

### প্রস্তাবিত stack (সিদ্ধান্ত, existing dependency নয়)
- React Native + TypeScript strict, Expo **development build/prebuild**। Native Firebase module ব্যবহার করলে Expo Go যথেষ্ট নয়।
- React Navigation: native stack + custom bottom navigation + More drawer/modal।
- Zustand: ephemeral screen/session state; pure TypeScript reducers: battle/story/economy। Firestore snapshot: persisted state-এর authority।
- `@react-native-firebase/app`, `auth`, `firestore`, `storage`; analytics ঐচ্ছিক native module, original analytics behaviour-এর supported equivalent। একই Firebase project-এর Android/iOS app registration প্রয়োজন; web app ID সরাসরি native config হিসেবে নয়।
- Reanimated + Gesture Handler; SVG/Skia: wheel, hologram, particles, glow, ARISE kinetic effects।
- Expo Image, Expo Image Picker, Expo Video, Expo Audio, Expo Clipboard, Expo Linking, safe-area-context, slider। SVG avatar-এর জন্য SVG-capable renderer/local raster fallback।
- AsyncStorage: legacy local progress bridge; SecureStore শুধু প্রয়োজনীয় sensitive local material-এর জন্য। Firebase SDK-কে auth persistence পরিচালনা করতে দাও।
- Zod runtime validation; Jest/RN Testing Library; emulator integration tests; Maestro/Detox E2E।

**Version policy:** implementation শুরুর সময় mutually compatible Expo/RN/native Firebase versions নির্বাচন করে lockfile commit করতে হবে। এই blueprint কোনো untested latest-version compatibility দাবি করছে না।

### Native replacement map
| Web source | Native replacement |
|---|---|
| HTML/template string/innerHTML | typed React components; text-কে Text হিসেবে render |
| getElementById/querySelector/event binding | controlled state, refs, declarative onPress/onChangeText |
| sticky header/fixed nav | safe-area header + custom tab bar |
| CSS grid | flex/grid layout বা FlatList numColumns |
| CSS pseudo-element | absolute layered View/Gradient/Skia |
| box-shadow/text-shadow/filter/blend | platform shadow + layered glow/Skia; screenshot যাচাই |
| canvas wheel | SVG/Skia vector wheel + Reanimated rotation |
| Audio/AudioContext | audio service + bundled synthesized SFX |
| FileReader/object URL/file input | image picker + metadata + upload service |
| clipboard/location hash | Clipboard + configured share URL/deep-link adapter |
| localStorage/sessionStorage | AsyncStorage + session Set |
| visibilitychange/beforeunload | AppState + listener cleanup; crash-safe presence expiry |
| alert/confirm/prompt/custom HTML modal | branded native modal with editable fields |
| scrolling DOM node | list refs, scrollToEnd, keyboard-safe layout |

No WebView core feature, fake static chat, fake RNG reveal, placeholder battle engine বা mock persistence দিয়ে parity complete বলা যাবে না।

---

## 2. Project structure ও module ownership

```text
apps/mobile/
  app.config.ts
  src/
    app/                 # providers, bootstrap, session cleanup
    navigation/          # RootStack, MainShell, MoreDrawer, overlays
    design/              # tokens, gradients, typography, animation specs
    components/          # Panel, NeonButton, CardVisual, Avatar, CurrencyChip
    features/
      auth/ profile/ feed/ tracker/ chat/ news/ sensei/ quiz/
      arena/ battle/ shop/ missions/ themes/ inventory/ story/ music/
    domain/
      catalog/           # copied typed catalog, validated against reference
      progression/       # XP, ranks, badges
      economy/           # reward definitions and commands
      battle/            # pure reducer + RNG injected
      story/             # pure reducer, dialogue, ARISE
    data/
      firebase/          # native adapters, refs, subscriptions
      repositories/      # user, feed, chat, inventory, progress
      local/             # legacy storage migration + scoped keys
    services/            # audio, media, AI proxy, presence, clock
    state/               # session/UI stores, no global mutable singleton DOM
    tests/
backend/
  functions/src/         # privileged economy/AI/media command endpoints
  firestore.rules
  storage.rules
  firestore.indexes.json
packages/contracts/      # shared schema, operation IDs, reward constants
```

প্রতিটি domain operation typed command/result দেবে; UI অর্থ সরাসরি বাড়াবে না। Reducer থেকে timers, network, audio আলাদা effect runner-এ থাকবে। Test-এ RNG/clock inject করা যাবে। Catalog version ও economy rule version backend/client-এ এক থাকতে হবে।

### State domains
- Session: authReady/currentUser/error/busy; logout-এ user state purge।
- Profile: persisted meta ও derived level/badge/power। `level` কখনো স্বাধীন authority নয়।
- UI: selected tab, More, avatar/name editor, inspect user, toast, modal stack।
- Feed: pending caption/media/link, preview, posting, comment/post editor।
- Chat: search, active peer, DM/global mode, inbox, unread, reaction picker।
- News: modal, articles, loading, per-article reading timer, session claim IDs।
- Quiz: anime input, questions, index, answer, judge loading, feedback/results, XP/gems summary।
- Shop: active anchor tab, missions accordion, theme accordion, purchase/shake/beam/result।
- Arena: spin phase, rotation, pending outcome, result tone।
- Battle: selection → confirmation/rules → coinToss → fight → ended → reward।
- Story: map → coinToss → dialogue → fight → victory/defeat; pending dialogue result; heavy cooldown, guard, rage, initiative, shadows।
- Audio: enabled=false, sfxEnabled=true, track=0, mode=continue, volume=.4, panel closed। Original settings session-only; persist করা extension, mandatory parity নয়।

---

## 3. Navigation ও screen contract

### Bootstrap/Auth
`SYSTEM REBOOTING` / `Extracting Shadow Files... ⚡` boot appearance → auth-ready loader → Login/Sign up অথবা main app। Default main tab **Profile**। Firebase auth session restore করতে হবে।

### Bottom bar (ক্রম অপরিবর্তিত)
**Profile · Arena · Feed · Shop · More**। More drawer-এ **Cards, Tracker, Chat, Adventure**। More active হবে ওই চার destination-এ। Chat unread badge সর্বোচ্চ `9+`। Outside-tap drawer বন্ধ করে। Header-এ Anime Meta Hub, raw XP, Gems, Gold, Music/SFX toggle। Currency update real-time।

### Feature map
| Destination | পূর্ণ UI / nested flow |
|---|---|
| Profile | avatar upload/picker, name edit/save/cancel, admin/badge/rank, active theme, level/XP, gems-next badge progress, Gold, story power/bonus, bio, ৬ featured slots, daily confirm, sign out |
| Arena | neon spin wheel, free count/result, AI battle entry/rules/selection/confirm/fight/result, anime quiz, Top 10 leaderboard/weekly reward/public profile |
| Feed | composer, text/image/video/link preview, post menu/edit/delete, reactions/like, comments/editor/delete, shares, news hub |
| Shop | Mystery Box/Missions/Themes sticky anchor tabs, pity, shake/beam/reveal, card catalog preview, accordion missions, theme shop |
| Cards | ৩-column owned cards, detail preview, equip/recycle, equipped indicators, Shadow Soldiers gallery |
| Tracker | manual anime title import, list, episode +1, remove |
| Chat | search users, recent/inbox, AI Sensei area, global chat entry, DM, global reactions/delete, profiles |
| Adventure | requirements/rules, chapter tabs/map/enemy cards, fight/dialogue, ARISE, win/loss/claim/exit |

### Shared overlay registry
Neon confirmation/danger; import anime; equip slot; inspect public profile; news; quiz rules; quiz questions/result; catalog preview; owned-card detail; level-up; music panel; More; story rules; ARISE selection; battle rules/entry confirm। Toast + XP/Gems/Gold floating flash পৃথক presentation layers। Android Back প্রথমে top overlay dismiss করবে, তারপর nested screen, তারপর destination/root। Battle থেকে exit source-এর মতো fee refund দেবে না; data cleanup করবে।

---

## 4. Design fidelity — CSS migration contract

Base tokens: `bg #030014`, `bgSoft #0b0820`, `panel #14112f`, `panel2 #1c1740`, `line rgba(167,139,250,.28)`, `text #f3edff`, `muted #bca8ef`, `brand #8b5cf6`, `brand2 #c026d3`, `liked #fb7185`, `danger #f87171`, `online #22c55e`।

- Inter 400/700/900; বাংলা glyph-এর জন্য compatible Bengali fallback/font bundle। Original text বাংলা/ইংরেজি/কিছু Korean মিশ্র; parity-তে অনুবাদ করে বদলাবে না।
- Content centred, max-width **560**; narrow phones full width; landscape/tablet safe areas। Header padding 10×14; main 12; original main bottom 90 + safe inset; panel radius14/padding12; input/button radius10; auth radius18; avatar92। এগুলো base; stylesheet-এর পরবর্তী overrides authoritative।
- Header translucent blur, violet/pink radial ambience, neon currency chips, Gold pulse। Native blur unsupported হলে opaque approximation শুধু approved fallback; default screenshot target নয়।
- Featured card rows ২ করে Legendary/Rare/Common; inventory final `inv-grid-3col` তিন কলাম—পুরনো `.inventory-grid` দুই কলাম blindly ব্যবহার করবে না।
- Cards-এর image framing, rarity pill, overlay gradients, common border, rare pulsing purple, legendary gold/pink/cyan glow, spinning hologram সব রাখতে হবে। Preview/detail image-এর crop source selector অনুযায়ী।
- Profile rank glow, gem badge tiers, themes-এর fire/wave/chakra/smoke/steam/impact/snow effects; feed premium cards; DM/global bubbles; battle duel stage; HP/DEF bars; story scanline/digital UI; boss rage/crit/miss/shield break visuals।
- `reference/inventory.json.keyframes`-এর **প্রতিটি ১০৭টি unique animation নাম** একটি native animation mapping পাবে। Full CSS-এ একই নাম পুনঃসংজ্ঞায়িত হলে effective final definition ও selector context নিতে হবে। Source duration/delay/easing/repeat/direction preserve; Web hover→pressed feedback; pseudo elements→layers।
- Gacha timing: shake1500ms → beam600ms → card reveal। Wheel5200ms quintic ease-out; ৫–৮ full turns + correction; target pointer270°। Battle coin1800ms, duel1200ms, hit900ms, player→AI delay800ms। Story coin2500ms; most hit feedback900ms; Guard→enemy600ms; enemy initiative500ms after intro। ARISE burst choreography exact reference থেকে port।
- Scroll position, keyboard focus, text draft ও input cursor snapshot update-এ হারাবে না। Original full-DOM rerender bug native-এ অনুকরণ নয়।
- Reduced motion alternative accessibility support রাখবে; full effects default parity mode-এ বজায় থাকবে।

---

## 5. Auth, profile, progression ও badges

### Auth
Email/password login; signup optional username (fallback email prefix), password ≥6 Firebase rule; busy guard; switch login/signup; mapped invalid credential/email-in-use/weak password errors। Password reset, Google login, email verification সোর্সে নেই—অতিরিক্ত দাবি করবে না। New user zero XP/Gold/Gems, empty inventory/themes/tracker, default Gojo avatar, epoch last claim। Missing legacy fields backfill করতে হবে।

### Profile
- Name trim/nonempty, Bio case-sensitive persisted field `Bio`। Five DiceBear Adventurer avatars: Gojo/Naruto/Levi/Luffy/Sukuna; fallback bottts(name)।
- Gallery upload accepted image, intended **2 MiB max**। Source-এ অন্য camera-input handler validation bypass করে—একই validated upload pipeline-এ আনতে হবে, বড় media সমর্থন হারিয়ে নয়। Upload preview এবং persistence থাকবে।
- Badge/rank/glow ও equipped theme নিজের/public profile, leaderboard, feed ও chat context-এ source অনুযায়ী দেখাবে। পোস্ট/মেসেজে original author snapshots এবং live lookups আলাদা—সবকিছু current profile দিয়ে rewrite নয়।
- Public inspect: avatar/name/badges/rank/Bio/stats/featured cards/theme এবং source-এর available chat action। অন্যের private fields expose করবে না।

### XP engine (exact)
Input XP nonnegative floored; level starts1; current level-এর threshold consume করে next level। Cap100।
| Current level | XP to advance |
|---|---:|
|1–10|50|
|11–20|80|
|21–60|300|
|61–80|650|
|81–90|850|
|91–99|1000|

Ranks: 1–10 Genin (Beginner); 11–20 Hunter (Active); 21–40 Captain (Legend); 41–60 Captain (Legend OP); 61–80 Master (Legend OP); 81–90 Grandmaster (Boss Stage); 91–100 Demon King (Boss)। Cap-এ remaining/next=0, progress100%; raw XP জমতে থাকে। XP ও Story Power সম্পূর্ণ পৃথক। Level-up snapshot observer থেকে একবার modal, multiple handlers থেকে duplicate নয়।

**সোর্সের ভুল comment সতর্কতা:** XP2840 → level26, level21 নয় (50×10 + 80×10=1300 XP-এ level21)। পুরনো named-admin reset-এর literal2840 বনাম comment আলাদা; সাধারণ login-এ automatic reset port করা যাবে না।

### Gems badges
100 Copper Kunai; 300 Silver Katana; 600 Golden Shuriken; 1000 Diamond Rinnegan; 2000 Mythic Meta Hub। Labels/emoji/glow/badge CSS exact catalog-এ। Current total gems দিয়ে tier; spend/adjust হলে নিচেও নামতে পারে। Next badge progress `round(gems / nextThreshold *100)`—previous-tier-normalized নয়।

### Daily claim
Confirmation → **+20 XP**, rolling24h cooldown from `last_claim_date`, calendar reset নয়। Epoch initial eligible। Backend server clock; failed operation retryable; modal/toast/SFX থাকবে।

---

## 6. Cards, gacha, slots ও recycle

### Card catalog (HP / ATK / DEF)
|id|rarity|HP|ATK|DEF|
|---|---|---:|---:|---:|
|gojo|legendary|850|5500|950|
|sukuna|legendary|770|6000|1100|
|itachi|legendary|800|5800|1000|
|tanjiro|legendary|650|5100|790|
|jinwoo|legendary|900|5800|1050|
|deku|rare|980|2150|1095|
|kaiju8|rare|920|2200|1000|
|denji|rare|600|1540|875|
|subaru|rare|850|1800|900|
|okarun|rare|750|1900|850|
|yojinhoo|common|800|202|100|
|kanao|common|750|190|95|
|yuji|common|820|210|90|
|hinata|common|700|180|110|
|ochako|common|720|185|105|
|kiba|common|780|195|95|

Stats resolution: embedded hp/atk/def if all truthy → catalog lookup → rarity fallback. Fallback legendary1800/600/300, rare1200/400/200, common800/260/140। Normalized owned card stores instanceId/id/name/rarity/image, not independently editable stats; battle/story hydrate catalog। Unknown legacy card fallback source index behavior audit করে deterministic migration করতে হবে।

### Mystery Box
- **500 Gold**, no XP/Gems cost। Base probabilities Legendary8%, Rare22%, Common70%; selected rarity pool uniform। Multiple copies valid, unique `instanceId` mandatory। Inventory newest first।
- `pityRare`: pulls since Rare/Legendary; `pityLegendary`: since Legendary।
- Next Legendary count≥21 → guaranteed Legendary, precedence first। Else next Rare count≥10 → exactly Rare। Else normal roll (`<.08`, `<.30`, else common)। Legendary resets both; Rare resets only rare; Common increments both।
- Transaction spend+append+update pity atomic; low balance, double tap, offline error states। Show rarity result, catalog preview, pity counters/near-threshold styles। No 10-pull feature exists; invent নয়।

### Equip
Six IDs: legendary-1/2, rare-1/2, common-1/2। Equip picker filters matching rarity; persisted slot references owned instance; replace existing; unequip confirm; equipped card stays inventory। Source write function itself rarity/duplicate-slot guard করে না—server validation এবং same-instance multi-slot policy QA decision-এ। Featured slots **Story Power source নয়**।

### Recycle
|Rarity|Gold|XP|
|---|---:|---:|
|Legendary|600|300|
|Rare|300|150|
|Common|100|50|

Confirmation-এ card/reward/irreversible warning; recycled instance remove + matching equipped slots clear + currencies atomic। Same card ID count>1 হলে **duplicate**: card-এর100% raw ATK/HP/DEF স্থায়ী `flatBonus*`-এ যোগ। Nonduplicate flat bonus নেই। Current inventory কমে যাওয়ার effect-ও power calculation-এ পড়বে; retained flat bonus আলাদা। Duplicate check transaction snapshot থেকে করবে। Preview modal-এ image/name/rarity/HP/ATK/DEF, equip/recycle access source অনুযায়ী। Shadow Soldier stats gallery-ও Cards-এ থাকবে।

---

## 7. Wheel, missions, themes ও leaderboard

### Wheel
৮টি সমান segment; uniform1/8; paid spin20 XP, freeSpins থাকলে আগে সেটি consume। Reward fee কাটার **পরে** যোগ, XP floor0।
|Slot|XP delta|Free spin delta|Paid net XP|
|---|---:|---:|---:|
|LOSE|0|0|-20|
|2x XP|40|0|+20|
|10 XP|10|0|-10|
|JACKPOT|100|0|+80|
|BANKRUPT|-20|0|-40|
|50 XP|50|0|+30|
|3x XP|60|0|+40|
|FREE|0|1|-20|

Free spin BANKRUPT still -20 XP, no entry fee। Segment colors/icons/order catalog exact। Animation outcome ও credited outcome একই operation ID-তে bind; repeated rotations drift-free। UI 5s বললেও actual source5200ms।

### Daily missions
|ID / trackKey|Goal|Gold|XP|Gems|
|---|---:|---:|---:|---:|
|m_news / newsRead|5|70|20|5|
|m_posts / postsCreated|2|50|15|5|
|m_social / socialActions|10|50|20|5|
|m_tracker / animeAdded|3|90|30|8|
|m_community / communityActions|3|250|40|10|

Progress capped at goal; claim once/date; ready/claimed/disabled UI, progress bars, total done, ready badge, reset countdown। News successful claim, post create, fresh like/comment, anime add, global-message send, completed quiz progress events। **Actual source** Social=combined10 actions (not necessarily5 likes+5 comments); Community=combined3 global messages/quiz completions (not necessarily1+2)। এই mechanics silently কঠিন করা যাবে না। Date key `UTC ISO YYYY-MM-DD`; countdown source local midnight mismatch decision register-এ।

### Premium themes
Dragon Ball5000; One Piece4000; Naruto3500; Bleach2500; Attack on Titan2000; One Punch Man1000; Vinland Saga1000 **Gold**। Theme catalog gradients/emoji/description/effects exact। Owned/locked/equipped states; purchase confirm; atomic balance/ownership check; equip only owned; same theme tap toggles off; stored `inventory.themes` ও `equippedTheme`। No real-money checkout exists। Effect propagation across profile/public inspect/feed/chat/leaderboard source contexts রাখতে হবে।

### Leaderboard
All-time raw XP descending Top10, not weekly-earned XP। Top3 weekly claim: rank1 Gold500/Gems30/XP50; rank2 300/20/30; rank3 100/10/15। Week starts Sunday local midnight converted ISO date in source। Claim once `weeklyRewardClaimed` per week, own qualifying row button only। Backend rank independently verifies; client `rank` trusted নয়। Medals/top-three styling, rank titles, badges, public inspect। Tie ordering source stable sort on user snapshot order; deterministic tie-breaker approval required।

---

## 8. AI Card Battle Arena — Story থেকে আলাদা engine

### Entry/selection
Owned cards≥3; selected cards≥3 enforced UI and backend; no fixed max3 or max6—source permits selection up to full inventory count। Entry400 Gold, confirmation। No card consumption or permadeath। AI mirrors **selected deck rarity distribution**, independently random card each same-rarity pool; duplicates possible। Coin50/50 first turn।

### Stats/damage
`HP = 2 × sum(selected card HP)`; `DEF=sum(DEF)`; each card attack `round(ATK*.5)`। No Story permanent/flat/shadow bonus in this engine।

```ts
if (def > 0) {
  hp = max(0, hp - round(damage * 2/3));
  def = max(0, def - round(damage * 1/3));
} else hp = max(0, hp - damage);
```

No shield-overflow damage transfer। Each player picks remaining card instance; it moves used pile. AI consumes first card of its generated deck. Duel pairs are visuals, not a separate card-vs-card HP simulation। Alternating turns; depleted AI skips back to player; both decks depleted → higher remaining **absolute HP** wins, tie→player। HP0 immediate loss/win; no draw result। Selection, totals, hand/used state, opponent next-card display, turn indicator, duel overlay, damage float, shield-break, battle log, rules and result screens all required।

### Rewards
Win +800 Gold/+10 Gems/+30 XP; lose +200/+2/+10। Fee deducted separately, so net Gold win+400, lose-200। Claim once battle ID; successful reward→exit/reset selection। Exit during battle source offers no refund/resume; robust cleanup mandatory। Critical combat visuals in styles do not imply unimplemented critical RNG for this engine; Story owns crit/miss RNG।

---

## 9. Solo Leveling Story — full five-chapter system

### Entry/map
Level≥3 **and inventory instances≥3**। All chapters/enemies immediately available after entry; no linear chapter unlock, no forced previous-enemy clear, no story entry fee। Chapter tabs, enemy cards/stats/boss/first-clear labels, power summary, refresh, rules, chapter rank and changing Jin-Woo portrait। Ranks: Ch1 E-Rank; Ch2 D/C-Rank; Ch3 B-Rank; Ch4 A-Rank; Ch5 S-Rank ★ Shadow Monarch।

Jin-Woo image Ch1/2 `IMG_20260325_164742.jpg`; Ch3/4 `IMG_20260326_202630.jpg`; Ch5 `IMG_20260326_202940.jpg`।

### Exact enemies (HP/ATK/DEF)
|Ch|Enemy|HP|ATK|DEF|
|---|---|---:|---:|---:|
|1|Goblin Scout|170|350|310|
|1|Iron Fang Wolf|290|550|450|
|1|Kasaka the Venomous (boss)|8000|15000|4080|
|2|Archer|15000|3200|800|
|2|Baran (boss)|120000|18000|5000|
|3|Demon Soldier|500000|45000|12000|
|3|Igris (boss)|2500000|120000|40000|
|4|High Orc Scout|8500000|350000|150000|
|4|Tusk (boss)|35000000|900000|450000|
|5|Ice Elf Baruka|120000000|2500000|1000000|
|5|Beru (boss)|600000000|8000000|30000000|

### Player power — exact order
For each HP/ATK/DEF:
`max(1, round(sum(ALL inventory card stat) × (1 + permBonusStat/100)) + flatBonusStat)`。
All copies count; equipped-only নয়; account XP/level multiplier নেই। Boss percent bonuses add across clears, percentages apply before flat bonus।

### Fight flow ও mechanics
Coin2500ms → Bengali intro dialogue → fight। Enemy initiative schedules first enemy attack500ms after initial dialogue। Full Bengali boss intro/mid/victory/defeat lines catalog থেকে verbatim; non-boss generic lines too। Tap dialogue advances speaker/portrait/name, pendingVictory/Defeat resolves after last line।

- **Strike:** playerATK1×।
- **Heavy:** round(ATK1.5×), cooldown3। Source cooldown decrements only non-heavy attacking action; Guard returns early and does **not** decrement। Label says turns; this ambiguity must be explicit, no silent change।
- **Guard:** no outgoing attack; next enemy ATK round×.5, flag consumed once।
- Both sides roll: `<.05` miss; `[.05,.15)` crit2×; otherwise regular85%। Heavy multiplier before crit; Guard multiplier before enemy crit।
- With DEF>0: HP loss max(1,round(ATK*.02)), DEF loss max(1,round(ATK*.01)); clamp0; no overflow।
- With DEF=0: HP loss max(1,round(ATK*.05))। Source returns display `dmg` as .02 even here—QA defect to repair explicitly, actual HP formula stays .05।
- Boss HP≤50% triggers mid dialogue once। At HP≤20% and alive, every boss enrages once, ATK becomes round(base1.5×); mid dialogue may occur if not already shown। Not Kasaka-only despite comment।
- Hit shake/damage float/crit/miss/shield break/enrage warning and source-specific SFX। Reliable phase/turn locks needed; no repeat taps while enemy action pending।

### Rewards — first boss clear
|Ch|XP|Gold|Gems|ATK%|HP%|DEF%|Declared title|
|---|---:|---:|---:|---:|---:|---:|---|
|1|100|300|10|5|5|3|Dungeon Conqueror|
|2|20000|10000|25|8|8|5|Demon Slayer|
|3|200000|100000|50|12|12|8|Red Gate Conqueror|
|4|1000000|500000|100|18|18|12|Orc Slayer|
|5|10000000|5000000|500|25|25|20|Shadow Monarch|

- First normal enemy: max(1,round(chapterXP*.05)) XP, max(1,round(chapterGold*.05)) Gold, **0 Gems**, no permanent %।
- Repeat boss: round(chapterXP*.30) XP only। Repeat normal: max(1,round(chapterXP*.05*.30)) XP only। No repeat Gold/Gems/percent bonus।
- Any first boss sets `dungeonConqueror=true`। Declared chapter `reward.title` is not a general persisted title system in existing code; do not replace XP rank with it or claim a full unlocked-title inventory exists।
- Claim explicit; atomic first-clear marker/currencies/bonuses. Failure must not consume claim. Victory/defeat dialogues precede result; defeat no reward।

### Shadow Army + ARISE
- Every defeated story enemy (boss/normal, all chapters) joins unique enemy-ID Shadow Army; **not** random extraction chance। Store original stats/name/image। Existing source adds on victory before reward claim।
- Original storage `shadow_army` device-local; `cleared_<enemyId>` device-local. Safe migration described below; cross-account shared data must not silently leak।
- ARISE button/selection starts Ch2; Ch1 denied with toast। Multi-select any number (no source cap), no selection→toast; show original shadow cards and bonus summary।
- Each chosen shadow contributes **round(original stat*.5) per shadow**, then sum. Add to current/max HP, ATK, current/max DEF; active indicator/bonus fields। No enemy turn consumed by source confirm।
- Play separate ARISE voice clip and kinetic burst, selected shadow portraits/particles, aura/system text. Entire animation port from `triggerAriseBurst`, not replace with generic spinner。
- Source confirm can stack repeatedly and reset omits ARISE flags; do not invent a one-use restriction without decision. Owner-approved rule (D16): one confirmed ARISE application per battle; reset all shadow flags per new fight. Enforce on server, including retries/concurrent requests; UI button state alone is insufficient।

---

## 10. Social feed, media ও XP ledger

### Composer/post rendering
Caption required even with media। Text + optional one image/video + optional link; preview/remove media, show/hide/clear link input। Video nonadmin≤60s; admin no duration limit; media max8 MiB **all users** per create path। Image/video playback, external link opening, author/badge/theme/admin, relative time, edited label, like/reaction/share counts, post menu, expandable comments, edit/save/cancel/delete flows। Feed query newest60; user posts hide at age≥7days; admin posts never auto-hide but still subject to query60 window। Hide is not delete।

Daily max10 posts (admin exempt); `post_activity` date/count. Delete does not refund daily quota. Original limit checked from stale client state only, subscription missing—server must enforce exact10 reliably।

### XP rules (all XP floors0)
|Action|Actor XP|Creator XP|
|---|---:|---:|
|Create post|+15|same actor, once|
|Like another post|+5|+1|
|Unlike|−5|creator keeps received XP|
|Comment|+10|+3 if different user|
|Delete own comment|−10|creator keeps +3|
|Share/copy link|+5|+5 if different user|
|Delete own post|−15|received engagement XP retained|
|Edit post/comment|0|0|
|Emoji-only reaction|0|0|

Source self-like gives no persisted XP (but misleading toast/progress); self-comment **does** give+10; self-share gives+5 once to self, not+10। Re-like and repeated share can repeatedly reward creator: preserve as explicit rule/abuse decision, not silently cap। Social mission progression actual path differs for self-like vs text description—see QA।

Feed reactions: six options 👍 ❤️ 😂 😮 😢 🔥; one reaction per user; selecting same removes via `reactToPost` logic, change removes previous. Source popup same-reaction handler calls `likePost` instead, so reaction/like states can diverge; repair recorded separately. Like (`likedBy`) and emoji (`reactions`) are distinct persisted concepts; do not merge and double-reward by accident।

### Upload architecture
Source stores base64 directly in Firestore; 8MiB feed/2MiB avatar cannot reliably fit Firestore document size. Native must accept same inputs but upload binary to Storage, persist downloadable URL/object metadata. Render **both legacy data URLs and new remote URLs**. Validate MIME/file size/duration backend as well. Upload progress/cancel/retry, permission denial, cleanup orphan upload on failed post. Caption and drafts preserved on snapshot. No new multi-image/carousel feature required.

Share parity is copy URL (`#post-ID`), not necessarily full deep-link opening: source does not implement hash routing to a post. Use configured HTTPS canonical URL; optional functional native deep-link is additive and tested, cannot rely on `location` on device.

---

## 11. Tracker, News, AI Sensei ও Quiz

### Tracker
Manual title input only, no remote anime search/import API. Trim/nonempty, case-insensitive duplicate title rejection. New record `{id:timestamp,title,episode:1}`, prepend. Episode+1 unbounded; remove no reward rollback. Successful add advances animeAdded mission. Preserve existing tracker IDs/data.

### News Hub
Actual source is **Jikan airing anime list**, not news article API:
`GET https://api.jikan.moe/v4/anime?order_by=start_date&sort=desc&limit=15&sfw=true&status=airing`。
Map ID `news-${mal_id}`, title/title_english, JPG large/fallback image, synopsis first180 + `...`, URL, airing date, score/N/A, episodes/?. Loading/empty/failure, external read link and Read+XP action. One active read timer,10 seconds, +10XP, max5 successful claims/UTC date. Close cancels timer. Same ID claim tracked only modal session; reopening resets IDs but daily count remains. Production durable per-article de-dup would change allowed reading behaviour—decision required. Use active foreground elapsed clock to prevent background interval drift; this is lifecycle repair, no shorter duration.

### AI Sensei
Chat UI messages stored session-only; initial greeting preserved. Groq OpenAI-compatible chat completions, model `llama-3.3-70b-versatile`; system asks anime/manga/Japanese culture expertise,4–8 lines. Temperature .8, max_tokens512. **Only current user question** sent, not displayed conversation history. Loading/disabled send, empty guard, API/network/fallback response. Route through own authenticated backend; secret never in mobile bundle, EXPO_PUBLIC env or checked-in reference.

### Quiz
Rules→anime title→generate questions→typed answer/skip→AI feedback→next→result/close. Exactly5 intended questions, schema question/answer/hint; source accepts shorter nonempty array and slices5, a validation defect. Generator temperature .7/max1024; judge .2/max128, lenient spelling, JSON correct/explanation. Original judge network/parse fallback: case-insensitive user text includes first word of correct answer. Preserve/test fallback intentionally, not assume sophisticated local judge. Hint UI/source fields retained where rendered.

Correct +10XP; wrong−10; skip−15 (floor balance0). Apply per-question, not only end. End5/5→10Gems,4/5→5Gems, else0; one communityActions on completion, no quiz entry fee/daily limit in source. Feedback shows correct answer/explanation, summary counts and signed net XP. Closing early keeps already applied XP, no completion gems/mission. Backend-issued quiz ID binds questions/judgments/claim, answer not trusted client-side.

---

## 12. Chat/presence — DM + Global + user search

### User discovery/presence
Search username case-insensitive, exclude self, show avatar/badge/rank/online. `online && now-lastSeenMs<70000` status rule; heartbeat30s. Background/logout attempts offline update; expiry handles crash/no close event. Native AppState reconnect refresh. Recent chat max30 saved peer IDs; remove recent hides reference, not conversation delete.

### Direct chat
Deterministic chat ID `[uidA,uidB].sort().join('_')`; parent participants, updatedAtMs, lastText/lastSenderId, dynamic `unread_<uid>`. Open ensures parent, adds recent, clears own unread. Query source messages createdAtMs ascending limit300 (oldest300, not newest300); pagination repair decision below. Own/other bubbles/time/day presentation, header user profile/status, text send/Enter equivalent, auto-scroll, send pop SFX, delete own message confirmation. No DM reactions/media/typing/read receipt UI in supplied source; do not promise them.

Send message payload snapshots: senderId/Name/Avatar/Gems/Theme/text/createdAtMs/createdAt. Parent last message updated; increment recipient unread atomically, not cached list arithmetic. Active reader clears unread reliably. Inbox descending updatedAtMs limit50 source globally filters participants afterward—native secure query must filter server-side participants. Total unread badge includes visible inbox sums; no OS push-notification system exists in source.

### Global chat
Source ascending createdAtMs limit200; same text composer, avatar/name/admin/glow/theme, profile entry, own delete, timestamps and pop on new incoming deduplicated session. Tap bubble opens single picker, outside closes. Emojis ❤️ 😂 👍 🔥 😞. **Multiple emoji types per user allowed**, toggle each emoji independently, unlike feed single-reaction model. Chips show count/own selected state. Successful send increments communityActions. Global messages no XP by themselves apart from missions.

Listeners unmount/peer switch/logout-এ unsubscribe; remove inbox listener too. Do not let accumulated document click handlers or timers survive screens. No automatic deletion of messages when removing recent chat.

---

## 13. Music ও complete sound behaviour

Three tracks exact catalog URLs: Dark Aria, Kamado Tanjiro, Suzume; toggle, selected track, mode Repeat/Continue (Continue wraps playlist), volume0..1; settings panel close/open. Native audio session handles interruptions/headphones, pause/release and errors. Source resume resets src in some paths; exact restart-versus-resume is acceptance decision, not playback failure.

SFX: global button click, mystery box rising sequence, XP claim chime, accelerating/decelerating wheel ticks + end tones, pop message/box, story sword/electric/digital pulse/hit, independent ARISE voice. Source placeholder SFX data URL is **not** real asset; actual Web Audio oscillator frequency/duration/wave/gain envelopes from reference must be synthesized/bundled for native. ARISE/pop bypass global sfxEnabled in existing functions; consistent mute behaviour is explicit decision. Audio defaults/settings do not imply persistent background-music OS playback entitlement.

External Catbox MP3 and GitHub pop references are not downloaded/validated here. Repo currently has image assets but **no pop.mp3**. Offline/reliable release requires licensed approved local copies/fallback without crashing or blocking gameplay.

---

## 14. Data contracts, Firestore compatibility ও server API

### Existing persisted schema (retain exact field casing)
`user_meta/{uid}`:
- identity: uid,email,username,avatar,**Bio**;
- progression: xp,level,gems,gold,freeSpins;
- collection: inventoryCards[],equippedSlots{},inventory:{themes:[]},equippedTheme;
- gacha: pityRare,pityLegendary;
- tracker[],recentChats[];
- permBonusAtk/Hp/Def,flatBonusAtk/Hp/Def;
- storyRulesShown,dungeonConqueror;
- last_claim_date Timestamp,daily_read_count,last_read_date;
- missionData:{date,progress:{newsRead,postsCreated,socialActions,animeAdded,communityActions},claimed:{m_news,m_posts,m_social,m_tracker,m_community}};
- online,lastSeenMs,weeklyRewardClaimed, legacy `_xpReset2840`, created_at,updated_at.

`post_activity/{uid}`: uid,day_key,count,updated_at.

`feed_posts/{postId}`: uid,username,avatar,gems,equippedTheme,caption; legacy text fallback; mediaUrl/mediaType/linkUrl; likesCount,likedBy:{uid:true},shareCount,comments[],reactions:{emoji:uid[]}; created_at,created_at_ms,updated_at,isAdmin,edited. Comment: id,uid,username,avatar,text,createdAtMs,edited.

`direct_chats/{sortedUidPair}`: chatId,participants[],updatedAtMs,updatedAt,lastText,lastSenderId,unread_<uid>.
`direct_chats/{chatId}/messages/{id}`: sender snapshot + text + createdAtMs/createdAt.
`global_messages/{id}`: same sender snapshot + optional reactions map.

New server-owned records (extension, not claimed existing):
- `user_meta/{uid}/story_clears/{enemyId}` firstClear/claimed reward/version;
- `user_meta/{uid}/shadows/{enemyId}` captured original stats/catalogVersion;
- `game_sessions/{id}` owner/type/ruleVersion/deck/seed/action sequence/status/reward state;
- `reward_operations/{uid_operationId}` idempotency result;
- quiz sessions/read timers/media metadata according to server contract.

### Authoritative command surface
|Command|Server responsibilities|
|---|---|
|claimDaily, claimMission, claimWeekly|clock, eligibility, once-only, authoritative rank/progress|
|pullCard|balance, RNG, rarity/pity, instance ID, atomic purchase|
|equip/unequip, recycle|ownership, slot policy, duplicate snapshot, atomic bonus/rewards|
|buyTheme/equipTheme|price, ownership, toggle|
|startSpin/finishSpin|fee/free reservation, locked outcome, retry same result|
|startBattle/actionBattle/claimBattle|entry/select/deck, authoritative actions/result, once-only reward|
|startStory/actionStory/arise/claimStory|entry, stats, legal turns/RNG/result, first-clear/shadow/reward|
|create/edit/delete post/comment, like/share/react|ownership, limits, all XP ledger updates atomically|
|sendDM/sendGlobal/deleteMessage/reactGlobal|membership, metadata/unread, ownership, mission event|
|startNewsRead/claimRead|10s/session/date quota and selected repeat policy|
|sensei/generateQuiz/judgeQuiz/finishQuiz|auth, provider secret, rate limits, schemas, XP/gems|

Requests include auth token, unique operationId, schema/rule version and payload. Server returns committed result + session version, never trusts proposed reward or winner. Retry same operation ID returns same result. Inactive/offline operations must not locally award spendable currency. Network failure after commit recovers using operation lookup; animations never trigger second charge. Server validates a legal battle action log, not merely client-reported victory. No payout from undocumented RNG seed exposed in advance.

### Security & indexes
Firebase Rules default deny; own editable profile fields whitelist; economy/progress server-only; DM read participant-only; own-message edit/delete policy; feed/comment ownership; global authenticated read/reaction, moderated writes; Storage MIME/size/owner restrictions. Admin identity via immutable UID/custom claim, **not editable username**. Separate public profile projection from private email/account data. SDK admin server credentials only deployed secret management.

Indexes: participants array-contains + updatedAtMs desc DM inbox; feed created_at_ms desc; messages createdAtMs desc for latest pagination (explicit deviation); server leaderboard xp desc; any date/owner compound queries finalized in emulator. Source arrays/comments/reactions risk document growth; v2 subcollections can be introduced behind repository adapter and migration without dropping legacy readers.

### Secrets
Original upload contained a hardcoded **Groq API secret**. Revoke/rotate immediately with provider; do not reuse. Redacted reference contains no actual Groq key. Firebase web API key is configuration rather than equivalent server secret, but reference redacts it too; native platform configs and Rules/App Check/restrictions must be configured securely. No Firebase admin/service-account secret was needed. Do not run imported reference application against live project.

---

## 15. Migration & external dependencies

### Existing account migration
1. Back up Firestore via authorized project tooling before writes; emulator copy/fake data first. Add schemaVersion with reversible adapter; no destructive rename.
2. Preserve Auth UID and original balances/xp/inventory instances/slots/themes/tracker/chat/post IDs.
3. Fill absent fields default0/empty/false, derive level from XP; do not rerun named-admin correction on all logins.
4. Base64 avatars/media render while new uploads move Storage; background migration optional with verified object checksums.
5. Legacy browser localStorage cannot automatically be read by standalone RN app. Offer authenticated **web export/import or web-to-cloud sync** for shadow_army/cleared_*; explicit account binding and one-time import. Custom avatar already in Firestore preferred; local custom_avatar fallback import if needed. Never claim those local records exist in Firestore.
6. Existing device-global clear/shadow data may mix accounts. Import preview/consent; backend validates enemy IDs and eligible mapping; flag unverifiable legacy clears for approved migration policy, never pay every first-clear again by default.
7. Atomic server-owned clears/shadows per UID after migration; reward op ledger prevents multi-device duplicate claims.
8. Dual-reader compatibility, shadow launch and rollback path until parity approval. No production mutation from blueprint tooling.

### Asset audit
Card/story art already in repository, but source references `raw.githubusercontent.com/.../main`; freeze a manifest/hash or bundle exact local art so main changes cannot silently alter cards. Keep filename URL encoding (`%20(1)`) correct. Catalog exact paths preserved.

**Known mismatch:** Ice Elf Baruka source URL names `IMG_20260325_202505.jpg`, repository has `IMG_20260326_202505.jpg`. Do not silently alter canonical reference; choose verified intended image for native manifest after visual approval. pop.mp3 missing locally. DiceBear SVG/Inter/Jikan/Groq/Firebase/Catbox/raw GitHub are external dependencies; this environment’s network allowlist prevented treating them as fully live-tested integrations. Existing repo art presence is not proof of rights to distribute; obtain appropriate rights for app publication, music/voice especially.

---

## 16. Delivery sequence — completeness gates, not reduced MVP

1. **Freeze/reference:** hashes/catalog/inventory; golden screenshots/video of every baseline flow at agreed viewports. Existing deployment or isolated fake-adapter baseline needed; don't execute exposed credentials.
2. **Foundation:** TypeScript/native build, fonts/assets/tokens, overlay registry/navigation, Firebase emulator + contracts/Rules, session lifecycle.
3. **Pure domain parity:** progression, badges, pity, wheel, missions, recycle, AI battle, story, rewards; deterministic fixtures.
4. **Identity/profile:** restore/signup/login/logout, migration/defaults, upload, featured cards, profile inspect, badges/daily.
5. **Collection/economy:** shop/gacha animation/preview/equip/recycle, themes, missions, wheel/leaderboard/weekly.
6. **Combat:** complete AI battle and all5 chapters/11 enemies/full dialogues/ARISE/shadows, once-only rewards.
7. **Social/community:** feed/media/edit/delete/reactions/XP; tracker/news/Sensei/quiz; DM/global/unread/presence.
8. **Audio/visual closure:** all107 keyframes mapped, all SFX/music, responsive/keyboard/safe areas, accessibility.
9. **Validation/release:** QA document all checked, migration rehearsal, emulator permission/abuse tests, physical Android+iOS, background/reconnect/retry, privacy/asset review. Only then call the native app complete.

**Definition of done:** every reference function/data action/visible section/animation is traceably implemented or approved native equivalent; all rule fixtures pass; no unresolved critical data-loss/security bug; all source defects have explicit resolution; zero fake backend feature; all catalog data preserved. Blueprint alone cannot certify future pixel-perfect/native behavioural parity without implementation and device comparison.
