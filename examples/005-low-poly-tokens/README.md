# Una variable, todos los tokens

Video narrado vertical de 40.82 s, 1080 × 1920, 60 fps.

Petición: adaptar el guion de `projects/005-low-poly-tokens/001-Voz/guion.md` al estilo 3D low poly de las referencias `inspiration/3d-1.png`, `3d-2.png` y `3d-3.png`. La persona tiene geometría facetada, gorro azul, facciones asimétricas y una boca animada alineada con los ojos; Claude conserva su silueta de cubo naranja. La voz masculina de Claude usa el efecto suave aprobado por el usuario.

Doce escenas alternan planos generales y primeros planos. La factura de $47 es el momento principal; el archivo conserva la variable original y el cierre ofrece gastar otros $80. Las palabras, los gestos y los efectos puntuales se anclan a la grabación aprobada mediante Timeline.json. No hay música de fondo.

Fuentes: `src/005-low-poly-tokens/`, storyboard y scripts en `projects/005-low-poly-tokens/003-Escenas/`. Resultado y revisión: `projects/005-low-poly-tokens/004-Render/final.mp4`, `final-sheet-*.png`, `final-wave.png` y `review/report.json` (medios generados fuera de Git).

Reproducir el render de producción con dos procesos de trabajo y aceleración gráfica D3D12 / codificación NVENC en WSL:

```bash
nice -n 12 python3 projects/005-low-poly-tokens/003-Escenas/render-final.py
../videos_remotion/.venv-voice/bin/python projects/005-low-poly-tokens/003-Escenas/review-final.py
```

Para validar únicamente el primer plano de cinco segundos:

```bash
npx remotion render CloseUpScene out/close-up.mp4 --gl=angle
```
