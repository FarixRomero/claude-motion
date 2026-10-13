import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {runSim} from '../kit/runtime.js';
import {createStage} from '../kit/stage3d.js';
import {clamp01, keyed, lerp, prog, rng, easeOutCubic} from '../kit/util.js';
import {C,F} from './palette.js';
import TL from './timeline.json';

const V = (p) => new THREE.Vector3(...p);
const on = (t,at,d=.7) => prog(t,at,at+d,easeOutCubic);
const blend = (a,b,k) => a.map((v,i)=>lerp(v,b[i],k));
const POS = {clients:[-18,0,0],gateway:[-8,0,0],balancer:[0,0,0],database:[11,0,-11],controller:[4,0,-10]};
const SP = [[8,0,1],[8,0,-4],[14,0,1],[14,0,-4]];

// A deterministic illustrative model, independent of frame playback order.
function model(t) {
  const m=TL.model;
  const users=Math.round(keyed([[TL.crowd.start,[1000]],[TL.crowd.tenThousand,[10000]],[TL.crowd.fiftyThousand,[50000]],[TL.crowd.hundredThousand,[100000]]],t)[0]);
  const incoming=lerp(2000,m.incoming,prog(t,TL.overload.rise,TL.overload.saturated));
  const limit=t>=TL.protect.rateActive;
  const shed=t>=TL.protect.shedActive;
  const ready=t>=TL.scale.ready;
  const balanced=t>=TL.scale.distributed;
  const instances=ready?4:balanced?3:1;
  const capacity=Math.min(instances*m.singleCapacity,m.dbCapacity);
  const admitted=shed?lerp(m.protectedAdmit,m.finalAdmit,on(t,TL.scale.distributed,3)):limit?m.ratePolicy:incoming;
  const queue=Math.round(m.queueLimit*prog(t,TL.overload.rise,TL.overload.queueFull)*(1-prog(t,TL.protect.drain,TL.protect.recovered)));
  const latency=Math.round(lerp(80,1800,prog(t,TL.overload.rise,TL.overload.saturated))*(1-.91*prog(t,TL.protect.drain,TL.protect.recovered)));
  return {users,incoming,capacity,admitted,queue,latency,limit,shed,ready,balanced,instances};
}

