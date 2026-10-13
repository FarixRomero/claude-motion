# 100 000 usuarios · Alta concurrencia y resiliencia

30 s · 1080×1080 · 60 fps · firma `farix.romero` permanente.

Una arquitectura Three.js fija cambia de estado mientras la cámara sigue el
tráfico. 1200 usuarios y mallas instanciadas representan población y solicitudes
escaladas. La sobrecarga forma una cola acotada. Las protecciones desvían
excedentes por política (HTTP 429) y presión de recursos (HTTP 503), mientras
las solicitudes admitidas continúan procesándose.

El balanceador comienza distribuyendo entre tres instancias disponibles;
el controlador solicita una cuarta, espera su preparación y solo luego la
incorpora. La base compartida conserva un presupuesto ilustrativo de 14 000
req/s. La recuperación se produce con 12 000 req/s admitidos y rechazos activos.

- [Prompt](prompt.md)
- [Storyboard](../../sims/high-traffic-architecture/storyboard.md)
- [Timeline](../../sims/high-traffic-architecture/timeline.json)
- [Simulación](../../sims/high-traffic-architecture/main.js)
- [Sonido](../../sfx/cues/high-traffic-architecture.py)
- [MP4 final](../../out/high-traffic-architecture.mp4)

```bash
npm run build:traffic
npm run review:traffic
```

Todo el estado se reconstruye a partir del tiempo solicitado. No es un benchmark
ni un simulador de rendimiento validado: es una explicación visual con métricas
ilustrativas. Los dos segundos de preparación son tiempo narrativo comprimido.
La capacidad de cada instancia no modifica la capacidad compartida de la DB.

La música y los efectos se sintetizan con el motor sfx: crecimiento, tensión,
recuperación y resolución. La firma está en el overlay independiente de cámara.

El primer pase detectó plataformas vacías prematuras, recorte del gateway al
revelar las réplicas y etiquetas demasiado densas en el cierre. Se corrigieron
la visibilidad de plataformas, el encuadre y las etiquetas del plano general.

La revisión del MP4 corrigió además la separación de la etiqueta de la DB,
su aparición durante la transición a protección, la salida explícita
`429 Too Many Requests` y el indicador de instancias en uso antes del balanceo.
Los tramos corregidos se capturaron de nuevo a resolución completa.

La revisión final incluye 89 fotogramas de beats, una secuencia a intervalos de
un segundo y fotogramas alrededor de las uniones de los tramos. Resumen:
`out/sheets/traffic-overview-1.png`. Formato verificado: H.264, 1800 fotogramas,
30 segundos exactos, 1080×1080 a 60 fps; AAC estéreo a 48 kHz. Audio: −14 LUFS,
pico verdadero −2.5 dBFS. Decodificación completa sin errores ni segmentos
negros detectados. Forma de onda: `out/high-traffic-architecture-wave.png`.

La comprobación de estados en los 1800 fotogramas confirmó: cola máxima de 24
elementos visuales, cero rutas a la cuarta instancia antes de readiness,
al menos 1000 req/s de margen entre carga admitida y capacidad después de la
protección, y firma presente en todos los estados. Solicitar fotogramas fuera
de orden produce el mismo estado. Resultados en `out/high-traffic-validation.json`.

Referencias: [Kubernetes HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/),
[Readiness](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/),
[Envoy overload manager](https://www.envoyproxy.io/docs/envoy/latest/configuration/operations/overload_manager/overload_manager).

## Ajuste de marca y música

La firma coincide con el estilo aprobado de CI/CD: JetBrains Mono 400, 19 px, #9db3ce, tracking .19em, opacidad 1, top 66 y right 70. Se actualizó el CSS de la simulación; para esta entrega se sustituyó la firma sobre los fotogramas aprobados mediante una máscara de los glifos y una capa de texto capturada con Chromium. Se comprobó la limpieza del fondo del encabezado en la revisión del MP4. Los estilos calculados se registran en `out/traffic-brand-style.json`.

La apertura musical mantiene una sola nota suave hasta la transición a tensión definida en el timeline. Los acentos tonales del contador se sustituyen por ticks discretos; desaparecen el cambio de altura y la nota adicional del segundo 2.3. Se conserva el whoosh de convergencia y se regenera toda la mezcla desde el cue sheet.

El MP4 actualizado se revisó en 89 fotogramas de doce contact sheets actuales (`out/sheets/traffic-final-1.png` a `traffic-final-12.png`) y en un fotograma nativo del inicio. FFprobe confirma 30 segundos, 1800 fotogramas, 1080×1080, 60 fps y AAC estéreo a 48 kHz. La decodificación completa pasó sin errores ni cuadros negros inesperados. Audio final: −14.0 LUFS y pico verdadero −2.2 dBFS.
