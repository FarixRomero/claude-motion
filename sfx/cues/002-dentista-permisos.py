"""Entry point for the dental dialogue cue sheet."""
from pathlib import Path
from runpy import run_path
_cues = run_path(str(Path(__file__).resolve().parents[2] / 'projects/002-dentista-permisos/003-Escenas/sound.py'))
TIMELINE = _cues['TIMELINE']
OUT = _cues['OUT']
TARGET_LUFS = _cues['TARGET_LUFS']
score = _cues['score']
