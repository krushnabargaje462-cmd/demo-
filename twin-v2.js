import {watchLive,fmt,text} from './live-data.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';

// Mission Titan — realistic 4-cell holder twin.
// The geometry is intentionally based on the supplied reference photos:
// four blue cylindrical cells, black two-piece holder, exposed silver terminals,
// tight cell spacing, and no fake enclosure around the pack.

function clock(){
  text('clock',new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
}
clock(); setInterval(clock,1000);

const mount=document.getElementById('twin3d');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x070a0d);

const camera=new THREE.PerspectiveCamera(32,1,0.1,100);
camera.position.set(7.2,4.4,10.8);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(mount.clientWidth,mount.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.07;
controls.minDistance=5.8;
controls.maxDistance=16;
controls.target.set(0,0,0);

// ---------- Studio lighting ----------
scene.add(new THREE.HemisphereLight(0xeef7ff,0x17191b,2.0));
const key=new THREE.DirectionalLight(0xffffff,4.0);
key.position.set(4.5,8,8); key.castShadow=true; scene.add(key);
const fill=new THREE.DirectionalLight(0x8fcfff,1.5);
fill.position.set(-6,3,5); scene.add(fill);
const rim=new THREE.PointLight(0x2f8fff,7,16);
rim.position.set(-4,3,-4); scene.add(rim);

// ---------- Ground / photo-like backdrop ----------
const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(22,16),
  new THREE.MeshStandardMaterial({color:0x111417,roughness:.88,metalness:0})
);
ground.rotation.x=-Math.PI/2;
ground.position.y=-1.82;
ground.receiveShadow=true;
scene.add(ground);

const pack=new THREE.Group();
pack.rotation.y=-0.08;
scene.add(pack);

// ---------- Holder materials ----------
const holderMat=new THREE.MeshStandardMaterial({color:0x0b0d0f,metalness:.25,roughness:.48});
const holderEdgeMat=new THREE.MeshStandardMaterial({color:0x15191c,metalness:.42,roughness:.34});
const holderHighlightMat=new THREE.MeshStandardMaterial({color:0x252b2f,metalness:.48,roughness:.30});
const blackRubber=new THREE.MeshStandardMaterial({color:0x050607,metalness:.03,roughness:.76});
const terminalMat=new THREE.MeshStandardMaterial({color:0xd8dde0,metalness:.96,roughness:.16});
const terminalDarkMat=new THREE.MeshStandardMaterial({color:0x747d83,metalness:.9,roughness:.22});
const nickelMat=new THREE.MeshStandardMaterial({color:0xbfc5c9,metalness:.96,roughness:.17});

function addBox(name,geo,pos,mat,group=pack){
  const m=new THREE.Mesh(geo,mat);
  m.name=name;
  m.position.copy(pos);
  m.castShadow=true;
  m.receiveShadow=true;
  group.add(m);
  return m;
}

// Reference-style lower and upper black holder plates.
addBox('bottom-frame',new THREE.BoxGeometry(6.25,.38,2.78),new THREE.Vector3(0,-1.48,0),holderMat);
addBox('top-front-frame',new THREE.BoxGeometry(6.25,.34,.48),new THREE.Vector3(0,1.48,1.18),holderEdgeMat);
addBox('top-back-frame',new THREE.BoxGeometry(6.25,.34,.48),new THREE.Vector3(0,1.48,-1.18),holderEdgeMat);
addBox('top-left-frame',new THREE.BoxGeometry(.42,.34,2.36),new THREE.Vector3(-2.91,1.48,0),holderEdgeMat);
addBox('top-right-frame',new THREE.BoxGeometry(.42,.34,2.36),new THREE.Vector3(2.91,1.48,0),holderEdgeMat);
addBox('bottom-front-frame',new THREE.BoxGeometry(6.25,.30,.42),new THREE.Vector3(0,-1.48,1.19),holderEdgeMat);
addBox('bottom-back-frame',new THREE.BoxGeometry(6.25,.30,.42),new THREE.Vector3(0,-1.48,-1.19),holderEdgeMat);
addBox('bottom-left-frame',new THREE.BoxGeometry(.42,.30,2.38),new THREE.Vector3(-2.91,-1.48,0),holderEdgeMat);
addBox('bottom-right-frame',new THREE.BoxGeometry(.42,.30,2.38),new THREE.Vector3(2.91,-1.48,0),holderEdgeMat);

