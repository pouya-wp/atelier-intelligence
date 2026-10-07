import * as THREE from 'three';
import { createMedal, studio } from './logo3d.js';

// Opening title: a line splits the screen (paper above, emerald "liquid" below). The brand coin is
// thrown in from the right, breaks the surface — the submerged part refracts and takes the green,
// the surface ripples and splashes — sinks onto the entry seal, then a ripple dissolve reveals the page.
// One GL context, created here and fully disposed when the intro ends.

const COMPOSITE = `
precision highp float;
uniform sampler2D tScene;
uniform vec2 uRes; uniform float uDpr, uTime, uLine, uFill, uSurf, uSplashX, uSplashT, uReveal;
uniform vec2 uCenter;
varying vec2 vUv;

vec3 neutral(vec3 c) {            // Khronos PBR Neutral, matches the rest of the site
  float x = min(c.r, min(c.g, c.b)); float off = x < .08 ? x - 6.25 * x * x : .04; c -= off;
  float peak = max(c.r, max(c.g, c.b)); if (peak < .76) return c;
  float d = .24, np = 1. - d * d / (peak + d - .76); c *= np / peak;
  float g = 1. - 1. / (.15 * (peak - np) + 1.); return mix(c, vec3(np), g);
}
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, 0.), vec3(1. / 2.4)) - .055, step(.0031308, c)); }
vec4 coin(vec2 uv) { return texture2D(tScene, uv); }   // already tone-mapped, premultiplied

void main() {
  vec2 p = gl_FragCoord.xy;                 // device px, origin bottom-left
  float H = uRes.y, W = uRes.x;
  // --- water surface: idle swell + damped ripple travelling out from the impact point
  float surf = uSurf * H + sin(p.x / H * 9. + uTime * 1.8) * .003 * H;
  float dt = uTime - uSplashT;
  if (uSplashT > 0. && dt > 0.) {
    float dx = abs(p.x - uSplashX) / H;
    surf += .034 * H * exp(-dt * 1.5) * exp(-dx * 2.2) * sin(dt * 11. - dx * 38.);
  }
  bool under = p.y < surf;

  // --- background: paper above; emerald fills downward from the line
  vec3 paper = vec3(.953, .957, .945);
  vec2 q = p / uRes;
  vec3 em = mix(vec3(.027, .18, .137), vec3(.078, .41, .31), smoothstep(1.25, .05, length((q - vec2(.85, .55)) * vec2(1.2, 1.))));
  float depth = clamp((surf - p.y) / H, 0., 1.);
  em *= 1. - depth * .35;                                       // darker with depth
  em += pow(abs(sin(p.x / H * 13. + uTime * 1.3) * sin(p.y / H * 17. - uTime * 1.1)), 3.) * .05 * (1. - depth); // caustics
  float filled = step(surf - p.y, uFill * H * 1.1);
  vec3 col = under ? mix(paper, em, filled) : paper;

  // --- the coin: clean above, refracted + tinted below the surface
  vec2 uv = q;
  if (under) uv += vec2(sin(p.y / H * 42. + uTime * 3.) * .006, cos(p.x / H * 36. + uTime * 2.4) * .004) * filled;
  vec4 c = coin(uv);
  if (under && filled > .5) { c.rgb = mix(c.rgb, c.rgb * vec3(.62, .95, .82), .45); }
  col = col * (1. - c.a) + c.rgb;

  // --- surface line: drawn from the centre outward, with a light meniscus under it
  float half_ = uLine * W * .5;
  float onLine = step(abs(p.x - W * .5), half_);
  float ld = abs(p.y - surf) / uDpr;
  col = mix(col, vec3(.04, .25, .19), smoothstep(1.2, 0., ld) * onLine * (1. - filled * .6));
  col += vec3(.8, .95, .9) * exp(-max(surf - p.y, 0.) / (6. * uDpr)) * .12 * filled * float(under);

  // --- ripple dissolve: inside the radius the page shows through; the edge refracts and glints
  float a = 1.;
  if (uReveal > 0.) {
    vec2 dir = p - uCenter; float d = length(dir);
    float e = d - uReveal;
    vec2 off = normalize(dir + 1e-4) * sin(e / (9. * uDpr)) * 14. * uDpr * exp(-abs(e) / (70. * uDpr));
    if (e > 0.) { vec4 c2 = coin((p + off) / uRes); col = mix(col, col * (1. - c2.a) + c2.rgb, .5); }
    a = smoothstep(-6. * uDpr, 26. * uDpr, e);
    col += vec3(.95, .86, .62) * exp(-abs(e) / (9. * uDpr)) * .45;              // champagne crest
    col += vec3(1.) * exp(-abs(e + 60. * uDpr) / (14. * uDpr)) * .08 * a;        // trailing echo
  }
  gl_FragColor = vec4(col * a, a);
}`;

