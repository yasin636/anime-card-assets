#!/usr/bin/env python3
"""Fail-closed CI check. Never print secret values or invoke Firebase APIs."""
import argparse
import base64
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--signing-only', action='store_true', help='Verify the two signing secrets without requiring Firebase config.')
parser.add_argument('--skip-java-check', action='store_true', help='Local OpenSSL check; CI must not use this option.')
args = parser.parse_args()
required = ['ANDROID_KEYSTORE_BASE64', 'ANDROID_KEYSTORE_PASSWORD']
if not args.signing_only:
    required.append('FIREBASE_ANDROID_CONFIG_BASE64')
missing = [k for k in required if not os.environ.get(k)]
if missing:
    raise SystemExit('Required Actions secrets are missing: ' + ', '.join(missing))
manifest = json.loads((Path(__file__).resolve().parent.parent / 'docs/react-native-blueprint/android-test-certificate.json').read_text())
output = Path(args.output).resolve()
os.umask(0o077)
output.mkdir(parents=True, exist_ok=True)
try:
    config = None if args.signing_only else json.loads(base64.b64decode(os.environ['FIREBASE_ANDROID_CONFIG_BASE64'], validate=True))
    key_bytes = base64.b64decode(os.environ['ANDROID_KEYSTORE_BASE64'], validate=True)
except Exception:
    raise SystemExit('A supplied base64 secret or Firebase JSON is invalid; values were not logged.')
norm = lambda x: x.replace(':', '').upper()
if not args.signing_only:
    if 'private_key' in config or config.get('type') == 'service_account':
        raise SystemExit('Use Android google-services.json, NEVER a service-account key.')
    if config.get('project_info', {}).get('project_id') != manifest['firebaseProject']:
        raise SystemExit('Firebase project mismatch.')
    clients = [c for c in config.get('client', []) if c.get('client_info', {}).get('android_client_info', {}).get('package_name') == manifest['applicationId']]
    if len(clients) != 1:
        raise SystemExit('Expected exactly one matching Android client for the applicationId.')
    client = clients[0]
    if not client.get('api_key'):
        raise SystemExit('Android configuration has no API key entry.')
    android_clients = [c for c in client.get('oauth_client', []) if c.get('client_type') == 1]
    if not any(c.get('android_info', {}).get('package_name') == manifest['applicationId'] and norm(c.get('android_info', {}).get('certificate_hash', '')) == norm(manifest['sha1']) for c in android_clients):
        raise SystemExit('Updated Firebase configuration needs an Android OAuth client for the pinned SHA-1. Register fingerprints then download google-services.json again.')
    oauth = client.get('oauth_client', []) + client.get('services', {}).get('appinvite_service', {}).get('other_platform_oauth_client', [])
    if not any(c.get('client_type') == 3 and c.get('client_id') for c in oauth):
        raise SystemExit('No web OAuth client for Google Sign-In. Enable Google provider and download updated Android config.')
keystore = output / 'test-signing.p12'
cert = output / 'certificate.pem'
keystore.write_bytes(key_bytes)
if config is not None:
    (output / 'google-services.json').write_text(json.dumps(config))
# Password uses environment, not command-line arguments. Capture errors to avoid
# accidental secret/config content in a raw tool traceback.
try:
    if args.skip_java_check:
        pem = subprocess.check_output(['openssl', 'pkcs12', '-in', str(keystore), '-passin', 'env:ANDROID_KEYSTORE_PASSWORD', '-clcerts', '-nokeys'], stderr=subprocess.PIPE)
    else:
        pem = subprocess.check_output(['keytool', '-exportcert', '-rfc', '-keystore', str(keystore), '-storetype', 'PKCS12', '-storepass:env', 'ANDROID_KEYSTORE_PASSWORD', '-alias', manifest['alias']], stderr=subprocess.PIPE)
    cert.write_bytes(pem)
    for algorithm in ['sha1', 'sha256']:
        actual = subprocess.check_output(['openssl', 'x509', '-in', str(cert), '-noout', '-fingerprint', '-' + algorithm], stderr=subprocess.PIPE, text=True).strip().split('=', 1)[1]
        if norm(actual) != norm(manifest[algorithm]):
            raise SystemExit('Keystore certificate does not match the pinned ' + algorithm + ' fingerprint.')
except subprocess.CalledProcessError:
    raise SystemExit('Cannot open/export the PKCS12 certificate. Check keystore/password/alias privately; no secret values logged.')
if args.signing_only:
    print('PASS: private signing secrets open the keystore and match the pinned SHA-1/SHA-256. Firebase config was not checked.')
else:
    print('PASS: private certificate identity and Android Firebase OAuth configuration match. No live login/database request performed.')
