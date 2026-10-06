import * as THREE from 'three';
import { watchVisible } from './visibility.js';

// Molten-gold orb for the talking assistant. Displacement grows with "voice" energy.
const noise = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){ const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
 vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g;
 vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy); vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
 i=mod289(i); vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
 float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
 vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.)); vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
 vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
 return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }`;

export function createOrb(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 10); cam.position.z = 3.6;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.06 }, uLight: { value: new THREE.Vector2() } },
    vertexShader: `${noise}
      uniform float uTime; uniform float uAmp; varying vec3 vN; varying vec3 vV;
      float disp(vec3 p){ return snoise(p*1.6+vec3(0.,0.,uTime*.6))*uAmp + snoise(p*2.6+uTime*.9)*uAmp*.15; }
      void main(){
        vec3 p = position; vec3 n = normalize(normal);
        vec3 t = normalize(cross(n, vec3(0.,1.,.01))); vec3 b = cross(n,t); float e=.01;
        vec3 p0 = p + n*disp(p); vec3 p1 = (p+t*e); p1 += normalize(p1)*disp(p1); vec3 p2 = (p+b*e); p2 += normalize(p2)*disp(p2);
        vN = normalize(normalMatrix*normalize(cross(p1-p0, p2-p0)));
        vec4 mv = modelViewMatrix*vec4(p0,1.); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec2 uLight; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(vV); vec3 r = reflect(-v, n);
        // procedural studio reflection: bright softbox top, warm floor, dark horizon band
        float sky = smoothstep(-.1,.9,r.y); float box = smoothstep(.75,.98, dot(r, normalize(vec3(uLight,1.))));
        vec3 env = mix(vec3(.02,.12,.09), vec3(.75,.92,.85), sky) + vec3(1.)*box*1.2;
        env *= .55 + .45*smoothstep(-.4,.2,abs(r.y-.05));
        float fr = pow(1.-max(dot(n,v),0.), 3.);
        vec3 gold = vec3(.35,.78,.62);
        vec3 col = env*gold*(.85+.5*fr) + vec3(.71,.58,.34)*fr*.35;
        col = col/(1.+col*.6);
        gl_FragColor = vec4(pow(col, vec3(.9)), 1.); }`,
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 18), mat); scene.add(mesh);
  let amp = 0.06, target = 0.06, alive = true, w = 0, frameNo = 0;
  const vis = watchVisible(canvas);
  const clock = new THREE.Clock();
  const lm = { x: .3, y: .6 };
  addEventListener('pointermove', (e) => { lm.x = (e.clientX / innerWidth) * 2 - 1; lm.y = -(e.clientY / innerHeight) * 2 + 1; });
  (function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    // idle orb: 30 fps; talking: full rate; hidden: nothing
    if (!vis.active() || (amp < 0.08 && (frameNo++ & 1))) return;
    const r = canvas.getBoundingClientRect();
    if (r.width !== w) { w = r.width; renderer.setSize(r.width, r.height, false); }
    amp += (target - amp) * 0.1;
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t; mat.uniforms.uAmp.value = amp;
    mat.uniforms.uLight.value.set(lm.x, lm.y);
    mesh.rotation.y = t * 0.3;
    renderer.render(scene, cam);
  })();
  return { setEnergy(v) { target = 0.06 + v * 0.32; }, dispose() { alive = false; renderer.dispose(); } };
}
