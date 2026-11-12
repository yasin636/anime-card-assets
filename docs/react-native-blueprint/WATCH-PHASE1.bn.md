# AniGooD Watch — ধাপ ১: playback feasibility

## অবস্থা
শুরু: বিদ্যমান dependency/config audit সম্পন্ন; player implementation ও device verification এখনও বাকি। Accepted baseline v0.18.0/code30 অপরিবর্তিত। আগের Step8 স্থগিত।

## Audit
- Expo 54, React Native 0.81.5, React 19.1.0।
- সরাসরি video-player dependency বর্তমানে নেই; expo-audio 1.1.1 আছে। Transitive Media3 উপস্থিতি দিয়ে video integration সম্পন্ন বলা যাবে না।
- বর্তমান app.config.cjs plugins-এ video/orientation plugin নেই।
- Account/data, package, signing, branding ও gameplay অপরিবর্তিত রাখতে হবে।

## এই ধাপের সীমা
1. SDK-compatible native player বাছাই: track enumeration/selection, external subtitles, fullscreen lifecycle, future offline integration যাচাই করে সিদ্ধান্ত।
2. আলাদা পরীক্ষামূলক screen; পূর্ণ catalog/source market নয়।
3. অনুমোদিত test assets-এ original/multi-audio ও subtitles পরীক্ষা। কোনো sample-কে production content source বলা যাবে না।
4. Play/pause/seek, loading/error/retry, audio/subtitle নির্বাচন, fullscreen/rotation, screen exit cleanup।
5. অনুমোদিত production source-এর availability/terms/download permission আলাদা নথিভুক্ত করা। বর্তমানে কোনো production content provider নিশ্চিত নয়।

## Acceptance gates
- Typecheck, automated player-state/security tests ও existing regressions।
- Signed update APK; device-এ actual playback এবং track change যাচাই।
- Back/fullscreen/background-return-এ app আটকে যাবে না; audio leak নয়।
- Broken/expired URL ও unavailable track-এ honest error; fake availability নয়।
- Sample playback PASS production catalog coverage প্রমাণ নয়।

## নিষেধ/সীমা
- Billing activation নয়; paid service নয়।
- Private content API spoofing বা DRM bypass নয়।
- Arbitrary plugin code মূল Hermes runtime-এ নয়।
- Remote media থেকে sensitive headers/credentials অন্য origin-এ forward নয়।
- Reward economy/Watch Party/পুরোনো UI পুনর্লিখন এই ধাপের অংশ নয়।
- Static/automated checks-কে phone playback PASS বলা যাবে না।

## Implemented checkpoint — v0.19.0/code31
- expo-video ~3.0.16 native player; only actual embedded/discovered track selectors।
- More → Watch; native controls ও landscape fullscreen; background pause, navigation unload, entering Watch pauses music।
- Original generated 12s MP4 fixture (two AAC tones + English tx3g) bundled for offline acceptance।
- HTTPS media input without app credentials or persisted links; honest error/reload; no implicit autoplay/fallback।
- External SRT/ASS import, PiP/downloads/party পরের ধাপের কাজ। Production source approval এখনও unresolved, sample দিয়ে সেটি পূরণ হয়েছে বলা যাবে না।
- Local 140 tool/mobile tests + 92 backend tests PASS; foundation PASS। Local typecheck only missing CI-generated Firebase client; final generated-config TS/native build status GitHub CI-এ যাচাই করতে হবে।
- Phone playback acceptance pending; apps/mobile/ANIGOOD-WATCH1-TEST.md অনুসরণ করুন।
