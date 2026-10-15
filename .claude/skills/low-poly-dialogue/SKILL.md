---
name: low-poly-dialogue
description: Crea videos narrados reutilizando el humano low poly, Claude naranja y las escenas aprobadas de 005-low-poly-tokens en motion-pipeline. Úsalo para nuevos diálogos de esta serie, guiones similares o cuando el usuario pida el mismo estilo de animación.
---

# Serie de diálogos low poly

Reutiliza la plantilla de `assets/template/`, una copia de la versión aprobada de `005-low-poly-tokens`. El usuario quiere una serie consistente: conservar los personajes, el escenario y los planos; adaptar el diálogo y pequeños detalles, sin rediseñar cada video. Las instrucciones explícitas posteriores del usuario tienen prioridad.

Trabaja en `/home/farixromero/motion-pipeline`. Lee su `AGENTS.md` y las reglas locales de motion-design, review-loop y sound-design cuando corresponda. No modifiques un proyecto terminado para crear otro.

## Qué conservar

- Humano: `HumanHead.tsx` aprobado, cabeza facetada, gorro y pelo azules, facciones asimétricas, torso azul. Ojos, nariz y boca en el mismo grupo; la boca permanece bajo el centro de los ojos derechos y se abre con el volumen de su voz.
- Claude: `CubeCharacter.tsx`, cubo naranja, ojos verticales oscuros, cuatro patas desiguales, sin boca ni brazos. Habla mediante rebote y squash & stretch.
- Teclado gigante, fondo azul casi negro, iluminación cálida y rim violeta, bokeh dorado, estrellas, Bloom y DepthOfField. Mantener paleta, tipografía, subtítulos por palabra y marca `farix.romero`.
- Vertical 1080×1920, 60 fps. Diálogo y efectos puntuales, sin música ni pad. Cierre con dos segundos de lectura.
- Yo usa `mi-voz`. Claude usa siempre el preset de `scripts/project/speaker-defaults.json`: `claude-robot`, `robot-soft`, exaggeration 0.2, cfg_weight 0.65. Velocidad 1.2×. El usuario ya aprobó estas voces; no solicites otra aprobación para reutilizarlas.

## Crear otro episodio

```bash
python3 .claude/skills/low-poly-dialogue/scripts/init_project.py 006-claude-deploy --script /ruta/guion.md
```

El comando crea las cuatro carpetas del proyecto, copia los personajes y las escenas, aplica las voces y registra una composición independiente. Sin `--script` incluye el guion de ejemplo para editar. Rechaza destinos existentes. Los tiempos copiados son ejemplos marcados pendientes: **no representan la nueva grabación**.

Lee `003-Escenas/scene-plan.json` y `content.json` del nuevo proyecto. Estos son los puntos de adaptación habituales:

- `content.json`: nombres de variable, archivos, pruebas, documentos, importe y estimación. `headlines` permite sustituir el titular de una escena por un array de líneas (por ejemplo, `"variable": ["SOLO UN", "CAMBIO"]`). La interfaz y los titulares de la plantilla leen estos valores.
- `scene-plan.json`: orden de escenas, planos, pistas de cámara y palabras que disparan los eventos. Cambia los tokens de referencia a las palabras reales del nuevo guion.
- `storyboard.md`: qué se ve durante cada intervención y cuál es el remate.

Conserva las escenas de la biblioteca que sirven al guion. Si hay otra cantidad de intervenciones, adapta su asignación y los eventos en el plan; no añadas una escena nueva cuando basta con cambiar un texto, contador o gesto. Los IDs de evento que utiliza una escena deben existir. No inventes palabras para satisfacer un ancla ni alteres el guion del usuario.

```bash
npm run project -- prepare 006-claude-deploy
python3 projects/006-claude-deploy/003-Escenas/prepare-scenes.py
npm run typecheck
```

Revisa `validation.json` y las marcas de Whisper contra el audio nuevo; el preparador se detiene si hay diferencias o palabras pendientes de revisión. Después reconstruye todos los tiempos, captions y volúmenes desde esa grabación. El guion más reciente y el WAV final mandan; no reutilices IDs ordinales antiguos.

Cambiar únicamente la voz también exige resincronizar y renderizar: se reutilizan las escenas y geometrías, no un MP4 con duraciones antiguas. Para preservar intervenciones ya aprobadas al cambiar un solo hablante, usa el mecanismo de reutilización de WAVs de `001-Voz/ajustar-voz.py` de los proyectos existentes.

## Biblioteca de escenas

La plantilla incluye: tokens agotados, confirmación de Claude, solicitud pequeña, auditoría de archivos, reacción del humano, trabajo adicional, pregunta del costo, factura, indignación, permiso pendiente, pausa «…» y oferta final. Mantén el ritmo de comedia: petición sencilla → exceso de trabajo → costo → tarea sin resolver → remate. Cambia tema, cifras y textos cuando lo pida el guion.

No fuerces doce turnos si el guion tiene otra estructura. Reutiliza los planos general, humano y Claude, y las interfaces adecuadas. Mantén los componentes de personajes intactos salvo petición de diseño expresa.

## Continuidad y render

- `cameraTrack` controla la cámara independientemente del cambio de texto o turno. La pausa y la oferta final comparten la pista del plano de autorización; no reiniciar el dolly ni insertar un primer plano de medio segundo en «…». Conserva encuadre, escala y posición a ambos lados de la pausa.
- La animación depende del frame. No añadas bucles, aleatoriedad ni tiempos absolutos fuera del timeline.
- Si reutilizas la variante cúbica de `004`, actualiza sus sombras cada frame y evita recibir sombras sobre las caras. No congeles un mapa que incluya personajes móviles.
- En este WSL se verificó RTX 4070 Ti con `GALLIUM_DRIVER=d3d12`, `MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA`, Chrome for Testing y ANGLE. NVENC codifica H.264. El renderer incluido usa dos procesos y prioridad baja. No cambies configuraciones de sistema ni interrumpas renders ajenos.
- Comprueba el dispositivo real: «WebGL acelerado» puede ocultar llvmpipe por CPU. El renderer guarda `004-Render/gpu-device.json`. Si esa vía no está disponible, usa la ruta CPU de Remotion; conserva el acabado.

```bash
nice -n 12 python3 projects/006-claude-deploy/003-Escenas/render-final.py
../videos_remotion/.venv-voice/bin/python projects/006-claude-deploy/003-Escenas/review-final.py
```

Abre todas las hojas del MP4 actual y su waveform, además de los fotogramas antes y después de las pausas. Revisa caras, continuidad, subtítulos, marca y niveles de audio. Solo después registra la revisión con `record-review.py`. Entrega el MP4 final con una ruta nueva si una versión anterior podría estar almacenada en caché.
