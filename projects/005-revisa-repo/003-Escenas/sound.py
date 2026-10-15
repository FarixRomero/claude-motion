"""Punctual interface cues following the final recorded dialogue."""
from sfx.synth import click,key,pop,whoosh,impact
TIMELINE='projects/005-revisa-repo/002-Cues/Timeline.json'
OUT='projects/005-revisa-repo/004-Render/effects.wav'
TARGET_LUFS=-28.0
SEED=84

def score(mix,tl):
 at=lambda name:tl['events'][name]['at']
 mix.put(at('scan.start'),click(620,.07),.07,pan=.25)
 mix.put(at('war.question'),pop(410,280,.15),.05,pan=.25)
 for name in ['function.lines','variables.names','comment.warning','nested.count','queries.count','function.name']:
  mix.put(at(name),key(),.065,pan=.15)
 for i,name in enumerate(['job.auth','job.tax','job.mail','job.tickets']):
  mix.put(at(name),click(620+i*90,.06),.045,pan=-.2+i*.13)
 mix.put(at('logic.hostage'),pop(430,210,.13),.065)
 for name in ['advice.separate','advice.rename','advice.divide']:
  mix.put(at(name),click(880,.06),.045,pan=.1)
 mix.put(at('edit.blocked'),click(360,.09),.06)
 mix.put(at('break.count'),pop(440,180,.15),.08)
 mix.put(at('restart.hero'),whoosh(.3,260,2300,peak=.35),.14)
 mix.put(at('restart.hero')+.10,impact(.5),.16)
 mix.put(at('years.reaction'),key(),.045,pan=-.25)
