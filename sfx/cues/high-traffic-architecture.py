"""Growth, overload and controlled recovery, synchronized to the sim timeline."""
from sfx.cues.cicd_production_helpers import kick, hat, snare, bass
from sfx.synth import blip, chime, click, envelope, impact, pad, riser, whoosh

TIMELINE = "sims/high-traffic-architecture/timeline.json"
OUT = "public/high-traffic-architecture.wav"
TARGET_LUFS = -14.0
SEED = 73
D, F, A, C, E = 146.832, 174.614, 220.0, 261.626, 329.628


def score(mix, tl):
    c, o, p, s, end, music = (tl[k] for k in ("crowd", "overload", "protect", "scale", "stable", "music"))
    put = mix.put
    volume = envelope([(music["start"], .4), (c["hundredThousand"], .9), (music["tension"], .8),
                       (music["recover"], .9), (music["resolve"], 1.15), (end["fadeAudio"], .7), (tl["duration"], 0)])
    chords = [(music["start"], [D, F, A, E]), (music["tension"], [D, F, A/2, C]),
              (music["recover"], [D, A, C, E]), (music["resolve"], [D, A, D*2, E, F*2])]
    mix.put_stereo(music["start"], *pad(tl["duration"], chords, volume=volume, tremolo=.06), gain=.048)
    drum, hi, clap = kick(), hat(), snare()
    arp = [D*4, A*2, F*4, E*2, D*4, C*2, A*2, E*2]
    for i, at in enumerate(music["beats"]):
        tense = music["tension"] <= at < music["recover"]
        energy = .45 + .55 * min(1, at / c["hundredThousand"])
        if at >= end["fadeAudio"]:
            energy *= max(0, (tl["duration"]-at)/(tl["duration"]-end["fadeAudio"]))
        put(at, drum, (.13 if tense else .1)*energy)
        put(at, bass(D/2), .13*energy)
        put(at, hi, .044*energy, -.25)
        put(at+.25, hi, .033*energy, .25)
        if i % 2:
            put(at, clap, .055*energy)
        steady = music.get("growthLead") == "repetitive-tonic" and at < music["tension"]
        note = D*2 if steady else arp[i % 8]
        lead_gain = .045 if steady else (.042 if tense else .078)
        put(at+.25, blip(note, dur=.32, tau=.1), lead_gain*energy, -.4+(i%3)*.4)
        if tense:
            put(at+.375, click(1800, dur=.025), .026, .2)
    for at in [c["tenThousand"], c["fiftyThousand"], c["hundredThousand"]]:
        put(at, click(2000, dur=.018), .025)
    put(c["converge"], whoosh(c["hundredThousand"]-c["converge"], 400, 3200, peak=.45), .16, -.25)
    put(o["start"], whoosh(.8, 700, 2700, peak=.4), .13)
    put(o["rise"], riser(o["saturated"]-o["rise"], f0=150, f1=1800), .065)
    put(o["saturated"], impact(dur=.9), .19)
    for i in range(4):
        put(o["timeouts"]+i*.45, blip(A*2, dur=.13, tau=.045), .065, .3)
    put(p["rateLimit"], whoosh(p["rateActive"]-p["rateLimit"], 900, 3600, peak=.4), .15, -.4)
    put(p["rateActive"], chime([D*4, A*4], dur=.6, tau=.2), .13, -.4)
    put(p["shed"], whoosh(p["shedActive"]-p["shed"], 2800, 700, peak=.35), .14, .2)
    put(p["shedActive"], click(1800), .12, .2)
    for i, at in enumerate(music["beats"]):
        if p["rateActive"] <= at < s["start"] and i % 2:
            put(at, click(2400, dur=.025), .05, -.35)
    put(p["recovered"], chime([D*2, A*2, E*2], dur=1.2, tau=.4), .11)
    put(s["balance"], whoosh(s["distributed"]-s["balance"], 700, 3200, peak=.45), .13, .15)
    for i in range(3):
        put(s["distributed"]+i*.13, blip([D,F,A][i]*4, dur=.2), .09, -.4+i*.4)
    put(s["request"], click(3000), .1, .25)
    put(s["starting"], whoosh(s["ready"]-s["starting"], 450, 2200, peak=.3), .11, .4)
    put(s["ready"], chime([D*4, A*4, E*4], dur=1.1, tau=.36), .14, .4)
    put(s["route"], blip(D*4, dur=.22), .09, .4)
    put(end["start"], whoosh(end["hold"]-end["start"], 500, 3100, peak=.4), .14)
    put(end["title"], impact(dur=1.3), .16)
    put(end["title"], chime([D*2,F*2,A*2,E*2], dur=2.4, tau=.8), .14)
    put(end["pulse"], chime([D*4,A*4,E*4], dur=1.15, tau=.4), .15)
