"""D-minor electronic score and event cues for the CI/CD film.

All placement reads sims/cicd-production/timeline.json; audio is synthesized.
"""

import math
import random

from sfx.dsp import biquad, hp, lp, saw
from sfx.synth import SR, blip, chime, click, envelope, impact, pad, pop, riser, whoosh

TIMELINE = "sims/cicd-production/timeline.json"
OUT = "public/cicd-production.wav"
TARGET_LUFS = -14.0
SEED = 42

D2, D3, F3, A3, C4, E4 = 73.416, 146.832, 174.614, 220.0, 261.626, 329.628
CHORD = [D3, F3, A3, C4, E4]
ARP = [D3 * 4, A3 * 2, F3 * 4, E4 * 2, D3 * 4, C4 * 2, A3 * 2, F3 * 4]


def kick():
    phase = 0.0
    result = []
    for i in range(int(.38 * SR)):
        t = i / SR
        freq = D2 / 2 + 112 * math.exp(-t * 32)
        phase += math.tau * freq / SR
        attack = min(1, t / .003)
        result.append(math.sin(phase) * math.exp(-t * 13) * attack)
    return result


def hat():
    source = [(random.random() * 2 - 1) * math.exp(-i / (SR * .025)) for i in range(int(.095 * SR))]
    return biquad(source, hp(7000))


def snare():
    source = []
    for i in range(int(.19 * SR)):
        t = i / SR
        source.append((random.random() * 2 - 1) * math.exp(-t * 23) + .35 * math.sin(math.tau * D3 * t) * math.exp(-t * 32))
    return biquad(source, hp(1300))


def bass(freq):
    n = int(.37 * SR)
    tone = biquad(saw(freq, n), lp(650))
    return [v * min(1, i / (SR * .01)) * math.exp(-i / (SR * .13)) for i, v in enumerate(tone)]


def build_texture(duration):
    n = int(duration * SR)
    source = []
    for i in range(n):
        t = i / SR
        gate = (.3 + .7 * math.sin(t * math.tau * 18) ** 8)
        edge = min(1, t / .03, (duration - t) / .045)
        source.append((random.random() * 2 - 1) * gate * edge)
    return biquad(biquad(source, hp(1800)), lp(6500))


