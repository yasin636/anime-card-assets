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

The generator redacts both the AI secret and Firebase web API key, records original source SHA-256 hashes, and extracts literal catalogs without executing the application. Inspect generated diffs before saving. Reference tests verify baseline rules/catalogs only; a React Native app and device/E2E validation are still to be implemented.
