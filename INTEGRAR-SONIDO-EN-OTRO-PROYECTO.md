# Integrar efectos de sonido y masterización en otro proyecto

La mejor opción es **dar al agente una instrucción concreta y pedirle que consulte los archivos relevantes de este repositorio**. Este Markdown define el trabajo; el código sirve como referencia para implementarlo.

No necesita leer ni trasladar todo el toolkit de animación. Puede añadir el sistema de sonido al código que ya tienes, conservando su estructura y su motor visual.

## Instrucción lista para pegar

```text
Este proyecto ya tiene código. Quiero integrar únicamente generación
procedural de efectos de sonido y mezcla/masterización de audio.

Usa como referencia el repositorio:
/home/farixromero/motion-pipeline

Primero inspecciona el proyecto actual: sus eventos, duración, timeline,
audio existente y sistema de exportación. Conserva la implementación
visual y adapta el sonido a su arquitectura.

Lee estos archivos del repositorio de referencia:
- PROCESO-SONIDO.md
- .claude/skills/sound-design/SKILL.md
- sfx/synth.py
- sfx/mix.py
- sfx/loudness.py
- sfx/__main__.py y sfx/__init__.py
- sfx/dsp.py, si necesitas filtros, osciladores o reverberación adicionales.
- sfx/cues/high-traffic-architecture.py como ejemplo de sincronización.
  Si reutilizas sus funciones de percusión y bajo, consulta también
  sfx/cues/cicd_production_helpers.py.

Implementa lo siguiente:
1. Reutiliza o adapta el motor sfx para generar whooshes, clicks,
   confirmaciones, impactos y risers. Elige solo los que correspondan
   a eventos reales del proyecto.
2. Crea un cue sheet propio. Los tiempos deben salir del timeline
   o de los eventos del proyecto, no de una lista de segundos duplicada.
3. Usa una semilla fija para que el resultado sea reproducible.
4. Mezcla las capas con ganancias y posiciones estéreo controladas.
   Conserva el audio existente y ajusta su relación con los efectos.
   Añadir o reemplazar música no forma parte de este pedido.
5. Masteriza la mezcla completa, no cada efecto por separado:
   objetivo aproximado de -14 LUFS integrados y margen de pico verdadero
   de -2 dBTP en el WAV previo a la exportación.
6. Integra el audio en el sistema de exportación existente. Si produce
   un MP4, usa audio AAC estéreo y verifica un pico verdadero máximo
   de -1 dBTP en ese archivo final.
7. Revisa la sincronización, las transiciones, los cortes y los niveles.
   Escucha especialmente los puntos donde coinciden varios efectos.
   Corrige acentos redundantes y cambios de notas que distraigan.
8. Añade comandos reproducibles y una documentación breve con los
   archivos modificados, cómo generar el audio y cómo verificarlo.

Si ya existe audio que necesita remasterización, utiliza una ruta de
procesamiento de archivos, por ejemplo FFmpeg. Mix no importa archivos
de audio directamente: no presupongas una función de carga inexistente.

Evita instalar o trasladar Remotion, Three.js, Chromium u otras partes
del toolkit cuando solo necesitas el motor de sonido. Verifica primero
las herramientas disponibles y añade únicamente las necesarias.

Completa la integración y verifica la exportación real del proyecto.
No te quedes solo en una propuesta o en ejemplos de código.
```

La ruta anterior funciona si ambos proyectos están en la misma máquina y el agente puede acceder a ella. En otro entorno, proporciona una copia de los archivos indicados o acceso al repositorio. Puedes sustituir la ruta en la instrucción.

## Qué archivos trasladar

Para reutilizar el motor, conserva sus archivos dentro de una carpeta `sfx/`, ya que utilizan imports relativos:

| Archivo | Función |
| --- | --- |
| `sfx/__init__.py` | Define el paquete Python. |
| `sfx/__main__.py` | Permite ejecutar `python3 -m sfx`. |
| `sfx/synth.py` | Genera los efectos a partir de ondas, ruido y envolventes. |
| `sfx/mix.py` | Coloca los sonidos en el tiempo, mezcla, masteriza y escribe el WAV. |
| `sfx/loudness.py` | Calcula loudness integrado y pico verdadero para el motor. |
| `sfx/dsp.py` | Opcional: filtros, osciladores, delays y reverberación. |

Añade un cue sheet propio en `sfx/cues/`. Adapta sus rutas `TIMELINE` y `OUT` al proyecto destino. Los cue sheets de otros videos son referencias; sus tiempos, música y efectos no se deben trasladar automáticamente.

El motor básico utiliza la biblioteca estándar de **Python 3**. Para unir audio y video, procesar archivos existentes y verificar la exportación, utiliza **FFmpeg y FFprobe**. Node solo hace falta si decides reutilizar herramientas del repositorio como `scripts/wave.mjs`.

## Dos situaciones distintas

### Crear efectos nuevos

El motor `sfx` sintetiza muestras, las coloca en el tiempo y produce una mezcla. Por ejemplo, un evento de instancia lista puede disparar un acorde de confirmación, y una transferencia puede acompañarse con un whoosh.

### Remasterizar audio existente

Primero se lee y mide el archivo existente. Después se procesa su nivel y dinámica, se incorpora a la mezcla con los efectos y se masteriza el conjunto. Para normalización con FFmpeg, se puede usar `loudnorm` en dos pasadas: una para medir y otra con los valores medidos.

La ecualización y otros ajustes se eligen según el material. Alcanzar un nivel de loudness por sí solo no sustituye esa revisión ni la escucha de la mezcla.

## En qué momento se integra

1. **Inspección:** identificar eventos y audio disponible en el proyecto existente.
2. **Planificación:** decidir qué acciones necesitan efectos y tomar sus tiempos del timeline.
3. **Implementación:** añadir el motor y el cue sheet; generar pruebas si ayudan a evaluar el ritmo.
4. **Ajuste visual:** terminar los cambios de duración y acciones que afecten la sincronización.
5. **Producción final de audio:** generar los efectos, incorporar el audio existente, mezclar y masterizar.
6. **Exportación:** unir el audio con la salida del proyecto.
7. **Verificación:** comprobar la sincronización y medir el archivo exportado; corregir y repetir cuando haga falta.

Si la animación ya está terminada, se parte de sus tiempos actuales. No hace falta rehacer su storyboard o su implementación para añadir sonido.

## Comandos de referencia

Después de trasladar el paquete y crear el cue sheet correspondiente:

```bash
python3 -m sfx --list
python3 -m sfx sfx/cues/mi_video.py
```

`mi_video.py` es el archivo que debe crear el agente para tu proyecto; su nombre y sus rutas se adaptan a la estructura existente.

Para medir el audio de un MP4 con FFmpeg:

```bash
ffmpeg -hide_banner -nostats -i out/mi_video.mp4 \
  -map 0:a:0 -af ebur128=peak=true -f null -
```

La verificación debe hacerse sobre el archivo final, porque codificar el audio a AAC puede modificar su pico verdadero.
