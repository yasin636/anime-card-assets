/**
 * CloudStream provider Test Lab — opt-in only.
 *
 * Lets the owner load an explicitly-provided .cs3 provider, search, view
 * details/episodes, resolve links, and see distinct errors (timeout /
 * load-error / search-error / http / zero-links / unsupported). Diagnostic
 * export redacts token/cookie/signed-URL values.
 *
 * No marketplace, no arbitrary repo install, no auto-update. Plugin code runs
 * in-process (interface-bounded isolation, not a security sandbox). Licence:
 * hosts the GPLv3 CloudStream library; see preserved notices.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CloudStreamHostError,
  isCloudStreamHostAvailable,
  load as loadDetails,
  loadProvider,
  listProviders,
  resolveLinks,
  search,
  redactDiagnostic,
} from './cloudstreamHost';
import type { CloudStreamDetails, CloudStreamSearchHit } from './cloudstreamHost';

export default function CloudStreamTestLab() {
  const available = isCloudStreamHostAvailable();
  const [providerFile, setProviderFile] = useState('');
  const [providers, setProviders] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CloudStreamSearchHit[]>([]);
  const [details, setDetails] = useState<CloudStreamDetails | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      setStatus(label + ': ok');
    } catch (e) {
      const code = e instanceof CloudStreamHostError ? e.code : 'unsupported';
      setError(`[${code}] ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!available) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>CloudStream Provider Test Lab</Text>
        <Text style={styles.muted}>
          Native CloudStream host is not available on this build (Android only, opt-in).
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CloudStream Provider Test Lab</Text>
      <Text style={styles.muted}>
        Opt-in, limited host. Load an explicitly-provided .cs3 provider to test
        search → details → links behind AniGooD's own player.
      </Text>

      <Text style={styles.label}>Provider file name (in filesDir/cloudstream/)</Text>
      <TextInput style={styles.input} value={providerFile} onChangeText={setProviderFile} placeholder="provider.cs3" />
      <Button
        title="Load provider"
        disabled={busy || !providerFile.trim()}
        onPress={() => run('load', async () => { await loadProvider(providerFile.trim()); setProviders(await listProviders()); })}
      />

      <Text style={styles.label}>Loaded providers</Text>
      <Text style={styles.muted}>{providers.length ? providers.join(', ') : '(none)'}</Text>

      <Text style={styles.label}>Search query</Text>
      <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="title" />
      <Button
        title="Search"
        disabled={busy || !providers.length || !query.trim()}
        onPress={() =>
          run('search', async () => {
            const p = providers[0];
            setHits(await search(p, query.trim()));
          })
        }
      />

      {hits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Search hits ({hits.length})</Text>
          {hits.map((h, i) => (
            <View key={i} style={styles.hit}>
              <Text style={styles.hitTitle}>{h.name} {h.year ? `(${h.year})` : ''}</Text>
              <Text style={styles.muted}>{h.type} · {h.apiName}</Text>
              <Button
                title="Load details"
                onPress={() =>
                  run('load', async () => {
                    const p = providers[0];
                    setDetails(await loadDetails(p, h.url));
                  })
                }
              />
            </View>
          ))}
        </View>
      )}

      {details && (
        <View style={styles.section}>
          <Text style={styles.label}>Details: {details.name}</Text>
          <Text style={styles.muted}>{details.type} · {details.episodes.length} episodes</Text>
          {details.episodes.slice(0, 12).map((ep, i) => (
            <Text key={i} style={styles.muted}>
              S{ep.season} E{ep.episode} · {ep.name || '(untitled)'}
            </Text>
          ))}
          {details.episodes[0] && (
            <Button
              title="Resolve links (ep 1)"
              onPress={() =>
                run('links', async () => {
                  const p = providers[0];
                  const { streams, subtitles } = await resolveLinks(p, details.episodes[0].url, []);
                  setStatus(`links: ${streams.length} stream(s), ${subtitles.length} subtitle(s)`);
                })
              }
            />
          )}
        </View>
      )}

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Export redacted diagnostic"
        onPress={() => {
          const diag = redactDiagnostic({
            providerFile,
            providers,
            query,
            hitCount: hits.length,
            detailsName: details?.name ?? null,
          });
          setStatus('diagnostic: ' + JSON.stringify(diag));
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  content: { padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  muted: { fontSize: 13, color: '#8a93a3' },
  label: { fontSize: 13, fontWeight: '600', color: '#c8d0e0', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#2a3140', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', backgroundColor: '#161b22' },
  section: { marginTop: 12, padding: 12, backgroundColor: '#161b22', borderRadius: 10 },
  hit: { paddingVertical: 8, gap: 4 },
  hitTitle: { color: '#fff', fontSize: 14 },
  status: { color: '#7fd1a0', fontSize: 13, marginTop: 8 },
  error: { color: '#ff8b8b', fontSize: 13, marginTop: 8 },
});
