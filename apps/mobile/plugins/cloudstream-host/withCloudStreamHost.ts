/**
 * Expo config plugin: injects a limited CloudStream-compatible provider host
 * into the generated Android project.
 *
 * - Adds the JitPack repository (CloudStream library-android is published there).
 * - Adds `com.github.recloudstream.cloudstream:library-android:4.8.0` dependency.
 * - Writes the native Kotlin host + RN bridge module into app source.
 * - Registers the native module package in MainApplication.
 *
 * This is a LIMITED host: it loads provider(s) explicitly provided to it; there
 * is no marketplace, no arbitrary repo install, no auto-update, no DNS-block
 * bypass. Plugin code runs in-process (PathClassLoader); the bridge exposes only
 * a bounded data interface and never passes host accounts/secrets to plugin code
 * (interface-bounded isolation, not a security sandbox).
 *
 * Licence: CloudStream library is GPLv3. This plugin reuses the library via a
 * declared dependency; GPL notices are preserved (see docs/react-native-blueprint).
 */
import { withDangerousMod, withAppBuildGradle, withSettingsGradle, withMainApplication } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const CLOUDSTREAM_GROUP = 'com.github.recloudstream.cloudstream';
const CLOUDSTREAM_ARTIFACT = 'library-android';
const CLOUDSTREAM_VERSION = '4.8.0';
const CLOUDSTREAM_DEP = `${CLOUDSTREAM_GROUP}:${CLOUDSTREAM_ARTIFACT}:${CLOUDSTREAM_VERSION}`;
const JITPACK_URL = 'https://jitpack.io';
const HOST_PACKAGE = 'com.yasin636.cloudstream';
const HOST_MODULE = 'CloudStreamHostModule';
const HOST_PACKAGE_CLASS = 'CloudStreamHostPackage';

/** Native Kotlin sources written into the Android project. */
const NATIVE_FILES: Array<{ rel: string; contents: string }> = [
  {
    rel: `app/src/main/java/${HOST_PACKAGE}/CloudStreamHostModule.kt`,
    contents: fs.readFileSync(
      path.join(__dirname, 'native', 'CloudStreamHostModule.kt'),
      'utf8',
    ),
  },
  {
    rel: `app/src/main/java/${HOST_PACKAGE}/CloudStreamHostPackage.kt`,
    contents: fs.readFileSync(
      path.join(__dirname, 'native', 'CloudStreamHostPackage.kt'),
      'utf8',
    ),
  },
];

/** Write native Kotlin sources into the generated android project. */
function withCloudStreamHostSources(config: any) {
  return withDangerousMod(config, [
    'android',
    async ({ projectRoot }) => {
      for (const file of NATIVE_FILES) {
        const dest = path.join(projectRoot, file.rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, file.contents, 'utf8');
      }
    },
  ]);
}

/** Add JitPack repository to settings.gradle.kts (idempotent). */
function withCloudStreamRepo(config: any) {
  return withSettingsGradle(config, ({ mod }) => {
    mod((gradle: string) => {
      if (gradle.includes(JITPACK_URL)) return gradle;
      const block = `\nmaven { url = uri("${JITPACK_URL}")\n  content {\n    includeGroup("${CLOUDSTREAM_GROUP}")\n  }\n}\n`;
      return gradle.replace(/(dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{)/, (_m, p1: string) => `${p1}${block}`);
    });
    return config;
  });
}

/** Add CloudStream library dependency to app/build.gradle.kts (idempotent). */
function withCloudStreamDependency(config: any) {
  return withAppBuildGradle(config, ({ mod }) => {
    mod((gradle: string) => {
      if (gradle.includes(CLOUDSTREAM_DEP)) return gradle;
      const block = `\ndependencies {\n    implementation("${CLOUDSTREAM_DEP}")\n}\n`;
      return `${gradle.trimEnd()}\n${block}`;
    });
    return config;
  });
}

/** Register the native module package in MainApplication.kt (idempotent). */
function withCloudStreamPackage(config: any) {
  return withMainApplication(config, ({ mod }) => {
    mod((app: string) => {
      const pkg = `new ${HOST_PACKAGE}.${HOST_PACKAGE_CLASS}()`;
      if (app.includes(pkg)) return app;
      // Register the package right after getPackages() opening in MainApplication.
      return app.replace(/getPackages\(\)\s*\{/, (m: string) => `${m}\n      ${pkg},`);
    });
    return config;
  });
}

export function withCloudStreamHost(config: any) {
  config = withCloudStreamHostSources(config);
  config = withCloudStreamRepo(config);
  config = withCloudStreamDependency(config);
  config = withCloudStreamPackage(config);
  return config;
}
