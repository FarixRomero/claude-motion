"""Capture the full existing scene, then mux and validate approved dialogue."""
from pathlib import Path
import importlib.util, os, shutil
PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parents[1]
spec = importlib.util.spec_from_file_location('pipeline',ROOT/'scripts/project.py')
pipeline = importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
original_run = pipeline.run

def run(command,env=None,capture=False):
    command=list(command)
    if command[:3]==['npx','remotion','render']:
        # La captura incluye ya escenas, interfaz, subtítulos y marca completos.
        shutil.copy2(PROJECT/'004-Render/scene-3d.mp4',command[4])
        return ''
    return original_run(command,env=env,capture=capture)

config=pipeline.read_json(PROJECT/'project.json')
with pipeline.project_lock(PROJECT):
    pipeline.check_prepared(PROJECT,config,pipeline.runtime())
    if os.environ.get('REUSE_CAPTURE') != '1':
        original_run(['node','sims/build.mjs','logs-errores'])
        env=dict(os.environ,GALLIUM_DRIVER='d3d12',MESA_D3D12_DEFAULT_ADAPTER_NAME='NVIDIA')
        original_run(['node',PROJECT/'003-Escenas/capture-gpu.mjs'],env=env)
    pipeline.run=run
    pipeline.render_project(PROJECT,config,pipeline.runtime())
