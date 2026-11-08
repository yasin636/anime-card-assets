#!/usr/bin/env python3
"""Create a private Android TEST identity outside Git. Never print key/password.
Requires Python3 + OpenSSL. Reuses existing output; refuses partial output overwrite.
The backup ZIP is private: never commit/upload it to a public repository/artifact.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import secrets
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--private-dir', required=True)
parser.add_argument('--backup', required=True)
parser.add_argument('--public-manifest', required=True)
args = parser.parse_args()
private = Path(args.private_dir).expanduser().resolve()
backup = Path(args.backup).expanduser().resolve()
manifest = Path(args.public_manifest).expanduser().resolve()
repo = Path(__file__).resolve().parent.parent
if private == repo or repo in private.parents or backup == repo or repo in backup.parents:
    raise SystemExit('Private signing directory/backup must be outside the repository.')
os.umask(0o077)
private.mkdir(parents=True, exist_ok=True)
password = private / 'ANDROID_KEYSTORE_PASSWORD.txt'
keystore = private / 'anime-meta-hub-test.p12'
cert = private / 'certificate.pem'
key = private / 'private-key.encrypted.pem'
alias = 'anime-meta-hub-test'
run = lambda cmd: subprocess.check_output(cmd, stderr=subprocess.PIPE, text=True)
if not keystore.exists():
    if any(p.exists() for p in [password, cert, key]):
        raise SystemExit('Partial identity exists; refusing to overwrite. Recover/review manually.')
    password.write_text(secrets.token_urlsafe(36))
    run(['openssl', 'req', '-new', '-x509', '-newkey', 'rsa:3072', '-sha256', '-days', '10000',
         '-keyout', str(key), '-out', str(cert), '-passout', 'file:' + str(password),
         '-subj', '/CN=Anime Meta Hub Private Test/O=Anime Meta Hub/C=BD'])
    # OpenSSL treats the same passin/passout filename as a two-line stream.
    # Use a subprocess-only environment variable for the export password instead.
    os.environ['ANIME_TEST_STORE_PASSWORD'] = password.read_text()
    try:
        run(['openssl', 'pkcs12', '-export', '-out', str(keystore), '-inkey', str(key),
             '-in', str(cert), '-name', alias, '-passin', 'file:' + str(password),
             '-passout', 'env:ANIME_TEST_STORE_PASSWORD'])
    finally:
        os.environ.pop('ANIME_TEST_STORE_PASSWORD', None)
else:
    if not password.exists() or not cert.exists():
        raise SystemExit('Existing identity incomplete; refusing to recreate.')

fingerprints = {}
for alg in ['sha1', 'sha256']:
    output = run(['openssl', 'x509', '-in', str(cert), '-noout', '-fingerprint', '-' + alg])
    fingerprints[alg] = output.strip().split('=', 1)[1]
public = {
    'purpose': 'Private Android test signing only; not production release identity',
    'applicationId': 'com.yasin636.animemetahub',
    'firebaseProject': 'anime-meta-hub',
    'alias': alias,
    **fingerprints,
}
manifest.parent.mkdir(parents=True, exist_ok=True)
manifest.write_text(json.dumps(public, indent=2) + '\n')
(private / 'ANDROID_KEYSTORE_BASE64.txt').write_text(base64.b64encode(keystore.read_bytes()).decode())
(private / 'FINGERPRINTS.json').write_text(json.dumps(public, indent=2) + '\n')
(private / 'READ-ME-FIRST.txt').write_text('''PRIVATE ANDROID TEST SIGNING BACKUP — KEEP PRIVATE

Do NOT upload this ZIP, the P12, base64, password, or encrypted PEM to chat,
public Git, GitHub Releases or Actions artifacts. Only certificate fingerprints
are public. Store a safe offline backup. Losing this key prevents same-key updates.
The key is for internal testing, not the production/store signing plan.

GitHub repository > Settings > Secrets and variables > Actions > New repository secret:
1. ANDROID_KEYSTORE_BASE64: paste complete contents of ANDROID_KEYSTORE_BASE64.txt
2. ANDROID_KEYSTORE_PASSWORD: paste complete contents of ANDROID_KEYSTORE_PASSWORD.txt

Do not send those values back to the assistant. The key alias is anime-meta-hub-test.
Store/key password are the same; keystore format PKCS12.

After registering SHA-1 and SHA-256 in Firebase, download the UPDATED Android
configuration and supply that non-service-account google-services.json separately.
The FIREBASE_ANDROID_CONFIG_BASE64 Actions secret can then be prepared from it.

The previous v0.1.0 APK used a PUBLIC development key. A private-key build with the
same package cannot update that installed APK: uninstall the sample-only v0.1.0
before installing the first private-key APK. Future private-key test APKs must retain
this identity and increment versionCode. No real account data existed in v0.1.0.
''')
backup.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(backup, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for filename in ['anime-meta-hub-test.p12', 'ANDROID_KEYSTORE_BASE64.txt',
                     'ANDROID_KEYSTORE_PASSWORD.txt', 'certificate.pem',
                     'FINGERPRINTS.json', 'READ-ME-FIRST.txt']:
        archive.write(private / filename, arcname=filename)
os.chmod(backup, 0o600)
print(json.dumps(public, indent=2))
print('Private backup created outside Git; no key/password printed.')
