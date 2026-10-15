"""Punctual deploy, leak, cost and disappearance cues; no background bed."""
from sfx.synth import key,click,pop,whoosh,chime,impact
TIMELINE='projects/006-envio-prd/002-Cues/Timeline.json'
OUT='projects/006-envio-prd/004-Render/effects.wav'
TARGET_LUFS=-28.0
SEED=106

def score(mix,tl):
 at=lambda name:tl['events'][name]['at']
 mix.put(at('deploy.start'),key(),.07,pan=.2)
 mix.put(at('deploy.success'),chime([523.25,659.25,783.99],dur=.45,tau=.14),.065,pan=.25)
 for name in ['env.leaked','key.found','key.shared']:
  mix.put(at(name),click(530,.08),.065,pan=.25)
 mix.put(at('usage.detected'),pop(420,290,.15),.055)
 mix.put(at('cost.ten'),click(620,.06),.05)
 mix.put(at('cost.hundred'),pop(520,740,.12),.07)
 mix.put(at('cost.thousand'),whoosh(.28,350,2400,peak=.3),.12)
 mix.put(at('cost.thousand')+.10,impact(.5),.15)
 mix.put(at('usage.limit'),click(360,.1),.07)
 mix.put(at('claude.departure'),whoosh(1.3,1700,250,peak=.16),.075,pan=.35)
 mix.put(at('claude.gone'),click(280,.07),.035,pan=.35)
