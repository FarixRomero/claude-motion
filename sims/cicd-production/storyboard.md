# CI/CD a producción

33 segundos · 1080 × 1080 · 60 fps. Tres dimensiones reales con Three.js,
movimiento de cámara continuo y títulos de pantalla que permanecen quietos.
Azul para infraestructura existente, cian para el artefacto que avanza y
verde únicamente para verificaciones correctas, pods listos y éxito.

| Tiempo | Plano y acción | Texto principal | Sonido |
| --- | --- | --- | --- |
| 0–3 s | Plano general de toda la arquitectura. Pulso luminoso recorre el pipeline. La cámara viaja directamente hacia el editor y entra en la explicación. | ¿CÓMO LLEGA TU CÓDIGO A PRODUCCIÓN? | Pulso electrónico y whoosh de transición al editor |
| 3–9 s | Editor flotante en primer plano, `git push`, commit luminoso viaja a Git. El repositorio enciende la conexión de CI. | Todo comienza con un commit | Teclas, confirmación, whoosh de transferencia |
| 9–15 s | Travelling por TEST → BUILD → DOCKER. Pruebas correctas, aplicación compilada, capas se ensamblan en una imagen `app:v1.2.0` y se publican en REGISTRY. | Integración continua (CI) | Ticks, ensamblaje, confirmaciones |
| 15–21 s | El artefacto publicado alimenta CD. STAGING verifica la misma imagen; se activa PRODUCTION. Cámara se aproxima al clúster Kubernetes. | Despliegue continuo (CD) | Riser, activación de servidores, whoosh |
| 21–27 s | Plano cercano del clúster. Un pod nuevo se crea, pasa su sonda de disponibilidad y recibe tráfico antes de retirar un pod anterior. Se repite tres veces, con un máximo de cuatro pods simultáneos. | Rolling Update — Sin interrupciones* | Pulso rítmico, chimes al estar listos, retirada mecánica suave |
| 27–33 s | Pullback revela arquitectura completa, conexiones activas y panel de monitoreo con tres réplicas sanas y curva estable de latencia. Título final quieto casi cinco segundos. | DE TU CÓDIGO A PRODUCCIÓN / CI/CD Pipeline | Impacto de éxito, acorde resuelto, cola musical |

## Momento principal

Rolling update escalonado, nunca apagado colectivo. Configuración ilustrada:
3 réplicas, maxSurge=1, maxUnavailable=0, sondas de disponibilidad y capacidad
suficiente. El balanceador enruta exclusivamente a pods listos. Los pods
antiguos azules representan la revisión v1; los nuevos cian-verdes, revisión
v2, ejecutan la imagen app:v1.2.0. La revisión del despliegue y la etiqueta
de imagen son identificadores distintos.

Nota visible: «*Con sondas de disponibilidad y estrategia configuradas».
La disponibilidad continua se ilustra bajo esas condiciones, sin prometer
cero downtime universal.

## Exactitud

Git dispara CI; las pruebas son una puerta antes de compilar y empaquetar.
Docker genera una imagen, no un contenedor en ejecución. El registro guarda
la imagen. CD actualiza la especificación de Kubernetes y el clúster descarga
la misma imagen del registro. STAGING y PRODUCTION son entornos distintos.
Las métricas son ilustrativas; no se muestran cifras de una instalación real.

Referencias: https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/
y https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

El timeline contiguo es la fuente única de tiempos para cámara, estados,
transferencias, revisiones, música y efectos. Todo render es función pura de t.

## Ajuste de ritmo

A pedido del usuario se duplicó la duración para dar más tiempo a procesar
la información, conservando el diseño aprobado. Cada etapa tiene seis
segundos; cámara, transferencias y transiciones avanzan a media velocidad.
La música se recompone a 120 BPM para treinta segundos y los efectos
se sincronizan con el timeline ampliado.

## Introducción y firma

La introducción presenta el resultado antes de explicar el proceso. Se añaden tres segundos para conservar el ritmo pausado aprobado. `farix.romero` permanece en todos los planos con el estilo exacto del rótulo CI/CD · PRODUCCIÓN: JetBrains Mono 400, 19 px, #9db3ce, top 66 px, right 70 px y tracking +.19em.

## Ajuste definitivo de apertura

Se elimina el acercamiento inicial a Kubernetes y su confirmación DEPLOY SUCCESSFUL. La pregunta inicial conduce directamente al editor y «Todo comienza con un commit», con una transición suave de 2.15 a 3 segundos. Duración total: 33 segundos.
