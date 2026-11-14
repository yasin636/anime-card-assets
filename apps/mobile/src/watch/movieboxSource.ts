/**
 * MovieBox OWN-ADAPTER wiring — opt-in Test Lab prototype (contract-only).
 *
 * Wires the bounded MovieBox data contract (movieboxAdapter.ts) onto the existing
 * data-only source boundary style of sourceIntegration.ts. This module performs NO
 * network call, NO signing, NO credential handling and NO stats/telemetry. It only
 * validates a configuration, builds the adapter request URL, and maps bounded
 * adapter output to the integrated-stream shape with the same header strictness as
 * the existing boundary (raw headers / cookie / DASH rejected).
 *
 * NOT MovieBox integration: the MovieBox backend access path is an unresolved
 * blocker (anonymous-token + x-client-token + x-tr-signature, not an authorized
 * partner API). A backend URL is NOT configured by default; without one the module
 * fails with a distinct "not-configured" error so the live gate cannot be bypassed
 * by accident. Until the live-access gate passes (real full video+audio, seek,
 * captions/qualities), this stays a prototype.
 *
 * Identity rules: provider subject IDs are long strings; never coerced to Number.
 * Explicit string IDs only; no title-first-result guessing.
 */
import type {IntegratedStream, RemoteSubtitle} from './sourceIntegration';
import {
  buildStreamUrl,
  parseStreams,
  type MovieBoxStreamEntry,
} from './movieboxAdapter';

/** Distinct, honest error surfacing for the MovieBox source boundary. */
export type MovieBoxSourceCode =
  | 'not-configured'
  | 'config'
  | 'mapping'
  | 'network'
  | 'timeout'
  | 'http'
  | 'response'
  | 'empty'
  | 'unsupported';