const CELL_X=[-2.13,-.71,.71,2.13];
const cells=[];
const cellMaterials=[];
const faultGlows=[];
const faultLights=[];
const warningGlows=[];

// ---------- Cell label texture ----------
function createCellLabel(index){
  const canvas=document.createElement('canvas');
  canvas.width=512; canvas.height=220;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.font='bold 31px Arial';
  ctx.textAlign='center';
  ctx.fillText('LiFePO4  3.2V  32700',256,74);
  ctx.font='23px Arial';
  ctx.fillText('CELL '+index+'   •   MISSION TITAN',256,115);
  ctx.font='18px Arial';
  ctx.fillStyle='rgba(255,255,255,.70)';
  ctx.fillText('3.2V / 6000mAh',256,151);
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

function createFaultIndicator(group,index){
  const glowMat=new THREE.MeshBasicMaterial({color:0xff0018,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.31,32,32),glowMat);
  glow.position.set(0,1.76,.0);
  glow.visible=false;
  group.add(glow);
  faultGlows.push(glow);

  const light=new THREE.PointLight(0xff0018,0,4.2,2);
  light.position.set(0,1.65,.08);
  light.visible=false;
  group.add(light);
  faultLights.push(light);

  const ringMat=new THREE.MeshBasicMaterial({color:0xff0018,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.035,12,48),ringMat);
  ring.rotation.x=Math.PI/2;
  ring.position.set(0,1.67,.0);
  ring.visible=false;
  group.add(ring);
  warningGlows.push(ring);
}

// ---------- Four blue cells ----------
for(let i=0;i<4;i++){
  const group=new THREE.Group();
  group.position.set(CELL_X[i],0,0);
  group.userData.index=i+1;
  group.userData.critical=false;
  group.userData.warning=false;

  const wrapMat=new THREE.MeshStandardMaterial({
    color:0x148bd7,
    metalness:.04,
    roughness:.30,
    emissive:0x03131e,
    emissiveIntensity:.08
  });
  const can=new THREE.Mesh(new THREE.CylinderGeometry(.60,.60,2.78,72),wrapMat);
  can.castShadow=true; can.receiveShadow=true;
  can.userData.index=i+1;
  group.add(can);
  cellMaterials.push(wrapMat);

  // Subtle blue label band, close to the reference pack.
  const bandMat=new THREE.MeshStandardMaterial({color:0x0878bf,metalness:.02,roughness:.38});
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.605,.605,.33,72,1,true),bandMat);
  band.position.y=.10; group.add(band);

  // Bottom rolled rim.
  const bottomRim=new THREE.Mesh(new THREE.TorusGeometry(.565,.055,12,72),terminalDarkMat);
  bottomRim.rotation.x=Math.PI/2;
  bottomRim.position.y=-1.29;
  group.add(bottomRim);

  // Top rolled rim + black insulator + silver positive terminal.
  const topRim=bottomRim.clone(); topRim.position.y=1.29; group.add(topRim);
  const insulator=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.075,72),blackRubber);
  insulator.position.y=1.40; group.add(insulator);
  const terminal=new THREE.Mesh(new THREE.CylinderGeometry(.245,.245,.12,64),terminalMat);
  terminal.position.y=1.49; terminal.castShadow=true; terminal.userData.index=i+1; group.add(terminal);

  // Small central contact depression for a more photographic terminal.
  const contact=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.012,48),terminalDarkMat);
  contact.position.y=1.56; group.add(contact);

  // Negative base contact.
  const negative=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.06,72),terminalDarkMat);
  negative.position.y=-1.39; group.add(negative);

  // Printed wrapper text.
  const labelTex=createCellLabel(i+1);
  const label=new THREE.Mesh(
    new THREE.CylinderGeometry(.603,.603,.92,72,1,true,Math.PI*.15,Math.PI*.42),
    new THREE.MeshBasicMaterial({map:labelTex,transparent:true,side:THREE.DoubleSide,depthWrite:false})
  );
  label.position.y=.22;
  group.add(label);

  createFaultIndicator(group,i+1);
  pack.add(group);
  cells.push(group);
}

