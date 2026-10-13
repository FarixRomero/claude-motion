# Agent guide

This repo is a motion design toolkit for coding agents, built on [Remotion](https://remotion.dev) (React → video). It gives you taste rules with numbers, a loop for reviewing your own frames, and a procedural sound engine synced to the timeline. `EffortVideo` (22 s, 1080×1080, 60 fps) is a finished example to read and take apart, not a template you have to follow.

## Read first

The skills in `.claude/skills/` are the core of this repo. Claude Code and Cursor load them automatically; other agents should read them before touching a video.

- `motion-design/SKILL.md`: easing, springs, timing, type, color, texture, transitions, with numbers.
- `review-loop/SKILL.md`: how to look at your own renders and what to check. Mandatory before saying a video is done.
- `sound-design/SKILL.md`: writing a cue sheet for the `sfx` engine, levels, mastering, adding generators.
- `web-sims/SKILL.md`: simulations and 3D pieces built as one HTML page and captured frame by frame to 60 fps (`sims/`).

## Narrated projects

Use `projects/<id>/` for new narrated pieces. Initialize with `npm run project -- init <id>`.
The four folders are `001-Voz/`, `002-Cues/`, `003-Escenas/`, `004-Render/`.
See `projects/README.md` for CLI commands and the timeline contract.

- The user's script lives in `001-Voz/guion.md`. `npm run project -- prepare <id>` generates local Chatterbox V3 audio with the shared `mi-voz` profile, then transcribes the final WAV with faster-whisper.
- Read the script, listen to `001-Voz/voz.wav`, and review `002-Cues/validation.json` before designing scenes. Whisper timestamps are estimates; the recorded voice is the timing reference.
- For these pieces, use `002-Cues/Timeline.json` instead of the example's root timeline. Preserve its narration and sync metadata. Add storyboard scenes and named visual events anchored to its phrase/word IDs. Keep storyboard and assets in `003-Escenas/`, components under `src/<id>/`, and final media/review in `004-Render/`.
- When audio or transcription changes, existing visual definitions are preserved and flagged for review. Revisit their times and references before rendering; do not trust old ordinal word IDs to represent the same words.
- Keep generated WAVs and render outputs out of Git. `examples/` remains the gallery for finished pieces.

## Visual direction for new narrated videos

The user's default style is the reference in `projects/001-mi-video/003-Escenas/assets/style-reference.png`:
vertical 1080×1920, dark grid background, block-shaped illustrated characters,
large heavy sans-serif headlines, a code/interface window behind the characters,
a pill-shaped counter below, and white subtitles with the currently spoken word in cyan.
Use green for success and red for errors. Keep elements legible and characters clear
of essential interface labels. Reuse or adapt `src/001-mi-video/Character.tsx` and
its project palette for this style. Preserve the trademark specification below.
Default narration speed is 1.2×, preserving pitch; derive scene times and captions from the final sped-up recording.
For narrated videos, use voice and punctual sound effects by default. Do not add a sustained tonal pad or hum unless the user requests it.
This is the default for new pieces; the user can override it per project.

## Making a video

1. Agree on the message, a storyboard and the one hero moment with the user. Ask for format (1:1, 16:9, 9:16), length, brand colors and fonts if they matter.
2. Write every beat into a timeline JSON before any component code, one file per video (the example keeps its own at `timeline.json`).
3. Register a `<Composition>` in `src/Root.tsx` and put the scenes in their own folder under `src/`. Reuse `src/components/` (`Mask`, `Roll`, `Grain`, `Background`, `WobbleFilter`, `Spark`) and the helpers in `src/lib.ts` (easings, `prog`, `band`, `sp`).
4. Define the video's palette and fonts in one place, the way `C` and `F` are defined in `src/lib.ts`.
5. Run the review loop until a full pass is clean.
6. Write a cue sheet `sfx/cues/<name>.py` against the same timeline and render the sound.
7. Render, mux, and check loudness on the final file.
8. Add the piece to `examples/` with the prompt you were given.

## Simulations and 3D

When the idea is a simulation (agents, particles, a machine the camera flies through) rather than motion graphics, use the `sims/` pipeline instead of Remotion: one HTML page per piece, `render(t)` pure in time, `node sims/capture.mjs` steps it frame by frame into an mp4. Guide and commands: `sims/README.md`; workflow: `web-sims/SKILL.md`. Capture needs a Chromium: `npx playwright install chromium` once, or set `$CHROMIUM`.

## Tools

| Command | What it does |
|---|---|
| `npm run studio` | live preview of every composition |
| `npx remotion render <Id> out/<name>-silent.mp4 --scale=0.5` | fast draft render |
| `npm run sheet -- --video <mp4> --timeline <json>` | contact sheets at every beat → `out/sheets/` |
| `python3 -m sfx --list` | sound generators and what each is for |
| `python3 -m sfx sfx/cues/<name>.py` | render a cue sheet → mastered WAV (−14 LUFS) |
| `npm run wave -- <wav or mp4> --timeline <json>` | waveform with beat markers + loudness check |
| `npm run typecheck` | TypeScript check |

Mux picture and sound:

```bash
ffmpeg -y -i out/<name>-silent.mp4 -i public/<name>.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/<name>.mp4
```

The example has shortcuts: `npm run draft`, `npm run sfx`, `npm run build` (sound + render + mux → `out/effort.mp4`), `npm run cover`, `npm run gif`.

Requirements: Node 20+, Python 3, ffmpeg. If `/usr/bin/chromium` (or `$REMOTION_BROWSER`) exists it's used; otherwise Remotion downloads its own browser on first render.

## Layout

```
.claude/skills/          the rules: motion-design, review-loop, sound-design
sfx/                     sound engine: synth.py (generators), mix.py (placement, mastering), loudness.py
sfx/cues/effort.py       example cue sheet
scripts/sheet.mjs        contact sheets for visual review
scripts/wave.mjs         waveform + loudness check
src/lib.ts               easings and animation helpers, plus the example's palette (C), fonts (F), timeline (TL)
src/components/          reusable pieces: primitives (Mask, Roll, Spark, Grain, WobbleFilter), Background, useFonts
src/EffortVideo.tsx      example piece; its scenes in src/scenes/, its timeline in timeline.json
src/ArticleCover.tsx     example still: a 2000×800 cover drawn from the same timeline
examples/                gallery: prompt, process and result for each piece
sims/                    web sims → video: kit/, build.mjs, capture.mjs, beats.py, examples crawlers/ dossier/ engine/
sfx/dsp.py               filters, oscillators, reverb for longer sound scripts (used by sims/engine/sound.py)
```

## Conventions

- Every video must display the user's trademark exactly as `farix.romero`, discreetly and legibly throughout the piece. Match the CI/CD production chapter typography exactly: JetBrains Mono, weight 400, 19 px at 1080px, #9db3ce, letter spacing .19em, opacity 1, top 66 px and right 70 px.

- Animation is a pure function of `useCurrentFrame()`. No CSS animations, `Math.random()` or `Date`.
- No hardcoded start times, in components or in cue sheets; read them from the timeline.
- Colors and fonts only from the video's palette object.
- Match the existing code style: small helpers, inline styles, comments only for non-obvious constraints.
