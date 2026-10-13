# CI/CD · De tu código a producción

33 s · 1080 × 1080 · 60 fps · H.264 + AAC estéreo.

La apertura muestra toda la arquitectura con «¿CÓMO LLEGA TU CÓDIGO A PRODUCCIÓN?», viaja directamente al editor para comenzar la explicación. La firma `farix.romero` coincide exactamente con la tipografía del rótulo CI/CD · PRODUCCIÓN: JetBrains Mono 400, 19 px, #9db3ce y margen superior/derecho 66/70 px.

Una cámara sigue un commit desde un editor hasta Git, recorre CI y la
publicación de una imagen Docker, verifica staging y se aproxima a Kubernetes.
El rolling update conserva tres réplicas listas, crea como máximo un pod
adicional y retira cada pod antiguo después de que su reemplazo está listo.
Un pullback revela la arquitectura completa y la telemetría de producción.

El texto explicativo está en español. Las etiquetas TEST, BUILD, DOCKER,
REGISTRY, STAGING y PRODUCTION se conservaron según el prompt. `v1` y `v2`
son revisiones del despliegue; la nueva revisión ejecuta `app:v1.2.0`.

- [Prompt recibido](prompt.md)
- [Storyboard](../../sims/cicd-production/storyboard.md)
- [Timeline compartido](../../sims/cicd-production/timeline.json)
- [Escena Three.js](../../sims/cicd-production/main.js)
- [Paleta y fuentes](../../sims/cicd-production/palette.js)
- [Cue sheet](../../sfx/cues/cicd-production.py)
- Resultado local: [cicd-production.mp4](../../out/cicd-production.mp4)

```bash
npm run build:cicd
npm run review:cicd
```

La música es sintetizada a 120 BPM en re menor: pad estéreo, bajo, bombo,
percusión y arpegios. Teclas, procesamiento, ensamblaje, transferencias,
sondas de disponibilidad y éxito leen el mismo timeline que la cámara.
No se usaron imágenes de stock ni audio externo.

## Ajuste solicitado

El usuario aprobó el aspecto visual y pidió una versión más lenta para
procesar mejor la información. Se extendió a treinta segundos, seis por
etapa, conservando la versión original en `out/cicd-production-15s.mp4`.

## Introducción solicitada

Se añaden tres segundos al inicio para mostrar el destino antes del recorrido, conservando los seis segundos por etapa. La versión aprobada anterior queda en `out/cicd-production-30s.mp4`. Cámara, música y efectos leen los nuevos tiempos del mismo JSON.

## Revisión

Cuatro pases de stills corrigieron el recorte inicial del editor, el espacio
de los títulos, las etiquetas que coincidían con la imagen y la posición del
monitoreo. La franja inferior oscura conserva la legibilidad del asterisco.
Se verificaron los 360 frames del rolling update: mínimo tres réplicas listas,
máximo cuatro pods simultáneos y final con tres pods nuevos, ninguno antiguo.

La versión anterior de treinta segundos se revisó en 106 fotogramas del MP4 final,
distribuidos en catorce contact sheets. El resumen visual está en
`out/sheets/cicd-overview-1.png`. Se verificaron los 1800 fotogramas a 60 fps,
la decodificación completa y el audio AAC estéreo a 48 kHz: −14.1 LUFS,
pico verdadero −1.4 dBFS. La forma de onda está en
`out/cicd-production-wave.png`.

La disponibilidad continua mostrada requiere sondas de disponibilidad,
estrategia de rolling update y capacidad adecuadas. No representa una
garantía universal de cero downtime. La telemetría es ilustrativa.

Referencias técnicas: [Docker](https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/)
y [Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

## Verificación anterior (con plano intermedio)

La introducción y la firma se revisaron en el MP4 exportado: 118 fotogramas en quince contact sheets (`out/sheets/cicd-final-1.png` a `cicd-final-15.png`), más dieciséis fotogramas de introducción y uniones en `cicd-intro-joins-1.png` y `cicd-intro-joins-2.png`. Se comprobó el regreso al editor, la continuidad entre capturas y el encuadre del final.

La firma y el encabezado comparten exactamente JetBrains Mono 400, 19 px, espaciado .19em, #9db3ce, opacidad 1 y posición superior 66 px. Los valores calculados del navegador coinciden en `out/cicd-brand-style.json`. Esta preferencia queda registrada en AGENTS.md y en el prompt base.

FFprobe confirma 33.000 s, 1980 fotogramas, 1080×1080, 60 fps, H.264 y AAC estéreo a 48 kHz. FFmpeg decodificó completamente imagen y audio sin errores ni cuadros negros inesperados. Mezcla final: −14.1 LUFS y pico verdadero −1.4 dBFS.

## Apertura directa

A pedido del usuario se elimina el plano intermedio de acercamiento a Kubernetes y DEPLOY SUCCESSFUL. La pregunta inicial conduce directamente al editor mediante una transición de cámara suave. El inicio dura tres segundos y la duración total conserva el ritmo aprobado de 33 segundos. Se retiran el impacto y la confirmación sonora intermedios; queda el whoosh de entrada al editor.

## Revisión final de apertura directa

Se revisaron los 115 fotogramas de los quince contact sheets actuales del MP4 final, más doce fotogramas de la transición y sus uniones (`out/sheets/cicd-direct-transition-1.png` y `cicd-direct-transition-2.png`). La pregunta inicial pasa directamente a «Todo comienza con un commit»; no aparece la confirmación intermedia ni el acercamiento a Kubernetes. La firma conserva el estilo exacto aprobado.

El inicio se capturó de nuevo a resolución nativa y los planos posteriores se reutilizaron de la versión aprobada. FFprobe verifica 33.000 segundos, 1980 fotogramas, 1080×1080, 60 fps y AAC estéreo a 48 kHz. La decodificación completa pasó sin errores ni cuadros negros inesperados. La música y los efectos se generaron de nuevo: −14.1 LUFS integrados, pico verdadero −2.2 dBFS.
