import * as THREE from 'three';
import { makeRenderer, studioEnv, goldMaterial } from './ingot.js';

// Photo → 3D render studio: a ring "reconstructed" from a sketch, on a turntable.
export function createStudio(canvas) {
  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  studioEnv(renderer, scene);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100); cam.position.set(0, 1.4, 7.2); cam.lookAt(0, 0.2, 0);

  const ringG = new THREE.Group(); scene.add(ringG);
  const metal = goldMaterial(0xffc35a, 0.07);

  // band: lathe profile so it reads as a real comfort-fit band
  const prof = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; prof.push(new THREE.Vector2(1.18 + Math.cos(a) * 0.12, Math.sin(a) * 0.2)); }
  const band = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), metal);
  band.rotation.x = Math.PI / 2; ringG.add(band);

  // crown + prongs
  const head = new THREE.Group(); head.position.y = 1.3; ringG.add(head);
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.26, 64, 1, true), metal); head.add(bezel);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.3, 6, 12), metal);
    p.position.set(Math.cos(a) * 0.34, 0.16, Math.sin(a) * 0.34); p.rotation.z = Math.cos(a) * -0.25; p.rotation.x = Math.sin(a) * 0.25; head.add(p);
  }
  // agate cabochon (the brand's namesake stone)
  const gem = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 96, 64, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0x5c0904, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.54, specularIntensity: 1, attenuationColor: new THREE.Color(0x8a1206), attenuationDistance: 0.25, envMapIntensity: 2.2 })
  );
  gem.scale.set(1, 0.5, 1); gem.position.y = 0.1; head.add(gem);
  // pavé side stones
  const dia = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: 0, transmission: 1, thickness: 0.3, ior: 2.4, dispersion: 4, envMapIntensity: 2.5 });
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const a = Math.PI / 2 + i * 0.12;
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), dia);
    s.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0); ringG.add(s);
  }

  // reflective floor
  // soft contact shadow + warm pool of light instead of a hard floor
  const sc = document.createElement('canvas'); sc.width = sc.height = 256; const sg = sc.getContext('2d');
  const grd = sg.createRadialGradient(128, 128, 0, 128, 128, 128); grd.addColorStop(0, 'rgba(0,0,0,.75)'); grd.addColorStop(0.45, 'rgba(0,0,0,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.55; scene.add(floor);
  const pc = document.createElement('canvas'); pc.width = pc.height = 256; const pg = pc.getContext('2d');
  const g2 = pg.createRadialGradient(128, 128, 0, 128, 128, 128); g2.addColorStop(0, 'rgba(212,175,106,.35)'); g2.addColorStop(1, 'rgba(212,175,106,0)');
  pg.fillStyle = g2; pg.fillRect(0, 0, 256, 256);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -1.56; scene.add(pool);
  const key = new THREE.SpotLight(0xfff3dc, 160, 30, 0.45, 0.7, 1.2); key.position.set(3, 7, 4); scene.add(key);
  const rim = new THREE.PointLight(0xffa860, 25, 20); rim.position.set(-4, 2, -3); scene.add(rim);

  // wireframe "scan" ghost shown during reconstruction
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.TorusGeometry(1.18, 0.16, 12, 48)), new THREE.LineBasicMaterial({ color: 0xf7e4b5, transparent: true, opacity: 0 }));
  scene.add(wire);

  let rotY = 0.5, velY = 0.004, rotX = 0.15, dragging = false, lx = 0, ly = 0, reveal = 1, revealT = 1;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; velY = (e.clientX - lx) * 0.0025; rotX = THREE.MathUtils.clamp(rotX + (e.clientY - ly) * 0.004, -0.4, 0.9); lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener('pointerup', () => { dragging = false; });

  let w = 0, h = 0, alive = true; const clock = new THREE.Clock();
  (function loop() {
    if (!alive) return;
    const r = canvas.getBoundingClientRect();
    if (r.width !== w || r.height !== h) { w = r.width; h = r.height; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    const t = clock.getElapsedTime();
    if (!dragging) velY += (0.004 - velY) * 0.02;
    rotY += velY;
    ringG.rotation.set(rotX, rotY, 0);
    ringG.position.y = 0.15 + Math.sin(t) * 0.05;
    reveal += (revealT - reveal) * 0.04;
    ringG.scale.setScalar(0.001 + reveal * 0.999);
    wire.material.opacity = (1 - reveal) * 0.7 + Math.max(0, 0.6 - Math.abs(reveal - 0.5)) * 0.5;
    wire.rotation.copy(ringG.rotation); wire.position.copy(ringG.position);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();

  return {
    setMetal(hex, rough) { metal.color.set(hex); metal.roughness = rough; },
    rebuild() { reveal = 0; revealT = 0; setTimeout(() => { revealT = 1; }, 1600); },
    dispose() { alive = false; renderer.dispose(); },
  };
}
