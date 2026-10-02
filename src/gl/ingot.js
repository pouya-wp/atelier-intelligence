import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import studioHDR from '@pmndrs/assets/hdri/studio.exr.js';
import { LOGO_GLYPH, LOGO_CIRCLE } from '../icons.js';

// draws the brand mark (ring + glyph) as an engraving mask
function drawMark(g, cx, cy, size) {
  g.save(); g.translate(cx - size / 2, cy - size / 2); g.scale(size / 150, size / 150);
  g.lineWidth = 6; g.stroke(new Path2D(LOGO_CIRCLE)); g.fill(new Path2D(LOGO_GLYPH));
  g.restore();
}

// Real polished gold: pure metal, no clearcoat (clearcoat is what reads as "plastic").
export function goldMaterial(color = 0xf2b84b, rough = 0.1, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: rough, envMapIntensity: 1.9, ...extra });
}

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

// Studio HDRI + hard-edged softbox strips → crisp, high-contrast jewellery reflections.
let hdrPromise;
function loadHDR() {
  hdrPromise ||= new EXRLoader().loadAsync(studioHDR).then((t) => { t.mapping = THREE.EquirectangularReflectionMapping; return t; });
  return hdrPromise;
}
export function studioEnv(renderer, scene) {
  loadHDR().then((hdr) => {
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.MeshBasicMaterial({ map: hdr, side: THREE.BackSide }));
    sky.material.color.setScalar(1.1); envScene.add(sky);
    // softboxes: big key above/behind (lights top faces), strip lights for razor edges, warm bounce below
    const box = (w, h, x, y, z, i, c = [1, 0.95, 0.85]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c).multiplyScalar(i), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    };
    box(14, 5, 0, 9, -6, 3.2);
    box(10, 4, 0, 8, 6, 2.2);
    box(1.4, 14, -9, 2, 1, 5);
    box(1.4, 14, 9, 2, -1, 4);
    box(16, 0.6, 0, 1.5, -11, 6);
    box(18, 6, 0, -8, 0, 0.6, [1, 0.7, 0.35]);
    scene.environment = pm.fromScene(envScene, 0.015).texture;
    pm.dispose();
  });
}

const fontReady = () => (document.fonts ? Promise.all([document.fonts.load('800 70px Meem'), document.fonts.load('500 40px Meem')]).catch(() => {}) : Promise.resolve());

// stamp: white = engraved & frosted, black = mirror polish
function stampTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  const draw = () => {
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 5; g.strokeRect(36, 36, 952, 440);
    drawMark(g, 512, 118, 120);
    g.font = '800 54px Meem'; g.fillText('طلای عقیق', 512, 222);
    g.fillRect(392, 258, 240, 2);
    g.font = '800 104px Meem'; g.fillText('999.9', 512, 334);
    g.font = '500 30px Meem'; g.fillText('FINE GOLD  ·  1000 g  ·  YAZD', 512, 428);
    t.needsUpdate = true;
  };
  draw(); fontReady().then(draw);
  return t;
}

function coinTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  const draw = () => {
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(256, 256, 236, 0, 7); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(256, 256, 212, 0, 7); g.stroke();
    for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 218, 256 + Math.sin(a) * 218); g.lineTo(256 + Math.cos(a) * 230, 256 + Math.sin(a) * 230); g.stroke(); }
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    drawMark(g, 256, 232, 230);
    g.font = '500 28px Meem'; g.fillText('AGHIGH · 750', 256, 392);
    t.needsUpdate = true;
  };
  draw(); fontReady().then(draw);
  return t;
}

// stamped face: frosted lettering (rough) recessed into a mirror surface
export function stampedGold(map, base = 0.08, frost = 0.5, color = 0xf2b84b) {
  const m = goldMaterial(color, 1, { bumpMap: map, bumpScale: -3, roughnessMap: map });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
        roughnessFactor = mix(${base.toFixed(3)}, ${frost.toFixed(3)}, texelRoughness.g);
      #endif`);
  };
  return m;
}

