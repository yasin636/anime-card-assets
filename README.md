# anime-card-assets

Anime Meta Hub card/story artwork assets.

## React Native blueprint

ব্যবহারকারীর দেওয়া HTML/CSS/JavaScript থেকে তৈরি পূর্ণাঙ্গ native-port specification:

- [মূল বাংলা ব্লুপ্রিন্ট](docs/react-native-blueprint/BLUEPRINT.bn.md)
- [ফিচার parity, bug decisions ও QA checklist](docs/react-native-blueprint/PARITY-AND-QA.bn.md)
- [হুবহু game/content catalog](docs/react-native-blueprint/reference/catalog.json)
- [Source symbol, action ও animation inventory](docs/react-native-blueprint/reference/inventory.json)

`reference/` contains the complete supplied HTML/CSS and a line-preserving, secret-redacted JavaScript reference. These files are documentation inputs, **not a production application**. The uploaded AI API secret must be revoked/rotated; do not restore it to the reference or mobile client.

Run offline reference checks (Node.js, no dependencies/network):

```sh
node tools/test-blueprint-reference.cjs
```

To regenerate the reference from the original three uploaded files or another directory containing them:

```sh
node tools/build-blueprint-reference.cjs /path/to/source-files
node tools/test-blueprint-reference.cjs
```

The generator redacts both the AI secret and Firebase web API key, records original source SHA-256 hashes, and extracts literal catalogs without executing the application. Inspect generated diffs before saving. Reference tests verify baseline rules/catalogs only; native implementation and device/CI evidence are tracked separately below.

## Latest test increment — Step04 v0.5.2 Arena artwork-fit fix

[Download standalone Arena test APK (ZIP)](https://github.com/yasin636/anime-card-assets/actions/runs/43002803307/artifacts/13847272978) · [Step04 scope, manual backend update and QA](apps/mobile/STEP04-TEST.md).

Real-artwork rarity/stat card grids, deck totals, compact avatar rankings/podium and public six-slot featured profiles replace the rejected serial-button UI. [Redesign QA and privacy boundary](apps/mobile/ARENA-REDESIGN-TEST.md). Trusted wheel, persistent card battles, Top10/weekly rewards and server-provider quiz implementation retained. Quiz is visibly disabled until an owner-authorized private server provider key is configured; no phone key upload or fake rewards. This is the first Step04 test, **not final Step04 acceptance**. Keep owner-only access and existing balances; do not uninstall to update. Backend must be manually updated to latest branch before Arena commands. No Rules change needed.

## Accepted native owner release — Step03 v0.4.0

- [Step03 release scope and evidence matrix](apps/mobile/STEP03-RELEASE.md): Cards/six slots, trusted Gacha/pity, recycle/duplicate bonuses and seven themes. Owner-only live access remains intentional; no public rollout is authorized by an APK build.
- [Accepted Settings/Sensei setup](apps/mobile/SETTINGS-SENSEI-TEST.md): exact seven Gemini models, local own-key storage and separate chat retained.
- [Firestore boundary and emulator tests](security/firestore/README.md): strict client permissions and real transaction concurrency/idempotency. Release build waits for emulator success.
- Android standalone APK updates preserve the original private signing identity. Current release artifact and phone acceptance are recorded in [progress](docs/react-native-blueprint/PROGRESS.bn.md).
- Gallery remains explicitly deferred; other blueprint systems are not silently claimed finished. iOS/device edge-case/public-production verification remains distinct from automated tests.

## Historical native app — Step01 test

Source: [`apps/mobile`](apps/mobile). Status/test evidence: [implementation progress](docs/react-native-blueprint/PROGRESS.bn.md).

[Download Navigation Test v0.1.0 (GitHub artifact ZIP)](https://github.com/yasin636/anime-card-assets/actions/runs/42473341865/artifacts/13614353281) — extract APK and install on Android; artifact expires November22,2026. GitHub login may be required. This is an offline, test-signed navigation preview, not a production app or a real account/reward system. Historical artifact; Step01 and later increments were accepted, see current progress above. Do not install this old public-key sample over a current private-key release.
