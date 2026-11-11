# v0.7.0 / code14 — Narrative upgrade Part 1

Owner accepted System-window flow in v0.6.1 screenshots, then approved all eight narrative/cinematic ideas. This is the first incremental standalone owner-test APK, not completion of the whole eight-feature scope.

## Included now
- Five hand-written Bengali chapter openings with an ongoing redacted-record mystery. Explicitly labelled fictional System Anomaly, not a real error/security alert. Original game adaptation, not official anime canon.
- Natural authored intro/mid/victory/defeat lines for all11 enemies, plus11 aftermath passages. Mobile presentation replaces source prose slot-for-slot; server dialogue length/index/phase/turn/reward logic unchanged. No Gemini request/key/quota or live-generated dialogue.
- Boss Remembers dialogue reacts to actual saved session state: summoned shadows, at least two Guards in retained recent log, or zero enemy shield. Not lifetime performance inference and does not change damage/difficulty. Old unknown dialogue kinds fall back to server text.
- Two cosmetic Monarch Command choices per chapter entry, distinct authored response and journal record. No stats/reward difference. Full opening on first visit, short entry on repeat/previously visited chapter; replay available. Skip opening can enter the selected free-entry battle; closing/replaying cannot start it. Skipped scene is explicitly recorded as skipped, not falsely fully read.
-11 Shadow Echo memories/aftermaths available only for current server-confirmed owned Shadow IDs. Existing earned Shadows unlock without re-fighting. No locally minted ownership or first-clear marker.
- Monarch Archive v1: local per-account reading journal, visited/skipped scenes, latest cosmetic choices, read Echoes, and recent server-confirmed terminal battle records (outcome, recorded enemy turns, ARISE IDs/count and actual claim receipt). Bounded120 entries/80 visited IDs. No fabricated old history or critical/guard totals not tracked in server sessions. Recap reads latest recorded entry. Device-local journal only, NOT cloud sync or an authoritative reward ledger; UI says uninstall/data-clear removes it. Read errors preserve old archive, save failures visible; never block/alter economy.
- Optional sequential skip for the short in-battle server dialogue. It still sends/reuses authoritative version-locked advance operations; no client phase/winner/reward fabrication. Archive/scenes pause automatic presentation progression; native Back/background/navigation hide modals, with existing pending retry preserved.

## Still pending in the approved scope
New Living Gate event choreography, unique cinematic Signature Boss Moments, full expanded After-Action Chronicle event capture, richer branching consequences across later scenes and server/cloud Archive migration/sync are NOT implemented in this part. Existing v0.6.1 battlefields/boss alert/ARISE visuals remain, not passed off as these newly proposed features being finished. Next APK scope follows owner feedback; whole upgrade not complete yet.

## Install / test
Update over v0.6.1, do not uninstall. Mobile-only; no Render deploy/new Firebase config/Rules/AI key/billing. Existing accepted Step05 backend supplies all authoritative state. Existing balances/cards/progress and once-per-battle ARISE unchanged.

More → Adventure → Chapter scene / replay: read opening and anomaly, close without entering. Open an enemy's free battle entry: read or skip opening, try a choice, confirm chosen response; only Enter/Skip-and-enter starts a fight. During dialogue check new Bengali prose; optional skip should advance same server session. After a win inspect aftermath and normal explicit claim. Open Monarch Archive, read an already-earned Shadow Echo, reopen app to check local journal. Switch accounts: no other owner's journal should appear. No extra paid Arena action needed.

## Verification boundary
Tests cover all11 authored dialogue slot counts vs original server catalog; all5 openings, reaction priority, bounded/validated archive parsing, server-field-only reports, owned-only Echo buttons, replay/cancel without commands, cosmetic choice persistence and original retry/ARISE/System tests. TypeScript locally lacks ignored generated Firebase client config; CI generates it securely and must pass before signed APK handoff. Real React tests mock native/network IO, not phone prose/visual acceptance. No live account mutation/provider call by agent.

Gallery upload, temporary GCP policy/role cleanup and existing deferred work remain open, not silently fixed by this release.
