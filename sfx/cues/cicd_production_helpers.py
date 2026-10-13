"""Reusable electronic percussion and bass generators."""
import math
import random
from sfx.dsp import biquad, hp, lp, saw
from sfx.synth import SR
D2, D3 = 73.416, 146.832

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


