/**
 * CloudStream-compatible provider host — JS bridge (opt-in Test Lab only).
 *
 * Wraps the native CloudStreamHostModule. Maps CloudStream provider results
 * (search / load / loadLinks) to AniGooD's existing IntegratedStream boundary
 * so the existing UI/search/details/player can consume them unchanged.
 *
 * Limited host: loads explicitly-provided .cs3 plugins; no marketplace, no
 * arbitrary repo install, no auto-update. Interface-bounded isolation only —
 * plugin code runs in-process (not a security sandbox); no host
 * account/secret/credential is passed to plugin code.
 *
 * Distinct errors: timeout / load-error / search-error / http / zero-links /
 * unsupported. Diagnostic exports redact token/cookie/signed-URL values.
 *
 * Licence: hosts the GPLv3 CloudStream library; see preserved notices.
 */
import { NativeModules, Platform } from 'react-native';
import type { IntegratedStream, RemoteSubtitle } from './sourceIntegration';

type CsHost = {
  loadProvider: (fileName: string) => Promise<{ ok: boolean; message: string }>;
  listProviders: () => Promise<string[]>;
  search: (providerName: string, query: string) => Promise<Array<Record<string, unknown>>>;
  load: (providerName: string, url: string) => Promise<Record<string, unknown>>;
  loadLinks: (providerName: string, data: string) => Promise<{
    ok: boolean;
    links: Array<Record<string, unknown>>;
    subtitles: Array<Record<string, unknown>>;
  }>;
  unloadProvider: (fileName: string) => Promise<{ ok: boolean; message: string }>;
};

export type CloudStreamHostCode =
  | 'unsupported'
  | 'not-available'
  | 'load-error'
  | 'search-error'
  | 'http'
  | 'timeout'
  | 'zero-links'
  | 'mapping';

export class CloudStreamHostError extends Error {
  constructor(readonly code: CloudStreamHostCode, message?: string) {
    super(message ?? code);
  }
}

const isAndroid = Platform.OS === 'android';
const native: CsHost | undefined =
  isAndroid && NativeModules.CloudStreamHost
    ? (NativeModules.CloudStreamHost as unknown as CsHost)
    : undefined;

export function isCloudStreamHostAvailable(): boolean {
  return !!native;
}

function rejectToError(code: CloudStreamHostCode, e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  if (/timeout|timed out|deadline/i.test(msg)) throw new CloudStreamHostError('timeout', msg);
  if (/load-error/i.test(msg)) throw new CloudStreamHostError('load-error', msg);
  if (/search-error/i.test(msg)) throw new CloudStreamHostError('search-error', msg);
  if (/loadLinks-error/i.test(msg)) throw new CloudStreamHostError('http', msg);
  if (/http|status|429|403|401/i.test(msg)) throw new CloudStreamHostError('http', msg);
  throw new CloudStreamHostError('unsupported', msg);
}

function text(v: unknown, max = 240): string {
  return typeof v === 'string' ? v.replace(/[-]/g, ' ').slice(0, max) : '';
}

/** Provider URL/identity data is opaque and preserved exactly (no coercion). */
export function normalizeProviderUrl(raw: unknown): string {
  if (typeof raw !== 'string' || !/^https:\/\//.test(raw) || raw.length > 4096) {
    throw new CloudStreamHostError('mapping', 'Invalid provider url');
  }
  return raw;
}

export async function loadProvider(fileName: string): Promise<void> {
  if (!native) throw new CloudStreamHostError('not-available');
  try {
    const res = await native.loadProvider(fileName);
    if (!res?.ok) throw new CloudStreamHostError('load-error', res?.message);
  } catch (e) {
    rejectToError('load-error', e);
  }
}

export async function listProviders(): Promise<string[]> {
  if (!native) throw new CloudStreamHostError('not-available');
  try {
    return await native.listProviders();
  } catch (e) {
    rejectToError('search-error', e);
  }
}

export interface CloudStreamSearchHit {
  name: string;
  url: string;
  apiName: string;
  type: string;
  posterUrl: string | null;
  year: number | null;
}

