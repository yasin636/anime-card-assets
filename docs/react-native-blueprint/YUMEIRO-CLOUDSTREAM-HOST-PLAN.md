# AniGooD limited CloudStream-compatible provider host — investigation + plan

Reference: `siamform/yumeiro` @ `366a5f6ed35a421b917f1c42e20bcd080873cbd1` (v1.8.0).
Goal: limited CloudStream-compatible provider support behind AniGooD's own
UI/search/details/player (no WebView, no external app launch). MovieBox is NOT
mandatory. First milestone = one specific, reviewed provider with clearly
authorized/open-licensed content.

## 1. Licence (verified)

| Artifact | Licence | Evidence |
|---|---|---|
| Yumeiro (`siamform/yumeiro`) | **GPLv3-or-later** | `LICENSE` = GNU GPL v3; `TRADEMARKS.md` states "free software under the GNU GPL v3"; file headers "Licensed under the GNU General Public License v3.0 or later" |
| CloudStream library (`recloudstream/cloudstream`) | **GPLv3** | `LICENSE` = GNU GPL v3 (tag `v4.8.0`) |
| AniGooD | **undeclared** | No `LICENSE` file; no `license` field in `apps/mobile/package.json` (default all-rights-reserved) |

**Compatibility determination:** Reusing GPLv3 code (CloudStream library, Yumeiro
reference) in AniGooD requires the **combined work to be GPLv3** (source
availability, copyleft notices). This is a **compliance requirement**, not a
licence *conflict* (GPLv3 is compatible with itself; no incompatible licence is
involved). It is NOT silently resolved: AniGooD must adopt GPLv3 for the combined
work (or the owner decides otherwise) before redistribution. All GPL notices and
corresponding source/build instructions are preserved in this repo.

## 2. Dependency verification (independently resolved)

Declared: `com.github.recloudstream.cloudstream:library-android:4.8.0`
(published on **JitPack**, `settings.gradle.kts` includes `maven("https://jitpack.io")`
with content filtering for `com.github.recloudstream.cloudstream`).

Verified independently (GitHub source, not blindly copied):
- Repo `recloudstream/cloudstream`, tag **`v4.8.0`** exists (commit `3796406e…`).
- Module structure at `v4.8.0`: `app`, **`library`**, `docs`; `settings.gradle.kts`
  includes `:app, :library, :docs`. The **`library`** module publishes the
  `library-android` artifact on JitPack.
- LICENSE = GPLv3 (above).
- Transitive deps (also on JitPack/MavenCentral): NiceHttp (`com.github.Blatzar`),
  NewPipeExtractor (`com.github.TeamNewPipe`), plus OkHttp/Jackson/kotlinx-coroutines
  from MavenCentral.

**Sandbox note:** this sandbox's outbound allowlist does **not** include
`jitpack.io`, so the artifact cannot be downloaded here. This is **not** proof the
build fails on the phone/CI — GitHub Actions runners reach JitPack/MavenCentral.
Build feasibility is determined by an actual CI build, not by sandbox reachability.

## 3. Architecture (native bridge per existing Expo/RN architecture)

AniGooD is an **Expo managed-workflow** app (no committed `android/` folder; the
APK workflow runs `npx expo prebuild` → `./gradlew :app:assembleRelease`).
The CloudStream host is a **native Android module** fed into the existing
data-only watch boundary (`sourceIntegration.ts` `IntegratedStream`).

Pipeline (opt-in Test Lab only):
```
Test Lab UI (JS) ──► RN bridge ──► Native CloudStream host (Kotlin)
                                              │ loads one bundled .cs3 provider
                                              │ MainAPI.search/load/loadLinks
                                              ▼
                                    IntegratedStream (url, subtitles, format, metadata)
                                              │
                                              ▼
                          AniGooD UI / search / details / player (existing)
```

- **Config plugin** (`with[com.lagradost.cloudstream3]`): injects JitPack repo +
  `library-android:4.8.0` dependency into the generated `android/` during prebuild.
- **Native module** (Kotlin): loads the bundled `.cs3` via PathClassLoader →
  `manifest.json` → `pluginClassName` → `load(context)` → reads `APIHolder.allProviders`.
  Exposes bounded calls: `listProviders`, `search`, `load`, `loadLinks`.
- **JS bridge** (`cloudstreamHost.ts`): typed wrapper; maps results to
  `IntegratedStream`; distinct errors (timeout / load-error / http / zero-links /
  player-error).
- **Test Lab UI**: opt-in screen calling the bridge; diagnostic export with
  token/cookie/signed-URL redaction.

## 4. Isolation design (honest — not a security sandbox)

PathClassLoader + try/catch + coroutine timeout + same-UID process is **NOT** a
security sandbox (owner constraint). The host provides a **bounded data interface**:
the native bridge passes only bounded queries/results; **no AniGooD
account/secret/credential is ever passed to plugin code**. This is
**interface-bounded isolation**, not process isolation. It is NOT claimed as a
"security sandbox" or "isolated process". Plugin code runs in-process; the only
guarantee is that the bridge does not expose host secrets to it. If the owner
requires stronger isolation, that is a separate architecture decision.

## 5. First-milestone provider

One specific, reviewed provider bundled with the host — **not** a marketplace,
**not** arbitrary repo install, **not** auto-update. Prefer clearly
authorized/open-licensed content. MovieBox is not required for this milestone.
Internet Archive uploads are **not** assumed all public-domain; any IA-backed
provider must be checked per-item. Provider selection and per-item licence
verification are recorded in the milestone checkpoint.

## 6. What stays intact

TMDB/Kitsu, BYOS, player, accounts, history, subtitles, accepted downloads.
HLS/DASH streaming support is **not** claimed as downloader support. No
uninstall/reset. Existing package (`com.yasin636.animemetahub`) + signing
certificate preserved; versionCode bumped from current baseline (40). No new
signing key. No secrets fabricated; no paid service/deployment.

## 7. Status

- Investigation complete (licence, dependency, architecture, isolation, build
  feasibility approach).
- Implementation: config plugin + native module + JS bridge + Test Lab UI + tests.
- Build verification: CI build attempt (sandbox cannot reach JitPack; CI can).
- No mock/inert build presented as integration; no advance playback proof
  requested.
