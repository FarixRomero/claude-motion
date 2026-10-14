"""Punctual keyboard, interface and fire effects; no music or tonal bed."""
import math
import random
from sfx.synth import SR, click, key, pop, whoosh, chime, impact

TIMELINE = 'projects/004-logs-errores/002-Cues/Timeline.json'
OUT = 'projects/004-logs-errores/004-Render/effects.wav'
TARGET_LUFS = -29.0
SEED = 42

def crackle(duration=.16):
    """Short dry burst for an individual tongue of fire, with no tonal component."""
    length = int(duration * SR)
    noise = [random.uniform(-1, 1) for _ in range(length)]
    low, out = 0.0, []
    for i, sample in enumerate(noise):
        low += .14 * (sample - low)
        t = i / SR
        out.append((sample - low) * math.exp(-t / .035) * min(1, t / .002) * .45)
    return out

def score(mix, tl):
    at = lambda name: tl['events'][name]['at']
    mix.put(at('production.enter'), click(900, .06), .035, pan=-.3)
    mix.put(at('fix.key'), key(), .22, pan=.3)
    mix.put(at('fix.key') + .08, chime([523.25,659.25,783.99], dur=.46, tau=.14), .08, pan=.2)
    mix.put(at('question.enter'), pop(420, 300, .13), .035, pan=-.3)
    for name in ('logs.off', 'alerts.off'):
        mix.put(at(name), click(850,.08), .16, pan=.3)
        mix.put(at(name)+.06, whoosh(.2,2200,600,peak=.18), .07, pan=.2)
    mix.put(at('logs.reaction'), pop(360,230,.15), .035, pan=-.25)
    mix.put(at('argument.jump'), key(), .12, pan=-.3)
    mix.put(at('dashboard.zero'), chime([523.25,659.25,783.99], dur=.6,tau=.16), .08, pan=.25)
    mix.put(at('fire.reveal'), whoosh(.55,180,2300,peak=.35), .14, pan=.35)
    mix.put(at('fire.reveal')+.25, impact(.55), .12, pan=.35)
    start = at('fire.reveal')
    for i in range(int((tl['duration']-start)/.19)):
        mix.put(start+i*.19, crackle(.12+(i%3)*.025), .035+(i%4)*.008, pan=.25+(i%3)*.15)
    mix.put(at('records.empty'), click(1100,.06), .10, pan=.2)
    mix.put(at('punchline.look')+.16, click(400,.05), .045)
