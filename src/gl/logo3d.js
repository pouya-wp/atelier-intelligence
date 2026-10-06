import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { studioEnv } from './ingot.js';
import { LOGO_GLYPH, logo } from '../icons.js';

// The official mark as a real object: a gold medallion (satin field, polished bevel and rim)
// with the glyph raised in white enamel. One shared WebGL renderer draws every logo on the
// page into its own 2D canvas, so any number of logos costs a single GL context.

let shared = null;
const instances = new Set();
const mouse = { x: 0.3, y: -0.4 };

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
  studioEnv(renderer, scene);
  const cam = new THREE.PerspectiveCamera(26, 1, 10, 1000);
  cam.position.set(0, 0, 360);

  const medal = new THREE.Group(); scene.add(medal);

  // disc: extruded circle with a generous bevel → the rolled edge of a struck coin
  const disc = new THREE.Shape(); disc.absarc(0, 0, 70, 0, Math.PI * 2, false);
  const discGeo = new THREE.ExtrudeGeometry(disc, { depth: 6, bevelEnabled: true, bevelThickness: 4, bevelSize: 3.5, bevelSegments: 10, curveSegments: 128 });
  discGeo.translate(0, 0, -3);
  const field = new THREE.MeshPhysicalMaterial({ color: 0xe9b955, metalness: 1, roughness: 0.3, envMapIntensity: 1.7 });
  const polished = new THREE.MeshPhysicalMaterial({ color: 0xf0c260, metalness: 1, roughness: 0.14, envMapIntensity: 1.6 });
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
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0xfbf7ec, metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 });
  const glyph = new THREE.Mesh(glyphGeo, enamel);
  glyph.position.z = 6.2; medal.add(glyph);

  // light that follows the cursor across the whole page
  const key = new THREE.DirectionalLight(0xfff3dd, 2.2); scene.add(key);
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.45));

  return { renderer, scene, cam, medal, key };
}

function frame(t) {
  requestAnimationFrame(frame);
  if (!shared || document.hidden) return;
  const { renderer, scene, cam, medal, key } = shared;
  key.position.set(mouse.x * 300, mouse.y * 300 + 120, 260);
  for (const inst of instances) {
    if (!inst.canvas.isConnected) { instances.delete(inst); continue; }
    if (!inst.visible) continue;
    inst.tx += ((inst.hover ? inst.hx : Math.sin(t / 2600 + inst.seed) * 0.12) - inst.tx) * 0.09;
    inst.ty += ((inst.hover ? inst.hy : Math.cos(t / 3100 + inst.seed) * 0.08) - inst.ty) * 0.09;
    inst.s += ((inst.hover ? 1.05 : 1) - inst.s) * 0.12;
    const px = Math.round(inst.size * Math.min(devicePixelRatio, 2));
    if (renderer.domElement.width !== px) renderer.setSize(px, px, false);
    medal.rotation.set(inst.ty, inst.tx, 0);
    medal.scale.setScalar(inst.s);
    renderer.render(scene, cam);
    const g = inst.ctx; g.clearRect(0, 0, px, px); g.drawImage(renderer.domElement, 0, 0, px, px);
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
  const inst = { canvas, ctx: canvas.getContext('2d'), size, visible: true, hover: false, hx: 0, hy: 0, tx: 0, ty: 0, s: 1, seed: Math.random() * 10 };
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