// ---------- Holder details around each top/bottom cell ----------
for(let i=0;i<4;i++){
  const x=CELL_X[i];
  // Circular black collar creates the four visible holes in the top holder.
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.68,.14,12,64),blackRubber);
  collar.rotation.x=Math.PI/2;
  collar.position.set(x,1.43,0);
  collar.castShadow=true;
  pack.add(collar);

  const bottomCollar=collar.clone();
  bottomCollar.position.y=-1.43;
  pack.add(bottomCollar);

  // Raised tabs between cells, like the molded holder in the reference.
  if(i<3){
    addBox('top-tab-'+i,new THREE.BoxGeometry(.24,.46,.72),new THREE.Vector3((x+CELL_X[i+1])/2,1.57,0),holderHighlightMat);
    addBox('bottom-tab-'+i,new THREE.BoxGeometry(.24,.40,.68),new THREE.Vector3((x+CELL_X[i+1])/2,-1.57,0),holderHighlightMat);
  }
}

// Tiny molded screw/rivet details.
for(const x of [-2.82,2.82]){
  for(const z of [-1.10,1.10]){
    const screw=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.06,24),terminalDarkMat);
    screw.rotation.x=Math.PI/2;
    screw.position.set(x,1.68,z);
    pack.add(screw);
  }
}

// ---------- Nickel bridge strips between adjacent positive contacts ----------
for(let i=0;i<3;i++){
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.62,.055,.20),nickelMat);
  bar.position.set((CELL_X[i]+CELL_X[i+1])/2,1.60,0);
  bar.castShadow=true;
  pack.add(bar);
}

// ---------- Main pack leads (subtle, tucked behind the holder) ----------
function wireCurve(points,color){
  const curve=new THREE.CatmullRomCurve3(points);
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,36,.045,10,false),new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.18}));
  tube.castShadow=true; pack.add(tube); return tube;
}
wireCurve([new THREE.Vector3(2.13,1.57,-.05),new THREE.Vector3(2.55,1.65,-.20),new THREE.Vector3(3.0,1.30,-.55)],0xd31f32);
wireCurve([new THREE.Vector3(-2.13,-1.48,.05),new THREE.Vector3(-2.55,-1.52,.20),new THREE.Vector3(-3.0,-1.15,.55)],0x1b2024);

// Ground contact shadow.
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(6.9,3.8),new THREE.ShadowMaterial({opacity:.34}));
shadow.rotation.x=-Math.PI/2;
shadow.position.y=-1.80;
shadow.receiveShadow=true;
pack.add(shadow);

// ---------- Interaction ----------
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let live={};

function colorForCell(v,min,max){
  if(!Number.isFinite(v)) return {color:0x3c6a86,emissive:0x03131f,critical:false,warning:false};
  const delta=max-min;
  if(delta>=.08 && Math.abs(v-min)<.006) return {color:0xff2638,emissive:0xff0018,critical:true,warning:false};
  if(delta>=.03 && Math.abs(v-min)<.015) return {color:0xe5a51f,emissive:0x6a3c00,critical:false,warning:true};
  return {color:0x168fdc,emissive:0x031f34,critical:false,warning:false};
}

function update3D(d){
  const vals=[1,2,3,4].map(i=>Number(d[`cell${i}Voltage`]));
  const finite=vals.filter(Number.isFinite);
  const min=finite.length?Math.min(...finite):NaN;
  const max=finite.length?Math.max(...finite):NaN;
  cells.forEach((group,i)=>{
    const state=colorForCell(vals[i],min,max);
    const mat=cellMaterials[i];
    mat.color.setHex(state.color);
    mat.emissive.setHex(state.emissive);
    group.userData.voltage=vals[i];
    group.userData.critical=state.critical;
    group.userData.warning=state.warning;
    faultGlows[i].visible=state.critical;
    faultLights[i].visible=state.critical;
    warningGlows[i].visible=state.critical;
  });
}

