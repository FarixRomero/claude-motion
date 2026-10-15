# Envío a producción

Petición: animar el guion de `projects/006-envio-prd/001-Voz/guion.md` con `$low-poly-dialogue`, cambios suaves y Claude desapareciendo al final.

Se reutilizan el humano low poly, Claude naranja, teclado, luces, bokeh, tipografía y subtítulos de la serie. 1080×1920 a 60 fps, voces mi-voz y claude-robot / robot-soft a 1.2×, efectos puntuales sin música.

La cámara conserva su encuadre con un acercamiento mínimo a lo largo de todo el video. Titulares y paneles se cruzan con fundidos de 0.42 s. El contador avanza con diez, cien y mil dólares. Al despedirse, Claude se desvanece durante 2.2 s con pequeños fragmentos que ascienden; el humano completa el remate frente a su puesto vacío.

La acotación de desaparición permanece intacta en el guion y se excluye expresamente de la voz mediante dialogue.stage_directions. La interfaz solo muestra una clave ficticia ocultada. Se corrigieron dos tomas de síntesis conservando las restantes; los importes se sintetizan como una cláusula con pausas, manteniendo las palabras y restaurando la puntuación original en los captions.

Fuentes en `src/006-envio-prd/`; plan, storyboard, cues y scripts en `003-Escenas/`. Medios y revisiones fuera de Git en `004-Render/`.

```bash
# Con voz y transcripción final verificadas:
python3 projects/006-envio-prd/003-Escenas/prepare-scenes.py
nice -n 12 python3 projects/006-envio-prd/003-Escenas/render-final.py
../videos_remotion/.venv-voice/bin/python projects/006-envio-prd/003-Escenas/review-final.py
```

La revisión incluye todos los turnos, los fundidos y una secuencia densa del efecto final. Solo después de inspeccionar las hojas actuales se registra review/report.json.

El render dedicado usa D3D12/NVIDIA y NVENC en segmentos de seis segundos con un navegador nuevo por segmento. Se mantienen los tiempos absolutos y se unen sin recodificar: evita la pérdida del contexto gráfico observada en un render largo. Los materiales transparentes de Claude se inicializan desde el primer frame para que el fundido actualice el shader correctamente.
