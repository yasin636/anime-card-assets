# Step04 v0.5.0 / code8 — FIRST ARENA TEST APK, not final acceptance

Authorized next increment: Wheel, AI Card Battle, Anime Quiz, Leaderboard/Weekly. Existing Step03 v0.4.0 owner acceptance retained. No balances/cards reset, no client rewards, no global access widening, no new paid service provisioning. Update privately signed APK in place, no uninstall.

## Required manual backend deployment

Render service → Manual Deploy → Deploy latest commit. Existing Secret File/GOOGLE_APPLICATION_CREDENTIALS unchanged. Keep ECONOMY_ENABLED=false and existing ECONOMY_TEST_UIDS. No Firebase Rules change needed: arena sessions/receipts are already client-denied; API uses Admin SDK. AutoDeploy remains off. Agent cannot perform deployment without Render access and has not mutated live accounts.

Arena → auto connection → Refresh / Resume Arena if needed. Old backend returns invalid-command and no arena reward is applied. Stage04 node operations use existing persisted-before-send perUID operation queue/receipts and revocation-checked identity/owner server gate.42 backend domain/HTTP groups include6 arena rules groups; new actual emulator groups test receipt/concurrency, battle fee/reward/resume/forfeit, rank query/once-per-week, provider-mocked quiz rewards/private questions.

## Features and owner QA (all spending explicit)

- Wheel: uniform server8segments, paid20XP, consume free first, source8rewards, floor0,5200ms result-bound wheel animation. A real spin can lose XP. Confirm once; retry only same pending operation. Closing while animation runs does not undo already saved result.
- Battle: select>=3 unique owned instances, no fixed3 maximum; prepare legacy identity from Cards only if necessary (do not auto-migrate).400Gold confirmed start, same rarity distribution AI,50/50first, snapshot stats HP2sum/DEFsum/ATK*.5, shield split/no overflow, each card once, absoluteHP/tieplayer. Server persists active state; refresh/reopen resumes. Win800Gold/10Gems/30XP or lose200/2/10 once, entry separate. Forfeit: no refund/reward; card inventory unchanged. Battle UI first increment has hand/used state/AI next/log/HP/DEF/results, not full source SFX/duel-motion polish; that remains phone-feedback iteration, not silently marked full parity.
- Leaderboard: server-read rawXP Top10, limited public projection (never email/gold/receipts/tokens), inspect limited profile, weekly rank verified transactionally, source Top3 rewards once/week.
- EXPLICIT initial timezone/tie policy: owner-release week Sunday00:00 Asia/Dhaka (UTC+06), ties Firestore document-name default ordering (XP desc implies document-name desc). Blueprint original had device-local week and unspecified tie order. This is a provisional deterministic policy shown in UI, NOT evidence of explicit owner approval of the ambiguity. Confirm with owner before final Stage04 acceptance/public rollout. Public profile currently limited name/Bio/avatar/XP/theme, not full social inspection.

## Quiz security dependency — NOT yet configured live

Never reuse/upload the phone's saved Settings/Sensei key. A reward judge controlled by a modified phone cannot be trusted. Quiz generation/judgment therefore run only on backend, private session answers never included in status; exactly5 validated questions, short-answer judge, source first-answer-word fallback on judge errors, correct+10/wrong−10/skip−15floor0 per question,5correct10Gems/4correct5Gems once, completion community progress UTC. Indexed commands reject stale/repeated answers; early close preserves XP/no completion rewards. Private session state resumes.

To enable quiz, owner MAY separately put QUIZ_GEMINI_API_KEY in Render Environment (not chat/Git/APK). It is a server-trusted provider key, uses fixed gemini-2.5-flash v1beta; model/API quota/availability not independently verified. Do not request its contents. This may consume provider quota/cost according to that account; no free/billing guarantee, paid billing not authorized. With no server key, quiz visibly disabled, no fake questions or rewards. Emulator mocks generation/judge only; no real Google call executed by agent. Phone Settings/Sensei exact7 behavior stays unchanged.

## Acceptance boundaries

This is Step04 start/test APK, NOT Step04 complete. Owner must QA actual wheel/battle/rank flows and review timezone/tie/public-profile limits; server quiz setup + live generation/judgment remain pending. Feed/DM/Adventure and full cross-feature missions not implemented in this increment. Existing Gallery deferred and GCP key-policy/temporary-role cleanup outstanding. Do not globally enable economy or erase legacy data to make tests pass.
