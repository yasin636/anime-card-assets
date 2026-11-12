# Step 7B — v0.13.0 / Android code 23

Signed internal-test update; install over the existing private-signed app. Do NOT uninstall or clear app data. No Render deploy, Cloudinary permission change or billing activation is needed. Video remains deferred; actual provider cleanup still pending verification.

## Changes
- Original blueprint playlist restored by exact external URLs: Dark Aria (oogzjb.mp3), Kamado Tanjiro (hbnkwu.mp3), Suzume (viowx8.mp3), all on https://files.catbox.moe/.
- Reference streaming is the default, including migrated 7A preferences. Original recordings are NOT bundled. External availability, recording identity and usage permission have not independently been verified. No silent fallback: offline original demos require explicit selection.
- Loading, native error, 30-second timeout, Retry/Restart and background pause. No launch autoplay. Existing audio settings remain account-scoped.
- Account-scoped Settings Reduce Motion; system Reduce Motion wins. Theme loops stop on blur/background. Story and Arena effects/navigation respect the effective setting; static duel results remain dismissible.
- Android keyboard resize, iOS keyboard avoidance, scrollable More/About menus, narrow-screen padding and currency wrapping; accessible form/button labels and state. Avatar fallback resets on changed URI. Nested Sensei keyboard avoidance removed.

## ফোনে পরীক্ষা
1. ZIP extract করে APK-তে চাপো → Update। Uninstall করবে না। About-এ v0.13.0 দেখো; আগের login/profile/photo/balance আছে কি না দেখো।
2. Settings → Music & sound → Source songs selected দেখো। Dark Aria → Play music; তারপর Kamado Tanjiro ও Suzume আলাদা চালাও। Internet লাগবে। প্রথমে Loading দেখা স্বাভাবিক। গানটির পরিচয়ও শুনে নিশ্চিত করো।
3. Internet বন্ধ করে নতুন track চালাও। Error হলে Retry / Restart track চাপো; demo নিজে থেকে বাজা চলবে না। Internet ফিরিয়ে Retry করো। চাইলে আলাদা করে Choose Offline demo চাপতে পারো।
4. Pause, Repeat/Continue, volume ও SFX mute পরীক্ষা করো। App background-এ নিলে থামবে; ফিরে Play না চাপা পর্যন্ত চলবে না। App বন্ধ/খুললেও autoplay নয়।
5. Settings → Accessibility & motion → Reduce Motion ON। Theme loop, Story ও Arena/Wheel পরীক্ষা করো। Result/reward বদলাবে না। Android Settings-এ Remove animations ON করলেও motion কমতে হবে (ফোনভেদে নাম আলাদা)।
6. Profile username/bio, Feed caption/comment/edit, Chat এবং Sensei-তে keyboard খুলে নিচের input/Send/Save-এ পৌঁছাতে পারছ কি না দেখো। More/About খুলে scroll ও Android Back পরীক্ষা করো। ফোন rotate এবং বড় font size-এও পরীক্ষা করো।
7. অন্য account-এ preference মিশছে কি না দেখো; ফিরে পুরোনো account-এর settings আছে কি না দেখো।

Phone layout, TalkBack, native streaming and update acceptance are NOT certified by mocked React tests. Report the screen/song, error text and screenshot if any step fails. No claim that all blueprint visual parity is complete.
