"""Supporting sounds anchored to the narration's visual timeline."""
from sfx.synth import blip, chime, click, impact, pop, whoosh

TIMELINE = 'projects/001-mi-video/002-Cues/Timeline.json'
OUT = 'projects/001-mi-video/004-Render/effects.wav'
TARGET_LUFS = -30.0


def score(mix, tl):
    events = tl['events']
    at = lambda name: events[name]['at']
    mix.put(at('book'), whoosh(0.2, 500, 1400, peak=0.25), 0.035, pan=-0.4)
    mix.put(at('split'), whoosh(0.55, 260, 2600, peak=0.4), 0.055)
    mix.put(at('split') + 0.4, impact(0.65), 0.08)
    mix.put(at('quote'), pop(440, 293.66, 0.12), 0.045, pan=0.4)
    mix.put(at('users'), blip(293.66, dur=0.18), 0.045)
    mix.put(at('hr'), blip(369.99, dur=0.18), 0.04)
    for index, name in enumerate(('kubernetes', 'gateway', 'observability', 'meetings')):
        mix.put(at(name), click(freq=900 + index * 140), 0.05, pan=-0.3 + index * 0.2)
    mix.put(at('error'), blip(146.83, dur=0.22), 0.03)
    mix.put(at('before'), chime([293.66, 369.99], dur=0.4, tau=0.13), 0.025)
    mix.put(at('disconnected'), click(500, dur=0.09), 0.04)
    mix.put(at('solve'), chime([293.66, 369.99, 440], dur=1.2, tau=0.4), 0.025)
