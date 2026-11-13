// Structural scope checks, not a substitute for device interaction tests.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('../apps/mobile/node_modules/typescript');
const root = path.join(__dirname, '..');
const mobile = path.join(root, 'apps/mobile');
const app = JSON.parse(fs.readFileSync(path.join(mobile, 'app.json'))).expo;
const pkg = JSON.parse(fs.readFileSync(path.join(mobile, 'package.json')));
const lock = JSON.parse(fs.readFileSync(path.join(mobile, 'package-lock.json')));
assert.equal(lock.version, pkg.version); assert.equal(lock.packages[''].version, pkg.version);
for (const [name, entry] of Object.entries(lock.packages)) {
  if (!entry.resolved?.startsWith('https://registry.npmjs.org/') || !entry.resolved.endsWith('.tgz')) continue;
  const u = new URL(entry.resolved), base = decodeURIComponent(u.pathname.split('/-/')[0]).split('/').pop();
  const filename = decodeURIComponent(u.pathname.split('/').pop());
  assert.equal(entry.version, filename.slice(base.length + 1, -4), `Dependency metadata version mismatch: ${name}`);
}

const code = fs.readFileSync(path.join(mobile, 'App.tsx'), 'utf8');
const source = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let pages;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'pages') pages = node.initializer;
  ts.forEachChild(node, visit);
}
visit(source);
assert(pages && ts.isObjectLiteralExpression(pages));
assert.deepEqual(pages.properties.map(p => p.name.getText(source)), ['Watch', 'Profile', 'Arena', 'Feed', 'Shop', 'Cards', 'Tracker', 'Chat', 'Adventure', 'Settings', 'AIProvider']);
assert.equal(app.version, '0.21.0');
assert.equal(app.android.versionCode, 34);
assert.equal(app.android.package, 'com.yasin636.animemetahub');
assert.equal(app.ios.bundleIdentifier, app.android.package);
assert.equal(app.updates.enabled, false);
assert.equal(pkg.dependencies.expo, '54.0.38');
assert.equal(pkg.dependencies['react-native'], '0.81.5');
assert(code.includes('AniGooD'));assert(!code.includes('STEP 07B / POLISH'));assert(code.includes("['Watch','Chat','Feed','Shop','Cards','Tracker'].includes(route.name)"));
assert(code.includes('<AuthProvider>'));
assert(code.includes('<EconomyProvider'));
assert(code.includes('<AIProvider'));
assert(code.includes('Open app Settings'));
assert(code.includes('AIProvider: AISettings'));
assert(code.includes('<CardsScreen'));
assert(code.includes('<ShopScreen'));
assert(code.includes('auth.pendingEmail'));
assert(pkg.dependencies['@react-native-firebase/auth']);
assert(pkg.dependencies['@react-native-google-signin/google-signin']);
assert(code.includes('onRequestClose'));
assert(code.includes('session.profile?.xp'));
assert(!/\bgsk_[a-zA-Z0-9]+/.test(code));
assert(!/from ['"](?:firebase|@react-native-firebase)/.test(code));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for (const [name, original] of Object.entries({
  gojo: '1774203370787_with_bgc.png',
  sukuna: '1774203030221_with_bgc.png',
  deku: '1774206242811_with_bgc.png',
  yuji: 'gpt-image-1.5-high-fidelity_a_Good_good_very_good__1_with_bgc.png',
})) assert.equal(hash(path.join(mobile, 'assets/cards', name + '.png')), hash(path.join(root, original)));
const { execFileSync } = require('node:child_process');
const autolinker = path.join(mobile, 'node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js');
const nativeModules = JSON.parse(execFileSync(process.execPath, [autolinker, 'resolve', '--platform', 'android', '--json'], { cwd: mobile, encoding: 'utf8' }));
for (const module of nativeModules.modules) {
  for (const project of module.projects || []) {
    if (project.publication) assert(project.publication.version, `${module.packageName} missing Android publication version`);
  }
}
assert(nativeModules.modules.find(m => m.packageName === 'expo-font').packageVersion.startsWith('14.'));
console.log('PASS: 8 original destinations + Settings/AI Provider, Settings/Sensei test app configuration, artwork integrity, scope and Android autolinking checks. Device tests still required.');
