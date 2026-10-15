# ¿Aplicación o declaración de guerra?

Petición: usar `$low-poly-dialogue` con el guion de `projects/005-revisa-repo/001-Voz/guion.md`. Se conservan el humano low poly, Claude naranja y el escenario aprobados de la serie; el guion del archivo tiene 23 intervenciones.

Video vertical de 66.58 segundos, 1080×1920, 60 fps. La ventana de revisión muestra las 2.000 líneas, variables, comentario, if anidados, consultas duplicadas y las responsabilidades de hacerTodo. El momento principal es recomendar empezar desde cero, seguido de la reacción a los cinco años de desarrollo.

El plano general comparte su cámara entre respuestas breves. La reacción «¡cinco años!» reutiliza el primer plano humano. Subtítulos por palabra y marca farix.romero permanentes. Voces mi-voz y claude-robot / robot-soft, 1.2×; efectos puntuales, sin música.

Se corrigió la repetición de Hazlo en una intervención conservando los otros 22 WAVs. El No inicial de «No. Secuestra la lógica» se recuperó con una transcripción independiente sin VAD: el audio ya contenía esa palabra. La auditoría se guarda junto al render, manteniendo las señales originales de confianza.

Fuentes: `src/005-revisa-repo/`; plan, storyboard, cues y herramientas de reproducción en `003-Escenas/`. Media y hojas de revisión fuera de Git en `004-Render/`.

```bash
# Con la grabación final preparada y validada:
python3 projects/005-revisa-repo/003-Escenas/prepare-scenes.py
nice -n 12 python3 projects/005-revisa-repo/003-Escenas/render-final.py
../videos_remotion/.venv-voice/bin/python projects/005-revisa-repo/003-Escenas/review-final.py
```

Revisar las hojas actuales antes de registrar review/report.json. El render verifica duración, dimensiones, fps y niveles de audio. La ruta GPU usa D3D12 sobre RTX 4070 Ti y NVENC; los personajes de la plantilla se conservan sin modificación.
