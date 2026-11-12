# R1 native audit — initial findings (not fixes yet)

Reviewed App.tsx, EconomyProvider.tsx, CollectionScreens.tsx, ProfileScreen.tsx, FeedScreen.tsx and ThemeAura.tsx at runtime source 6cd5a1d / docs 954085d.

1. EconomyProvider is above AppNavigation and keyed by UID: screen navigation alone does NOT remount this provider. Do not falsely attribute every tab delay to a reconnect.
2. EconomyProvider.check() unconditionally sets allowed=false before GET /v1/economy/status, and foreground AppState triggers check. During this validation actions are disabled. Need distinguish initial authorization, background revalidation and actual revocation; server authorization MUST remain authoritative. No persisted client allowed flag should grant spend.
3. One shared e.result and busy/pending state serves reads and mutations. Feed focus effect resets readKey on blur/background and issues feedView on next focus. Native refresh policy should retain scoped data and avoid redundant foreground/rapid navigation fetches, without losing mutation receipts or showing another UID's content. Cache TTL/invalidation and stale indicators need tests.
4. EconomyStatus prints shared latest result (even feedView on Cards), full UID, connection explanation and permanent Retry panel. Replace ordinary success debug text with contextual state; move details to Diagnostics, retain real pending-retry/error affordances.
5. Render Free backend cold start is a separate hosting limitation; UI caching cannot make a sleeping server execute mutations. No billing/hosting change authorized. Cannot verify production response timings here.
6. Profile has stale migration/development copy, visible email and signout panel, all upload controls expanded, long featured grid. Default screen should emphasize identity and showcase; edit/photo/account actions move into focused sheets. Keep account linking and secure upload workflows.
7. Current ThemeAura paints a global full-screen gradient/effects based on equipped theme. Social surfaces need controlled accent rather than content-obscuring red wash. Preserve equip ownership, reduced-motion and background/focus gating.

Implementation still pending visual approval: native shell, compact Diagnostics/error/pending UX, Profile, Feed composer/comments/reaction picker, feed lifecycle/cache tests, keyboard/accessibility/reduced motion, signing and in-place-update tests. Preview acceptance is not APK acceptance. No claim of measured loading performance improvement yet.
