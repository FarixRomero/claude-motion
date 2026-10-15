# HumanHead / CloseUpScene

Prueba de acabado: 1080×1920, 30 fps y cinco segundos. Incluye la primera intervención de Yo para validar la boca. La voz masculina suave aprobada de Claude se conserva para el video narrado.

Código completo en `src/005-low-poly-tokens/HumanHead.tsx` y `CloseUpScene.tsx`, con el registro `CloseUpScene` en `src/Root.tsx`. Colores y fuentes en `head-design.ts`; tiempos de esta prueba en `close-up.timeline.json`.

Cabeza de icosaedro (radio 1.2, detail 1), gorro de facetas seleccionadas con borde irregular, ocho conos de pelo, piezas faciales asimétricas y torso cúbico. Materiales del personaje planos, roughness 0.85 y sin texturas. El ojo izquierdo es una pirámide hundida y las dos piezas de ojo derechas son prismas verticales, según la especificación del usuario.

Iluminación cálida desde abajo/frente, contorno violeta, ambiente bajo, siete círculos dorados suaves y estrellas de icosaedro detail 0. Bloom usa threshold 0.6 e intensity 1.2. DepthOfField conserva el foco sobre la cara con bokehScale 5. ToneMapping ACES limita el recorte de los blancos.

Las animaciones dependen exclusivamente del frame de Remotion. No hay `requestAnimationFrame`, `Math.random` ni acumulación de estado. La barrera de captura espera a que el postprocesado esté montado y fuerza una pasada para el frame solicitado antes de liberar `delayRender`.

```bash
npx remotion render CloseUpScene out.mp4 --gl=angle
```

Para este proyecto, con baja prioridad y un solo proceso de render:

```bash
nice -n 12 npx remotion render CloseUpScene projects/005-low-poly-tokens/004-Render/close-up.mp4 --gl=angle --concurrency=1
```

Referencias de implementación: [ThreeCanvas](https://www.remotion.dev/docs/three-canvas), [Bloom](https://react-postprocessing.docs.pmnd.rs/effects/bloom), [DepthOfField](https://react-postprocessing.docs.pmnd.rs/effects/depth-of-field). Se instalaron versiones compatibles con React 19 y Three.js 0.186.1, manteniendo @remotion/three en 4.0.529 para coincidir con Remotion.

## Boca animada y alineación facial

HumanHead acepta `talking` y `audioVolume` (0–1). La boca se abre por volumen y queda cerrada en silencio. El RMS por frame de la primera intervención del usuario está en el timeline de prueba; la locución original permanece intacta.

Todas las piezas faciales están en un grupo cuyo origen es el punto medio del par de ojos rectangulares (X 0.375). La nariz y la boca usan X local 0. La profundidad se calcula sobre la superficie del icosaedro para evitar que las piezas queden dentro de la cabeza. El grupo sigue la rotación y el cabeceo del cráneo.

Última prueba: `004-Render/close-up-aligned.mp4`.