function selectCell(index){
  const v=Number(live[`cell${index}Voltage`]);
  const vals=[1,2,3,4].map(i=>Number(live[`cell${i}Voltage`]));
  const finite=vals.filter(Number.isFinite);
  const min=finite.length?Math.min(...finite):NaN;
  const delta=Number.isFinite(v)&&Number.isFinite(min)?v-min:NaN;
  const group=cells[index-1];
  const state=group.userData.critical?'red':group.userData.warning?'yellow':'green';
  document.getElementById('selectedCell').innerHTML=`<strong>CELL ${index}</strong> <span class="badge ${state}">${state==='red'?'CRITICAL':state==='yellow'?'MONITOR':'HEALTHY'}</span>`;
  document.getElementById('selectedParams').innerHTML=
    `<div class="param-line"><span>Voltage</span><strong>${fmt(v,3,' V')}</strong></div>
     <div class="param-line"><span>Difference from lowest</span><strong>${fmt(delta,3,' V')}</strong></div>
     <div class="param-line"><span>Pack SOC</span><strong>${fmt(live.soc,0,'%')}</strong></div>
     <div class="param-line"><span>Battery Temp</span><strong>${fmt(live.batteryTemperature,1,' °C')}</strong></div>
     <div class="param-line"><span>Cell Delta</span><strong>${fmt(live.cellDifference,3,' V')}</strong></div>`;
}

mount.addEventListener('pointerdown',e=>{
  const r=mount.getBoundingClientRect();
  pointer.x=((e.clientX-r.left)/r.width)*2-1;
  pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(cells,true);
  if(!hits.length)return;
  let obj=hits[0].object;
  while(obj && obj.userData.index==null) obj=obj.parent;
  if(obj?.userData?.index) selectCell(obj.userData.index);
});

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  const t=performance.now()/1000;
  cells.forEach((group,i)=>{
    const glow=faultGlows[i];
    const light=faultLights[i];
    const ring=warningGlows[i];
    if(group.userData.critical){
      // Fast, bright warning flash. This is intentionally obvious on a live twin.
      const p=.18+.82*(.5+.5*Math.sin(t*9));
      const p2=.25+.75*(.5+.5*Math.sin(t*9+Math.PI));
      glow.material.opacity=.08+.34*p;
      glow.scale.setScalar(.85+0.55*p);
      light.intensity=2+16*p;
      ring.material.opacity=.15+.8*p2;
      ring.scale.setScalar(.9+0.3*p2);
      cellMaterials[i].emissiveIntensity=.20+1.15*p;
    }else if(group.userData.warning){
      glow.visible=false; light.visible=false; ring.visible=false;
      cellMaterials[i].emissiveIntensity=.16;
    }else{
      glow.visible=false; light.visible=false; ring.visible=false;
      cellMaterials[i].emissiveIntensity=.08;
    }
  });
  renderer.render(scene,camera);
}
animate();

window.addEventListener('resize',()=>{
  camera.aspect=mount.clientWidth/mount.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(mount.clientWidth,mount.clientHeight);
});

function setFlow(op){
  const box=document.getElementById('motionState'), strip=document.querySelector('.flow-strip');
  box.className='motion-state '+String(op||'IDLE').toLowerCase();
  strip.className='flow-strip '+String(op||'IDLE').toLowerCase();
  document.querySelector('#motionState b').textContent=op||'IDLE';
  document.getElementById('flowText').textContent=op||'IDLE';
  document.getElementById('flowArrow').textContent=op==='CHARGING'?'→':op==='DISCHARGING'?'←':'•';
}

function conditionIndex(d){
  const delta=Number(d.cellDifference);
  const temp=Number(d.batteryTemperature);
  let score=100;
  if(Number.isFinite(delta)) score-=Math.min(35,Math.max(0,(delta-.02)*300));
  if(Number.isFinite(temp) && (temp>40 || temp<5)) score-=Math.min(20,Math.abs(temp-25)*.7);
  if(Number(d.protection)>0) score-=20;
  return Math.max(0,Math.min(100,Math.round(score)));
}

