import * as THREE from 'three';
import {C, F} from './palette.js';
import TL from '../002-Cues/Timeline.json';

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => {x = clamp(x); return x * x * (3 - 2 * x);};
const beat = (name) => TL.events[name].at;
const progress = (t, name, duration = .6) => ease((t - beat(name)) / duration);
const pulse = (t, name, duration = .55) => {const x = (t - beat(name)) / duration; return x > 0 && x < 1 ? Math.sin(x * Math.PI) : 0;};
const mix = (a, b, k) => a + (b - a) * k;
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map();
const mat = (color, roughness = .65) => {
  const key = `${color}:${roughness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness}));
  return materials.get(key);
};
function box(parent, size, position, color, roughness) {
  const mesh = new THREE.Mesh(boxGeo, mat(color, roughness));
  mesh.scale.set(...size); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function character(color, x) {
  const root = new THREE.Group(); root.position.set(x, .55, .55);
  const body = new THREE.Group(); root.add(body);
  const torso = box(body, [2.05, 2.0, 1.2], [0, 1.6, 0], color);
  if (color === C.orange) torso.material = [mat(C.orangeSide),mat(C.orangeSide),mat(C.orange),mat(C.orangeSide),mat(C.orange),mat(C.orangeSide)];
  box(body, [2.12, .14, 1.26], [0, 2.63, 0], color);
  const eyes = [];
  for (const ex of [-.47, .47]) eyes.push(box(body, [.18, .59, .04], [ex, 1.89, .62], C.ink));
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group(); pivot.position.set(side * 1.04, 1.34, 0); body.add(pivot);
    box(pivot, [.5, .42, .57], [side * .19, 0, 0], color); return pivot;
  });
  const feet = [];
  for (let i = 0; i < 4; i++) feet.push(box(root, [.41, .61, .67], [-.76 + i * .5, .31, .02], color));
  return {root, body, arms, eyes, feet, x};
}
const cameraKeys = {
  production: {position: [4.9, 7.3, 17.4], target: [0, 3.8, -1.0]},
  fixed: {position: [4.1, 6.2, 14.6], target: [.7, 3.5, -.8]},
  question: {position: [-4.4, 5.3, 11.8], target: [-1.1, 2.9, .0]},
  logs: {position: [3.8, 7.0, 17.8], target: [-.35, 3.8, -1.3]},
  alerts: {position: [3.9, 7.0, 17.8], target: [-.35, 3.8, -1.3]},
  argument: {position: [-3.5, 5.5, 12.7], target: [-.5, 3.1, .0]},
  dashboard: {position: [3.1, 6.5, 15.3], target: [.3, 4.1, -1.3]},
  fire: {position: [8.1, 8.2, 24.5], target: [2.1, 4.0, -1.5]},
  punchline: {position: [4.6, 4.6, 9.7], target: [1.8, 2.5, .3]},
};
const headlines = {
  production: ['ERRORES EN', 'PRODUCCIÓN'], fixed: ['PROBLEMA', '«SOLUCIONADO»'],
  question: ['¿TAN RÁPIDO?', ''], logs: ['LOGS', 'DESACTIVADOS'],
  alerts: ['ALERTAS', 'DESACTIVADAS'], argument: ['ESO NO', 'SOLUCIONA NADA'],
  dashboard: ['CERO', 'ERRORES'], fire: ['PERO PRODUCCIÓN…', ''], punchline: ['SIN', 'REGISTROS'],
};

export async function setupScene({canvas, capture}) {
  await document.fonts.ready;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1); renderer.setClearColor(C.background);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.background);
  scene.fog = new THREE.Fog(C.background, 32, 65);
  const camera = new THREE.PerspectiveCamera(42, 1080 / 1920, .1, 100);
  const ambient = new THREE.HemisphereLight(C.muted, C.purple, 1.15); scene.add(ambient);
  const key = new THREE.DirectionalLight(C.white, 2.4); key.position.set(-4, 11, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left: -15, right: 15, top: 15, bottom: -15, near: .5, far: 40});
  key.shadow.bias = -.0002; key.shadow.normalBias = .06; scene.add(key);
  const rim = new THREE.DirectionalLight(C.purple, 3.3); rim.position.set(4, 7, -7); scene.add(rim);
  const fireLight = new THREE.PointLight(C.flame, 0, 18, 1.8); fireLight.position.set(5.7, 3.8, -2); scene.add(fireLight);
  const screenLight = new THREE.PointLight(C.cyan, 8, 12, 2); screenLight.position.set(0, 5.6, -2); scene.add(screenLight);

  box(scene, [35, .45, 24], [0, -.55, -2], C.desk);
  box(scene, [15.4, .36, 7.8], [0, -.1, 1.2], C.keyboard);
  const keys = [];
  for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++) {
    const x = (col - 5.5) * 1.18; const z = (row - 2) * 1.35 + 1.2;
    const base = box(scene, [1.08, .43, 1.19], [x, .27, z], C.key);
    box(base, [.92 / 1.08, .06 / .43, 1.0 / 1.19], [0, .52, 0], C.keyTop);
    keys.push(base);
  }
  // Slightly beveled silhouette from an inset top surface; keys remain simple blocks.
  box(scene, [9.6, 7.25, .4], [-.4, 5.7, -3.7], C.ink);
  box(scene, [9.35, 7.0, .12], [-.4, 5.7, -3.45], C.border);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1536; screenCanvas.height = 1152;
  const ctx = screenCanvas.getContext('2d');
  const texture = new THREE.CanvasTexture(screenCanvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(9.05, 6.79), new THREE.MeshBasicMaterial({map: texture}));
  screen.position.set(-.4, 5.7, -3.37); scene.add(screen);
  box(scene, [.48, 1.2, .6], [-.4, 1.67, -3.65], C.border);
  box(scene, [3.0, .16, 1.5], [-.4, 1.02, -3.25], C.ink);

  const developer = character(C.blue, -1.65), claude = character(C.orange, 1.65);
  scene.add(developer.root, claude.root);
  // Caras limpias; los personajes proyectan su sombra sobre el teclado.
  for (const actor of [developer, claude]) actor.root.traverse(mesh => {
    if (mesh.isMesh) mesh.receiveShadow = false;
  });
  const servers = new THREE.Group(); scene.add(servers);
  for (let r = 0; r < 2; r++) {
    const x = 5.1 + r * 1.65;
    box(servers, [1.5, 4.9, 1.45], [x, 2.2, -3.4], C.ink);
    for (let i = 0; i < 6; i++) {
      box(servers, [1.3, .61, .12], [x, .25 + i * .74, -2.61], C.panel);
      for (let j = 0; j < 6; j++) box(servers, [.1, .035, .025], [x - .45 + j * .16, .4 + i * .74, -2.53], C.border);
      const led = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .04), new THREE.MeshBasicMaterial({color: C.red}));
      led.position.set(x - .45, .12 + i * .74, -2.52); servers.add(led);
    }
  }
  const flames = [];
  const flameMaterials = [C.flame, C.gold, C.flameCore].map(color => new THREE.MeshBasicMaterial({color, transparent: true, opacity: .88}));
  const flameGeometry = new THREE.LatheGeometry([[0,0],[.2,.07],[.31,.35],[.24,.7],[.1,1.1],[0,1.55]].map(p => new THREE.Vector2(...p)), 7);
  for (let i = 0; i < 30; i++) {
    const flame = new THREE.Mesh(flameGeometry, flameMaterials[i % 3]);
    scene.add(flame); flames.push(flame);
  }
  const smokeMaterial = new THREE.MeshStandardMaterial({color: C.smoke, transparent: true, opacity: .15, roughness: 1, depthWrite: false});
  const smokes = [];
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 1), smokeMaterial); scene.add(mesh); smokes.push(mesh);
  }
  const specks = [];
  for (let i = 0; i < 26; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(.025, 5, 4), new THREE.MeshBasicMaterial({color: C.gold, transparent: true, opacity: .45}));
    p.position.set(Math.sin(i * 2.4) * 11, 2 + (i % 9), -5 - (i % 4)); scene.add(p); specks.push(p);
  }

  const overlay = document.createElement('div'); overlay.id = 'film-overlay'; document.getElementById('app').appendChild(overlay);
  overlay.innerHTML = `<div class="vignette"></div><div class="brand">farix.romero</div><div class="chapter"></div><div class="headline"></div><div class="subtitles"><div class="speaker"></div><div class="words"></div></div><div class="footer">PRODUCCIÓN · EN VIVO <i></i></div>`;
  const style = document.createElement('style');
  style.textContent = `#film-overlay{position:absolute;width:1080px;height:1920px;left:0;top:0;transform-origin:top left;pointer-events:none;color:${C.white};font-family:${F.ui}}.brand{position:absolute;top:66px;right:70px;font:400 19px '${F.mono}';letter-spacing:.19em;color:${C.muted};opacity:1}.vignette{position:absolute;inset:0;background:linear-gradient(${C.background} 0%,${C.background}f5 16%,transparent 29%),radial-gradient(ellipse at 50% 45%,transparent 45%,${C.background}99 100%)}.chapter{position:absolute;left:72px;top:68px;font:400 18px '${F.mono}';letter-spacing:.12em;color:${C.muted}}.headline{position:absolute;left:70px;right:70px;top:172px;text-align:center;font-size:78px;font-weight:900;line-height:1.03;letter-spacing:-.045em;text-shadow:0 4px 22px ${C.background}88}.headline span{display:block}.subtitles{position:absolute;left:76px;right:76px;top:1550px;text-align:center}.speaker{font:600 20px '${F.mono}';letter-spacing:.18em;margin-bottom:22px}.words{font-size:54px;font-weight:750;line-height:1.22;letter-spacing:-.025em;text-shadow:0 3px 14px ${C.background},0 2px 4px ${C.background}}.words span{display:inline}.footer{position:absolute;bottom:89px;left:72px;font:400 17px '${F.mono}';letter-spacing:.14em;color:${C.muted}}.footer i{display:inline-block;width:9px;height:9px;border-radius:50%;background:${C.red};margin-left:15px}`;
  document.head.appendChild(style);
  const titleEl = overlay.querySelector('.headline'), chapterEl = overlay.querySelector('.chapter'), subtitleEl = overlay.querySelector('.words'), speakerEl = overlay.querySelector('.speaker');

  function drawScreen(state) {
    const {fixed, logsOff, alertsOff, empty, logsTween, alertsTween} = state;
    ctx.fillStyle = C.screen; ctx.fillRect(0, 0, 1536, 1152);
    const rounded = (x,y,w,h,r,color) => {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
    const text = (s,x,y,size,color=C.white,font=F.mono,weight=400) => {ctx.fillStyle=color;ctx.font=`${weight} ${size}px '${font}'`;ctx.fillText(s,x,y);};
    rounded(28,28,1480,90,22,C.panel);
    [C.red,C.gold,C.green].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(64+i*36,73,10,0,Math.PI*2);ctx.fill();});
    text('production / observability',218,86,35,C.muted);
    rounded(65,160,1406,365,28,C.panel);
    ctx.textAlign='center';
    text('ERRORES EN PRODUCCIÓN',768,220,42,C.muted,F.ui,700);
    text(fixed?'0':'128',768,425,210,fixed?C.green:C.red,F.ui,850);
    text(fixed?'Todo bajo control':'Incidentes activos',768,491,48,fixed?C.green:C.red,F.ui,750);
    ctx.textAlign='left';
    ctx.strokeStyle=fixed?C.green:C.red;ctx.lineWidth=7;ctx.beginPath();
    // The centered counter stays visible when the camera moves closer.
    ctx.moveTo(0,0);
    rounded(65,560,680,173,24,C.panel); rounded(778,560,693,173,24,C.panel);
    text('LOGS DE ERRORES',103,615,33,C.muted,F.ui,650);
    text('ALERTAS',817,615,33,C.muted,F.ui,650);
    for(const [off,x,tween] of [[logsOff,103,logsTween],[alertsOff,817,alertsTween]]){
      rounded(x,645,155,55,28,off?C.border:C.green);
      rounded(x+mix(106,7,tween),652,42,42,21,C.white);
      text(off?'OFF':'ON',x+188,689,47,off?C.red:C.green,F.mono,700);
    }
    rounded(65,770,1406,322,24,C.ink);
    text(empty?'CONSULTA DE REGISTROS':'error.log',empty?800:105,830,34,C.muted);
    if(empty){text('Sin registros',800,957,90,C.white,F.ui,750);text('No hay datos del incidente.',800,1030,37,C.muted);}
    else if(logsOff){text('Logs desactivados',105,953,68,C.muted,F.ui,650);}
    else{['ERROR  api: connection timeout','ERROR  db: too many connections','ERROR  worker: job failed'].forEach((s,i)=>text(s,105,905+i*66,38,C.red));}
    texture.needsUpdate=true;
  }
  let previousScreen = '';
  const resize = () => {
    const w=canvas.clientWidth || innerWidth, h=canvas.clientHeight || innerHeight;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    overlay.style.transform=`scale(${w/1080},${h/1920})`;
  };
  // Las sombras deben seguir cada pose, sin conservar la silueta inicial.
  camera.position.set(...cameraKeys.production.position);
  camera.lookAt(new THREE.Vector3(...cameraKeys.production.target));
  renderer.render(scene,camera);
  renderer.shadowMap.autoUpdate = true;
  const target = new THREE.Vector3();
  return {resize, render(t) {
    const sceneIndex = Math.max(0, TL.scenes.findIndex(s => t >= s.start && t < s.end));
    const current = TL.scenes[sceneIndex], previous = TL.scenes[Math.max(0,sceneIndex-1)];
    const k=ease((t-current.start)/current.enter), a=cameraKeys[previous.id], b=cameraKeys[current.id];
    camera.position.set(...b.position.map((v,i)=>mix(a.position[i],v,k)));
    target.set(...b.target.map((v,i)=>mix(a.target[i],v,k)));camera.lookAt(target);
    const fixed=t>=beat('fix.key'), logsOff=t>=beat('logs.off'), alertsOff=t>=beat('alerts.off'), empty=t>=beat('records.empty');
    const logsTween=progress(t,'logs.off',.28),alertsTween=progress(t,'alerts.off',.28);
    const screenState=JSON.stringify([fixed,logsOff,alertsOff,empty,Math.round(logsTween*30),Math.round(alertsTween*30)]);
    if(screenState!==previousScreen){drawScreen({fixed,logsOff,alertsOff,empty,logsTween,alertsTween});previousScreen=screenState;}
    const turn=TL.narration.turns.find(s=>t>=s.start&&t<s.end);
    for(const [person,speaker] of [[developer,'Yo'],[claude,'Claude']]) {
      const speaking=turn?.speaker===speaker, frequency=speaker==='Yo'?10:7;
      const bob=speaking?Math.sin((t-turn.start)*frequency)*.048:Math.sin(t*1.7)*.016;
      const jump=speaker==='Claude'?pulse(t,'fix.key')*.56:pulse(t,'argument.jump')*.4;
      const walk=speaker==='Claude'?pulse(t,'alerts.off',.85):0;
      person.root.position.set(person.x+walk*.2,.55+jump,.55);
      person.body.position.y=bob;person.body.rotation.z=speaking?Math.sin(t*frequency*.6)*.027:0;
      person.root.rotation.y=speaker==='Claude'?-.10: .18;
      if(speaker==='Claude')person.root.rotation.y=mix(-.1,.1,progress(t,'punchline.look',.5));
      if(speaker==='Yo'&&current.id==='fire')person.root.rotation.y=-.36;
      person.arms[0].rotation.z=speaking?.3+Math.sin(t*frequency)*.18:.08;
      person.arms[1].rotation.z=speaking?-.3-Math.sin(t*frequency+.6)*.18:-.08;
      if(speaker==='Claude')person.arms[0].rotation.z-=1.2*(pulse(t,'logs.off',.65)+pulse(t,'alerts.off',.65));
      if(speaker==='Claude'&&current.id==='dashboard'){person.arms[0].rotation.z=-.7;person.arms[1].rotation.z=.7;}
      if(speaker==='Yo'&&current.id==='fire')person.arms[1].rotation.z=1.05;
      const blink=((t+(speaker==='Yo'?1.1:1.7))%4.6)<.12?.13:1;
      person.eyes.forEach(eye=>eye.scale.y=.59*blink);
      person.feet.forEach((foot,i)=>{foot.position.y=.31+walk*Math.sin(t*18+i*Math.PI)*.07;});
    }
    keys.forEach((key,i)=>{key.position.y=.27-(i===30?pulse(t,'fix.key')*.12:0);});
    const burning=progress(t,'fire.reveal',.65), smoke=progress(t,'smoke.start',1.0);
    flames.forEach((flame,i)=>{
      const cycle=(t*.8+i*.137)%1;
      flame.visible=burning>0;
      flame.position.set(4.52+(i%10)*.3+Math.sin(t*5+i)*.05, .12+Math.floor(i/10)*1.18, -2.3+(i%3)*.06);
      flame.scale.set(1.0+Math.sin(t*9+i)*.15,(1.3+Math.sin(t*11+i)*.35)*burning, 1);
      flame.rotation.z=Math.sin(t*5+i)*.22;
    });
    smokes.forEach((p,i)=>{
      const cycle=(t*.15+i*.081)%1;p.visible=smoke>0;
      p.position.set(5.5+Math.sin(i*2.1+cycle*3)*(.25+cycle*.65),4.0+cycle*5,-3.3);
      p.scale.setScalar((.45+cycle*.9)*smoke);p.rotation.y=t*.18+i;
    });
    fireLight.intensity=burning*(42+Math.sin(t*15)*8);screenLight.color.set(fixed?C.green:C.cyan);
    specks.forEach((p,i)=>{p.position.y=2+(i%9)+Math.sin(t*.5+i)*.1;});
    const headline=headlines[current.id];titleEl.innerHTML=headline.map((s,i)=>s?`<span style="color:${i===1?(current.id==='dashboard'||current.id==='fixed'?C.green:current.id==='punchline'?C.white:C.red):C.white}">${s}</span>`:'').join('');
    chapterEl.textContent=`${String(sceneIndex+1).padStart(2,'0')} / 09`;
    const caption=TL.captions.find(s=>t>=s.start&&t<s.end);
    speakerEl.textContent=caption?.speaker==='Yo'?'TÚ':caption?'CLAUDE':'';
    speakerEl.style.color=caption?.speaker==='Yo'?C.blue:C.orange;
    subtitleEl.innerHTML=caption?caption.words.map(w=>`<span style="color:${t>=w.start&&t<w.end?C.cyan:C.white}">${w.text}</span>`).join(' '):'';
    renderer.render(scene,camera);
    return {};
  }};
}
export {TL};