runSim({duration:TL.duration,fps:TL.fps,theme:'dark',accent:C.cyan,seed:TL.seed,hud:{enabled:false,title:'100 000 usuarios',subtitle:''},director:{enabled:false},watermark:''}, async ({canvas,capture})=>{
  const stage=createStage(canvas,{viewport:()=>({top:innerHeight*.13,bottom:innerHeight*.06})},{bg:C.bg,fov:43,exposure:1.08,capture,bloom:{strength:.38,radius:.35,threshold:.82}});
  const {scene,camera}=stage;
  scene.fog=new THREE.FogExp2(C.bg,.004);
  scene.add(new THREE.HemisphereLight(C.dim,C.bg,1.8));
  const key=new THREE.DirectionalLight(C.white,3);key.position.set(-12,25,20);scene.add(key);
  const rim=new THREE.DirectionalLight(C.blue,3.5);rim.position.set(15,12,-20);scene.add(rim);
  const mat=(color=C.panel,extra={})=>new THREE.MeshStandardMaterial({color,metalness:.4,roughness:.6,...extra});
  const neon=(color=C.cyan)=>mat(color,{emissive:color,emissiveIntensity:.55});
  const box=(g,w,h,d,material,at=[0,0,0])=>{const o=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,1,.07),material);o.position.set(...at);g.add(o);return o;};
  const line=(points,color=C.blue,opacity=.6)=>{const o=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(V)),new THREE.LineBasicMaterial({color,transparent:true,opacity}));scene.add(o);return o;};
  const group=(p)=>{const g=new THREE.Group();g.position.set(...p);scene.add(g);return g;};
  const platform=(g,w=4,d=3.8)=>{
    box(g,w,.3,d,mat(),[0,-.15,0]);
    box(g,w-.2,.035,d-.2,mat(C.panelHi),[0,.02,0]);
    const p=g.position.toArray();
    g.userData.outline=line([[-w/2,.06,-d/2],[w/2,.06,-d/2],[w/2,.06,d/2],[-w/2,.06,d/2],[-w/2,.06,-d/2]].map(q=>q.map((v,i)=>v+p[i])));
    box(g,w-.5,.04,.045,neon(C.blue),[0,-.08,d/2+.02]);
  };
  const groups=Object.fromEntries(Object.entries(POS).map(([k,p])=>[k,group(p)]));
  platform(groups.gateway,4.8,4.6);platform(groups.balancer,4.2,4);
  platform(groups.database,5,4);platform(groups.controller,3.8,3);
  const racks=[];
  function rack(p,i){
    const g=group(p);platform(g,4,3.8);
    const body=mat(C.panelHi,{emissive:C.blue,emissiveIntensity:.08});
    box(g,2.5,2.5,1.8,body,[0,1.55,0]);
    const lamp=neon(C.blue);
    for(let j=0;j<4;j++){
      box(g,2.15,.29,.07,mat(),[0,.65+j*.52,.95]);
      box(g,.15,.065,.035,lamp,[-.85,.65+j*.52,1]);
      box(g,1.35,.032,.035,mat(C.dim),[.18,.65+j*.52,1]);
    }
    const load=box(g,.08,.12,.05,neon(C.blue),[-1.1,2.67,.96]);
    racks.push({g,body,lamp,load,p,i});
  }
  SP.forEach(rack);
  const gatewayMat=mat(C.panelHi,{emissive:C.blue,emissiveIntensity:.12});
  box(groups.gateway,3.5,3.2,.75,gatewayMat,[0,1.8,0]);
  // Open aperture and chip architecture make the gateway recognizable.
  box(groups.gateway,2.7,2.25,.1,mat(C.bg),[0,1.75,.42]);
  const gateLamp=neon(C.cyan);
  [-1.25,1.25].forEach(x=>box(groups.gateway,.09,2.1,.06,gateLamp,[x,1.75,.49]));
  [-.8,0,.8].forEach(x=>box(groups.gateway,.35,.4,.07,neon(C.blue),[x,1.75,.5]));
  box(groups.balancer,2.7,1.1,2,mat(C.panelHi),[0,.85,0]);
  for(let i=0;i<3;i++)box(groups.balancer,.42,.13,.035,neon(C.cyan),[-.8+i*.8,.9,1.04]);
  box(groups.controller,2.4,1.65,1.3,mat(C.panelHi),[0,1.1,0]);
  box(groups.controller,1.6,.05,.035,neon(C.green),[0,1.1,.68]);
  box(groups.controller,.05,.7,.035,neon(C.green),[0,1.1,.68]);
  const dbMat=mat(C.panelHi,{emissive:C.cyan,emissiveIntensity:.08});
  for(let i=0;i<3;i++){
    const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,.75,32),dbMat);cylinder.position.set(0,.7+i*.8,0);groups.database.add(cylinder);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.35,.025,6,32),neon(C.cyan));ring.rotation.x=Math.PI/2;ring.position.y=1.04+i*.8;groups.database.add(ring);
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),mat(C.bg,{metalness:.12,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.8;scene.add(floor);
  const grid=new THREE.GridHelper(100,50,C.grid,C.grid);grid.position.y=-.76;grid.material.transparent=true;grid.material.opacity=.22;scene.add(grid);

  // Instanced population and packets keep the render bounded.
  const random=rng(TL.seed), dummy=new THREE.Object3D();
  const users=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045,0),neon(C.blue),1200);
  const userPositions=[];
  for(let i=0;i<1200;i++){
    const p=[-14-random()*12,.4+random()*8,(random()-.5)*20];userPositions.push(p);
    dummy.position.set(...p);dummy.scale.setScalar(.6+random()*.8);dummy.updateMatrix();users.setMatrixAt(i,dummy.matrix);
  }
  scene.add(users);
  const converging=new THREE.BufferGeometry();
  const coords=[];
  for(let i=0;i<90;i++){coords.push(...userPositions[i*12],-8,1.4,0);}
  converging.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
  const fans=new THREE.LineSegments(converging,new THREE.LineBasicMaterial({color:C.blue,transparent:true,opacity:.12}));scene.add(fans);

  function route(points,count=18,color=C.blue){
    const curve=new THREE.CatmullRomCurve3(points.map(V));
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.025,5,false),neon(color));scene.add(tube);
    const packets=new THREE.InstancedMesh(new THREE.SphereGeometry(.075,5,4),new THREE.MeshBasicMaterial({color,toneMapped:false}),count);scene.add(packets);
    return {curve,tube,packets,count,color};
  }
  const into=route([[-19,1.3,0],[-14,1.3,0],[-8,1.3,0]],64);
  const trunk=route([[-8,.25,0],[-4,.25,0],[0,.25,0]],24);
  const branches=SP.map(p=>route([[0,.25,0],[3,.25,p[2]], [p[0],.25,p[2]]],14));
  const dbLinks=SP.map(p=>route([[p[0],.25,p[2]],[p[0]+2,.25,p[2]],[11,.25,-11]],10,C.cyan));
  const reject429=route([[-10,1,0],[-11,1,3],[-11,1,7]],12,C.red);
  const reject503=route([[-3,.5,0],[-3,.5,4],[0,.5,7]],10,C.red);
  const timeout=route([[6,.5,1],[6,.5,4],[7,.5,6]],8,C.red);
  const controlLink=route([[4,.5,-10],[9,.5,-8],[14,.5,-4]],5,C.green);
  controlLink.packets.visible=false;
  const barrier=box(scene,.08,4,4.2,mat(C.cyan,{transparent:true,opacity:.14,depthWrite:false,emissive:C.cyan,emissiveIntensity:.25}),[-10,2,0]);
  const shedBarrier=box(scene,.08,2.5,2.8,mat(C.amber,{transparent:true,opacity:.15,depthWrite:false,emissive:C.amber,emissiveIntensity:.2}),[-3,1.35,0]);
  const queueGroup=group([3.3,.2,1]);
  const queue=new THREE.InstancedMesh(new THREE.BoxGeometry(.2,.2,.2),neon(C.amber),TL.model.queueLimit);queueGroup.add(queue);
  const queueFrame=line([[2.2,.2,2.3],[5,.2,2.3],[5,.2,3.6],[2.2,.2,3.6],[2.2,.2,2.3]],C.amber,.5);
  // Queue grid remains at fixed world coordinates beside the initial instance.
  for(let i=0;i<TL.model.queueLimit;i++){dummy.position.set((i%8)*.32-1.05,.15,Math.floor(i/8)*.32+1.5);dummy.scale.setScalar(1);dummy.updateMatrix();queue.setMatrixAt(i,dummy.matrix);}
  const halo=new THREE.Mesh(new THREE.TorusGeometry(19,.045,6,96),neon(C.green));halo.rotation.x=-Math.PI/2;halo.position.set(0,.08,-1);scene.add(halo);

  const film=document.createElement('div');film.className='film';
  Object.entries(C).forEach(([k,v])=>film.style.setProperty(`--film-${k}`,v));
  Object.entries(F).forEach(([k,v])=>film.style.setProperty(`--film-${k}`,v));
  film.innerHTML=`<div class="vignette"></div><div class="footer-shade"></div>
    <div class="chapter">ARQUITECTURA <b>·</b> ALTA CONCURRENCIA</div>
    <div class="trademark">farix.romero</div><div id="heading" class="heading"></div>
    <div id="anchors"></div><div id="counter" class="counter"></div>
    <div id="metrics" class="metrics"></div><div id="detail" class="detail"></div>
    <div class="footnote">Simulación ilustrativa · Partículas y tiempos escalados</div>
    <div class="rail">CLIENTES <i>›</i> API GATEWAY <i>›</i> SERVICIOS <i>›</i> BASE DE DATOS</div>
    <div class="progress"><i id="progress"></i></div>`;
  document.getElementById('app').appendChild(film);
  const el=id=>film.querySelector(`#${id}`);
  const anchors=[];
  const anchor=(name,p,sub='')=>{const dom=document.createElement('div');dom.className='anchor';el('anchors').appendChild(dom);const a={name,p,sub,dom};anchors.push(a);return a;};
  anchor('API GATEWAY',[-8,4,0]);anchor('LOAD BALANCER',[0,2.8,0]);anchor('BASE DE DATOS',[11,4.2,-11],'Presupuesto compartido');
  anchor('AUTOSCALING',[4,3.1,-10]);
  const serviceLabels=SP.map((p,i)=>anchor(`SERVICIO ${i+1}`,[p[0],3.9,p[2]]));
  const rateLabel=anchor('RATE LIMITING',[-10,5.1,0],'Política de admisión');
  const shedLabel=anchor('LOAD SHEDDING',[-3,3.6,0],'Protección por sobrecarga');
  anchor('HTTP 429',[-11,1.2,7],'Límite excedido');anchor('HTTP 503',[0,1.2,7],'Rechazo por sobrecarga');
  const queueLabel=anchor('COLA LIMITADA',[3.5,.8,3.8]);
  const allServices=anchor('SERVICIOS',[12,1.5,3.1],'4 instancias listas');
  const cameraPos=TL.camera.map(k=>[k.at,k.position.split(',').map(Number)]);
  const cameraAim=TL.camera.map(k=>[k.at,k.target.split(',').map(Number)]);
  const format=n=>Math.round(n).toLocaleString('fr-FR').replaceAll('\u202f',' ');
  const drawRoute=(r,t,active,speed=1,count=r.count)=>{
    r.tube.visible=active;r.packets.visible=active;r.packets.count=Math.max(0,Math.floor(count));
    if(!active)return;
    for(let i=0;i<r.packets.count;i++){
      const f=(t*speed*.35+i/r.count)%1;
      dummy.position.copy(r.curve.getPoint(f));dummy.scale.setScalar(1);dummy.updateMatrix();r.packets.setMatrixAt(i,dummy.matrix);
    }
    r.packets.instanceMatrix.needsUpdate=true;
  };
  return {
    resize(){stage.resize();film.style.transform=`scale(${Math.min(innerWidth/1080,innerHeight/1080)})`;},
    render(t){
      const state=model(t), chapter=t<TL.overload.start?0:t<TL.protect.start?1:t<TL.scale.start?2:t<TL.stable.start?3:4;
      camera.position.set(...keyed(cameraPos,t));camera.lookAt(...keyed(cameraAim,t));camera.updateMatrixWorld();
      const pressure=prog(t,TL.overload.rise,TL.overload.saturated)*(1-prog(t,TL.protect.drain,TL.protect.recovered));
      const stateColor=pressure>.75?C.red:pressure>.3?C.amber:t>=TL.protect.recovered?C.green:C.blue;
      gatewayMat.emissive.set(state.limit?C.cyan:stateColor);
      users.count=Math.round(lerp(110,1200,prog(t,TL.crowd.grow,TL.crowd.hundredThousand)));
      fans.material.opacity=(.04+.1*prog(t,TL.crowd.grow,TL.crowd.hundredThousand))*(chapter===4?.3:1);
      groups.balancer.visible=t>=TL.overload.start;
      groups.database.visible=t>=TL.overload.start-.5;
      groups.controller.visible=t>=TL.scale.request;
      racks.forEach((r,i)=>{
        r.g.visible=i===0?t>=TL.overload.start-.5:i<3?t>=TL.scale.start:t>=TL.scale.starting;
        const born=i===3?on(t,TL.scale.starting,1.4):1;
        r.g.scale.setScalar(.2+.8*born);r.g.position.y=i===3?(1-born)*3:0;
        const healthy=i===3?state.ready:i>0?true:pressure<.3;
        r.lamp.color.set(healthy?C.green:stateColor);r.lamp.emissive.set(healthy?C.green:stateColor);
        r.body.emissive.set(i===0?stateColor:C.cyan);
        r.load.scale.x=24*(i===0&&!state.balanced?.55+.45*pressure:state.balanced?.55:0.02);
        r.load.position.x=-1.1+(r.load.scale.x*.08)/2;
        r.load.material.color.set(i===0?stateColor:C.cyan);r.load.material.emissive.set(i===0?stateColor:C.cyan);
      });
      [...Object.values(groups),...racks.map(r=>r.g)].forEach(g=>{if(g.userData.outline)g.userData.outline.visible=g.visible;});
      barrier.visible=t>=TL.protect.rateLimit;barrier.scale.y=.05+.95*on(t,TL.protect.rateLimit);
      shedBarrier.visible=t>=TL.protect.shed;shedBarrier.scale.y=.05+.95*on(t,TL.protect.shed);
      queue.count=state.queue;queue.visible=t>=TL.overload.rise;queueFrame.visible=t>=TL.overload.rise&&t<TL.scale.start;
      drawRoute(into,t,true,lerp(.4,1.3,prog(t,TL.crowd.grow,TL.crowd.hundredThousand)),chapter===0?lerp(8,64,prog(t,TL.crowd.grow,TL.crowd.hundredThousand)):64);
      drawRoute(trunk,t,t>=TL.overload.start,1.1,state.shed?10:24);
      const targets=state.balanced?(state.ready&&t>=TL.scale.route?4:3):1;
      branches.forEach((r,i)=>drawRoute(r,t,t>=TL.overload.start&&i<targets,1.05,state.shed?7:14));
      dbLinks.forEach((r,i)=>drawRoute(r,t,t>=TL.overload.start&&i<targets,.65,pressure>.7?3:7));
      drawRoute(reject429,t,state.limit,1,12);drawRoute(reject503,t,state.shed,1.2,chapter===2?10:4);
      drawRoute(timeout,t,t>=TL.overload.timeouts&&t<TL.protect.recovered,.9,8);
      drawRoute(controlLink,t,t>=TL.scale.request&&t<TL.scale.route,.8,5);
      halo.visible=t>=TL.stable.pulse;halo.scale.setScalar(.3+on(t,TL.stable.pulse,1.2));
      halo.material.transparent=true;halo.material.opacity=.3*(1-prog(t,TL.stable.pulse,TL.duration));
      const headings=['¿100 000 usuarios<br><em>al mismo tiempo?</em>','Más tráfico no significa<br><em>más capacidad</em>','Controlar la carga<br><em>para proteger el sistema</em>','Distribuir tráfico<br><em>y escalar capacidad</em>','100 000 USUARIOS.<br><em>¿TU SISTEMA<br>ESTÁ PREPARADO?</em><small>Alta concurrencia y resiliencia</small>'];
      const starts=[TL.crowd.title,TL.overload.title,TL.protect.title,TL.scale.title,TL.stable.title];
      const exits=[TL.crowd.exit,TL.overload.exit,TL.protect.exit,TL.scale.exit,TL.duration+1];
      const alpha=(chapter===0?1:on(t,starts[chapter],.55))*(1-on(t,exits[chapter],.3));
      el('heading').innerHTML=headings[chapter];el('heading').className=`heading ${chapter===4?'final':''}`;
      el('heading').style.opacity=alpha;el('heading').style.transform=`translateY(${(1-alpha)*12}px)`;
      el('counter').innerHTML=`<strong>${format(state.users)}</strong><span>USUARIOS CONCURRENTES</span>`;
      el('counter').style.opacity=chapter===0?1:0;
      el('metrics').style.opacity=chapter===0?0:chapter===4?on(t,TL.stable.monitor):1;
      const metrics=chapter===4?[
        ['Procesadas',`${format(state.admitted)} req/s`,C.cyan],['Latencia p95',`${state.latency} ms`,C.green],['Servicios','SALUDABLES',C.green],['Sobrecarga','CONTROLADA',C.green]
      ]:chapter===1?[
        ['Entrada',`${format(state.incoming)} req/s`,C.blue],['Capacidad',`${format(TL.model.singleCapacity)} req/s`,C.amber],['Cola limitada',`${state.queue}/${TL.model.queueLimit}`,stateColor],['Latencia p95',`${state.latency} ms`,stateColor]
      ]:chapter===2?[
        ['Entrada',`${format(state.incoming)} req/s`,C.blue],['Admitidas',`${format(state.admitted)} req/s`,C.cyan],['Cola limitada',`${state.queue}/${TL.model.queueLimit}`,stateColor],['Excedentes',state.shed?'429 / 503':state.limit?'429':'—',C.red]
      ]:[
        [state.balanced?'Instancias listas':'Instancias en uso',`${state.instances}/4`,C.green],['Admitidas',`${format(state.admitted)} req/s`,C.cyan],['Límite DB',`${format(TL.model.dbCapacity)} req/s`,C.amber],['Protección','ACTIVA',C.green]
      ];
      el('metrics').innerHTML=metrics.map(([a,b,c])=>`<div><span>${a}</span><strong style="color:${c}">${b}</strong></div>`).join('');
      const details=[
        'Usuarios concurrentes ≠ solicitudes por segundo',
        t>=TL.overload.timeouts?'Cola llena · Timeouts · El servicio sigue trabajando':'Entrada creciente · Una instancia · Capacidad limitada',
        t<TL.protect.shed?'Rate Limiting · Límites según una política':t<TL.protect.recovered?'Load Shedding · Rechazo ante sobrecarga':'Menos carga admitida → La cola se vacía',
        t<TL.scale.request?'Balanceo entre instancias disponibles':t<TL.scale.ready?'Nueva réplica: INICIANDO → verificación de salud':'✓ Nueva réplica LISTA → comienza a recibir tráfico',
        'Carga admitida ≤ capacidad disponible · Excedentes rechazados'
      ];
      el('detail').innerHTML=details[chapter];el('progress').style.width=`${100*clamp01(t/TL.duration)}%`;
      anchors.forEach(a=>{
        let visible=true,sub=a.sub;
        const n=a.name;
        if(n==='LOAD BALANCER')visible=t>=TL.scale.start;
        if(n==='BASE DE DATOS'){visible=t>=TL.overload.start;sub=chapter>=3?'Límite: 14 000 req/s':'';}
        if(n==='BASE DE DATOS'&&chapter===2&&t<TL.protect.rateActive)visible=false;
        if(n==='AUTOSCALING')visible=t>=TL.scale.request;
        if(n==='RATE LIMITING')visible=t>=TL.protect.rateLimit;
        if(n==='LOAD SHEDDING')visible=t>=TL.protect.shed;
        if(n==='HTTP 429')visible=state.limit;
        if(n==='HTTP 503')visible=state.shed;
        if(n==='COLA LIMITADA'){visible=chapter===1||chapter===2;sub=`${state.queue}/${TL.model.queueLimit} · representación escalada`;}
        if(n.startsWith('SERVICIO')){
          if(a===allServices){visible=chapter===4;}
          else{
            const i=serviceLabels.indexOf(a);visible=racks[i].g.visible&&chapter!==4;
            sub=i===3?(state.ready?'✓ LISTA':'INICIANDO'):chapter>=3?'✓ LISTA':i===0&&pressure>.5?'SATURADO':'ACTIVO';
          }
        }
        if(chapter===0)visible=n==='API GATEWAY';
        if(chapter===4)sub='';
        const point=[...a.p];
        if(chapter===4&&n==='BASE DE DATOS')point[1]=.8;
        const p=stage.project(point),s=innerWidth/1080;
        const fontSize=chapter===4?17:n==='RATE LIMITING'||n==='LOAD SHEDDING'?21:23;
        a.dom.innerHTML=n+`<span class="sub">${sub}</span>`;a.dom.style.fontSize=`${fontSize}px`;
        a.dom.style.left=`${p.x/s}px`;a.dom.style.top=`${p.y/s}px`;
        const minY=chapter===4?455:n==='BASE DE DATOS'&&(chapter===1||chapter===2)?270:355;
        a.dom.style.opacity=visible&&p.visible&&p.x/s>65&&p.x/s<1015&&p.y/s>minY&&p.y/s<810?1:0;
        if(chapter===2&&n==='HTTP 429'&&state.limit){
          a.dom.innerHTML='429 Too Many Requests<span class="sub">Límite excedido</span>';
          a.dom.style.left='245px';a.dom.style.top='740px';a.dom.style.fontSize='20px';a.dom.style.opacity=1;
        }
        if(n==='HTTP 429'||n==='HTTP 503')a.dom.style.color=C.red;
        if(n==='LOAD SHEDDING')a.dom.style.color=C.amber;
        if(n==='RATE LIMITING')a.dom.style.color=C.cyan;
      });
      stage.render();window.TRAFFIC_STATE={...state,targets,dbCapacity:TL.model.dbCapacity};return {};
    }
  };
});
