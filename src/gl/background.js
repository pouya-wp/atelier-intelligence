// Full-screen liquid-gold silk. Raw WebGL, one fragment shader, mouse = light source.
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uIntensity; uniform float uPulse;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<4;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
float height(vec2 p){
  float t = uTime*.035;
  vec2 q = vec2(fbm(p+vec2(0.,t)), fbm(p+vec2(5.2,1.3)-t));
  vec2 r = vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*1.4), fbm(p+3.*q+vec2(8.3,2.8)-t));
  float h = fbm(p+2.6*r);
  return h;
}
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  float asp = uRes.x/uRes.y;
  vec2 p = vec2(uv.x*asp, uv.y)*1.15;
  float e = .0025;
  float h  = height(p);
  float hx = height(p+vec2(e,0.));
  float hy = height(p+vec2(0.,e));
  vec3 n = normalize(vec3((h-hx)/e*.055, (h-hy)/e*.055, 1.));
  // silk folds: sharpen ridges
  float ridge = smoothstep(.35,.85,h);
  vec2 m = vec2(uMouse.x*asp, uMouse.y)*1.15;
  vec3 L = normalize(vec3(m - p, .55));
  vec3 V = vec3(0.,0.,1.);
  vec3 H = normalize(L+V);
  float diff = max(dot(n,L),0.);
  float spec = pow(max(dot(n,H),0.), 70.);
  float spec2 = pow(max(dot(n,H),0.), 9.);
  float dist = length(m-p);
  float fall = 1./(1.+dist*dist*2.2);
  vec3 goldDeep = vec3(.20,.11,.03), gold = vec3(.90,.62,.24), goldHi = vec3(1.,.88,.58);
  // black satin: almost no diffuse, light lives only in the specular glints
  vec3 col = goldDeep*diff*.10*ridge;
  col += gold*spec2*.22*fall*ridge;
  col += goldHi*spec*1.5*fall*ridge;
  // faint top-left rim so folds read even far from the cursor
  vec3 K = normalize(vec3(-.6,.8,.7));
  col += gold*pow(max(dot(n,normalize(K+V)),0.),90.)*.10*ridge;
  col += vec3(.38,.06,.03)*smoothstep(.42,.2,h)*.03;
  col *= uIntensity;
  col += goldHi*uPulse*fall*.6;
  // vignette + tone
  float vg = smoothstep(1.25,.25,length(uv-.5));
  col *= mix(.35,1.,vg);
  col = col/(1.+col);
  col = pow(col, vec3(.92));
  gl_FragColor = vec4(col + vec3(.006,.005,.005), 1.);
}`;

export function createBackground(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return { setIntensity() {}, pulse() {} };
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uInt = u('uIntensity'), uPulse = u('uPulse');

  // render at reduced resolution — it's a soft surface, and this keeps it buttery
  const scale = 0.5;
  function resize() {
    const w = Math.floor(innerWidth * scale), h = Math.floor(innerHeight * scale);
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h);
  }
  resize(); addEventListener('resize', resize);

  const mouse = { x: .7, y: .65, tx: .7, ty: .65 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth; mouse.ty = 1 - e.clientY / innerHeight; });
  let intensity = 1.4, target = 1.4, pulse = 0;
  const t0 = performance.now();
  (function loop() {
    mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
    intensity += (target - intensity) * 0.03; pulse *= 0.94;
    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uInt, intensity); gl.uniform1f(uPulse, pulse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(loop);
  })();
  return { setIntensity(v) { target = v; }, pulse(v = 1) { pulse = v; } };
}
