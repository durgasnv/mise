import * as THREE from 'three';

// A small procedural illustration: no model downloads, textures or shadow maps.
export function createKitchenScene(host, onReady, onUnavailable) {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor('#ead1af');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden','true');
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3.15,3.15,4,-4,0.1,40);
  camera.position.set(0,5.8,7.5);camera.lookAt(0,0.3,0);
  scene.add(new THREE.HemisphereLight('#fff8ec','#a58460',2.5));
  const light = new THREE.DirectionalLight('#fff4dc',3.2);light.position.set(-3,7,5);scene.add(light);
  const plate = new THREE.Group();scene.add(plate);
  const materials = [], geometries = [];
  const material = (color,extra={}) => { const m=new THREE.MeshStandardMaterial({color,roughness:0.7,...extra});materials.push(m);return m; };
  const geometry = g => {geometries.push(g);return g;};
  const ceramic = material('#fff8ec'), rim = material('#bb9163'), noodle = material('#d99940'), tomato = material('#e34e31'), herb = material('#365f3d'), cheese = material('#fff2c9');
  function mesh(shape,finish,parent=plate) {const m=new THREE.Mesh(shape,finish);parent.add(m);return m;}
  const base=mesh(geometry(new THREE.CylinderGeometry(2.45,2.27,0.14,64)),ceramic);base.position.y=-0.12;
  const ring=mesh(geometry(new THREE.TorusGeometry(2.29,0.018,6,64)),rim);ring.rotation.x=Math.PI/2;ring.position.y=-0.038;
  const well=mesh(geometry(new THREE.CylinderGeometry(1.96,2.12,0.05,64)),material('#ecd8b8'));well.position.y=-0.015;
  const shadow=mesh(geometry(new THREE.CircleGeometry(2.65,48)),material('#735b44',{transparent:true,opacity:0.12,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-0.22,-0.05);
  const parts=[];
  function part(object,index) {const home=object.position.clone();parts.push({object,home,lift:0.7+(index%4)*0.18,spread:0.12+(index%3)*0.08});}
  for(let i=0;i<15;i++) {
    const points=[];
    for(let n=0;n<=28;n++){const t=n/28*Math.PI*2;points.push(new THREE.Vector3(Math.cos(t+i*0.37)*(0.65+i*0.045),0.13+i*0.012+Math.sin(t*2+i)*0.065,Math.sin(t+i*0.22)*(0.62+i*0.037)));}
    const strand=mesh(geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),56,0.038,6,false)),noodle);part(strand,i);
  }
  const sphere=geometry(new THREE.SphereGeometry(1,20,14));
  [[-1.2,0.28,0.55],[1.15,0.33,0.4],[0.6,0.32,-1.15],[-0.45,0.3,-1.12],[-0.3,0.3,1.15]].forEach((p,i)=>{const m=mesh(sphere,tomato);m.scale.setScalar(0.27+(i%2)*0.045);m.position.set(...p);part(m,20+i);});
  [[-1.1,0.4,-0.15],[0.9,0.5,-0.35],[0,0.45,-0.95],[0.55,0.42,0.85],[-0.6,0.5,0.45]].forEach((p,i)=>{const m=mesh(sphere,herb);m.scale.set(0.43,0.045,0.2);m.position.set(...p);m.rotation.y=i*1.1;part(m,30+i);});
  const shave=geometry(new THREE.BoxGeometry(0.18,0.018,0.09));
  for(let i=0;i<10;i++){const m=mesh(shave,cheese);const a=i*2.4;m.position.set(Math.cos(a)*0.95,0.43+(i%3)*0.035,Math.sin(a)*0.86);m.rotation.y=a;part(m,40+i);}
  let disposed=false,visible=false,frame=0,progress=0,target=0,pointerX=0,pointerY=0,ready=false,renderedFrames=0;
  const touch=matchMedia('(pointer: coarse)').matches;
  function draw() {
    frame=0;if(disposed || !visible || document.hidden) return;
    progress+=(target-progress)*0.085;
    plate.rotation.y+=(pointerX*0.12-plate.rotation.y)*0.08;
    plate.rotation.x+=(pointerY*0.06-plate.rotation.x)*0.08;
    for(const {object,home,lift,spread} of parts){object.position.set(home.x*(1+(1-progress)*spread),home.y+(1-progress)*lift,home.z*(1+(1-progress)*spread));}
    try {renderer.render(scene,camera);} catch {onUnavailable();return;}
    canvas.dataset.frame=String(++renderedFrames);
    if(!ready){ready=true;onReady();}
    if(Math.abs(target-progress)>0.001 || Math.abs(pointerX*0.12-plate.rotation.y)>0.001 || Math.abs(pointerY*0.06-plate.rotation.x)>0.001) frame=requestAnimationFrame(draw);
  }
  function requestDraw(){if(!disposed && visible && !document.hidden && !frame) frame=requestAnimationFrame(draw);}
  function scroll(){const rect=host.getBoundingClientRect();target=THREE.MathUtils.clamp((innerHeight*0.88-rect.top)/(innerHeight*0.6),0,1);requestDraw();}
  function pointer(e){if(touch) return;const rect=host.getBoundingClientRect();pointerX=(e.clientX-rect.left)/rect.width-0.5;pointerY=(e.clientY-rect.top)/rect.height-0.5;requestDraw();}
  function leave(){pointerX=pointerY=0;requestDraw();}
  function size(){const {width,height}=host.getBoundingClientRect();if(!width || !height) return;camera.top=3.15*height/width;camera.bottom=-camera.top;camera.updateProjectionMatrix();renderer.setSize(width,height,false);scroll();}
  function stop(){if(frame) cancelAnimationFrame(frame);frame=0;}
  function visibility(){canvas.dataset.rendering=document.hidden || !visible ? "paused":"active";if(document.hidden) stop();else {scroll();requestDraw();}}
  function lost(e){e.preventDefault();stop();onUnavailable();}
  const resize=new ResizeObserver(size);resize.observe(host);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;canvas.dataset.rendering=visible && !document.hidden ? "active":"paused";if(visible){scroll();requestDraw();}else stop();});observer.observe(host);
  window.addEventListener('scroll',scroll,{passive:true});host.addEventListener('pointermove',pointer,{passive:true});host.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',lost);
  size();
  return () => {
    disposed=true;stop();resize.disconnect();observer.disconnect();window.removeEventListener('scroll',scroll);host.removeEventListener('pointermove',pointer);host.removeEventListener('pointerleave',leave);
    document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();
  };
}