export function playIntro(target) {
  return new Promise((resolve) => {
    const done = () => document.body.classList.remove('preintro');
    // note: no prefers-reduced-motion skip — Windows "animation effects: off" sets it, and the intro is the point of the demo
    let settled = false;
    const bail = (e) => { if (settled) return; settled = true; console.warn('intro skipped', e); try { renderer?.dispose(); } catch {} canvas.remove(); done(); resolve(); };
    const canvas = document.createElement('canvas'); canvas.className = 'intro';
    document.body.appendChild(canvas);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { canvas.remove(); done(); resolve(); return; }

    const dpr = Math.min(devicePixelRatio, 1.5);
    const W = innerWidth, H = innerHeight;
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ---- coin scene (linear HDR into an MSAA target; tone-mapped in the composite)
    const scene = new THREE.Scene(); scene.environment = studio(renderer);
    const FOV = 30, Z = 1000;
    const cam = new THREE.PerspectiveCamera(FOV, W / H, 10, 5000); cam.position.z = Z;
    const wpp = (2 * Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / H;   // world units per CSS px at z=0
    const toWorld = (x, y, v) => v.set((x - W / 2) * wpp, (y - H / 2) * wpp, 0);
    const medal = createMedal(); scene.add(medal);
    const key = new THREE.DirectionalLight(0xfff3dd, 1.4); key.position.set(300, 400, 600); scene.add(key);
    scene.add(new THREE.AmbientLight(0xfff4e0, 0.15));

    // splash droplets (emerald liquid thrown up into the paper)
    const N = 26, dpos = new Float32Array(N * 3), dsize = new Float32Array(N);
    const drops = Array.from({ length: N }, () => ({ x: 0, y: 0, vx: 0, vy: 0, live: false }));
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dgeo.setAttribute('size', new THREE.BufferAttribute(dsize, 1));
    const dmat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, premultipliedAlpha: true,
      uniforms: { uPx: { value: dpr } },
      vertexShader: 'attribute float size; uniform float uPx; void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize = size*uPx; }',
      fragmentShader: 'void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; float rim = smoothstep(.5,.3,d); vec3 c = mix(vec3(.004,.06,.04), vec3(.04,.22,.16), smoothstep(.5,.0,length(gl_PointCoord-vec2(.35,.3)))); gl_FragColor = vec4(c*rim, rim); }',
    });
    scene.add(new THREE.Points(dgeo, dmat));

    // the coin pass is drawn to the canvas, then copied here — no float render targets required
    const dbs = renderer.getDrawingBufferSize(new THREE.Vector2());
    const grab = new THREE.FramebufferTexture(dbs.x, dbs.y);

    // ---- composite (full-screen quad straight to the canvas)
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: grab }, uRes: { value: dbs.clone() }, uDpr: { value: dpr },
        uTime: { value: 0 }, uLine: { value: 0 }, uFill: { value: 0 }, uSurf: { value: 0.5 },
        uSplashX: { value: 0 }, uSplashT: { value: -1 }, uReveal: { value: 0 }, uCenter: { value: new THREE.Vector2() },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: COMPOSITE, depthTest: false, depthWrite: false,
    }));
    const post = new THREE.Scene(); post.add(quad);
    const ocam = new THREE.Camera();
    const U = quad.material.uniforms;

    // ---- choreography (CSS px, y up from the bottom)
    const r = target.getBoundingClientRect();
    const tgt = new THREE.Vector2(r.left + r.width / 2, H - (r.top + r.height / 2));
    const finalScale = (r.width * 0.98 * wpp) / 147;           // medal is ~147 units across
    U.uCenter.value.set(tgt.x * dpr, tgt.y * dpr);
    const lineY = H * 0.5;
    const LAUNCH = 0.6, TC = 0.78, G = -2600;
    const pos = new THREE.Vector2(W + 140, H * 0.84);
    const crossX = W * 0.6;
    const vel = new THREE.Vector2((crossX - pos.x) / TC, (lineY - pos.y - 0.5 * G * TC * TC) / TC);
    const rot = new THREE.Vector3(0.3, -0.6, 0.2), spin = new THREE.Vector3(9.5, -4.2, 2.1);
    let phase = 'wait', splashAt = -1, settleAt = -1, revealAt = -1, scale = finalScale * 1.4;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const tmp = new THREE.Vector3();
    let skip = false;
    canvas.addEventListener('pointerdown', () => { skip = true; });

    // the timeline runs on capped frame time, not the wall clock: a slow first second (shader
    // compiles, page still loading) slows the film down instead of skipping it
    let T = 0, last = -1, raf;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      try { step(now); } catch (e) { cancelAnimationFrame(raf); bail(e); }
    }
    function step(now) {
      const dt = last < 0 ? 0 : Math.min(1 / 30, (now - last) / 1000); last = now;
      const t = (T += dt);

      U.uLine.value = ease(Math.min(1, t / 0.5));
      U.uFill.value = ease(THREE.MathUtils.clamp((t - 0.25) / 0.6, 0, 1));

      if (phase === 'wait' && t >= LAUNCH) phase = 'air';
      if (phase === 'air') {
        const prevY = pos.y;
        vel.y += G * dt; pos.addScaledVector(vel, dt);
        rot.addScaledVector(spin, dt);
        if (prevY > lineY && pos.y <= lineY) {                     // breaks the surface
          phase = 'water'; splashAt = t; U.uSplashT.value = t; U.uSplashX.value = pos.x * dpr;
          vel.multiply(new THREE.Vector2(0.35, 0.22));
          rot.set(wrap(rot.x), wrap(rot.y), wrap(rot.z));
          drops.forEach((d, i) => {
            const s = Math.random();
            Object.assign(d, { x: pos.x + (Math.random() - 0.5) * 60, y: lineY, vx: (Math.random() - 0.5) * 900 + vel.x * 0.4, vy: 380 + s * 820, live: true });
            dsize[i] = 4 + Math.random() * 9;
          });
          dgeo.attributes.size.needsUpdate = true;
        }
      } else if (phase === 'water') {
        // water drag + spring onto the seal; the tumble settles face-on
        const ax = 26 * (tgt.x - pos.x) - 9 * vel.x, ay = 26 * (tgt.y - pos.y) - 9 * vel.y;
        vel.x += ax * dt; vel.y += ay * dt; pos.addScaledVector(vel, dt);
        rot.multiplyScalar(Math.exp(-3.2 * dt));
        scale += (finalScale - scale) * (1 - Math.exp(-4 * dt));
        if (settleAt < 0 && t - splashAt > 1.1 && vel.length() < 25) settleAt = t;
      }
      if (phase === 'air') scale += (finalScale * 1.15 - scale) * (1 - Math.exp(-2 * dt));

      medal.position.copy(toWorld(pos.x, pos.y, tmp));
      medal.rotation.set(rot.x, rot.y, rot.z);
      medal.scale.setScalar(scale);

      // droplets: ballistic, vanish back into the liquid
      drops.forEach((d, i) => {
        if (d.live) { d.vy += G * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.y < lineY - 4 && d.vy < 0) d.live = false; }
        toWorld(d.x, d.live ? d.y : -9999, tmp); dpos[i * 3] = tmp.x; dpos[i * 3 + 1] = tmp.y; dpos[i * 3 + 2] = 40;
      });
      dgeo.attributes.position.needsUpdate = true;

      // ripple dissolve once the coin rests on the seal (or on tap)
      if (revealAt < 0 && (settleAt > 0 && t - settleAt > 0.25 || t > 3.6 || skip)) {
        revealAt = t; document.body.classList.add('intro-reveal');
      }
      if (revealAt > 0) {
        const k = Math.min(1, (t - revealAt) / (skip ? 0.7 : 1.25));
        U.uReveal.value = ease(k) * Math.hypot(W, H) * 1.15 * dpr;
        if (k >= 1) { finish(); return; }
      }
      U.uTime.value = t;

      renderer.clear(); renderer.render(scene, cam);
      renderer.copyFramebufferToTexture(grab);
      renderer.clear(); renderer.render(post, ocam);
    }
    function finish() {
      cancelAnimationFrame(raf);
      if (settled) return; settled = true;
      document.body.classList.remove('intro-reveal');
      grab.dispose(); dgeo.dispose(); dmat.dispose(); quad.geometry.dispose(); quad.material.dispose();
      scene.environment?.dispose();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
      resolve();
    }
    try { renderer.compile(scene, cam); renderer.compile(post, ocam); } catch {}
    raf = requestAnimationFrame((n) => { done(); frame(n); }); // canvas now covers the page
  });
}
