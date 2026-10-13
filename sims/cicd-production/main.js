import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {runSim} from '../kit/runtime.js';
import {createStage} from '../kit/stage3d.js';
import {clamp01, easeInOutCubic, easeOutCubic, keyed, lerp, prog, rng} from '../kit/util.js';
import {C, F} from './palette.js';
import TL from './timeline.json';

const DEFAULTS = {
  duration: TL.duration, fps: TL.fps, theme: 'dark', accent: C.cyan,
  hud: {enabled: false, title: 'CI/CD a producción', subtitle: ''},
  director: {enabled: false}, watermark: '', seed: 42,
};

const POS = {
  editor: [-16, 0, 0], git: [-9, 0, 0], test: [-2, 0, 0], build: [5, 0, 0],
  docker: [12, 0, 0], registry: [12, 0, -7], staging: [5, 0, -7], cluster: [-5, 0, -12],
};
const p3 = (p) => new THREE.Vector3(...p);
const mix3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const RATE = TL.motion?.rate ?? 1;
const on = (t, at, d = .32) => prog(t, at, at + d / RATE, easeOutCubic);
const fade = (t, start, exit) => on(t, start, .25) * (1 - on(t, exit, .18));

runSim(DEFAULTS, async ({canvas, hud, capture, cfg}) => {
  const stage = createStage(canvas, {viewport: () => ({top: innerHeight * .16, bottom: 0})}, {
    bg: C.bg, fov: 43, exposure: 1.15, capture,
    bloom: {strength: .45, radius: .42, threshold: .72},
  });
  const {scene, camera} = stage;
  scene.fog = new THREE.FogExp2(C.bg, .007);
  scene.add(new THREE.HemisphereLight(C.dim, C.bg, 1.65));
  const key = new THREE.DirectionalLight(C.white, 3.3);
  key.position.set(-12, 22, 16); scene.add(key);
  const rim = new THREE.DirectionalLight(C.blue, 4.2);
  rim.position.set(12, 10, -20); scene.add(rim);
  const fill = new THREE.PointLight(C.cyan, 80, 38, 2);
  fill.position.set(-2, 8, 4); scene.add(fill);

  const solid = (color = C.panel, extra = {}) => new THREE.MeshStandardMaterial({
    color, metalness: .45, roughness: .52, ...extra,
  });
  const neon = (color = C.cyan, intensity = .8, extra = {}) => solid(color, {
    emissive: color, emissiveIntensity: intensity, metalness: .15, roughness: .45, ...extra,
  });
  const bodyMat = solid();
  const brightMat = neon(C.cyan);
  const blueMat = neon(C.blue, .45);
  const greenMat = neon(C.green, .5);
  const glassMat = solid(C.blue, {transparent: true, opacity: .1, depthWrite: false, metalness: .1});
  const box = (parent, w, h, d, mat, at = [0, 0, 0], radius = .09) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), mat);
    mesh.position.set(...at); parent.add(mesh); return mesh;
  };
  const line = (parent, points, color = C.blue, opacity = 1) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p3));
    const l = new THREE.Line(geometry, new THREE.LineBasicMaterial({color, transparent: true, opacity}));
    parent.add(l); return l;
  };
  const platform = (parent, w = 4.6, d = 4.1) => {
    box(parent, w, .34, d, bodyMat, [0, -.17, 0], .16);
    box(parent, w - .2, .04, d - .2, solid(C.panelHi), [0, .03, 0]);
    const path = [[-w/2, .05, -d/2], [w/2, .05, -d/2], [w/2, .05, d/2], [-w/2, .05, d/2], [-w/2, .05, -d/2]];
    line(parent, path, C.blue, .85);
    box(parent, w - .6, .045, .06, blueMat, [0, -.18, d/2 + .02]);
    box(parent, w - .7, .025, d - .7, neon(C.blue, .2, {transparent: true, opacity: .14, depthWrite: false}), [0, -.38, 0]);
  };
  const groupAt = (position) => {
    const g = new THREE.Group(); g.position.set(...position); scene.add(g); return g;
  };
  const groups = Object.fromEntries(Object.entries(POS).map(([k, p]) => [k, groupAt(p)]));
  ['git', 'test', 'build', 'docker', 'registry', 'staging'].forEach((k) => platform(groups[k]));
  platform(groups.editor, 6.4, 4.3);
  platform(groups.cluster, 10.2, 8.4);

  const grid = new THREE.GridHelper(130, 65, C.grid, C.grid);
  grid.position.y = -.75; grid.material.transparent = true; grid.material.opacity = .28; scene.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), solid(C.bg, {metalness: .1, roughness: .95}));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.8; scene.add(floor);

  function texture(draw, w = 1024, h = 640) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());
    return {canvas: c, ctx, tex};
  }
  function screen(parent, width, height, tex, at, rotation = 0) {
    const mat = new THREE.MeshBasicMaterial({map: tex, transparent: false, toneMapped: false});
    const s = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    s.position.set(...at); s.rotation.y = rotation; parent.add(s); return s;
  }
  const editorTexture = texture(() => {});
  box(groups.editor, 5.7, 3.85, .19, solid(C.steel), [0, 2.55, 0]);
  screen(groups.editor, 5.5, 3.65, editorTexture.tex, [0, 2.55, .105]);
  box(groups.editor, 5.2, .045, .045, brightMat, [0, .5, .2]);
  const drawEditor = (t) => {
    const {ctx, canvas: c, tex} = editorTexture;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = C.panel; ctx.fillRect(0, 0, c.width, 72);
    ctx.fillStyle = C.dim; ctx.font = `24px ${F.mono}`; ctx.fillText('aplicación / servicio.ts', 40, 46);
    [C.blue, C.cyan, C.muted].forEach((color, i) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(900 + i * 32, 36, 7, 0, Math.PI * 2); ctx.fill(); });
    const lines = [
      ['01', 'export const aplicación = {', C.cyan],
      ['02', '  versión: "1.2.0",', C.white],
      ['03', '  estado: "lista",', C.white],
      ['04', '  ruta: "/salud"', C.white],
      ['05', '};', C.cyan],
    ];
    lines.forEach(([n, code, color], i) => {
      const y = 137 + i * 63;
      ctx.fillStyle = C.muted; ctx.font = `29px ${F.mono}`; ctx.fillText(n, 38, y);
      ctx.fillStyle = color; ctx.fillText(code, 115, y);
    });
    ctx.fillStyle = C.panel; ctx.fillRect(0, 469, 1024, 171);
    ctx.fillStyle = C.dim; ctx.font = `24px ${F.mono}`; ctx.fillText('TERMINAL', 40, 505);
    const command = 'git push';
    const chars = Math.floor(prog(t, TL.git.typingStart, TL.git.typingEnd) * command.length);
    ctx.font = `39px ${F.mono}`; ctx.fillStyle = C.cyan; ctx.fillText('›', 40, 564);
    ctx.fillStyle = C.white; ctx.fillText(command.slice(0, chars), 91, 564);
    if (t < TL.git.push && Math.floor(t * RATE * 4) % 2 === 0) ctx.fillRect(92 + chars * 23.5, 531, 19, 38);
    if (t >= TL.git.push) { ctx.fillStyle = C.green; ctx.font = `25px ${F.mono}`; ctx.fillText('✓ Cambios enviados a Git', 40, 615); }
    tex.needsUpdate = true;
  };

  function symbol(parent, draw, at, width = 2.3, height = 2.3) {
    const tx = texture((ctx, w, h) => {
      ctx.fillStyle = C.panel; ctx.fillRect(0, 0, w, h);
      draw(ctx, w, h);
    }, 512, 512);
    return screen(parent, width, height, tx.tex, at);
  }
  const gitTower = box(groups.git, 2.9, 2.9, 1.7, solid(C.panelHi), [0, 1.8, 0]);
  const gitSymbol = symbol(groups.git, (ctx) => {
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(205, 390); ctx.lineTo(205, 125); ctx.moveTo(205, 265); ctx.bezierCurveTo(345, 265, 345, 280, 345, 140); ctx.stroke();
    [ [205,120], [205,390], [345,140] ].forEach(([x,y]) => {ctx.fillStyle = C.panel; ctx.beginPath();ctx.arc(x,y,30,0,Math.PI*2);ctx.fill();ctx.stroke();});
  }, [0, 1.8, .87]);

  function module(parent, kind) {
    const g = new THREE.Group(); parent.add(g);
    box(g, 2.9, 2.5, 2, solid(C.panelHi), [0, 1.6, 0]);
    for (let i = 0; i < 3; i++) box(g, 2.45, .07, .08, blueMat, [0, .75 + i * .32, 1.04]);
    const badge = symbol(g, (ctx) => {
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (kind === 'test') {
        ctx.strokeRect(140,130,232,252);
        ctx.beginPath();ctx.moveTo(180,220);ctx.lineTo(213,247);ctx.lineTo(251,195);ctx.stroke();
        ctx.beginPath();ctx.moveTo(180,313);ctx.lineTo(213,337);ctx.lineTo(251,287);ctx.stroke();
        ctx.beginPath();ctx.moveTo(286,224);ctx.lineTo(339,224);ctx.moveTo(286,316);ctx.lineTo(339,316);ctx.stroke();
      } else {
        ctx.beginPath();ctx.moveTo(120,235);ctx.lineTo(256,160);ctx.lineTo(392,235);ctx.lineTo(256,312);ctx.closePath();ctx.stroke();
        ctx.beginPath();ctx.moveTo(120,278);ctx.lineTo(256,354);ctx.lineTo(392,278);ctx.moveTo(120,322);ctx.lineTo(256,397);ctx.lineTo(392,322);ctx.stroke();
      }
    }, [0, 1.83, 1.03], 1.65, 1.65);
    const lamp = box(g, .22, .22, .06, neon(C.blue, .7), [1.1, 2.55, 1.04]);
    return {group: g, lamp, badge};
  }
  const test = module(groups.test, 'test');
  const build = module(groups.build, 'build');
  const checkTexture = texture((ctx,w,h)=>{
    ctx.fillStyle=C.panel;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=C.green;ctx.lineWidth=14;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.arc(256,256,155,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(165,257);ctx.lineTo(232,322);ctx.lineTo(350,192);ctx.stroke();
  },512,512);
  const testTexture=test.badge.material.map;
  const buildTexture=build.badge.material.map;
  const stagingCheck=screen(groups.staging,1.6,1.6,checkTexture.tex,[0,3.7,.6]);

  function imageObject(parent, scale = 1) {
    const g = new THREE.Group(); parent.add(g); g.scale.setScalar(scale);
    const layers = [];
    for (let i = 0; i < 3; i++) {
      const layer = box(g, 2.5, .48, 1.9, solid(i === 2 ? C.panelHi : C.panel), [0, i * .53, 0]);
      box(layer, 2.12, .025, .035, brightMat, [0, .17, .97]);
      for (let j = 0; j < 4; j++) box(layer, .21, .23, .025, neon(C.cyan, .2), [-.85 + j * .55, 0, .965]);
      layers.push(layer);
    }
    return {group: g, layers};
  }
  const docker = imageObject(groups.docker); docker.group.position.y = .65;

  function rack(parent, x = 0, z = 0, w = 2.4, h = 2.65) {
    const g = new THREE.Group(); parent.add(g); g.position.set(x, 0, z);
    box(g, w, h, 1.55, solid(C.panelHi), [0, h/2 + .32, 0]);
    for (let i = 0; i < 4; i++) {
      box(g, w - .3, .3, .075, bodyMat, [0, .69 + i * .5, .82]);
      box(g, .11, .065, .025, brightMat, [-w/2 + .3, .69 + i * .5, .87]);
      box(g, w*.44, .035, .025, solid(C.muted), [w*.08, .69 + i * .5, .87]);
    }
    return g;
  }
  rack(groups.registry);
  rack(groups.staging, -.85, 0, 1.5, 2.5); rack(groups.staging, .9, -.5, 1.5, 2.5);

  const cluster = groups.cluster;
  const successHalo = new THREE.Mesh(new THREE.TorusGeometry(5.2,.028,6,64), neon(C.green,.6,{transparent:true,opacity:0,depthWrite:false}));
  successHalo.rotation.x=-Math.PI/2;successHalo.position.y=.08;cluster.add(successHalo);
  const bounds = [[-4.8, .15, -3.9],[4.8,.15,-3.9],[4.8,.15,3.9],[-4.8,.15,3.9],[-4.8,.15,-3.9]];
  line(cluster, bounds, C.cyan, .5);
  // Transparent enclosure suggests the cluster boundary without obscuring pods.
  box(cluster, 9.7, 3.0, .055, glassMat, [0, 1.6, -3.9]);
  [ -4.8, 4.8 ].forEach((x) => {
    line(cluster, [[x,.1,-3.9],[x,3.7,-3.9],[x,3.7,3.9],[x,.1,3.9]], C.blue, .35);
  });
  const kubemark = symbol(cluster, (ctx) => {
    const x = 256, y = 256;
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 15;
    ctx.beginPath();ctx.arc(x,y,80,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7;
      ctx.beginPath();ctx.moveTo(x+Math.cos(a)*46,y+Math.sin(a)*46);ctx.lineTo(x+Math.cos(a)*165,y+Math.sin(a)*165);ctx.stroke();
      ctx.beginPath();ctx.arc(x+Math.cos(a)*165,y+Math.sin(a)*165,16,0,Math.PI*2);ctx.stroke();
    }
    ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.stroke();
  }, [0, 2.45, -3.84], 1.55, 1.55);

  function pod(isNew, x) {
    const g = new THREE.Group(); cluster.add(g);
    const mat = solid(isNew ? C.panelHi : C.steel, {emissive: isNew ? C.cyan : C.blue, emissiveIntensity: .12});
    box(g, 1.8, 1.8, 1.55, mat, [0, 1.0, 0]);
    const stripe = box(g, 1.5, .07, .045, isNew ? brightMat : blueMat, [0, 1.62, .8]);
    const lamp = box(g, .2, .2, .06, neon(isNew ? C.cyan : C.blue, .7), [.57, .55, .8]);
    box(g, 1.25, .045, .035, solid(C.muted), [-.07, .66, .8]);
    box(g, 1.25, .045, .035, solid(C.muted), [-.07, .9, .8]);
    for (let j = 0; j < 3; j++) box(g, .18, .025, 1.15, isNew ? brightMat : blueMat, [-.55+j*.55,1.92,0]);
    g.position.set(x, .15, -.55);
    return {group: g, lamp, stripe, mat, x};
  }
  const oldPods = [-3, 0, 3].map((x) => pod(false, x));
  const newPods = [-3, 0, 3].map((x) => pod(true, x));
  const balancer = box(cluster, 3.2, .45, 1, solid(C.panelHi), [0, .55, 2.8]);
  box(balancer, 2.8, .055, .035, greenMat, [0, .09, .53]);
  for (let i = 0; i < 3; i++) line(cluster, [[0,.48,2.3], [0,.48,1.45], [-3+i*3,.48,1.45],[-3+i*3,.48,.22]], C.blue, .6);

  function connection(a, b, activeAt, shape = []) {
    const start = [a[0], .18, a[2]], end = [b[0], .18, b[2]];
    const coords = [start, ...shape, end];
    const curve = new THREE.CatmullRomCurve3(coords.map(p3), false, 'centripetal');
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .036, 6, false), neon(C.blue, .25,{transparent:true}));
    scene.add(tube);
    const packets = [];
    for (let i = 0; i < 4; i++) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), brightMat); scene.add(sphere); packets.push(sphere);
    }
    return {curve, tube, packets, activeAt};
  }
  const links = [
    connection(POS.editor, POS.git, TL.git.push),
    connection(POS.git, POS.test, TL.git.trigger),
    connection(POS.test, POS.build, TL.ci.testPass),
    connection(POS.build, POS.docker, TL.ci.buildPass),
    connection(POS.docker, POS.registry, TL.ci.publish),
    connection(POS.registry, POS.staging, TL.cd.transfer),
    connection(POS.staging, POS.cluster, TL.cd.promote, [[1,.18,-7],[-5,.18,-7]]),
    connection(POS.registry, POS.cluster, TL.cd.pullImage, [[12,.18,-18],[-5,.18,-18]]),
  ];
  const commit = new THREE.Group(); scene.add(commit);
  const core = box(commit, .58, .58, .58, neon(C.cyan, 1), [0,0,0], .06);
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.82,.82,.82)), new THREE.LineBasicMaterial({color:C.cyan})); commit.add(cage);
  const travelers = imageObject(scene, .48);
  const traffic = [];
  for (let i = 0; i < 12; i++) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(.047, 7, 5), greenMat); cluster.add(sphere); traffic.push(sphere);
  }
  const r = rng(cfg.seed);
  const dust = [];
  const dustGeo = new THREE.SphereGeometry(.023, 5, 4);
  const dustMat = neon(C.blue, .3, {transparent: true, opacity: .5});
  for (let i=0;i<65;i++) {
    const mesh = new THREE.Mesh(dustGeo, dustMat);
    const base = [r()*45-23,r()*10+1,r()*30-21];
    mesh.position.set(...base);scene.add(mesh);dust.push({mesh,base,phase:r()*Math.PI*2});
  }

  const film = document.createElement('div'); film.className = 'film';
  Object.entries(C).forEach(([k,v])=>film.style.setProperty(`--film-${k}`,v));
  Object.entries(F).forEach(([k,v])=>film.style.setProperty(`--film-${k}`,v));
  film.innerHTML = `
    <div class="vignette"></div>
    <div class="footer-shade"></div>
    <div class="chapter"><span><i class="chapter-line"></i>CI/CD <b>·</b> PRODUCCIÓN</span></div>
    <div class="trademark">farix.romero</div>
    <div id="heading" class="heading"></div>
    <div id="anchors"></div>
    <div id="detail" class="detail"></div>
    <div id="footnote" class="footnote"></div>
    <div id="monitor" class="monitor">
      <div class="label">MONITOREO ACTIVO</div>
      <div class="health">Servicios sanos <span>3/3</span></div>
      <div class="latency">Latencia estable</div>
      <svg viewBox="0 0 250 53"><path id="chart-fill"/><path id="chart-line" fill="none" stroke-width="2.5"/></svg>
      <div class="success">✓ Despliegue correcto</div>
    </div>
    <div class="progress"><i id="progress"></i></div>
    <div id="rail" class="rail"></div>
  `;
  document.getElementById('app').appendChild(film);
  const el = (id) => film.querySelector(`#${id}`);
  const heading = el('heading'), detail = el('detail'), footnote = el('footnote');
  const anchorRoot = el('anchors');
  const anchorNodes = [];
  const labels = [
    ['editor','CÓDIGO',[0,4.8,0]], ['git','GIT',[0,3.8,0]], ['test','TEST',[0,3.4,0]],
    ['build','BUILD',[0,3.4,0]], ['docker','DOCKER',[0,3.2,0]], ['registry','REGISTRY',[0,3.7,0]],
    ['staging','STAGING',[0,3.6,0]], ['cluster','KUBERNETES',[0,4.3,-1.5]],
  ];
  labels.forEach(([name, text, offset]) => {
    const d = document.createElement('div');d.className = 'anchor';anchorRoot.appendChild(d);
    anchorNodes.push({name,text,offset,el:d});
  });
  const podAnchors = Array.from({length:6},()=>{const d=document.createElement('div');d.className='anchor';anchorRoot.appendChild(d);return d;});
  const balancerLabel = document.createElement('div');balancerLabel.className='anchor';anchorRoot.appendChild(balancerLabel);
  const imageLabel = document.createElement('div');imageLabel.className='anchor';anchorRoot.appendChild(imageLabel);
  const railNames = ['GIT','TEST','BUILD','DOCKER','REGISTRY','KUBERNETES','PRODUCTION'];
  const railStarts = [TL.git.push,TL.ci.testStart,TL.ci.buildStart,TL.ci.dockerStart,TL.ci.published,TL.cd.apply,TL.rolling.complete];
  const rail = railNames.map((s,i)=>`<span class="step" data-i="${i}"><i class="dot"></i>${s}</span>`).join('<span class="arrow">›</span>');
  el('rail').innerHTML = rail;
  const railNodes = [...el('rail').querySelectorAll('.step')];
  const cameraPositions = TL.camera.map((k)=>[k.at,k.position.split(',').map(Number)]);
  const cameraTargets = TL.camera.map((k)=>[k.at,k.target.split(',').map(Number)]);

  const place = (dom, point, opacity = 1, offsetY = 0) => {
    const pr = stage.project(point);
    const s = innerWidth / 1080;
    dom.style.left = `${pr.x/s}px`;dom.style.top = `${pr.y/s + offsetY}px`;
    const visible = pr.visible && pr.x/s > 60 && pr.x/s < 1020 && pr.y/s > 340 && pr.y/s < 905;
    dom.style.opacity = visible ? opacity : 0;
  };

  return {
    resize() { stage.resize(); film.style.transform = `scale(${Math.min(innerWidth/1080,innerHeight/1080)})`; },
    render(t) {
      const clock = t * RATE;
      const intro = t < TL.intro.exit;
      const sceneIndex = t < TL.ci.start ? 0 : t < TL.cd.start ? 1 : t < TL.rolling.start ? 2 : t < TL.success.start ? 3 : 4;
      const final = on(t,TL.success.start,.55);
      camera.position.set(...keyed(cameraPositions,t));
      camera.lookAt(...keyed(cameraTargets,t));
      camera.updateMatrixWorld();
      drawEditor(t);
      ['test','build','docker'].forEach((name)=>{groups[name].visible=intro||t>=TL.git.trigger;});
      groups.registry.visible=intro||t>=TL.ci.imageReady;
      groups.staging.visible=intro||t>=TL.cd.start-.3;
      groups.cluster.visible=intro||t>=TL.cd.start-.1;
      groups.editor.position.y = Math.sin(clock*.7)*.07;
      gitTower.material.emissive.set(C.cyan);
      gitTower.material.emissiveIntensity = .08 + .22*on(t,TL.git.commitArrive);
      test.lamp.material.color.set(t>=TL.ci.testPass?C.green:C.blue);
      test.lamp.material.emissive.set(t>=TL.ci.testPass?C.green:C.blue);
      test.badge.material.map=t>=TL.ci.testPass?checkTexture.tex:testTexture;
      build.lamp.material.color.set(t>=TL.ci.buildPass?C.green:C.blue);
      build.lamp.material.emissive.set(t>=TL.ci.buildPass?C.green:C.blue);
      build.badge.material.map=t>=TL.ci.buildPass?checkTexture.tex:buildTexture;
      stagingCheck.visible=intro||t>=TL.cd.verified;
      docker.layers.forEach((layer,i)=>{
        const assembled=intro?1:on(t,TL.ci.dockerStart+i*.07/RATE,.4);
        layer.position.y=i*.53+(1-assembled)*(1.8+i*.35);
        layer.scale.setScalar(.25+.75*assembled);
      });
      docker.group.rotation.y = Math.sin(clock*.55)*.28;
      docker.group.visible = intro || t >= TL.ci.dockerStart-.1/RATE;

      links.forEach((link,j)=>{
        const previewAt=TL.intro.pulseStart+(TL.intro.pulseEnd-TL.intro.pulseStart)*j/(links.length-1);
        const activation=intro?(.4+.6*prog(t,previewAt,previewAt+.2)):on(t,link.activeAt,.26);
        link.tube.material.emissiveIntensity=.06+.52*activation;
        link.tube.material.opacity=.12+.88*activation;
        link.tube.material.color.set(j===7?C.blue:C.cyan);
        link.tube.material.emissive.set(j===7?C.blue:C.cyan);
        link.packets.forEach((packet,i)=>{
          packet.visible=intro||t>=link.activeAt;
          const f=((t-(intro?previewAt:link.activeAt))*RATE*.7+i*.25+100)%1;
          packet.position.copy(link.curve.getPointAt(Math.max(0,f)));
        });
      });
      const ck=prog(t,TL.git.commitLeave,TL.git.commitArrive);
      const cp=mix3([-16,2.5,.6],[-9,1.8,0],ck);cp[1]+=Math.sin(ck*Math.PI)*1.15;
      commit.position.set(...cp);commit.visible=t>=TL.git.push&&t<TL.git.commitArrive+.2/RATE;
      commit.scale.setScalar(.85+.15*Math.sin(ck*Math.PI));
      core.rotation.set(clock*.9,clock*1.2,clock*.45);cage.rotation.set(clock*.6,-clock*.6,0);
      let travelA,travelB,travelK;
      if(t<TL.cd.start){travelA=[12,1.7,0];travelB=[12,1.7,-7];travelK=prog(t,TL.ci.publish,TL.ci.published);}
      else if(t<TL.cd.promote){travelA=[12,1.7,-7];travelB=[5,1.7,-7];travelK=prog(t,TL.cd.transfer,TL.cd.stagingArrive);}
      else if(t<TL.cd.pullImage){travelA=[5,1.7,-7];travelB=[-5,1.7,-12];travelK=prog(t,TL.cd.promote,TL.cd.apply);}
      else {travelA=[12,1.7,-7];travelB=[-5,1.7,-12];travelK=prog(t,TL.cd.pullImage,TL.cd.imagePulled);}
      const ip=mix3(travelA,travelB,travelK);ip[1]+=.6*Math.sin(travelK*Math.PI);
      travelers.group.position.set(...ip);travelers.group.rotation.y=clock*.65;
      travelers.group.visible=t>=TL.ci.publish&&t<TL.cd.imagePulled+.1/RATE;

      oldPods.forEach((pod,i)=>{
        const out=prog(t,TL.rolling.retire[i],TL.rolling.retired[i],easeOutCubic);
        pod.group.visible=!intro&&t<TL.rolling.retired[i];
        pod.group.scale.setScalar(1-out*.92);pod.group.position.set(pod.x,.15-out*.5,-.55);
      });
      newPods.forEach((pod,i)=>{
        const born=intro?1:on(t,TL.rolling.create[i],.3);
        const dock=intro?1:on(t,TL.rolling.retired[i],.18);
        pod.group.visible=intro||t>=TL.rolling.create[i];
        pod.group.scale.setScalar(.12+.88*born);
        pod.group.position.set(pod.x,.15+(1-born)*2.1,lerp(1.35,-.55,dock));
        pod.mat.emissiveIntensity=.08+.12*born;
        const ready=t>=TL.rolling.ready[i];
        pod.lamp.material.color.set(ready?C.green:C.cyan);pod.lamp.material.emissive.set(ready?C.green:C.cyan);
      });
      traffic.forEach((packet,i)=>{
        packet.visible=intro||t>=TL.cd.apply;
        const slot=i%3;
        const hasNew=intro||t>=TL.rolling.ready[slot];
        const z=hasNew?newPods[slot].group.position.z:oldPods[slot].group.position.z;
        const f=((t-(intro?TL.intro.start:TL.cd.apply))*RATE*1.45+Math.floor(i/3)*.25+100)%1;
        const target=[-3+slot*3,.55,z+.83];
        packet.position.set(...mix3([0,.55,3.4],target,Math.max(0,f)));
      });
      dust.forEach(({mesh,base,phase})=>{mesh.position.set(base[0],base[1]+Math.sin(clock*.3+phase)*.25,base[2]+Math.sin(clock*.2+phase)*.3);});
      stage.bloomPass.strength=.45+.1*final;
      const pulse=prog(t,TL.success.impact,TL.success.impact+.7/RATE);
      const endPulse=prog(t,TL.success.endGlow,TL.duration);
      successHalo.visible=t>=TL.success.impact;
      successHalo.material.opacity=.24*Math.sin(pulse*Math.PI)+.12*Math.sin(endPulse*Math.PI);
      successHalo.scale.setScalar(1+.18*pulse+.08*endPulse);

      const headings=[
        'Todo comienza<br>con un <em>commit</em>',
        'Integración<br>continua <em>(CI)</em>',
        'Despliegue<br>continuo <em>(CD)</em>',
        'Rolling Update<br><em>Sin interrupciones*</em>',
        'DE TU CÓDIGO<br>A <em>PRODUCCIÓN</em><small>CI/CD Pipeline</small>',
      ];
      heading.innerHTML=intro?'¿CÓMO LLEGA TU CÓDIGO<br>A <em>PRODUCCIÓN?</em>':headings[sceneIndex];
      heading.className=`heading${intro?' intro':sceneIndex===4?' final':''}`;
      const start=[TL.git.start,TL.ci.start,TL.cd.start,TL.rolling.start,TL.success.title][sceneIndex];
      const exit=[TL.git.exit,TL.ci.exit,TL.cd.exit,TL.rolling.exit,TL.duration+1][sceneIndex];
      const hk=intro?1-prog(t,TL.intro.titleExit,TL.intro.exit):sceneIndex===0?1:fade(t,start,exit);
      heading.style.opacity=hk;
      heading.style.transform=`translateY(${(1-hk)*14}px)`;
      const ciStatus=t<TL.ci.testPass?'Pruebas automáticas':t<TL.ci.buildPass?'✓ Pruebas · Compilando aplicación':t<TL.ci.imageReady?'✓ Compilación · Creando imagen':'✓ Imagen creada · Publicando en registro';
      const cdStatus=t<TL.cd.verified?'STAGING · Verificación automática':t<TL.cd.apply?'✓ Verificado → PRODUCTION':'Kubernetes descarga la imagen del registro';
      const rollingStatus=t<TL.rolling.complete?'Nuevo listo → anterior fuera':'✓ 3 réplicas actualizadas';
      const details=['git push → Git → CI',ciStatus,cdStatus,rollingStatus,'✓ Despliegue correcto · Monitoreo activo'];
      detail.innerHTML=details[sceneIndex];detail.style.opacity=intro||sceneIndex===4?0:hk;
      footnote.innerHTML=sceneIndex===3?'*Con sondas de disponibilidad y estrategia configuradas':'';
      footnote.style.opacity=hk;
      el('progress').style.width=`${clamp01(t/TL.duration)*100}%`;
      railNodes.forEach((d,i)=>{
        const current=railStarts.reduce((a,b,j)=>t>=b?j:a,-1);
        d.className=`step ${intro?(i<=Math.floor(prog(t,TL.intro.pulseStart,TL.intro.pulseEnd)*6)?'active':''):sceneIndex===4?'finished':i===current?'active':i<current?'passed':''}`;
      });

      anchorNodes.forEach(({name,text,offset,el:dom})=>{
        let show=0;
        if(sceneIndex===0)show=['editor','git'].includes(name)?1:0;
        if(sceneIndex===1)show=['test','build','docker','registry'].includes(name)?1:0;
        if(sceneIndex===2)show=['registry','staging','cluster'].includes(name)?1:0;
        if(sceneIndex===3)show=name==='cluster'?1:0;
        if(sceneIndex===4)show=name!=='editor'?final:0;
        if(intro)show=name!=='editor'?1:0;
        let sub='';
        if(name==='git'&&t>=TL.git.commitArrive&&sceneIndex===0)sub='<span class="sub ok">✓ CI activada</span>';
        if(name==='test'&&sceneIndex===1)sub=t>=TL.ci.testPass?'<span class="sub ok">✓ Pruebas</span>':'<span class="sub">Pruebas automáticas</span>';
        if(name==='build'&&sceneIndex===1)sub=t>=TL.ci.buildPass?'<span class="sub ok">✓ Aplicación compilada</span>':'<span class="sub">Compilación</span>';
        if(name==='registry'&&sceneIndex<=2&&t>=TL.ci.published)sub='<span class="sub ok">✓ Imagen publicada</span>';
        if(name==='staging'&&sceneIndex===2)sub=t>=TL.cd.verified?'<span class="sub ok">✓ Verificado</span>':'<span class="sub">Verificación</span>';
        if(intro)sub='';
        if(name==='cluster')sub='<span class="sub">PRODUCTION</span>';
        dom.innerHTML=text+sub;
        dom.style.fontSize=intro||sceneIndex===4?'18px':'25px';
        const world=groups[name].position.toArray().map((v,i)=>v+offset[i]);
        place(dom,world,show);
      });
      [...oldPods,...newPods].forEach((pod,i)=>{
        const isNew=i>=3,idx=i%3;
        const ready=t>=TL.rolling.ready[idx];
        const text=isNew?`v2<span class="sub ${ready?'ok':''}">${ready?'✓ Listo':'Iniciando'}</span>`:'v1';
        podAnchors[i].innerHTML=text;podAnchors[i].style.fontSize='22px';
        const pos=pod.group.position.toArray().map((v,j)=>v+POS.cluster[j]);pos[1]+=2.4;
        place(podAnchors[i],pos,sceneIndex===3&&pod.group.visible?1:0);
      });
      balancerLabel.innerHTML='<span class="sub">Balanceador · Tráfico activo</span>';
      place(balancerLabel,[-5,.45,-7.9],sceneIndex===3?1:0,15);
      imageLabel.innerHTML='<span class="tag">app:v1.2.0</span>';
      const imageP=sceneIndex===1?[12,4.5,0]:travelers.group.position.toArray().map((v,i)=>v+(i===1?2:0));
      place(imageLabel,imageP,sceneIndex===1&&t>=TL.ci.imageReady?1:0);
      const monitor=el('monitor');
      monitor.style.opacity=on(t,TL.success.monitor,.45);
      monitor.style.transform=`translateY(${(1-on(t,TL.success.monitor,.45))*28}px)`;
      const points=Array.from({length:40},(_,i)=>`${i===0?'M':'L'}${i*250/39},${28+Math.sin(i*.9+clock*.8)*3+Math.sin(i*2.3)*1.8}`).join(' ');
      el('chart-line').setAttribute('d',points);el('chart-line').setAttribute('stroke',C.green);
      el('chart-fill').setAttribute('d',`${points} L250,53 L0,53 Z`);el('chart-fill').setAttribute('fill',C.panelHi);
      stage.render();
      const oldCount=oldPods.filter((_,i)=>t<TL.rolling.retired[i]).length;
      const newCount=newPods.filter((_,i)=>t>=TL.rolling.create[i]).length;
      const readyCount=oldPods.filter((_,i)=>t<TL.rolling.retire[i]).length+newPods.filter((_,i)=>t>=TL.rolling.ready[i]).length;
      window.CICD_STATE={scene:sceneIndex,oldCount,newCount,readyCount,version:'app:v1.2.0'};
      return {};
    },
  };
});
