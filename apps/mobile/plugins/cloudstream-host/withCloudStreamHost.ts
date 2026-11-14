/**
 * Expo config plugin: injects a limited CloudStream-compatible provider host
 * into the generated Android project.
 *
 * Uses `withDangerousMod` for all file operations (predictable, no dependence
 * on the versioned `mod` helper API):
 *  - Adds the JitPack repository to settings.gradle.kts (CloudStream
 *    library-android is published there).
 *  - Adds `com.github.recloudstream.cloudstream:library-android:4.8.0` to
 *    app/build.gradle.kts.
 *  - Writes the native Kotlin host + RN bridge module into app source.
 *  - Registers the native module package in MainApplication.
 *
 * LIMITED host: loads provider(s) explicitly provided to it; no marketplace,
 * no arbitrary repo install, no auto-update, no DNS-block bypass. Plugin code
 * runs in-process (PathClassLoader); the bridge exposes only a bounded data
 * interface and never passes host accounts/secrets to plugin code
 * (interface-bounded isolation, not a security sandbox).
 *
 * Licence: CloudStream library is GPLv3. This plugin reuses the library via a
 * declared dependency; GPL notices are preserved (see NOTICE-CLOUDSTREAM.md).
 */
import { withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const CLOUDSTREAM_GROUP = 'com.github.recloudstream.cloudstream';
const CLOUDSTREAM_ARTIFACT = 'library-android';
const CLOUDSTREAM_VERSION = '4.8.0';
const CLOUDSTREAM_DEP = `${CLOUDSTREAM_GROUP}:${CLOUDSTREAM_ARTIFACT}:${CLOUDSTREAM_VERSION}`;
const JITPACK_URL = 'https://jitpack.io';
const HOST_PACKAGE = 'com.yasin636.cloudstream';
const HOST_PACKAGE_CLASS = 'CloudStreamHostPackage';
const HOST_PACKAGE_REF = `new ${HOST_PACKAGE}.${HOST_PACKAGE_CLASS}()`;

/** Native Kotlin sources written into the Android project. */
const NATIVE_FILES: Array<{ rel: string; contents: string }> = [
  {
    rel: `app/src/main/java/${HOST_PACKAGE}/CloudStreamHostModule.kt`,
    contents: fs.readFileSync(path.join(__dirname, 'native', 'CloudStreamHostModule.kt'), 'utf8'),
  },
  {
    rel: `app/src/main/java/${HOST_PACKAGE}/CloudStreamHostPackage.kt`,
    contents: fs.readFileSync(path.join(__dirname, 'native', 'CloudStreamHostPackage.kt'), 'utf8'),
  },
];

function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

/** Add JitPack repository to settings.gradle.kts (idempotent). */
function injectJitPackRepo(settingsPath: string): void {
  if (!fs.existsSync(settingsPath)) return;
  const content = readText(settingsPath);
  if (content.includes(JITPACK_URL)) return;
  const block = `\n    maven {\n        url = uri("${JITPACK_URL}")\n        content {\n            includeGroup("${CLOUDSTREAM_GROUP}")\n        }\n    }\n`;
  // Insert inside the first `repositories {` block under dependencyResolutionManagement.
  const updated = content.replace(
    /(dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{)/,
    (_m, p1: string) => `${p1}${block}`,
  );
  writeText(settingsPath, updated);
}

/** Add CloudStream library dependency to app/build.gradle.kts (idempotent). */
function injectDependency(appGradlePath: string): void {
  if (!fs.existsSync(appGradlePath)) return;
  const content = readText(appGradlePath);
  if (content.includes(CLOUDSTREAM_DEP)) return;
  const block = `\ndependencies {\n    implementation("${CLOUDSTREAM_DEP}")\n}\n`;
  writeText(appGradlePath, `${content.trimEnd()}\n${block}`);
}

/** Register the native module package in MainApplication (idempotent). */
function injectPackage(mainAppPath: string): void {
  if (!fs.existsSync(mainAppPath)) return;
  const content = readText(mainAppPath);
  if (content.includes(HOST_PACKAGE_REF)) return;
  // Inject the package right after the ReactPackage list opening.
  const updated = content.replace(
    /(Arrays\.(?:<ReactPackage>)?asList\()/,
    (_m, p1: string) => `${p1}\n            ${HOST_PACKAGE_REF},`,
  );
  writeText(mainAppPath, updated);
}

export function withCloudStreamHost(config: any) {
  return withDangerousMod(config, [
    'android',
    async ({ projectRoot }: { projectRoot: string }) => {
      // 1. Write native Kotlin sources.
      for (const file of NATIVE_FILES) {
        writeText(path.join(projectRoot, file.rel), file.contents);
      }
      // 2. JitPack repository.
      injectJitPackRepo(path.join(projectRoot, 'settings.gradle.kts'));
      // 3. CloudStream library dependency.
      injectDependency(path.join(projectRoot, 'app', 'build.gradle.kts'));
      // 4. Register the native package in MainApplication (.java or .kt).
      const mainAppJava = path.join(
        projectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'yasin636',
        'animemetahub',
        'MainApplication.java',
      );
      const mainAppKotlin = mainAppJava.replace('.java', '.kt');
      if (fs.existsSync(mainAppJava)) injectPackage(mainAppJava);
      else if (fs.existsSync(mainAppKotlin)) injectPackage(mainAppKotlin);
    },
  ]);
}
