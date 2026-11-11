# Story animation hotfix v0.7.2 / code16

Owner reported process exit on boss entry (resume battle works on relaunch) and missing ARISE presentation in v0.7.1. No device logcat available: exact physical-device root cause remains unconfirmed.

## Fixes
- Boss signature audio now holds one stable native player (null hook source), replacing its track explicitly. Previously the hook's changing source released the old shared object during render, then our effect cleanup invoked pause on that released object. Cosmetic audio errors (sync native calls, async seek/play) are contained; no battle operation depends on sound.
- ARISE picker and cinematic now share ONE native modal: no simultaneous picker dismiss/second-modal show. Normal effects retain the full 3.2s cinematic. Reduced effects now show a static 2.2s confirmation rather than silently omit ARISE. Background/focus hides and cancels the presentation timer; return restarts it. Tap/Back dismisses presentation only, never repeats the server operation.
- Boss visuals, five distinct sounds, Living Gate, Chronicle and all economy features retained. No stats/RNG/rewards changes. No backend/Rules/key/config changes for this hotfix. If Part2 backend was already deployed, do not redeploy just for this update.

## Verification
Regression tests simulate shared-object release ordering and all five source transitions, including cleanup after release. Integration tests assert ARISE response is visible in exactly one modal for both normal/reduced settings and blocks battle input until dismissed. Native mocked tests are not physical-device crash verification.

## Phone check
Update in place, do not uninstall. Try boss entry, signature skip/Back and next battle turn. Try ARISE on a NEW chapter2+ battle (once-per-battle rule unchanged), selecting an owned Shadow: full animation with Reduced OFF, static card with Reduced ON. Background/return and sound-off should not crash or double-apply stats. If process still exits, capture Android crash log before asserting the remaining cause.
