"""Punctual cues following the approved narration and visual events."""
from sfx.synth import key, click, pop, whoosh, chime, impact
TIMELINE = 'projects/005-low-poly-tokens/002-Cues/Timeline.json'
OUT = 'projects/005-low-poly-tokens/004-Render/effects.wav'
TARGET_LUFS = -28.0
SEED = 52

def score(mix, tl):
    at = lambda name: tl['events'][name]['at']
    mix.put(at('tokens.empty'), click(550,.07), .085, pan=-.3)
    mix.put(at('claude.complete'), chime([523.25,659.25,783.99],dur=.65,tau=.18), .1, pan=.3)
    mix.put(at('request.variable'), key(), .08, pan=-.3)
    mix.put(at('audit.enter'), whoosh(.32,400,2100,peak=.22), .085)
    for i in range(5):
        mix.put(at('files.count')+i*.09,key(),.035+i*.004,pan=-.35+i*.16)
    mix.put(at('files.reaction'), pop(430,260,.14), .045, pan=-.3)
    mix.put(at('tests.count'), pop(430,660,.15), .075, pan=-.2)
    mix.put(at('docs.count'), pop(520,784,.16), .075, pan=.2)
    mix.put(at('invoice.total'), whoosh(.32,220,2400,peak=.35), .14)
    mix.put(at('invoice.total')+.13, impact(.6), .16)
    mix.put(at('price.reaction'), key(), .08, pan=-.3)
    mix.put(at('variable.question'), click(900,.06), .055, pan=-.2)
    mix.put(at('changes.zero'), click(650,.09), .08)
    mix.put(at('permission.lock'), pop(320,180,.15), .065, pan=.2)
    # The user's ellipsis stays silent.
    mix.put(at('estimate.total'), pop(500,280,.18), .075, pan=.25)
