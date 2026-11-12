# R1 Native Redesign — v0.14.0 / Android code 24

Signed in-place update over the private-signed app. Do NOT uninstall/clear data. R1 only: shell, Profile, Feed, media layout and connection UX; not R2/R3/Step8. No paid service/billing, Render deployment or Cloudinary permission change required. Video remains deferred; actual media cleanup provider deletion remains unverified.

## Implemented
- Edition02-inspired native obsidian/lilac/lime shell and vector navigation. Debug step/version footer removed from ordinary screens; balances available in header wallet. Profile/Feed are not covered by the global red aura; equipped theme ownership persists and its tag remains on profile. Other screens retain their functionality and await R2/R3 polish.
- Real account identity/avatar/Bio/rank/level progress, balances, equipped-card horizontal showcase and combat details. No fake three-card collection, handles, member-since date or verified badge. Private email/account linking/logout and photo controls moved into focused sheets. Profile hero uses existing bundled artwork (not a paid/custom cover feature).
- Feed is virtualized (initial 5, batch 5, window7). Compact composer entry -> post sheet; account-scoped caption/link draft and secure upload/pending recovery preserved. Native Like hold opens reactions; accessible alternative via post menu. Comments in a sheet, owner Edit/Delete in menu. News and Missions are compact links, existing claims remain available in Tracker/Missions.
- Ordinary images use measured full width/aspect. Very tall images get bounded crop + explicit full-image affordance. Viewer displays whole image with zoom/reset and scrolling; no silent stretching. Android zoom uses explicit control; iOS supports ScrollView pinch additionally. Actual screen controls must be phone-tested.
- Normal screens no longer show permanent backend/UID/latest-command debug panel. Settings -> Connection diagnostics retains detail/recheck. Actual connection failure, pending retry and errors stay visible. Feed session cache (memory, UID-scoped,60s) reuses server-confirmed data on quick tab return and keeps old posts during refresh; explicit Refresh bypasses cache. Cache is not offline spending authority.
- Existing authorization preserved during read-only revalidation, but server 401/403 or denied status revokes availability. Foreground recheck throttled60s. Initial cold start still requires server; Render Free sleep is NOT solved or billed away. Every mutation still persists operation ID before sending and is server-authorized.

## Phone acceptance (বাংলা)
1. ZIP extract → APK → Update; Uninstall নয়। Profile-এর নাম/Bio/photo, balance, owned/equipped cards ঠিক আছে কি না দেখো। Header wallet চাপলে তিনটি balance আসবে।
2. Profile avatar/+ → preset/photo; pencil → name/Bio edit → Save। Account & privacy-তে email/link/logout আছে। Showcase swipe ও card tap, Combat power পরীক্ষা করো।
3. Feed → Create entry → caption লিখে Publish। App ফিরিয়ে draft আছে কি না দেখো। Photo সহ আলাদা post করো; সফল post-এর পরে নতুন composer-এ আগের attachment আটকে থাকে কি না দেখো।
4. Square, landscape ও দীর্ঘ screenshot post করো। পাশে অকারণ pillar থাকবে না; লম্বা ছবিতে পুরো ছবি দেখো → zoom/reset ও scroll। Android Back viewer বন্ধ করবে। ছবি unavailable হলে app crash নয়।
5. Like tap বনাম hold, menu -> Choose reaction; Comment -> Send; নিজের post/comment edit/delete ও confirmation পরীক্ষা করো। Share clipboard copy সফল হওয়ার পরেই আগের নিয়মে reward command যায়।
6. News/Missions links দিয়ে আগের feature ও claim আছে কি না দেখো। Feed/Profile/Shop ঘুরে Feed-এ ফেরো—দ্রুত return-এ অকারণে fresh read নয়; Refresh দিলে নতুন data আসে।
7. Internet off করে error/pending Retry দেখো। ফল অনিশ্চিত হলে একই pending Retry, নতুন purchase নয়। Initial app launch/free server wake এখনও সময় নিতে পারে।
8. App background/foreground, বড় font, keyboard, TalkBack এবং Settings Reduce Motion পরীক্ষা করো। দ্বিতীয় account-এ আগের account-এর Feed/private data না আসা জরুরি।
9. Arena/Shop/Cards/Chat/Story আগের action চলে কি না দেখো; এগুলোর redesign R2/R3-এ।

Evidence: 109 tool/native tests +87 backend tests locally; foundation passes. Local TS needs ignored generated Firebase client (CI generates it). Mocked React tests are not physical-device certification. Signed CI status/artifact recorded separately after completion. No performance benchmark or production latency claim.

## R1 owner-feedback patch — 0.14.1 / code 25
- Feed composer remains mounted during gallery AppState background transitions. PhotoUploader already guards gallery selection from background abort; previously the parent unmounted it anyway, invoking cleanup. Secure prepare/upload/finalize/retry logic unchanged.
- Reactions are an anchored floating pill above Like. Like/Comment group left; Share uses flexible left margin.
- Comments emphasize author and text, with Copy and owner Edit/Delete in contextual options. Existing server ownership and deletion XP confirmation preserved. Sending stays in a non-scrolling footer; full-modal KeyboardAvoidingView uses Android height avoidance.
- Automated regression coverage: composer/uploader instance survives background→active and submits verified mediaId; contextual comments and Android avoidance; existing distinct Like/reaction commands.
- Required phone acceptance: gallery photo in Feed (including cancel/retry), long-press reaction placement, multiline typing with keyboard, comment options/deletion confirmation. Mock rendering cannot certify native keyboard geometry.
