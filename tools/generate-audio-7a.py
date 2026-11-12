"""Reproducible original oscillator audio, no third-party recordings or compositions."""
import math, wave, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'apps/mobile/assets/audio'
SR=22050

def write(name,duration,sample):
    data=[]
    for i in range(int(SR*duration)):
        t=i/SR
        fade=min(1,t/.025,(duration-t)/.06)
        x=max(-.85,min(.85,sample(t)*max(0,fade)))
        data.append(struct.pack('<h',round(x*32767)))
    with wave.open(str(ROOT/name),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes(b''.join(data))

def freq(midi):return 440*2**((midi-69)/12)
def demo(chords):
    def sample(t):
        chord=chords[min(3,int(t//3))];beat=t%3
        pad=sum(math.sin(2*math.pi*freq(n)*t) for n in chord)*.035
        step=int((t%3)*4)%len(chord);env=math.exp(-6*(t%.25))
        return pad+.07*env*math.sin(2*math.pi*freq(chord[step]+12)*t)
    return sample
ROOT.mkdir(parents=True,exist_ok=True)
for name,chords in [('music-drift.wav',[[48,55,60],[53,60,65],[50,57,62],[55,62,67]]),('music-orbit.wav',[[57,64,69],[53,60,65],[55,62,67],[52,59,64]]),('music-neon.wav',[[60,64,67],[57,60,64],[53,57,60],[55,59,62]])]:write(name,12,demo(chords))
for name,notes,duration in [('ui-click.wav',[900],.045),('reward-chime.wav',[523,659,784],.48),('wheel-tick.wav',[1250],.04),('wheel-end.wav',[440,660,880],.6),('summon-rise.wav',[220,330,440,660],.8)]:
    def tone(t,notes=notes,duration=duration):
        step=min(len(notes)-1,int(t/duration*len(notes)))
        return .18*math.exp(-5*((t/duration*len(notes))%1))*math.sin(2*math.pi*notes[step]*t)
    write(name,duration,tone)
print('Generated original demo music and oscillator SFX.')
