# Cero errores

## Prompt

«Quiero que me hagas el proyecto con estas escenas. Quiero que tenga este estilo de animación. Dime cómo serán las escenas antes de realizar el código de escenas y cues.»

Guion del usuario: [guion.md](../../projects/004-logs-errores/001-Voz/guion.md). Referencias: `inspiration/3d-1.png` y `inspiration/3d-3.png`. El usuario aprobó las nueve escenas antes de implementar.

## Dirección

Diálogo de comedia en un escenario 3D sobre un teclado: desarrollador azul, Claude naranja, monitor oscuro y servidores inicialmente fuera de plano. El dashboard en cero se contrapone al incendio. Cierre: Claude no tiene registros del incidente.

Three.js determinista, 1080×1920 a 60 fps. Captura con el pipeline sims, integrada en LogsErroresVideo de Remotion. Voz mi-voz a 1.2× para Yo y claude-robot / robot-soft para Claude, subtítulos por palabra, efectos puntuales y crepitaciones; sin música ni pad. Trademark permanente según AGENTS.md.

## Fuentes y resultado local

- [Storyboard](../../projects/004-logs-errores/003-Escenas/storyboard.md)
- [Timeline](../../projects/004-logs-errores/002-Cues/Timeline.json)
- [Escenario 3D](../../projects/004-logs-errores/003-Escenas/scene.js)
- [Cue sheet](../../projects/004-logs-errores/003-Escenas/sound.py)
- Video: `projects/004-logs-errores/004-Render/final.mp4` (generado, fuera de Git).
- Revisión y mediciones: `projects/004-logs-errores/004-Render/`.

## Reconstruir

Desde la raíz:

```bash
npm run project -- prepare 004-logs-errores
python3 projects/004-logs-errores/003-Escenas/sync-storyboard.py
nice -n 12 python3 projects/004-logs-errores/003-Escenas/render-final.py
```

Tras cualquier cambio de guion o voz, revisar validation.json y los nuevos IDs antes de capturar. Tras cambiar las escenas, reconstruir el HTML y revisar stills antes del render completo. `npm run studio` muestra LogsErroresVideo una vez creado el video 3D local; `npm run project -- render 004-logs-errores` reutiliza esa captura.

## Validación final

30.466667 s, 1080×1920, 60 fps. Audio final: −14.5 LUFS y −1.7 dBTP. Transcripción sin diferencias ni palabras inciertas; TypeScript pasa. Se inspeccionaron 21 fotogramas del MP4 final en tres hojas: [informe](../../projects/004-logs-errores/004-Render/review.md).

Para regenerar las hojas locales (Pillow está en el entorno compartido de voz):

```bash
../videos_remotion/.venv-voice/bin/python projects/004-logs-errores/003-Escenas/review.py
```
