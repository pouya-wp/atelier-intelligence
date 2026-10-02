import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function goldMaterial(color = 0xf2c46d, rough = 0.2, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: rough, clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 1.25, ...extra });
}

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

export function studioEnv(renderer, scene) {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env; pm.dispose();
  return env;
}

function stampTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  g.lineWidth = 6; g.strokeRect(40, 40, 944, 432);
  g.lineWidth = 2; g.strokeRect(60, 60, 904, 392);
  g.textAlign = 'center';
  g.font = '300 96px "Cormorant Garamond", Georgia, serif'; g.fillText('AGHIGH  GOLD', 512, 200);
  g.font = '700 70px Vazirmatn, sans-serif'; g.fillText('طلای عقیق', 512, 300);
  g.font = '400 40px Georgia, serif'; g.fillText('FINE GOLD   999.9   ·   1000 g   ·   YAZD', 512, 395);
  // diamond mark
  g.save(); g.translate(512, 105); g.rotate(Math.PI / 4); g.strokeRect(-16, -16, 32, 32); g.restore();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}

function coinTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#444'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 238, 0, 7); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(256, 256, 214, 0, 7); g.stroke();
  for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 222, 256 + Math.sin(a) * 222); g.lineTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232); g.stroke(); }
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 150px Vazirmatn, sans-serif'; g.fillText('ع', 256, 236);
  g.font = '500 34px Georgia, serif'; g.fillText('AGHIGH · 750', 256, 360);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}

export function createIngotScene(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  studioEnv(renderer, scene);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  cam.position.set(0, 1.6, 9); cam.lookAt(0, 0, 0);

  const root = new THREE.Group(); scene.add(root);

  // the bar
  const bar = new THREE.Group(); root.add(bar);
  const gold = goldMaterial(0xf0c062, 0.17);
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.62, 1.6, 6, 0.16), gold);
  bar.add(body);
  const stamp = stampTexture();
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 1.42),
    goldMaterial(0xe9b65a, 0.32, { bumpMap: stamp, bumpScale: 2.2, alphaMap: stamp, transparent: true, roughnessMap: stamp })
  );
  face.rotation.x = -Math.PI / 2; face.position.y = 0.312; bar.add(face);
  bar.rotation.set(0.32, -0.55, 0.06);
  bar.position.set(0, 0, 0);

  // second, smaller bar stacked behind
  const bar2 = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.42, 1.05, 5, 0.12), goldMaterial(0xe8b55a, 0.24));
  bar2.position.set(0.9, -0.95, -1.6); bar2.rotation.set(0.25, 0.4, -0.05); root.add(bar2);

  // coins orbiting
  const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 96);
  const coinFace = coinTexture();
  const coinSide = goldMaterial(0xe9b860, 0.35);
  const coins = [];
  for (let i = 0; i < 5; i++) {
    const face = goldMaterial(0xf5cc78, 0.2, { bumpMap: coinFace, bumpScale: 3, roughnessMap: coinFace });
    const m = new THREE.Mesh(coinGeo, [coinSide, face, face]);
    m.userData = { a: (i / 5) * Math.PI * 2, r: 2.4 + (i % 2) * 0.5, y: (i - 2) * 0.35, s: 0.18 + i * 0.03 };
    root.add(m); coins.push(m);
  }

  // gold dust
  const N = 900, pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 12; pos[i * 3 + 1] = (Math.random() - .5) * 6; pos[i * 3 + 2] = (Math.random() - .5) * 6; seeds[i] = Math.random(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const dm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position; p.y += mod(uTime*.12*(.3+seed) + seed*6., 6.) - 3.; p.x += sin(uTime*.3+seed*20.)*.2;
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      gl_PointSize = (1.5+seed*3.5)*uPx*(6./-mv.z); vA = .25+.75*abs(sin(uTime*1.5+seed*40.)); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor = vec4(1.,.85,.55, vA*smoothstep(.5,0.,d)); }`,
  });
  scene.add(new THREE.Points(dg, dm));

  // lights: a key that follows the cursor + warm rim
  const key = new THREE.SpotLight(0xfff1d0, 220, 30, 0.5, 0.6, 1.4); key.position.set(3, 5, 6); scene.add(key); scene.add(key.target);
  const rim = new THREE.PointLight(0xff9a4a, 30, 20); rim.position.set(-5, 1, -4); scene.add(rim);
  const fill = new THREE.PointLight(0xb23a2e, 12, 20); fill.position.set(4, -3, 2); scene.add(fill);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  addEventListener('pointermove', onMove);

  let w = 0, h = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width === w && r.height === h) return;
    w = r.width; h = r.height; renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    // keep the bars on the "end" (left in RTL) side, scale for narrow cards
    const narrow = w < 700;
    root.position.set(narrow ? 0 : -3.3, narrow ? -1.3 : 0.1, 0);
    root.scale.setScalar(narrow ? 0.72 : 1);
  }
  const clock = new THREE.Clock(); let raf, alive = true;
  function loop() {
    if (!alive) return;
    resize();
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    root.rotation.y = mouse.x * 0.35 + Math.sin(t * 0.25) * 0.08;
    root.rotation.x = -mouse.y * 0.15;
    bar.position.y = Math.sin(t * 0.8) * 0.08;
    bar2.position.y = -0.75 + Math.sin(t * 0.7 + 1) * 0.06;
    coins.forEach((c) => {
      const u = c.userData, a = u.a + t * u.s;
      c.position.set(Math.cos(a) * u.r, u.y + Math.sin(t + u.a) * 0.15, Math.sin(a) * u.r * 0.6);
      c.rotation.set(t * 0.6 + u.a, t * 0.9, 0.4);
    });
    key.position.set(mouse.x * 8, 4 + mouse.y * 3, 6);
    dm.uniforms.uTime.value = t;
    renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  }
  loop();
  return { dispose() { alive = false; cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); renderer.dispose(); } };
}