function updateModules(d){
  const score=conditionIndex(d);
  text('healthScore',score+'%');
  const hs=document.getElementById('healthState');
  hs.textContent=score>=85?'GOOD':score>=65?'MONITOR':'ATTENTION';
  hs.className='badge '+(score>=85?'green':score>=65?'yellow':'red');
  text('healthReason',Number(d.cellDifference)>=.08?'High cell imbalance is reducing the live condition index.':'Condition index is based on current telemetry; it is not final SOH.');

  const faults=[];
  if(Number(d.cellDifference)>=.08) faults.push(`<li class="fault-critical">High cell imbalance detected (${fmt(d.cellDifference,3,' V')}).</li>`);
  else if(Number(d.cellDifference)>=.03) faults.push(`<li class="fault-warn">Cell imbalance should be monitored (${fmt(d.cellDifference,3,' V')}).</li>`);
  if(Number(d.batteryTemperature)>45) faults.push(`<li class="fault-critical">Battery temperature is high (${fmt(d.batteryTemperature,1,' °C')}).</li>`);
  if(Number(d.protection)>0) faults.push(`<li class="fault-warn">BMS protection flag is active.</li>`);
  if(d.bmsConnected===false) faults.push(`<li class="fault-critical">BMS communication is offline.</li>`);
  document.getElementById('faults').innerHTML=faults.length?`<ul>${faults.join('')}</ul>`:`<span class="fault-ok">✓ No active rule-based fault detected.</span>`;

  const suggestions=[];
  if(Number(d.cellDifference)>=.08) suggestions.push('<li>Inspect the lowest-voltage cell before high-load testing.</li>');
  if(Number(d.batteryTemperature)>40) suggestions.push('<li>Reduce thermal stress and allow the battery to cool.</li>');
  if(d.operationStatus==='DISCHARGING' && Number(d.soc)<25) suggestions.push('<li>Consider ending deep discharge and recharge within the configured battery limits.</li>');
  if(d.operationStatus==='CHARGING' && Number(d.soc)>90) suggestions.push('<li>Monitor the charging session as SOC approaches the upper range.</li>');
  if(!suggestions.length) suggestions.push('<li>Continue collecting telemetry. Maintenance recommendations will become more data-driven as history grows.</li>');
  document.getElementById('maintenance').innerHTML=`<ul>${suggestions.join('')}</ul>`;

  document.getElementById('secondLife').innerHTML='<strong>History required.</strong><br>Second-life classification will use long-term SOH, capacity and degradation history rather than a single live reading.';
}

watchLive(raw=>{
  live={
    ...raw,
    voltage:raw.voltage ?? raw.bmsVoltage,
    current:raw.current ?? raw.bmsCurrent,
    power:raw.power ?? ((Number(raw.voltage)||0)*(Number(raw.current)||0)),
    batteryTemperature:raw.batteryTemperature ?? raw.bmsTemperature,
    operationStatus:raw.operationStatus ?? (Number(raw.current)>0.05?'CHARGING':Number(raw.current)<-0.05?'DISCHARGING':'IDLE')
  };
  const d=live;
  text('voltage',fmt(d.voltage,2,' V'));
  text('current',fmt(d.current,3,' A'));
  text('power',fmt(d.power,2,' W'));
  text('soc',fmt(d.soc,0,'%'));
  text('temp',fmt(d.batteryTemperature,1,' °C'));
  document.getElementById('socFill').style.width=`${Math.max(0,Math.min(100,Number(d.soc)||0))}%`;
  text('socLabel',fmt(d.soc,0,'%'));
  setFlow(d.operationStatus||'IDLE');
  update3D(d); updateModules(d);
  const st=document.getElementById('twinStatus');
  st.textContent=d.bmsConnected?'Live':'Offline';
  st.className=`status-dot ${d.bmsConnected?'online':'offline'}`;
});
