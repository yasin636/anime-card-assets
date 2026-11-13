"""Public fixture probes only; no user URL/credential input, no binaries stored."""
import json, re, urllib.request
from urllib.parse import urljoin
BASE = 'https://raw.githubusercontent.com/yasin636/anime-card-assets/arena/cd835a4c-anime-card-assets/docs/watch-sources/byos-fixture/'
def get(url, limit=131072, byte_range=False):
    headers={'Range':'bytes=0-4095'} if byte_range else {}
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=30) as r:
        data=r.read(4096 if byte_range else limit+1)
        assert len(data)<=limit, 'Response exceeds fixture limit'
        return data

def hls(url, resolution=None, multi=False):
    master=get(url).decode('utf-8');assert master.startswith('#EXTM3U')
    if resolution: assert f'RESOLUTION={resolution}' in master
    if multi:
        languages=set(re.findall(r'TYPE=AUDIO,[^\n]*LANGUAGE="([^"]+)"',master))
        assert len(languages)>=2
        assert 'TYPE=SUBTITLES' in master
    variant=next(s.strip() for s in master.splitlines() if s.strip() and not s.startswith('#'))
    child=urljoin(url,variant); playlist=get(child).decode('utf-8');assert playlist.startswith('#EXTM3U')
    segment=next(s.strip() for s in playlist.splitlines() if s.strip() and not s.startswith('#'))
    data=get(urljoin(child,segment),byte_range=True)
    assert len(data)>16 and (data[0]==0x47 or data[4:8] in [b'ftyp',b'styp',b'moof']), 'Not expected TS/fMP4 bytes'
    print('::notice title=HLS media probe::PASS master, child and video segment bytes: '+('multi-audio/subtitles' if multi else resolution))

hls('https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',multi=True)
hls('https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',resolution='1920x1080')
manifest=json.loads(get(BASE+'manifest.json'));assert 'org.anigood.test:' in manifest['idPrefixes']
stream=json.loads(get(BASE+'stream/movie/org.anigood.test%3Amovie.json'));assert stream['streams'][0]['name'].startswith('TEST ONLY')
caption=get(stream['streams'][0]['subtitles'][0]['url']).decode('utf-8');assert caption.startswith('WEBVTT') and 'not a translation' in caption
print('::notice title=BYOS HTTP fixture::PASS live manifest, dotted-prefix stream JSON and subtitle VTT. Native phone playback remains separate.')
