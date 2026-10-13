# Prompt recibido

Create a 15-second, 1080×1080, 60 FPS cinematic motion graphic showing how
software is deployed to production through a CI/CD pipeline.

Use a premium dark technology aesthetic, with 3D isometric infrastructure,
glowing blue and cyan connections, animated data particles, smooth camera
movements, depth, lighting, and synchronized electronic sound effects.

## Scene 1 — Git Push (0–3 seconds)

Start with a cinematic close-up of a floating code editor in a dark environment.
A developer executes `git push`. A glowing commit object emerges from the editor
and travels through an animated connection toward a Git repository.

The camera follows the commit as it enters the repository. The repository
illuminates and automatically triggers a CI/CD pipeline.

On-screen text: "Todo comienza con un commit".
Sound: keyboard typing, git push confirmation, digital whoosh.

## Scene 2 — Continuous Integration (3–6 seconds)

The camera moves horizontally into a futuristic CI pipeline represented by
three interconnected 3D modules labeled TEST, BUILD, DOCKER.

A glowing energy pulse travels between the modules. First, automated tests
execute and display a green checkmark. Next, the application is compiled.
Finally, the code transforms into a rotating Docker container image labeled
`app:v1.2.0`. The image travels toward a glowing container registry.

On-screen text: "Integración continua (CI)".
Sound: processing ticks, mechanical transitions, success chimes.

## Scene 3 — Continuous Deployment (6–9 seconds)

The camera follows the Docker image as it leaves the registry and enters a
deployment pipeline. Show two distinct environments represented as floating
server platforms: STAGING → PRODUCTION.

The image first reaches staging, where automated verification completes
successfully. A glowing connection activates toward production. The camera
accelerates toward a large 3D Kubernetes cluster.

On-screen text: "Despliegue continuo (CD)".
Sound: rising electronic transition, server activation, cinematic whoosh.

## Scene 4 — Kubernetes Rolling Update (9–12 seconds)

The camera flies inside the Kubernetes production cluster. Show three running
pods with blue lighting representing version v1. New pods with cyan-green
lighting representing version v2 begin appearing.

Animate a rolling update: new pods become ready before older pods are
progressively removed, preserving application availability. A load balancer
distributes animated incoming requests toward the healthy pods. Avoid depicting
all old pods shutting down simultaneously.

On-screen text: "Rolling Update — Sin interrupciones*".
Sound: rhythmic deployment pulses, pod activation chimes, soft mechanical impacts.

## Scene 5 — Production Success (12–15 seconds)

The camera rapidly pulls back, revealing the entire CI/CD architecture as one
interconnected futuristic system. Show the complete illuminated pipeline:
GIT → TEST → BUILD → DOCKER → REGISTRY → KUBERNETES → PRODUCTION.

Animated data packets move continuously through the architecture. A monitoring
dashboard appears beside the production cluster with healthy services, stable
latency, and successful deployment indicators.

Finish with a cinematic camera movement and a bold central title:
"DE TU CÓDIGO A PRODUCCIÓN". Below it, display: "CI/CD Pipeline".
End with a subtle glowing success animation synchronized with the final musical impact.

## Motion and sound direction

Use smooth camera tracking, cinematic zooms, clean 3D compositions, isometric
server structures, light trails, subtle particles, realistic depth, and
professional motion graphics. Keep the composition visually clean and readable
on mobile devices.

Use electronic background music with a steady rhythmic pulse. Synchronize
transitions, builds, pod creation, and deployment success with sound effects.
Avoid excessive text, generic stock footage, static PowerPoint-style slides,
and random animations.

Follow AGENTS.md: create the storyboard first, define the timeline, implement
motion graphics, generate synchronized sound, review rendered frames, correct
visual issues, and export the finished MP4.

Final output: out/cicd-production.mp4

*Do not guarantee zero downtime; depict continuous availability under a correctly
configured rolling update. algo asi

## Ajuste posterior del usuario

«esta perfecto, pero quisisera que dure mas, osea que sea mas lento en
procesar la informacion, el video esta bueno»

## Nuevo inicio solicitado

0–2 s: pipeline completo en perspectiva y pulso hasta producción. Título: «¿CÓMO LLEGA TU CÓDIGO A PRODUCCIÓN?»
2–3 s: acercamiento al clúster, iluminación verde y «DEPLOY SUCCESSFUL» con impacto sonoro. Regreso al editor para comenzar la explicación a los 3 s. Se añaden tres segundos al video de 30 s para preservar su ritmo pausado. Firma `farix.romero` con exactamente la fuente y colores del video de alta concurrencia.

Ajuste final de firma: mantener la fuente y el tamaño de alta concurrencia, pero usar el mismo tono tenue de «CI/CD · PRODUCCIÓN» (#9db3ce), para evitar un blanco demasiado brillante.

Ajuste definitivo: `farix.romero` debe tener exactamente la misma fuente, tamaño, peso, espaciado, color y opacidad que «CI/CD · PRODUCCIÓN»: JetBrains Mono 400, 19 px, tracking .19em, #9db3ce y opacidad 1. Alineados a top 66 px.

Último ajuste solicitado: eliminar la escena inicial que hace zoom a Kubernetes y muestra DEPLOY SUCCESSFUL. Pasar directamente de «¿Cómo llega tu código a producción?» a «Todo comienza con un commit».
