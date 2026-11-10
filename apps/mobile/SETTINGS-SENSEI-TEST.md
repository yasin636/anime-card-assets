# v0.3.1 Settings / Sensei test (versionCode4)

Update in place over private-signed v0.2.0/v0.3.0. Do not uninstall merely to update. Existing balances/profile and per-UID Gemini SecureStore key are preserved; previous `models/`-prefixed model IDs are normalized if still in the requested list. No gallery/backend/Rules/billing changes.

## Settings

Header gear or More → Settings → AI Provider. Separate extensible Settings root, not an API form in chat. Provider enabled toggle, exact seven requested model IDs in a dropdown, optional replacement key (hidden by default), show ONLY newly typed key, encrypted-saved indicator, Save/Delete and explicit REAL connection test.

Requested IDs (no independent availability claim): gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.6-flash, gemini-robotics-er-2-preview, gemini-3.1-flash-lite, gemini-2.5-flash, gemini-2.5-flash-lite. Duplicate gemini-3.5-flash removed. No old discovery/sort/top-six filter, no hidden fallback to another model. Robotics remains selectable. Server404/permission/quota errors show failure, not invented success.

Test sends a tiny generateContent request with the exact selected model and typed replacement key (or saved key). May use Google quota/cost. Only a nonempty text response is successful; no model-list-only/mock connectivity result. Changing a draft model/key/toggle or leaving settings clears the previous test indicator. Test does NOT save configuration. Unsaved changes are labelled; chat uses the saved model/key/enabled state.

Key/model/enabled saved per Firebase UID in SecureStore, not source/public env/Firestore/AsyncStorage/logs/request URL. Saved secret is never put back in the input. Removal deletes local secret and disables Gemini; does not revoke Google key. All key/probe operations abort/ignore stale UI responses on account change/navigation. Secrets still must be decrypted for legitimate Google requests; compromised/rooted devices are outside an absolute confidentiality guarantee.

## Sensei

More → Chat is the separate clean AI conversation surface. Settings gear opens provider preferences. Dedicated scrollable selectable-text conversation, user/assistant bubbles, busy indicator, bottom multiline composer, Send/Stop, retry for failed/stopped turns, New chat confirmation. Not a mock streaming animation; images/audio/streaming are explicitly NOT implemented or advertised as working. Native back supported for Settings/provider/modal model list.

Only the current question is sent to Google, preserving the source request behavior. Display history stays in memory while navigating to Settings and back; not persisted to disk, cleared by New chat/account unmount. Model name recorded per turn. No chat tools or balance mutation. Replies can be wrong. Timeout/Stop/navigation abort a request; Google may already have processed/billed it. No automatic retries that silently consume quota.

## Phone QA required

1. Header gear / More → Settings / AI Provider; dropdown shows EXACT seven unique IDs including robotics. Back/modal outside press/Android Back works. Original eight destinations still exist.
2. Existing v0.3.0 key remains saved but not visible. Fresh account has no other UID's key/model. Toggle/change model Save; relaunch; confirm selected model and enabled state.
3. New typed key show/hide, replacement Save, removal and provider-off behavior. Do not screenshot/send key.
4. Choose a model accessible to YOUR key; real connection test succeeds. An invalid/unavailable/denied/quota-limited model must show failure; list presence is not a guarantee.
5. Changing model/key clears old success; testing unsaved configuration does not modify the chat's saved configuration. Test quota warning visible.
6. Open Sensei: no API key form. Keyboard/multiline scrolling/composer, Send/Stop, timeout/offline failure, Retry, New chat, long selectable replies, settings-and-back/history tests.
7. Switch account/logout during probe/request/save: no previous key/reply appears under another UID. Verify Google actual generation and secure storage on the phone; sandbox tests mocked Google.

TypeScript, Android prebuild/Hermes export and12 Gemini/security fixture groups plus31 economy,23 profile and61 original-reference checks pass locally. No physical device/iOS/Gemini live key test performed in sandbox. Step03 live economy still awaits trusted hosting and reviewed Rules; all mutation gates remain intact. This release is NOT full Step03 acceptance.
