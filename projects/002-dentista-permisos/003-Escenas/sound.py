"""Punctual interface cues; no sustained background."""
from sfx.synth import click, pop, whoosh, chime
TIMELINE = 'projects/002-dentista-permisos/002-Cues/Timeline.json'
OUT = 'projects/002-dentista-permisos/004-Render/effects.wav'
TARGET_LUFS = -30.0

def score(mix, tl):
    e = tl['events']
    at = lambda name: e[name]['at']
    mix.put(at('request'), click(1100), .04, pan=-.35)
    mix.put(at('hour'), pop(500, 739.99, .12), .045, pan=-.25)
    for name in ('hours.first', 'hours.repeat'):
        mix.put(at(name), click(950), .035, pan=.35)
    mix.put(at('request.repeat'), click(1100), .04, pan=-.35)
    mix.put(at('insist'), click(1200), .04, pan=-.35)
    mix.put(at('console.open'), whoosh(.2, 1000, 2800, peak=.25), .045)
    mix.typing(at('console.typeStart'), at('console.typeEnd'), len('DELETE FROM users;'), gain=(.025,.045), jitter=.003)
    mix.put(at('console.enter'), click(1400), .05)
    mix.put(at('database.clear'), whoosh(.23, 1100, 3300, peak=.35), .085)
    mix.put(at('database.clear'), click(1200,.06), .065)
    mix.put(at('permissions.limit'), chime([587.33,739.99,880], dur=.45, tau=.15), .035)
