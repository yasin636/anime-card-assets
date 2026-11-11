# Narrative Part2 — v0.7.1 / Android code15

- Living Gate: chapter-colored animated gate/runes/particles, confirmed shield break/enrage pulse and victory stabilization. Reduced effects keeps a static presentation.
- Five boss signatures: Kasaka venom, Baran thunder, Igris oath/sword, Tusk rune circle, Beru eyes; original synthesized short WAV stingers, not copyrighted clips. Entry/enrage presentation is skippable, auto-closes, pauses Story advancement, respects sound/reduced/background/focus. No new damage skill.
- Server Chronicle: strikes/heavy/guard/ARISE, attacks/crits/misses, actual capped HP loss and shield breaks. New battles get complete counters; already running battles explicitly partial from deployment version; older finished battles show unavailable. No bounded-log reconstruction. Version checks and atomic receipts unchanged.
- Monarch Archive includes these actual counters; command choices influence a later intro line without gameplay penalties. Archive remains per-account on this device, NOT cloud sync. Reinstall/data-clear loses reading history, not server balances.

## Deployment
Render autodeploy is off: manually deploy this branch's latest commit to the EXISTING economy service before testing expanded counters. No new key, env variable, Rules, or billing. Old backend remains playable, but app explicitly indicates Chronicle capability absent. Start a NEW battle after deployment for complete counters.

## Phone QA
Update in place. Visit each chapter boss, test skip/back, sound off and reduced effects. Background/return during signature; ensure no extra battle turn/reward. Test strike/heavy/guard, crit/miss, shield break, enrage and ARISE once. End battle and compare Chronicle to actual actions; explicitly claim reward once; reopen Archive. Test both choices and following intro reaction. Test repeat/defeat/forfeit and account isolation. Older battle counters must not appear as invented totals.

CI verifies build/signature/security and automated tests; physical-device QA remains owner acceptance. All eight feature categories have implementations, not a claim of exhaustive animation parity or device acceptance. Gallery, cloud archive and previously deferred GCP cleanup remain deferred.