export async function search(providerName: string, query: string): Promise<CloudStreamSearchHit[]> {
  if (!native) throw new CloudStreamHostError('not-available');
  try {
    const rows = await native.search(providerName, query);
    return (rows ?? []).map((r) => ({
      name: text(r.name, 240),
      url: normalizeProviderUrl(r.url),
      apiName: text(r.apiName, 80),
      type: text(r.type, 40),
      posterUrl: typeof r.posterUrl === 'string' ? r.posterUrl : null,
      year: typeof r.year === 'number' ? r.year : null,
    }));
  } catch (e) {
    rejectToError('search-error', e);
  }
}

export interface CloudStreamDetails {
  name: string;
  url: string;
  apiName: string;
  type: string;
  episodes: Array<{ name: string; url: string; episode: number; season: number }>;
}

export async function load(providerName: string, url: string): Promise<CloudStreamDetails> {
  if (!native) throw new CloudStreamHostError('not-available');
  try {
    const r = await native.load(providerName, url);
    const episodes = Array.isArray(r.episodes) ? (r.episodes as Array<Record<string, unknown>>) : [];
    return {
      name: text(r.name, 240),
      url: normalizeProviderUrl(r.url),
      apiName: text(r.apiName, 80),
      type: text(r.type, 40),
      episodes: episodes.map((ep) => ({
        name: text(ep.name, 200),
        url: normalizeProviderUrl(ep.url),
        episode: typeof ep.episode === 'number' ? ep.episode : 0,
        season: typeof ep.season === 'number' ? ep.season : 0,
      })),
    };
  } catch (e) {
    rejectToError('load-error', e);
  }
}

/** Resolve streams + subtitles. Zero links is an honest error, never success. */
export async function resolveLinks(
  providerName: string,
  data: string,
  playbackOrigins: string[],
): Promise<{ streams: IntegratedStream[]; subtitles: RemoteSubtitle[] }> {
  if (!native) throw new CloudStreamHostError('not-available');
  try {
    const res = await native.loadLinks(providerName, data);
    const links = Array.isArray(res.links) ? (res.links as Array<Record<string, unknown>>) : [];
    const subsRaw = Array.isArray(res.subtitles) ? (res.subtitles as Array<Record<string, unknown>>) : [];

    const subtitles: RemoteSubtitle[] = subsRaw
      .filter((s) => typeof s.url === 'string')
      .map((s, i) => ({
        id: `subtitle-${i}`,
        url: s.url as string,
        lang: text(s.lang, 40) || 'Unknown',
      }));

    const streams: IntegratedStream[] = [];
    for (const [i, l] of links.entries()) {
      // Unsupported types fail honestly at the boundary.
      const type = text(l.type, 20).toUpperCase();
      if (type === 'TORRENT' || type === 'DRM') continue;
      const url = typeof l.url === 'string' ? l.url : '';
      if (!url) continue;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        continue;
      }
      // Playback origin must be allowlisted; no arbitrary header/cookie pass-through.
      if (playbackOrigins.length && !playbackOrigins.includes(parsed.origin)) continue;
      const headers: Record<string, string> = {};
      const h = l.headers as Record<string, string> | undefined;
      if (h && typeof h === 'object') {
        for (const [k, v] of Object.entries(h)) {
          if (k.toLowerCase() === 'referer' || k.toLowerCase() === 'user-agent') headers[k.toLowerCase()] = v;
        }
      }
      const quality = typeof l.quality === 'number' && l.quality > 0 ? `${l.quality}p` : 'Unknown';
      streams.push({
        id: `cloudstream-${i}`,
        name: text(l.name, 120) || `Stream ${i + 1}`,
        description: `${quality} ${text(l.type, 20) || 'VIDEO'}`,
        url,
        headers,
        subtitles: [],
      });
    }
    if (streams.length === 0) throw new CloudStreamHostError('zero-links');
    return { streams, subtitles };
  } catch (e) {
    if (e instanceof CloudStreamHostError) throw e;
    rejectToError('http', e);
  }
}

/** Diagnostic export — redacts token/cookie/signed-URL values. */
export function redactDiagnostic(input: unknown): unknown {
  const REDACT = /(token|cookie|signed|auth|authorization|apikey|api_key)/i;
  if (typeof input === 'string') {
    return input.replace(/(\b\w*(token|cookie|signed|auth|key)\w*\b)([^,;\s]*)/gi, (_m, k: string) => `${k}=[REDACTED]`);
  }
  if (Array.isArray(input)) return input.map(redactDiagnostic);
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = REDACT.test(k) ? '[REDACTED]' : redactDiagnostic(v);
    }
    return out;
  }
  return input;
}