export class MovieBoxSourceError extends Error {
  constructor(
    readonly code: MovieBoxSourceCode,
    readonly status?: number,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export type MovieBoxSourceConfig = {
  /** Opt-in only. Must be true for any resolution to run. */
  enabled: boolean;
  /** Backend base URL. Empty/absent => not-configured (live gate not passed). */
  backendUrl: string;
  /** Playback origins that may supply a Referer for playback headers. */
  playbackOrigins: string[];
  /** ID prefixes that route lookups to this source (e.g. "mb:"). */
  idPrefixes: string[];
  /** Max integrated streams accepted from one response. */
  maxStreams?: number;
};

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;

function isOrigin(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 200) return false;
  try {
    const u = new URL(v);
    return u.pathname === '/' && !u.search && !u.hash;
  } catch {
    return false;
  }
}

/** Validate a MovieBox source config. Fails closed: no backend => not-configured. */
export function validateMovieBoxSource(input: unknown): MovieBoxSourceConfig {
  if (!record(input)) throw new MovieBoxSourceError('config');
  const enabled = input.enabled === true;
  const backendUrl = typeof input.backendUrl === 'string' ? input.backendUrl.trim() : '';
  if (!enabled) throw new MovieBoxSourceError('not-configured', undefined, 'MovieBox source is not enabled');
  if (!backendUrl) throw new MovieBoxSourceError('not-configured', undefined, 'MovieBox backend is not configured (live gate not passed)');
  let url: URL;
  try {
    url = new URL(backendUrl);
  } catch {
    throw new MovieBoxSourceError('config', undefined, 'Invalid MovieBox backend URL');
  }
  if (url.pathname !== '/' && !url.pathname.endsWith('/')) throw new MovieBoxSourceError('config', undefined, 'MovieBox backend URL must be a base URL');
  if (!url.protocol.startsWith('https:')) throw new MovieBoxSourceError('config', undefined, 'MovieBox backend must use https');
  if (!Array.isArray(input.playbackOrigins) || input.playbackOrigins.length > 12 || !input.playbackOrigins.every(isOrigin)) {
    throw new MovieBoxSourceError('config', undefined, 'Invalid playback origins');
  }
  if (!Array.isArray(input.idPrefixes) || input.idPrefixes.length > 40 || !input.idPrefixes.every((p: unknown) => typeof p === 'string' && p.length <= 80 && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(p))) {
    throw new MovieBoxSourceError('config', undefined, 'Invalid id prefixes');
  }
  const max = input.maxStreams === undefined ? 20 : input.maxStreams;
  if (typeof max !== 'number' || !Number.isSafeInteger(max) || max < 1 || max > 50) {
    throw new MovieBoxSourceError('config', undefined, 'Invalid maxStreams');
  }
  return {
    enabled: true,
    backendUrl: url.toString(),
    playbackOrigins: [...new Set(input.playbackOrigins as string[])],
    idPrefixes: [...new Set(input.idPrefixes as string[])],
    maxStreams: max,
  };
}

export type MovieBoxLookup = {
  type: 'movie' | 'series';
  /** Exact provider subject ID as a string. Never coerced to Number. */
  subjectId: string;
  season?: number;
  episode?: number;
};

/** Map a bounded adapter stream entry to an integrated stream, or null if rejected. */
export function toIntegratedStream(
  entry: MovieBoxStreamEntry,
  index: number,
  config: MovieBoxSourceConfig,
): IntegratedStream | null {
  // Same strictness as the existing boundary: raw custom headers are not an escape hatch.
  if (Object.keys(entry.headers).length > 0) return null;
  // Cookie-dependent DASH entries are not supported here (no cookie pass-through).
  if (entry.cookieDependent) return null;
  let url: URL;
  try {
    url = new URL(entry.url);
  } catch {
    return null;
  }
  const origins = config.playbackOrigins;
  if (!origins.includes(url.origin)) return null;
  const subs: RemoteSubtitle[] = [];
  void subs;
  void index;
  return {
    id: `moviebox-${index}`,
    name: entry.name,
    description: `${entry.quality} ${entry.format}${entry.codec ? ` · ${entry.codec}` : ''}`,
    url: entry.url,
    headers: {},
    subtitles: subs,
  };
}

/** Map adapter streams to integrated streams. Empty/absent streams are NOT success. */
export function toIntegratedStreams(
  streams: MovieBoxStreamEntry[],
  config: MovieBoxSourceConfig,
): IntegratedStream[] {
  if (streams.length > config.maxStreams!) throw new MovieBoxSourceError('response', undefined, 'too many streams');
  return streams
    .map((s, i) => toIntegratedStream(s, i, config))
    .filter((s): s is IntegratedStream => s !== null);
}

/** A fetcher abstraction so the wiring stays network-free and testable. */
export type MovieBoxFetch = (
  url: string,
  signal: AbortSignal,
) => Promise<{ok: boolean; status: number; text: () => Promise<string>}>;

/**
 * Resolve MovieBox streams for a lookup through the bounded adapter boundary.
 * Fails honestly: not-configured / mapping / http / network / response / empty.
 * A zero-stream result is an `empty` error — never reported as success.
 */
export async function resolveMovieBoxStreams(
  configInput: MovieBoxSourceConfig,
  lookup: MovieBoxLookup,
  fetchFn: MovieBoxFetch,
  signal: AbortSignal,
): Promise<IntegratedStream[]> {
  const config = validateMovieBoxSource(configInput);
  const season = lookup.type === 'series' ? lookup.season : 0;
  const episode = lookup.type === 'series' ? lookup.episode : 1;
  if (!SAFE_ID.test(lookup.subjectId)) throw new MovieBoxSourceError('mapping', undefined, 'Invalid subject id');
  if (lookup.type === 'series' && (!Number.isSafeInteger(season) || season! < 0 || !Number.isSafeInteger(episode) || episode! < 1)) {
    throw new MovieBoxSourceError('mapping', undefined, 'Invalid season/episode');
  }
  const url = buildStreamUrl(config.backendUrl, lookup.subjectId, season, episode);
  let resp: Awaited<ReturnType<MovieBoxFetch>>;
  try {
    resp = await fetchFn(url, signal);
  } catch (e) {
    if (signal.aborted) throw new MovieBoxSourceError('timeout');
    throw new MovieBoxSourceError('network');
    void e;
  }
  if (!resp.ok) throw new MovieBoxSourceError('http', resp.status, `MovieBox backend HTTP ${resp.status}`);
  let raw: string;
  try {
    raw = await resp.text();
  } catch {
    throw new MovieBoxSourceError('response');
  }
  const parsed = parseStreams(raw, lookup.subjectId, season, episode);
  if (parsed.count === 0) throw new MovieBoxSourceError('empty', undefined, 'MovieBox returned zero streams');
  const integrated = toIntegratedStreams(parsed.streams, config);
  if (integrated.length === 0) throw new MovieBoxSourceError('empty', undefined, 'MovieBox streams were all rejected by the boundary');
  return integrated;
}
