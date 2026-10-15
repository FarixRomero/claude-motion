"""Render isolated project artifacts with two workers, D3D12 on WSL and NVENC."""
from pathlib import Path
import importlib.util
import json, os

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parents[1]
spec = importlib.util.spec_from_file_location('pipeline', ROOT/'scripts/project.py')
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)
original_run = pipeline.run

def run(command, env=None, capture=False):
    command = list(command)
    if command[:3] == ['npx','remotion','render']:
        props = json.loads(Path(command[command.index('--props')+1]).read_text())
        command = ['node',PROJECT/'003-Escenas/gpu-render.mjs',command[4],json.dumps(props)]
        env = dict(os.environ if env is None else env)
        env.update(GALLIUM_DRIVER='d3d12',MESA_D3D12_DEFAULT_ADAPTER_NAME='NVIDIA')
    return original_run(command, env=env, capture=capture)

pipeline.run = run
with pipeline.project_lock(PROJECT):
    pipeline.render_project(PROJECT, pipeline.read_json(PROJECT/'project.json'), pipeline.runtime())
