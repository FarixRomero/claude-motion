"""Punctual UI cues; dialogue carries the mix, without sustained background."""
from sfx.synth import blip, click, impact, pop, whoosh

TIMELINE = 'projects/003-cambia-boton/002-Cues/Timeline.json'
OUT = 'projects/003-cambia-boton/004-Render/effects.wav'
TARGET_LUFS = -22


def score(mix, tl):
    e = tl['events']
    at = lambda name: e[name]['at']
    mix.put(at('blue'), click(1300), 0.12, -0.2)
    mix.put(at('green'), pop(600, 900), 0.10, -0.2)
    mix.put(at('redesign'), whoosh(0.35, 500, 1800, peak=0.3), 0.12, 0.3)
    mix.put(at('thirty'), impact(0.4), 0.16)
    for i in range(6):
        mix.put(at('thirty') + i * 0.06, click(800 + i * 120, dur=0.03), 0.065, (i - 2.5) * 0.13)
    for i, name in enumerate(('kubernetes', 'kafka', 'events')):
        mix.put(at(name), pop(600 + i * 100, 900 + i * 120), 0.09, -0.25 + i * 0.25)
    mix.put(at('color'), click(1400), 0.11, -0.3)
    mix.put(at('autoscale'), whoosh(0.45, 500, 1700, peak=0.3), 0.10, 0.3)
    mix.put(at('capacity'), blip(880, dur=0.16, tau=0.04), 0.09)
    mix.put(at('three'), pop(660, 440), 0.15)
    mix.put(at('you'), click(1000), 0.09, -0.25)
    mix.put(at('where'), whoosh(0.25, 1500, 500, peak=0.3), 0.08)
    mix.put(at('stillBlue') + 0.12, blip(220, dur=0.22, tau=0.08), 0.11)
