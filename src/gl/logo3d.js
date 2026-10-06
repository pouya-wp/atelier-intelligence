import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { LOGO_GLYPH, logo } from '../icons.js';

// The official mark as a real object: a gold medallion (satin field, polished bevel and rim)
// with the glyph raised in white enamel. One shared WebGL renderer draws every logo on the
// page into its own 2D canvas, so any number of logos costs a single GL context.

let shared = null;
const instances = new Set();
const mouse = { x: 0.3, y: -0.4 };
const SSAA = 1.5; // render 1.5× then scale down, FXAA on top

// product-shot studio: dark room, big overhead softbox, two tall strips, a back rim and a warm kicker.
// Small PMREM blur keeps reflections crisp → contrasty, believable gold.
export function studio(renderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x060606);
  const panel = (w, h, x, y, z, i, c = [1, 0.97, 0.92]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(9, 5, 0, 7, 3, 7);          // overhead softbox
  panel(1.2, 12, -7, 0, 2, 10);     // left strip
  panel(1.2, 12, 7, 0, 1, 8);       // right strip
  panel(14, 0.7, 0, 2.5, -8, 6);    // back rim line
  panel(3, 1.2, 1.5, -4, 6, 2.2, [1, 0.85, 0.65]); // warm kicker from below-front
  panel(30, 30, 0, -10, 0, 0.15);   // faint floor bounce
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.008).texture; pm.dispose();
  return tex;
}

function flipWinding(geo) {
  for (const name of ['position', 'normal', 'uv']) {
    const a = geo.attributes[name]; if (!a) continue;
    const n = a.itemSize, arr = a.array;
    for (let i = 0; i < a.count; i += 3) for (let k = 0; k < n; k++) {
      const j1 = (i + 1) * n + k, j2 = (i + 2) * n + k, tmp = arr[j1]; arr[j1] = arr[j2]; arr[j2] = tmp;
    }
    a.needsUpdate = true;
  }
}

// The medallion itself, shared by the logo renderer and the intro animation.
export function createMedal() {
  const medal = new THREE.Group();

  // disc: extruded circle with a generous bevel → the rolled edge of a struck coin
  const disc = new THREE.Shape(); disc.absarc(0, 0, 70, 0, Math.PI * 2, false);
  const discGeo = new THREE.ExtrudeGeometry(disc, { depth: 6, bevelEnabled: true, bevelThickness: 4, bevelSize: 3.5, bevelSegments: 10, curveSegments: 128 });
  discGeo.translate(0, 0, -3);
  const field = new THREE.MeshPhysicalMaterial({ color: 0xe6b450, metalness: 1, roughness: 0.2, envMapIntensity: 1.25 });
  const polished = new THREE.MeshPhysicalMaterial({ color: 0xf0c260, metalness: 1, roughness: 0.06, envMapIntensity: 1.35 });
  medal.add(new THREE.Mesh(discGeo, [field, polished]));

  // raised inner rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(64, 1.8, 24, 160), polished);
  rim.position.z = 7; medal.add(rim);

  // glyph: extruded from the official SVG path, centred on the medallion, raised enamel
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 151 153"><path d="${LOGO_GLYPH}"/></svg>`);
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
  const glyphGeo = new THREE.ExtrudeGeometry(shapes, { depth: 3, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 0.9, bevelSegments: 6, curveSegments: 48 });
  glyphGeo.translate(-75, -75, 0); glyphGeo.scale(1, -1, 1);
  flipWinding(glyphGeo); // the y-flip mirrors triangles; restore outward-facing winding
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0xfbf7ec, metalness: 0, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.0 });
  const glyph = new THREE.Mesh(glyphGeo, enamel);
  glyph.position.z = 6.2; medal.add(glyph);

  return medal;
}

function build() {
  const canvas = document.createElement('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const cam = new THREE.PerspectiveCamera(26, 1, 10, 1000);
  cam.position.set(0, 0, 385);

  const medal = createMedal(); scene.add(medal);

  // soft contact shadow rendered in GL (replaces a per-frame CSS drop-shadow)
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const sg = sc.getContext('2d'), sr = sg.createRadialGradient(64, 64, 20, 64, 64, 64);
  sr.addColorStop(0, 'rgba(4,28,20,.45)'); sr.addColorStop(1, 'rgba(4,28,20,0)'); sg.fillStyle = sr; sg.fillRect(0, 0, 128, 128);
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(176, 176), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shade.position.set(0, -7, -16); scene.add(shade);

  // light that follows the cursor across the whole page
  const key = new THREE.DirectionalLight(0xfff3dd, 1.4); scene.add(key);
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.12));

  // tone map + sRGB, then FXAA in display space; alpha is carried through for the transparent canvas
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, cam));
  composer.addPass(new OutputPass());
  const fxaa = new FXAAPass(); composer.addPass(fxaa);

  return { renderer, scene, cam, medal, key, composer, fxaa };
}

function frame(t) {
  requestAnimationFrame(frame);
  if (!shared || document.hidden) return;
  const { renderer, cam, medal, key, composer, fxaa } = shared;
  key.position.set(mouse.x * 300, mouse.y * 300 + 120, 260);
  for (const inst of instances) {
    if (!inst.canvas.isConnected) { instances.delete(inst); continue; }
    if (!inst.visible) continue;
    // idle logos redraw at ~24 fps; hovered ones every frame
    if (!inst.hover && Math.abs(inst.s - 1) < 0.002 && t - inst.last < 41) continue;
    inst.last = t;
    inst.tx += ((inst.hover ? inst.hx : Math.sin(t / 2600 + inst.seed) * 0.12) - inst.tx) * 0.09;
    inst.ty += ((inst.hover ? inst.hy : Math.cos(t / 3100 + inst.seed) * 0.08) - inst.ty) * 0.09;
    inst.s += ((inst.hover ? 1.05 : 1) - inst.s) * 0.12;
    const px = Math.round(inst.size * Math.min(devicePixelRatio, 2));
    const rpx = Math.round(px * SSAA);
    if (renderer.domElement.width !== rpx) { renderer.setSize(rpx, rpx, false); composer.setSize(rpx, rpx); fxaa.setSize(rpx, rpx); }
    medal.rotation.set(inst.ty, inst.tx, 0);
    medal.scale.setScalar(inst.s);
    composer.render();
    const g = inst.ctx; g.clearRect(0, 0, px, px); g.imageSmoothingQuality = 'high'; g.drawImage(renderer.domElement, 0, 0, px, px);
  }
}

addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; }, { passive: true });

// Replace the contents of `host` with a live 3D logo (falls back to the SVG mark).
export function mountLogo(host) {
  if (!shared) { shared = build(); if (shared) requestAnimationFrame(frame); }
  if (!shared) { host.innerHTML = logo(); return; }
  const size = Math.max(host.clientWidth, host.clientHeight, 40);
  const px = Math.round(size * Math.min(devicePixelRatio, 2));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px; canvas.className = 'logo3d'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'طلای عقیق');
  host.innerHTML = ''; host.appendChild(canvas);
  const inst = { canvas, ctx: canvas.getContext('2d'), size, visible: true, hover: false, hx: 0, hy: 0, tx: 0, ty: 0, s: 1, last: 0, seed: Math.random() * 10 };
  instances.add(inst);
  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    inst.hover = true;
    inst.hx = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
    inst.hy = ((e.clientY - r.top) / r.height - 0.5) * 0.9;
  });
  host.addEventListener('pointerleave', () => { inst.hover = false; });
  new IntersectionObserver(([en]) => { inst.visible = en.isIntersecting; }).observe(canvas);
}
