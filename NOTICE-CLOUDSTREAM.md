# Notice — CloudStream-compatible provider host

This project includes a limited CloudStream-compatible provider host that uses
the CloudStream extension library and references the Yumeiro implementation.

## GPLv3 components

- **CloudStream library** — `com.github.recloudstream.cloudstream:library-android:4.8.0`
  (repository `recloudstream/cloudstream`, tag `v4.8.0`), licensed under the
  **GNU General Public License v3.0**. Source: https://github.com/recloudstream/cloudstream
- **Yumeiro** (reference implementation) — `siamform/yumeiro` @
  `366a5f6ed35a421b917f1c42e20bcd080873cbd1` (v1.8.0), licensed under the
  **GNU General Public License v3.0 or later**. Source: https://github.com/siamform/yumeiro

The CloudStream library is consumed as a declared Gradle dependency (JitPack);
Yumeiro is used as a reference for the host/plugin-loading architecture and is
**not** vendored into this project.

## Licence compatibility

Reusing GPLv3 code in AniGooD requires the **combined work to be GPLv3**
(source availability, copyleft notices). This is a compliance requirement, not
a silent relicensing. The host code in `apps/mobile/plugins/cloudstream-host/`
and `apps/mobile/src/watch/cloudstreamHost.ts` that wraps the CloudStream
library is part of the combined work and is therefore provided under GPLv3.

## Corresponding source / build

- CloudStream library source: https://github.com/recloudstream/cloudstream (tag `v4.8.0`).
- Yumeiro reference source: https://github.com/siamform/yumeiro (revision `366a5f6…`).
- Build: the Expo config plugin
  (`apps/mobile/plugins/cloudstream-host/withCloudStreamHost.ts`) injects the
  JitPack repository and the `library-android:4.8.0` dependency into the
  generated Android project; the native host is
  `apps/mobile/plugins/cloudstream-host/native/CloudStreamHostModule.kt`.
