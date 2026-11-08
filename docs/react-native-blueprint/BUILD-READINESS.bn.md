# APK build readiness audit

যাচাইয়ের তারিখ: 2026-11-08 (UTC)। এই audit-এ app scaffold, APK build, workflow dispatch, push, production API call বা account modification করা হয়নি।

## সরাসরি যাচাইকৃত ফল

| বিষয় | ফল |
|---|---|
| Node.js / npm / npx | আছে: Node22.22.3, npm10.9.8 |
| npm registry | `npm ping` সফল |
| Git/GitHub CLI | আছে; GitHub authentication কাজ করছে |
| Repository access | public repository; API-reported pull/push/admin permissions আছে |
| Existing workflows | `gh workflow list` কোনো workflow দেখায়নি |
| Actions policy/settings read | বর্তমান integration token দিয়ে HTTP403; enabled/disabled নিশ্চিত নয় |
| Actions secret names read | HTTP403; secrets আছে/নেই নির্ধারণ করা যায়নি, secret value চাওয়া হয়নি |
| Java/JDK/javac | PATH-এ পাওয়া যায়নি; standard JDK location-এ পাওয়া যায়নি |
| Gradle / wrapper | executable নেই; repo-তে wrapper নেই |
| Android SDK/adb/sdkmanager/emulator | executable নেই; ANDROID_HOME/ANDROID_SDK_ROOT unset; standard user SDK directory নেই |
| Local resources | audit সময়ে প্রায়20GiB disk available,3.8GiB total RAM, no swap |
| Native project/config | package.json, app config, eas.json, Android Gradle project নেই |
| Native Firebase configs/signing keystore | scanned repository depth-এ নেই |
| EAS CLI | PATH-এ নেই; Expo account/auth/build quota যাচাই করা হয়নি |
| macOS/Xcode | এটি Linux পরিবেশ; local iOS build পথ নেই |
| Blueprint baseline checks |61টি offline check pass; native app test নয় |

## Network constraint

এই sandbox-এর outbound allowlist: github.com, codeload.github.com, api.github.com, registry.npmjs.org, pypi.org, files.pythonhosted.org। Android/Google Maven/Gradle distribution/Expo build service hosts এই তালিকায় নেই। তাই শুধু JDK install করলেই এখানে full Android dependency resolution হবে এমন নিশ্চয়তা নেই। Restricted hosts-এ network probe চালিয়ে allowlist bypass করার চেষ্টা করা হয়নি।

## প্রস্তাবিত প্রধান পথ: GitHub Actions → standalone test APK

1. `apps/mobile`-এ Expo/React Native TypeScript project, pinned compatible dependencies/lockfile এবং Android applicationId নির্ধারণ।
2. Workflow-এ compatible Node/JDK/Android SDK দিয়ে Expo prebuild ও Gradle standalone test APK build। শুধু Metro-server-dependent debug APK user testing-এর জন্য যথেষ্ট নয়; JS/assets bundled থাকতে হবে।
3. Stable dedicated test signing key, repository secret-এ সংরক্ষণ; key source control/chat-এ নয়। একই package+signing key বজায় রেখে versionCode increment করলে আগের install update করে data রাখা সম্ভব। Test signing production signing নয়।
4. GitHub runner-এ dependency access/quota/policy যাচাই; native build সফল হলে installable APK artifact ও checksum, changelog/test checklist। Artifact সাধারণত GitHub login চাইতে পারে এবং retention আছে; প্রয়োজন হলে user-approved GitHub Release download link। APK Git-এ commit নয়।
5. User phone feedback → fixes → same-step APK → explicit approval → next step। Failed build-কে APK ready বলা যাবে না।

**অমীমাংসিত access:** Actions settings/secrets API403 হলেও repository access কাজ করছে। Actions execution/workflow dispatch permission এই audit প্রমাণ করেনি। Workflow YAML লিখতে পারা মানে runner চালানোর অনুমতি থাকা নয়। User GitHub settings-এ Actions enabled/policies/usage দেখতে পারেন; প্রয়োজন হলে Arena GitHub app permissions-এ workflow/Actions access দিতে হবে। Actual workflow push/dispatch ও successful run ছাড়া APK delivery path verified নয়।

## বিকল্প

- **Expo EAS cloud:** installable internal-distribution Android APK সম্ভব; Expo account, authenticated build access, project linking, signing এবং quota প্রয়োজন। Expo service sandbox allowlist-এর বাইরে; authorized external/local machine বা suitable CI runner থেকে চালাতে হতে পারে। EAS CLI npm-এ পাওয়া যাওয়া মানেই cloud connectivity নয়।
- **User computer Android Studio/JDK/SDK:** Windows/macOS/Linux-এ Android build সম্ভব; workflow blocked হলে documented local build fallback। কম্পিউটার OS/setup এখনো জানা নেই।
- **iOS later:** APK শুধু Android-এর জন্য। iOS device distribution আলাদা signed build/TestFlight/ad-hoc পথ এবং প্রাসঙ্গিক Apple account/device registration/provisioning লাগবে; Android APK-এর মতো iPhone-এ install নয়।

## প্রথম Navigation APK-এর আগে প্রয়োজনীয় সিদ্ধান্ত/প্রস্তুতি

- App display name ও স্থায়ী Android applicationId (প্রস্তাব আলোচনা করা যাবে, এখনো set নয়)।
- GitHub Actions enabled/runner usage ও integration execution permissions অথবা বিকল্প build machine।
- Stable test signing setup; নিরাপদ key persistence।
- Expo/RN compatible version pinning, Android minimum OS/ABI নির্ধারণ; user phone Android version/model জানা ভালো।
- প্রথম ধাপে Firebase/Groq login/config প্রয়োজন নেই: offline navigation/sample balances স্পষ্টভাবে labelled। দ্বিতীয় ধাপে authorized native Firebase platform registration/config/Rules; AI integration-এর আগে exposed Groq key revoke/rotate ও backend secret setup।

**ফল:** source/UI development শুরু করার tools আছে। এই sandbox-এ এখন সরাসরি APK build-ready environment নেই। GitHub Actions সবচেয়ে যুক্তিযুক্ত প্রার্থী, কিন্তু বর্তমান permissions এবং প্রথম successful build দিয়ে delivery pathway নিশ্চিত করা বাকি।

## Follow-up: GitHub runner check succeeded

- Branch `arena/cd835a4c-anime-card-assets` pushed successfully, commit `f838e8e`.
- Workflow dispatch accepted using the current GitHub integration; the earlier settings/secrets-list403 does **not** prevent this workflow execution.
- Successful run: https://github.com/yasin636/anime-card-assets/actions/runs/42472463706
- API-confirmed successful steps: Node setup, Java setup, Android SDK/tools inspection, dependency endpoint checks, summary and diagnostic artifact upload.
- The earlier push-triggered run42472457909 was cancelled by the newer manually dispatched run due to the workflow concurrency setting; this was not an Android tool failure.
- Full log download from the Actions results host was blocked by sandbox network access (EOF). Run/job/step conclusions were independently read from the GitHub API; exact installed SDK versions are not asserted here.
- Result: runner access and readiness checks verified. An actual React Native compilation, stable test-signing setup, APK artifact creation and device installation are still unverified and are the next gates. No APK was produced by this workflow.
