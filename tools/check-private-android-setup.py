#!/usr/bin/env python3
"""Fail-closed CI check. Never print secret values or invoke Firebase APIs."""
import argparse
import base64
import json
import hashlib
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--signing-only', action='store_true', help='Verify the two signing secrets without requiring Firebase config.')
parser.add_argument('--skip-java-check', action='store_true', help='Local OpenSSL check; CI must not use this option.')
args = parser.parse_args()
def fail(message):
    # Only fixed diagnostic strings/secret NAMES, never values.
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        safe = message.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
        print('::error title=Private setup check::' + safe, flush=True)
    raise SystemExit(message)

def decode_secret(name):
    # Copying text on mobile may add line endings or wrap the Base64 string.
    return base64.b64decode(''.join(os.environ[name].split()), validate=True)

# Generated passwords are single-line; ignore accidental final copy line endings.
os.environ['ANDROID_KEYSTORE_PASSWORD'] = os.environ.get('ANDROID_KEYSTORE_PASSWORD', '').rstrip('\r\n')
required = ['ANDROID_KEYSTORE_BASE64', 'ANDROID_KEYSTORE_PASSWORD']
if not args.signing_only:
    required.append('FIREBASE_ANDROID_CONFIG_BASE64')
missing = [k for k in required if not os.environ.get(k)]
if missing:
    fail('Required Actions secrets are missing: ' + ', '.join(missing))
manifest = json.loads((Path(__file__).resolve().parent.parent / 'docs/react-native-blueprint/android-test-certificate.json').read_text())
output = Path(args.output).resolve()
os.umask(0o077)
output.mkdir(parents=True, exist_ok=True)
try:
    config = None if args.signing_only else json.loads(decode_secret('FIREBASE_ANDROID_CONFIG_BASE64'))
    key_bytes = decode_secret('ANDROID_KEYSTORE_BASE64')
except Exception:
    fail('A supplied base64 secret or Firebase JSON is invalid; values were not logged.')
norm = lambda x: x.replace(':', '').upper()
if manifest.get('keystoreSha256') and hashlib.sha256(key_bytes).hexdigest() != manifest['keystoreSha256']:
    fail('ANDROID_KEYSTORE_BASE64 does not decode to the supplied backup keystore. Re-copy the complete BASE64 text file, not the P12 filename or contents from another file.')
if not args.signing_only:
    if 'private_key' in config or config.get('type') == 'service_account':
        fail('Use Android google-services.json, NEVER a service-account key.')
    if config.get('project_info', {}).get('project_id') != manifest['firebaseProject']:
        fail('Firebase project mismatch.')
    clients = [c for c in config.get('client', []) if c.get('client_info', {}).get('android_client_info', {}).get('package_name') == manifest['applicationId']]
    if len(clients) != 1:
        fail('Expected exactly one matching Android client for the applicationId.')
    client = clients[0]
    if not client.get('api_key'):
        fail('Android configuration has no API key entry.')
    android_clients = [c for c in client.get('oauth_client', []) if c.get('client_type') == 1]
    if not any(c.get('android_info', {}).get('package_name') == manifest['applicationId'] and norm(c.get('android_info', {}).get('certificate_hash', '')) == norm(manifest['sha1']) for c in android_clients):
        fail('Updated Firebase configuration needs an Android OAuth client for the pinned SHA-1. Register fingerprints then download google-services.json again.')
    oauth = client.get('oauth_client', []) + client.get('services', {}).get('appinvite_service', {}).get('other_platform_oauth_client', [])
    if not any(c.get('client_type') == 3 and c.get('client_id') for c in oauth):
        fail('No web OAuth client for Google Sign-In. Enable Google provider and download updated Android config.')
keystore = output / 'test-signing.p12'
cert = output / 'certificate.pem'
keystore.write_bytes(key_bytes)
if config is not None:
    (output / 'google-services.json').write_text(json.dumps(config))
# Password uses environment, not command-line arguments. Capture errors to avoid
# accidental secret/config content in a raw tool traceback.
try:
    # Separate data/password validation from Java compatibility failures.
    try:
        pem = subprocess.check_output(['openssl', 'pkcs12', '-in', str(keystore), '-passin', 'env:ANDROID_KEYSTORE_PASSWORD', '-clcerts', '-nokeys'], stderr=subprocess.PIPE)
    except subprocess.CalledProcessError:
        fail('Keystore bytes match the backup, but the password cannot open it. Re-copy only ANDROID_KEYSTORE_PASSWORD.txt into the matching Actions secret (not a filename or account password).')
    if not args.skip_java_check:
        try:
            pem = subprocess.check_output(['keytool', '-exportcert', '-rfc', '-keystore', str(keystore), '-storetype', 'PKCS12', '-storepass:env', 'ANDROID_KEYSTORE_PASSWORD', '-alias', manifest['alias']], stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:
            fail('OpenSSL accepted the private key/password, but Java keytool could not export the alias. This is a Java compatibility/alias issue, not proof that the pasted password is wrong.')
    cert.write_bytes(pem)
    for algorithm in ['sha1', 'sha256']:
        actual = subprocess.check_output(['openssl', 'x509', '-in', str(cert), '-noout', '-fingerprint', '-' + algorithm], stderr=subprocess.PIPE, text=True).strip().split('=', 1)[1]
        if norm(actual) != norm(manifest[algorithm]):
            fail('Keystore certificate does not match the pinned ' + algorithm + ' fingerprint.')
except subprocess.CalledProcessError:
    fail('Cannot open/export the PKCS12 certificate. Check keystore/password/alias privately; no secret values logged.')
if args.signing_only:
    print('PASS: private signing secrets open the keystore and match the pinned SHA-1/SHA-256. Firebase config was not checked.')
else:
    print('PASS: private certificate identity and Android Firebase OAuth configuration match. No live login/database request performed.')