// ingot: tapered prism with tight bevels so edges catch thin highlight lines
function ingotGeometry(w, h, d, taper = 0.84, r = 0.035) {
  const geo = new RoundedBoxGeometry(w, h, d, 4, r);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = THREE.MathUtils.lerp(1, taper, (p.getY(i) + h / 2) / h);
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createIngotScene(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  studioEnv(renderer, scene);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  cam.position.set(0, 2.2, 9.5); cam.lookAt(0, 0, 0);

  const root = new THREE.Group(); scene.add(root);
  const bar = new THREE.Group(); root.add(bar);
  const W = 3.4, H = 0.62, D = 1.6, T = 0.84;
  bar.add(new THREE.Mesh(ingotGeometry(W, H, D, T), goldMaterial(0xf2b84b, 0.1)));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * T - 0.14, D * T - 0.12), stampedGold(stampTexture()));
  face.rotation.x = -Math.PI / 2; face.position.y = H / 2 + 0.002; bar.add(face);
  bar.rotation.set(0.42, -0.6, 0.04);

  const bar2 = new THREE.Mesh(ingotGeometry(2.2, 0.42, 1.05, 0.84), goldMaterial(0xeab04a, 0.14));
  bar2.position.set(0.9, -0.75, -1.6); bar2.rotation.set(0.25, 0.4, -0.05); root.add(bar2);

  const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 128);
  const coinFace = coinTexture();
  const edge = goldMaterial(0xf2b84b, 0.22);
  const coins = [];
  for (let i = 0; i < 5; i++) {
    const f = stampedGold(coinFace, 0.07, 0.42);
    const m = new THREE.Mesh(coinGeo, [edge, f, f]);
    m.userData = { a: (i / 5) * Math.PI * 2, r: 2.4 + (i % 2) * 0.5, y: (i - 2) * 0.35, s: 0.18 + i * 0.03 };
    root.add(m); coins.push(m);
  }

  // sparse gold dust
  const N = 380, pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 12; pos[i * 3 + 1] = (Math.random() - .5) * 6; pos[i * 3 + 2] = (Math.random() - .5) * 6; seeds[i] = Math.random(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const dm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position; p.y += mod(uTime*.12*(.3+seed) + seed*6., 6.) - 3.; p.x += sin(uTime*.3+seed*20.)*.2;
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      gl_PointSize = (1.+seed*2.5)*uPx*(6./-mv.z); vA = .2+.8*pow(abs(sin(uTime*1.5+seed*40.)),4.); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor = vec4(1.,.86,.55, vA*smoothstep(.5,0.,d)); }`,
  });
  scene.add(new THREE.Points(dg, dm));

  // one hard key that follows the cursor — the highlight you "move to light"
  const key = new THREE.SpotLight(0xfff4e0, 260, 30, 0.35, 0.35, 1.4); key.position.set(3, 5, 6); scene.add(key); scene.add(key.target);

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
    const narrow = w < 700;
    root.position.set(narrow ? 0 : -3.3, narrow ? -1.3 : 0.1, 0);
    root.scale.setScalar(narrow ? 0.72 : 1);
  }
  const timer = new THREE.Timer(); let raf, alive = true;
  function loop(ts) {
    if (!alive) return;
    resize(); timer.update(ts);
    const t = timer.getElapsed();
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    root.rotation.y = mouse.x * 0.4 + Math.sin(t * 0.25) * 0.06;
    root.rotation.x = -mouse.y * 0.18;
    bar.position.y = Math.sin(t * 0.8) * 0.06;
    bar2.position.y = -0.75 + Math.sin(t * 0.7 + 1) * 0.05;
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
  raf = requestAnimationFrame(loop);
  return { dispose() { alive = false; cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); renderer.dispose(); } };
}
