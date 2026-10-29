import * as THREE from './vendor/three/three.module.min.js';
// Design 1.2: Three.js owns the bullet and deforming paper; CSS owns page layout.
export async function mountBullet(hero, canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true}); }
  catch { hero.dataset.bulletRenderer='fallback'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(240,240,false);
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.7;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,50); camera.position.z=8;
  scene.add(new THREE.HemisphereLight(0xffffff,0x664012,3));
  for (const [color,power,x,y,z] of [[0xffffff,80,3,4,5],[0xffd893,45,-3,-1,3],[0xffffff,60,-2,3,-2]]) {
    const light=new THREE.PointLight(color,power); light.position.set(x,y,z); scene.add(light);
  }
  const bullet=new THREE.Group();scene.add(bullet);
  const brass=new THREE.MeshStandardMaterial({color:0xb68b36,metalness:.78,roughness:.27});
  const copper=new THREE.MeshStandardMaterial({color:0xcb8050,metalness:.72,roughness:.25});
  const dark=new THREE.MeshStandardMaterial({color:0x79501d,metalness:.8,roughness:.3});
  function lathe(profile,material) { const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64),material);bullet.add(mesh);return mesh; }
  lathe([[0,-1.25],[.29,-1.25],[.29,-1.17],[.25,-1.14],[.25,-1.05],[.28,-1.02],[.28,.35],[.26,.48],[.235,.52]],brass);
  lathe([[.235,.43],[.235,.66],[.225,.83],[.19,1.02],[.12,1.23],[.045,1.40],[0,1.47]],copper);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.265,.017,12,64),dark);ring.rotation.x=Math.PI/2;ring.position.y=-1.07;bullet.add(ring);
  const primer=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.012,32),copper);primer.position.y=-1.256;bullet.add(primer);
  // A connected sheet of paper: torn inner edge, curled lip, no flying particles.
  const paperCanvas = document.querySelector('.paper-canvas');
  const paperRenderer = new THREE.WebGLRenderer({canvas:paperCanvas,alpha:true,antialias:true});
  paperRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const paperScene = new THREE.Scene();
  const paperCamera = new THREE.OrthographicCamera(0,1,1,0,.1,4000);paperCamera.position.z=2000;
  const segments=160, rings=18, count=(segments+1)*(rings+1);
  const geometry=new THREE.BufferGeometry();
  const positions=new Float32Array(count*3),uvs=new Float32Array(count*2),colors=new Float32Array(count*3),indices=[];
  for(let i=0;i<segments;i++)for(let j=0;j<rings;j++){const a=i*(rings+1)+j,b=a+rings+1;indices.push(a,b,a+1,b,b+1,a+1);}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setIndex(indices);
  const sheetTextureCanvas=document.createElement('canvas');
  const sheetTexture=new THREE.CanvasTexture(sheetTextureCanvas);sheetTexture.colorSpace=THREE.SRGBColorSpace;
  const sheet=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:sheetTexture,vertexColors:true,side:THREE.DoubleSide}));sheet.frustumCulled=false;paperScene.add(sheet);
  const logoImages = await Promise.all([...document.querySelectorAll('.logo-single svg, .logo-stack svg')].map(async element => {
    const svg=element.cloneNode(true), image=new Image();
    svg.style.color=getComputedStyle(element).color;
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.outerHTML);
    await image.decode(); return {element,image};
  }));
  let width=1,height=1,impactX=0,impactY=0,reach=1;
  function preparePaper(){
    const bounds=hero.getBoundingClientRect(),trigger=canvas.getBoundingClientRect();
    width=bounds.width;height=bounds.height;impactX=trigger.left-bounds.left+trigger.width/2;impactY=height-(trigger.top-bounds.top+trigger.height/2);
    reach=Math.hypot(Math.max(impactX,width-impactX),Math.max(impactY,height-impactY))*1.55;
    paperRenderer.setSize(width,height,false);paperCamera.right=width;paperCamera.top=height;paperCamera.updateProjectionMatrix();
    sheetTextureCanvas.width=width;sheetTextureCanvas.height=height;const ctx=sheetTextureCanvas.getContext('2d');
    ctx.fillStyle=getComputedStyle(hero).backgroundColor;ctx.fillRect(0,0,width,height);
    for(const {element,image} of logoImages){const logo=element.getBoundingClientRect();if(logo.width&&logo.height)ctx.drawImage(image,logo.left-bounds.left,logo.top-bounds.top,logo.width,logo.height);}
    const laurel=document.querySelector('.festival-laurel'), lr=laurel.getBoundingClientRect();if(laurel.complete)ctx.drawImage(laurel,lr.left-bounds.left,lr.top-bounds.top,lr.width,lr.height);
    const credit=document.querySelector(['2','2.2'].includes(hero.dataset.design)?'.logo-stack .director-credit':'.logo-single .director-credit'),cr=credit.getBoundingClientRect(),cs=getComputedStyle(credit);ctx.font=cs.font;ctx.fillStyle=cs.color;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(credit.textContent,cr.left-bounds.left+cr.width/2,cr.top-bounds.top);
    sheetTexture.needsUpdate=true;
  }
  function drawPaper(elapsed){
    const p=Math.max(0,Math.min(1,(elapsed-480)/1400));
    const eased=p*p*(3-2*p), hole=p===0?0:8+eased*reach;
    const outer=reach*2;
    for(let i=0;i<=segments;i++){
      const angle=i/segments*Math.PI*2;
      const ragged=1+.065*Math.sin(angle*19)+.035*Math.sin(angle*43)+.025*Math.cos(angle*71);
      for(let j=0;j<=rings;j++){
        const t=j/rings,baseRadius=hole*ragged+(outer-hole*ragged)*t;
        const curl=Math.sin(Math.PI*p)*110*Math.exp(-t*18);
        const r=baseRadius+curl*.65, x=impactX+Math.cos(angle)*r,y=impactY+Math.sin(angle)*r;
        const n=i*(rings+1)+j;
        positions[n*3]=x;positions[n*3+1]=y;positions[n*3+2]=curl*(.8+.2*Math.sin(angle*5));
        uvs[n*2]=(impactX+Math.cos(angle)*baseRadius)/width;uvs[n*2+1]=(impactY+Math.sin(angle)*baseRadius)/height;
        const shade=1-Math.sin(Math.PI*p)*Math.exp(-t*22)*(.18+.14*(Math.cos(angle-1)+1)/2);
        colors[n*3]=colors[n*3+1]=colors[n*3+2]=shade;
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.uv.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
    paperRenderer.render(paperScene,paperCamera);
  }

  let frame=0, openingAt=0, oldOpen=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function active(){return !document.hidden&&['1.2','2.2'].includes(hero.dataset.design)&&hero.dataset.view==='home';}
  function draw(time) {
    frame=0;if(!active())return;
    const open=hero.dataset.reveal==='open';
    if(open&&!oldOpen){openingAt=time;preparePaper();}
    oldOpen=open;
    const elapsed=open?time-openingAt:0;
    const turn=open?Math.min(1,elapsed/270):0;
    const eased=turn*turn*(3-2*turn);
    // The copper tip is +Y. Rotating -90 degrees sends it away from the camera (-Z).
    bullet.rotation.set(.25+(-Math.PI/2-.25)*eased,.35*(1-eased),-.65*(1-eased));
    bullet.position.z=open?-Math.pow(Math.max(0,(elapsed-260)/240),2)*38:0;
    bullet.visible=!open||elapsed<510;
    if(!open&&!reduced.matches)bullet.rotation.y+=Math.sin(time*.0015)*.12;
    renderer.render(scene,camera);
    if(open&&!reduced.matches)drawPaper(elapsed);
    if(!reduced.matches&&(!open||elapsed<1900))frame=requestAnimationFrame(draw);
  }

  function sync(){if(hero.dataset.reveal!=='open')oldOpen=false;if(frame)cancelAnimationFrame(frame);frame=0;if(active())frame=requestAnimationFrame(draw);else oldOpen=false;}
  new MutationObserver(sync).observe(hero,{attributes:true,attributeFilter:['data-design','data-view','data-reveal']});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();hero.dataset.bulletRenderer='fallback';cancelAnimationFrame(frame);});
  hero.dataset.bulletRenderer='ready';hero.dataset.paperRenderer='ready';sync();
}