def score(mix, tl):
    git, ci, cd, rolling, success, music = (tl[k] for k in ("git", "ci", "cd", "rolling", "success", "music"))
    put = mix.put
    duration = tl["duration"]
    rate = tl.get("motion", {}).get("rate", 1)
    intro = tl["intro"]
    put(intro["pulseStart"], whoosh(intro["pulseEnd"]-intro["pulseStart"], 500, 4300, peak=.65), .14)
    put(intro["return"], whoosh(intro["exit"]-intro["return"], 3500, 650, peak=.5), .14)

    # Sustained stereo bed keeps the rhythmic track musical between events.
    volume = envelope([
        (music["start"], .35), (git["push"], .85), (ci["start"], 1),
        (cd["promote"], 1.1), (rolling["start"], .7),
        (success["impact"] - .15, .4), (success["impact"] + .2, 1.3),
        (success["fadeAudio"], 1), (duration, 0),
    ])
    mix.put_stereo(music["start"], *pad(duration, [(music["start"], CHORD), (music["resolve"], [D3, A3, D3 * 2, F3 * 2, E4])], volume=volume, tremolo=.08), gain=.043)

    drum, tick, clap = kick(), hat(), snare()
    for i, at in enumerate(music["beats"]):
        gain = 1.0 if at < success["start"] else .7
        put(at, drum, .145 * gain)
        put(at, bass(D2 if (i // 6) % 2 == 0 else A3 / 4), .14 * gain)
        put(at, tick, .063 * gain, -.22)
        put(at + .25, tick, .04 * gain, .22)
        if i % 2 == 1:
            put(at, clap, .063 * gain)
        note = ARP[i % len(ARP)]
        put(at + .25, blip(note, dur=.42, tau=.085), .095 * gain, -.42 + (i % 3) * .42)
        put(at + .375, blip(note, dur=.3, tau=.08), .023 * gain, .35 - (i % 3) * .35)

    mix.typing(git["typingStart"], git["typingEnd"], len("git push"), gain=(.13, .2), jitter=.003, spread=.15)
    put(git["push"], chime([D3 * 4, A3 * 4], dur=.55, tau=.16), .13)
    put(git["commitLeave"], whoosh(git["commitArrive"] - git["commitLeave"], 650, 4200, peak=.45), .17, -.3)
    put(git["commitArrive"], pop(D3 * 4, D3 * 2, dur=.14), .17, .2)
    put(git["trigger"], click(2800), .14, .3)

    put(ci["start"] - .12, whoosh(.4, 500, 3400, peak=.4), .15)
    put(ci["testStart"], build_texture(ci["testPass"] - ci["testStart"]), .055, -.4)
    put(ci["testPass"], chime([D3 * 4, F3 * 4, A3 * 4], dur=.7, tau=.2), .12, -.4)
    put(ci["buildStart"], build_texture(ci["buildPass"] - ci["buildStart"]), .065)
    put(ci["buildPass"], pop(A3 * 3, A3, dur=.14), .16)
    for i in range(3):
        put(ci["dockerStart"] + i * .07 / rate, click(1500 + i * 420), .14, -.15 + i * .15)
    put(ci["imageReady"], chime([D3 * 4, A3 * 4], dur=.8, tau=.25), .12, .4)
    put(ci["publish"], whoosh(ci["published"] - ci["publish"], 950, 4200, peak=.35), .15, .35)
    put(ci["published"], click(3100), .13, .35)

    put(cd["start"] - .1, whoosh(.45, 1100, 4600, peak=.35), .15)
    put(cd["stagingArrive"], pop(D3 * 4, D3 * 2), .13)
    put(cd["verify"], build_texture(cd["verified"] - cd["verify"]), .055)
    put(cd["verified"], chime([D3 * 4, F3 * 4, A3 * 4], dur=.8, tau=.24), .14)
    put(cd["promote"], riser(rolling["start"] - cd["promote"], f0=220, f1=3900), .10)
    put(cd["apply"], click(1800), .11, -.2)
    put(cd["pullImage"], whoosh(cd["imagePulled"] - cd["pullImage"], 4200, 1100, peak=.35), .12, -.35)
    put(rolling["start"] - .15, whoosh(.45, 4000, 600, peak=.6), .19)

    for i, (create, ready, retire) in enumerate(zip(rolling["create"], rolling["ready"], rolling["retire"])):
        pan = -.5 + i * .5
        put(create, whoosh(.25 / rate, 750, 3100, peak=.35), .11, pan)
        put(create, pop([D3, F3, A3][i] * 4, [D3, F3, A3][i] * 2), .15, pan)
        put(ready, chime([[D3 * 4, A3 * 4], [F3 * 4, C4 * 4], [A3 * 4, E4 * 4]][i], dur=.62, tau=.18), .12, pan)
        put(retire, whoosh(.22 / rate, 2400, 650, peak=.25), .08, pan)
        put(retire, click(1100, dur=.035), .08, pan)

    put(rolling["complete"], chime([D3 * 2, F3 * 2, A3 * 2, E4 * 2], dur=1.3, tau=.5), .12)
    put(success["start"], whoosh(success["pullbackEnd"] - success["start"], 800, 5400, peak=.65), .19)
    put(success["impact"], impact(dur=1.4), .23)
    put(success["impact"], chime([D3 * 2, F3 * 2, A3 * 2, E4 * 2, D3 * 4], dur=2.3, tau=.85), .18)
    put(success["endGlow"], chime([D3 * 4, A3 * 4, E4 * 4], dur=.48, tau=.15), .07)
