import * as THREE from './vendor/three.module.js';

/**
 * TMARSBASE｜火星運算核心
 * 原創程序美術；無外部紋理、字型、網路請求或後製套件。
 * 以 type="module" 載入；容器的尺寸與頁面排版由網站 CSS 決定。
 * three.module.js 與其相依檔案請使用同一官方版本，保留 Three.js 授權。
 * data-renderer 僅在第一幀成功完成後設為 webgl，其餘時間顯示 fallback。
 */

const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 40;
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// 僅作用於本模組建立的節點，不改變容器尺寸或網站其他元件。
const SCENE_CSS = `
#mars-scene > .tmars-scene-stage {
  position:relative; display:block; width:100%; height:100%;
  overflow:hidden; isolation:isolate; pointer-events:none; user-select:none;
  --mars-x:57.5%; --mars-diameter:55%;
}
#mars-scene .tmars-scene-canvas,
#mars-scene .tmars-scene-poster { position:absolute; inset:0; width:100%; height:100%; }
#mars-scene .tmars-scene-canvas { display:block; opacity:0; }
#mars-scene[data-renderer="webgl"] .tmars-scene-canvas { opacity:1; }
#mars-scene[data-renderer="webgl"] .tmars-scene-poster { visibility:hidden; }
#mars-scene .tmars-scene-poster {
  background:radial-gradient(ellipse at var(--mars-x) 50%,#9e35151c,transparent 66%);
}
#mars-scene .tmars-poster-system {
  position:absolute; left:var(--mars-x); top:50%; width:var(--mars-diameter);
  aspect-ratio:1; transform:translate(-50%,-50%);
}
#mars-scene .tmars-poster-halo {
  position:absolute; inset:-48%;
  background:radial-gradient(ellipse at 50% 50%,#e7651838 0%,#ac38141c 30%,#9a26080c 49%,transparent 68%);
}
#mars-scene .tmars-poster-planet {
  position:absolute; inset:0; z-index:2; overflow:hidden; border-radius:50%;
  background:
    radial-gradient(ellipse at 31% 32%,#301d19aa 0 6%,transparent 18%),
    radial-gradient(ellipse at 69% 67%,#1e1918 0 10%,transparent 26%),
    radial-gradient(ellipse at 42% 56%,#3b2620ee 0 6%,transparent 23%),
    radial-gradient(ellipse at 72% 22%,#9b5c3b 0 4%,transparent 21%),
    repeating-conic-gradient(from 28deg at 43% 56%,#b9764a20 0deg 7deg,#241b1814 11deg 18deg,transparent 21deg 39deg),
    radial-gradient(circle at 31% 27%,#c08051,#905034 38%,#5a2e21 62%,#1e1412 86%);
  box-shadow:inset 2px 2px 4px #ffd4a66b,inset 14px 5px 28px #e1854433,
    inset -36px -18px 45px #080607ed,0 0 4px #e57d494d,0 0 24px #ee581c1c;
}
#mars-scene .tmars-poster-planet::before {
  content:""; position:absolute; inset:0; border-radius:inherit; opacity:.6;
  background:
    radial-gradient(ellipse at 28% 46%,#241411 0 3%,#b07a4b 3.8%,transparent 5%),
    radial-gradient(ellipse at 45% 22%,#392419 0 2%,#d3935b99 2.8%,transparent 4%),
    radial-gradient(ellipse at 59% 63%,#352017 0 4%,#b77c4a 4.8%,transparent 6.5%),
    radial-gradient(ellipse at 33% 72%,#382218 0 2%,#b77c4a 2.7%,transparent 4%),
    repeating-conic-gradient(from 51deg at 31% 28%,#e9ad6509 0deg 3deg,#120d0b0d 4deg 7deg,transparent 8deg 11deg);
  transform:rotate(-18deg) scale(1.08);
}
#mars-scene .tmars-poster-planet::after {
  content:""; position:absolute; inset:-1px; border-radius:inherit;
  background:radial-gradient(circle at 21% 24%,transparent 22%,#120b0826 53%,#080609eb 83%);
}
#mars-scene .tmars-poster-orbit {
  position:absolute; inset:22% -35%; z-index:1; border:1px solid #fa8c4877;
  border-radius:50%; transform:rotate(-27deg);
  box-shadow:0 0 7px #fa652d35,inset 0 0 5px #ef762220;
}
#mars-scene .tmars-poster-orbit-front {
  z-index:3; clip-path:polygon(0 50%,100% 50%,100% 100%,0 100%);
  border-bottom-color:#ffc087ce;
}
#mars-scene .tmars-poster-orbit-secondary {
  inset:8% -23%; transform:rotate(43deg); opacity:.36;
}
#mars-scene .tmars-poster-orbit-polar {
  inset:-18% 22%; transform:rotate(26deg); opacity:.22;
}
#mars-scene .tmars-poster-moon {
  position:absolute; width:var(--size,5%); aspect-ratio:1; z-index:4; border-radius:50%;
  background:radial-gradient(circle at 28% 25%,#e2b18a,#866047 28%,#35261f 58%,#110e0e 84%);
  box-shadow:-1px -1px 2px #ffb47a66,0 0 12px #e06c2226;
}
#mars-scene .tmars-poster-star {
  position:absolute; width:var(--size); height:var(--size); border-radius:50%;
  background:#ffe4cb; opacity:var(--alpha); box-shadow:0 0 4px #e69a5038;
}
`;

function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 三維梯度雜訊取樣球面：經線接縫與兩極保持連續。
function makeNoise(seed) {
  const random = randomGenerator(seed);
  const p = new Uint16Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const mix = (a, b, t) => a + (b - a) * t;
  const grad = (hash, x, y, z) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  };
  return (x, y, z) => {
    const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
    const X = fx & 255, Y = fy & 255, Z = fz & 255;
    x -= fx; y -= fy; z -= fz;
    const u = fade(x), v = fade(y), w = fade(z);
    const A = p[X] + Y, B = p[X + 1] + Y;
    const AA = p[A] + Z, AB = p[A + 1] + Z;
    const BA = p[B] + Z, BB = p[B + 1] + Z;
    return mix(
      mix(mix(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
        mix(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
      mix(mix(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
        mix(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  };
}

function makePoster(container) {
  // 重掛載只移除本模組自己的節點。
  container.querySelectorAll(':scope > [data-tmars-owned]').forEach(node => node.remove());
  const style = document.createElement('style');
  style.dataset.tmarsOwned = '';
  style.textContent = SCENE_CSS;
  const stage = document.createElement('div');
  stage.className = 'tmars-scene-stage';
  stage.dataset.tmarsOwned = '';
  stage.setAttribute('aria-hidden', 'true');
  const poster = document.createElement('div');
  poster.className = 'tmars-scene-poster';
  const system = document.createElement('div');
  system.className = 'tmars-poster-system';
  for (const suffix of ['halo', 'orbit', 'orbit orbit-secondary', 'orbit orbit-polar', 'planet', 'orbit orbit-front']) {
    const part = document.createElement('span');
    part.className = suffix.split(' ').map(name => `tmars-poster-${name}`).join(' ');
    system.append(part);
  }
  [[-25, 66, 5], [118, 12, 7], [72, -12, 4], [82, 108, 3.5]].forEach(([x, y, size]) => {
    const moon = document.createElement('span');
    moon.className = 'tmars-poster-moon';
    moon.style.cssText = `left:${x}%;top:${y}%;--size:${size}%`;
    system.append(moon);
  });
  const random = randomGenerator(435);
  for (let i = 0; i < 58; i++) {
    const star = document.createElement('span');
    star.className = 'tmars-poster-star';
    star.style.cssText = `left:${random() * 100}%;top:${random() * 100}%;--size:${0.6 + random() * 1.4}px;--alpha:${0.12 + random() * 0.46}`;
    poster.append(star);
  }
  poster.append(system);
  stage.append(poster);
  container.append(style, stage);
  container.dataset.renderer = 'fallback';
  return stage;
}

function makeTerrain(width, own) {
  const height = width / 2;
  const noise = makeNoise(2412);
  const count = width * height;
  const relief = new Float32Array(count);
  const land = new Float32Array(count);
  const grain = new Float32Array(count);
  const craterTone = new Float32Array(count);
  const sinPhi = new Float32Array(width), cosPhi = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    const phi = (x / (width - 1)) * TAU;
    sinPhi[x] = Math.sin(phi); cosPhi[x] = Math.cos(phi);
  }
  for (let row = 0; row < height; row++) {
    const theta = (row / (height - 1)) * Math.PI;
    const st = Math.sin(theta), y = Math.cos(theta);
    for (let col = 0; col < width; col++) {
      const x = -cosPhi[col] * st, z = sinPhi[col] * st;
      const i = row * width + col;
      const warp = noise(x * 2.2 + 8, y * 2.2, z * 2.2);
      const continent = noise(x * 2.35 + warp * 0.24, y * 2.35 + 4, z * 2.35 - 3)
        + noise(x * 5.8 + 1, y * 5.8, z * 5.8) * 0.23;
      let detail = 0, amplitude = 0.5, frequency = 7;
      for (let octave = 0; octave < 6; octave++) {
        detail += amplitude * noise(x * frequency + warp * 0.5, y * frequency, z * frequency);
        amplitude *= 0.49; frequency *= 2.07;
      }
      const channel = y + 0.13 + Math.sin(x * 5 + z * 2) * 0.075 + noise(x * 13, y * 13, z * 13) * 0.023;
      const canyon = Math.exp(-((channel / 0.018) ** 2)) * smooth(-0.1, 0.6, z) * smooth(-0.95, -0.3, x);
      relief[i] = 0.51 + continent * 0.13 + detail * 0.34 - canyon * 0.075;
      land[i] = smooth(-0.09, 0.23, continent + detail * 0.23) * 0.95 + canyon * 0.2;
      grain[i] = noise(x * 178 + 3, y * 178, z * 178) * 0.64
        + noise(x * 71, y * 71, z * 71) * 0.35 + detail * 0.3;
    }
  }
  // 局部球面隕石坑：碗形凹陷、抬升坑緣與少量噴出物。
  const random = randomGenerator(971);
  for (let crater = 0; crater < 230; crater++) {
    const u = random(), v = 0.13 + random() * 0.74;
    const radius = 0.011 + (random() ** 3) * 0.082;
    const latitudeScale = Math.sin(v * Math.PI);
    const ry = radius / Math.PI * height, rx = radius / TAU * width / latitudeScale;
    const cx = u * (width - 1), cy = v * (height - 1);
    for (let row = Math.max(0, Math.floor(cy - ry * 1.5)); row <= Math.min(height - 1, Math.ceil(cy + ry * 1.5)); row++) {
      for (let col = Math.floor(cx - rx * 1.5); col <= Math.ceil(cx + rx * 1.5); col++) {
        const r = Math.hypot((col - cx) / rx, (row - cy) / ry);
        if (r > 1.5) continue;
        const i = row * width + ((col % width + width) % width);
        const bowl = r < 1 ? -0.052 * ((1 - r * r) ** 2) : 0;
        const rim = 0.031 * Math.exp(-(((r - 1) * 9) ** 2));
        relief[i] += bowl + rim;
        grain[i] += rim * 1.5 + bowl * 1.8;
        craterTone[i] += bowl * 360 + rim * 230;
      }
    }
  }
  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  colorCanvas.width = heightCanvas.width = width;
  colorCanvas.height = heightCanvas.height = height;
  const colorContext = colorCanvas.getContext('2d');
  const heightContext = heightCanvas.getContext('2d');
  if (!colorContext || !heightContext) throw new Error('無法建立程序地表');
  const colors = colorContext.createImageData(width, height);
  const heights = heightContext.createImageData(width, height);
  for (let i = 0; i < count; i++) {
    const p = i * 4;
    const elevation = clamp((relief[i] - 0.33) * 3, 0, 1);
    const mineral = 1 - land[i] * 0.57;
    const dust = grain[i] * 51 + craterTone[i];
    colors.data[p] = clamp((85 + elevation * 92 + dust) * mineral, 0, 255);
    colors.data[p + 1] = clamp((47 + elevation * 68 + dust * 0.73) * mineral, 0, 255);
    colors.data[p + 2] = clamp((34 + elevation * 49 + dust * 0.56) * mineral, 0, 255);
    colors.data[p + 3] = 255;
    const h = clamp(((relief[i] - 0.5) * 1.8 + 0.5 + grain[i] * 0.065) * 255, 0, 255);
    heights.data[p] = heights.data[p + 1] = heights.data[p + 2] = h;
    heights.data[p + 3] = 255;
  }
  // 坑緣偶爾跨越經線，複製邊界像素以維持無縫。
  for (let row = 0; row < height; row++) {
    const first = row * width * 4, last = first + (width - 1) * 4;
    colors.data.set(colors.data.subarray(first, first + 4), last);
    heights.data.set(heights.data.subarray(first, first + 4), last);
  }
  colorContext.putImageData(colors, 0, 0);
  heightContext.putImageData(heights, 0, 0);
  const map = own(new THREE.CanvasTexture(colorCanvas));
  const bump = own(new THREE.CanvasTexture(heightCanvas));
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = bump.wrapS = THREE.RepeatWrapping;
  map.anisotropy = bump.anisotropy = 2;
  return { map, bump };
}

function createScene(container) {
  const stage = makePoster(container);
  const resources = new Set();
  const own = resource => { resources.add(resource); return resource; };
  const cleanup = [];
  const listen = (target, name, callback, options) => {
    target.addEventListener(name, callback, options);
    cleanup.push(() => target.removeEventListener(name, callback, options));
  };
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMedia = window.matchMedia('(max-width: 760px)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const readOverride = () => {
    const mode = document.documentElement.dataset.motion;
    return mode === 'reduced' ? true : mode === 'full' ? false : null;
  };
  let override = readOverride();
  let reduced = override ?? media.matches;
  let disposed = false, failed = false, contextLost = false, inView = true, sized = false;
  let renderer, scene, camera, system, planet, stars, particles, canvas;
  let resizeObserver, intersectionObserver, motionObserver;
  let frame = 0, dirty = true, lastDraw = -Infinity, lastTick = 0, time = 0;
  let width = 0, height = 0, centerX = 0, shaderFailed = false;
  let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;
  const satellites = [];
  const starUniforms = { uTime: { value: 0 }, uDpr: { value: 1 } };

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTick = 0;
  }

  function releaseGPU() {
    stop();
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    }
    for (const resource of resources) resource.dispose();
    resources.clear();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }
    canvas?.remove();
    renderer = scene = camera = system = planet = stars = particles = canvas = null;
    satellites.length = 0;
  }

  function fail(error) {
    if (failed || disposed) return;
    failed = true;
    container.dataset.renderer = 'fallback';
    releaseGPU();
    console.warn('[TMARSBASE] 已切換至靜態火星備援畫面。', error);
  }

  function onContextLost(event) {
    event.preventDefault();
    if (disposed || failed) return;
    contextLost = true;
    stop();
    container.dataset.renderer = 'fallback';
  }

  function onContextRestored() {
    if (disposed || failed) return;
    // Three.js 先還原內部狀態，再由下一個可見幀重新上傳材質與紋理。
    // 成功繪出之前保留 CSS 海報；reduced 模式同樣會補畫一幀。
    contextLost = false;
    dirty = true;
    shaderFailed = false;
    measure();
  }

  function canDraw() {
    return !disposed && !failed && !contextLost && renderer && sized && inView && !document.hidden;
  }

  function schedule() {
    if (!frame && canDraw() && (dirty || !reduced)) frame = requestAnimationFrame(tick);
  }

  function update(delta) {
    if (!reduced) time += delta;
    const blend = reduced ? 1 : 1 - Math.exp(-delta * 4.5);
    easedX += ((reduced ? 0 : pointerX) - easedX) * blend;
    easedY += ((reduced ? 0 : pointerY) - easedY) * blend;
    system.position.set(centerX + easedX * 0.055, -easedY * 0.035, 0);
    system.rotation.set(easedY * 0.035, easedX * 0.05, -0.065);
    planet.rotation.set(0.11, 0.52 + time * 0.035, 0.09);
    stars.rotation.y = time * 0.0017 + easedX * 0.004;
    particles.rotation.y = time * 0.012;
    particles.rotation.z = time * 0.007;
    starUniforms.uTime.value = time;
    for (const satellite of satellites) {
      const angle = satellite.phase + time * satellite.speed;
      satellite.body.position.set(Math.cos(angle) * satellite.radius, Math.sin(angle) * satellite.radius, 0);
      satellite.body.rotation.set(time * 0.05, time * 0.13 + satellite.phase, 0.2);
      satellite.trail.rotation.z = angle - 0.32;
    }
  }

  function draw() {
    renderer.render(scene, camera);
    if (shaderFailed) throw new Error('WebGL 材質編譯失敗');
    container.dataset.renderer = 'webgl';
    dirty = false;
  }

  function tick(now) {
    frame = 0;
    if (!canDraw()) { lastTick = 0; return; }
    // 不補畫累積幀；包含拖曳、縮放與模式切換在內，繪圖間隔至少 25ms。
    if (now - lastDraw >= FRAME_MS) {
      const delta = lastTick ? Math.min((now - lastTick) / 1000, 0.075) : 0;
      lastTick = now;
      lastDraw = now;
      try { update(delta); draw(); } catch (error) { fail(error); }
    }
    schedule();
  }

  function measure() {
    if (disposed) return;
    width = stage.clientWidth;
    height = stage.clientHeight;
    sized = width > 0 && height > 0;
    const mobile = mobileMedia.matches;
    const aspect = sized ? width / height : 1;
    const halfHeight = Math.max(1.84, (mobile ? 2.16 : 2.5) / aspect);
    const halfWidth = halfHeight * aspect;
    centerX = mobile ? 0 : halfWidth * 0.15;
    stage.style.setProperty('--mars-x', mobile ? '50%' : '57.5%');
    stage.style.setProperty('--mars-diameter', `${sized ? height * 1.14 / halfHeight : 0}px`);
    if (!renderer || !camera || !sized || contextLost) { if (!sized) stop(); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    starUniforms.uDpr.value = dpr;
    camera.left = -halfWidth; camera.right = halfWidth;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    dirty = true;
    schedule();
  }

  function syncMotion() {
    const next = override ?? media.matches;
    if (reduced === next) return;
    reduced = next;
    pointerX = pointerY = 0;
    dirty = true;
    stop();
    schedule();
  }

  function onMotion(event) {
    override = typeof event.detail?.reduced === 'boolean' ? event.detail.reduced : readOverride();
    syncMotion();
  }

  listen(window, 'mars:motion', onMotion);
  listen(document, 'mars:motion', onMotion);
  listen(media, 'change', syncMotion);
  listen(mobileMedia, 'change', measure);
  listen(window, 'resize', measure, { passive: true });
  listen(document, 'visibilitychange', () => {
    stop();
    if (!document.hidden) { dirty = true; schedule(); }
  });
  listen(window, 'pointermove', event => {
    if (reduced || !canDraw() || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    pointerX = clamp((event.clientX - rect.left) / width * 2 - 1, -1, 1);
    pointerY = clamp((event.clientY - rect.top) / height * 2 - 1, -1, 1);
  }, { passive: true });
  const resetPointer = () => { pointerX = pointerY = 0; };
  listen(window, 'blur', resetPointer);
  listen(document, 'pointerout', event => { if (!event.relatedTarget) resetPointer(); }, { passive: true });
  if ('MutationObserver' in window) {
    motionObserver = new MutationObserver(() => { override = readOverride(); syncMotion(); });
    motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  }
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(stage);
  }
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      inView = entry ? entry.isIntersecting && entry.intersectionRatio > 0 : true;
      stop();
      if (inView) { dirty = true; schedule(); }
    }, { rootMargin: '0px', threshold: 0 });
    intersectionObserver.observe(stage);
  }

  try {
    measure();
    canvas = document.createElement('canvas');
    canvas.className = 'tmars-scene-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.07;
    renderer.debug.onShaderError = () => { shaderFailed = true; };
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);
    stage.append(canvas);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-3, 3, 2, -2, 0.1, 50);
    camera.position.set(0, 0, 9);
    system = new THREE.Group();
    scene.add(system);
    const compact = mobileMedia.matches;
    const terrain = makeTerrain(compact ? 768 : 1024, own);
    const geometry = own(new THREE.SphereGeometry(1.14, compact ? 96 : 144, compact ? 64 : 96));
    const material = own(new THREE.MeshStandardMaterial({
      map: terrain.map, bumpMap: terrain.bump, bumpScale: 0.095,
      displacementMap: terrain.bump, displacementScale: 0.025, displacementBias: -0.0125,
      roughness: 0.96, metalness: 0.025,
    }));
    planet = new THREE.Mesh(geometry, material);
    system.add(planet);
    scene.add(new THREE.AmbientLight(0xbd9074, 0.2));
    const key = new THREE.DirectionalLight(0xffecda, 2.8);
    key.position.set(-3.5, 3.5, 4.5);
    const fill = new THREE.DirectionalLight(0xb2785a, 0.23);
    fill.position.set(3, -1, 2);
    const rim = new THREE.DirectionalLight(0xff5224, 1.8);
    rim.position.set(2, 1, -3);
    scene.add(key, fill, rim);

    // 徑向散射光幕：透明加色，保留網站底色，避免全螢幕 bloom 成本。
    const halo = new THREE.Mesh(own(new THREE.PlaneGeometry(6.5, 6.5)), own(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color('#e9662a') } },
      vertexShader: `varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform vec3 uColor; varying vec2 vUv;
        void main(){
          vec2 p=(vUv-0.5)*2.0; float r=length(p);
          float haze=exp(-r*r*5.5)*0.12;
          float corona=exp(-pow((r-0.355)*8.0,2.0))*0.105;
          float lobe=0.55+0.45*smoothstep(-0.6,0.5,-p.x+p.y);
          float a=(haze+corona)*lobe*(1.0-smoothstep(0.65,1.0,r));
          gl_FragColor=vec4(uColor,a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })));
    halo.position.z = -2.4;
    system.add(halo);
    const atmosphere = new THREE.Mesh(own(new THREE.SphereGeometry(1.167, 72, 48)), own(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color('#ff8b43') } },
      vertexShader: `varying vec3 vN; varying vec3 vEye;
        void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);
          vEye=-p.xyz;gl_Position=projectionMatrix*p;}`,
      fragmentShader: `uniform vec3 uColor;varying vec3 vN;varying vec3 vEye;
        void main(){vec3 n=normalize(vN);
          float fresnel=pow(1.0-max(0.0,dot(n,normalize(vEye))),3.5);
          float sun=0.17+0.83*max(0.0,dot(n,normalize(vec3(-0.7,0.6,0.2))));
          gl_FragColor=vec4(uColor,fresnel*sun*0.48);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })));
    system.add(atmosphere);

    const orbitSpecs = [
      { radius: 1.69, tilt: [1.02, 0.12, -0.42], alpha: 0.56 },
      { radius: 1.94, tilt: [0.71, -0.82, 0.83], alpha: 0.22 },
      { radius: 1.53, tilt: [0.32, 1.14, 0.26], alpha: 0.19 },
    ];
    const orbitGroups = orbitSpecs.map(spec => {
      const group = new THREE.Group();
      group.rotation.set(...spec.tilt);
      system.add(group);
      const ring = new THREE.Mesh(own(new THREE.TorusGeometry(spec.radius, 0.0025, 5, 240)), own(new THREE.MeshBasicMaterial({
        color: 0xffa361, transparent: true, opacity: spec.alpha, depthWrite: false, blending: THREE.AdditiveBlending,
      })));
      const glow = new THREE.Mesh(own(new THREE.TorusGeometry(spec.radius, 0.014, 5, 192)), own(new THREE.MeshBasicMaterial({
        color: 0xff6528, transparent: true, opacity: spec.alpha * 0.075, depthWrite: false, blending: THREE.AdditiveBlending,
      })));
      group.add(ring, glow);
      return group;
    });
    const ticks = [];
    for (let i = 0; i < 88; i++) {
      const a = i / 88 * TAU, r = orbitSpecs[0].radius;
      const length = i % 11 === 0 ? 0.04 : 0.012;
      ticks.push(Math.cos(a) * (r + 0.025), Math.sin(a) * (r + 0.025), 0,
        Math.cos(a) * (r + 0.025 + length), Math.sin(a) * (r + 0.025 + length), 0);
    }
    const tickGeometry = own(new THREE.BufferGeometry());
    tickGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
    orbitGroups[0].add(new THREE.LineSegments(tickGeometry, own(new THREE.LineBasicMaterial({
      color: 0xee9964, transparent: true, opacity: 0.26, depthWrite: false,
    }))));
    const random = randomGenerator(1881);
    const moonNoise = makeNoise(22);
    [
      { orbit: 0, phase: 0.34, size: 0.067, speed: 0.085 },
      { orbit: 0, phase: 3.55, size: 0.044, speed: 0.06 },
      { orbit: 1, phase: 2.1, size: 0.084, speed: -0.045 },
      { orbit: 2, phase: 5.28, size: 0.048, speed: 0.07 },
    ].forEach(spec => {
      const rockGeometry = own(new THREE.IcosahedronGeometry(spec.size, 3));
      const positions = rockGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const scale = 1 + moonNoise(x * 48, y * 48, z * 48) * 0.15;
        positions.setXYZ(i, x * scale, y * scale * 0.83, z * scale);
      }
      rockGeometry.computeVertexNormals();
      const body = new THREE.Mesh(rockGeometry, own(new THREE.MeshStandardMaterial({
        color: spec.orbit === 1 ? 0x98715a : 0xb09379, roughness: 0.9,
        bumpMap: terrain.bump, bumpScale: 0.012,
      })));
      const trail = new THREE.Mesh(own(new THREE.TorusGeometry(orbitSpecs[spec.orbit].radius, 0.004, 5, 44, 0.26)), own(new THREE.MeshBasicMaterial({
        color: 0xffb578, opacity: 0.42, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })));
      orbitGroups[spec.orbit].add(body, trail);
      satellites.push({ ...spec, body, trail, radius: orbitSpecs[spec.orbit].radius });
    });

    function pointField(count, local) {
      const positions = [], sizes = [], colors = [], phases = [];
      for (let i = 0; i < count; i++) {
        if (local) {
          const a = random() * TAU, radius = 1.4 + random() * 0.72;
          positions.push(Math.cos(a) * radius, (random() - 0.5) * 2.5, Math.sin(a) * radius);
        } else {
          positions.push((random() - 0.5) * 19, (random() - 0.5) * 11, -5 - random() * 10);
        }
        sizes.push(local ? 1.1 + random() * 1.6 : 0.65 + (random() ** 3) * 1.6);
        phases.push(random() * TAU);
        const c = new THREE.Color(local ? '#e88c50' : '#eed7bd');
        c.multiplyScalar(0.45 + random() * 0.5);
        colors.push(c.r, c.g, c.b);
      }
      const geometry = own(new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
      geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return new THREE.Points(geometry, own(new THREE.ShaderMaterial({
        uniforms: starUniforms, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute float aSize;attribute float aPhase;uniform float uDpr;uniform float uTime;
          varying vec3 vColor;varying float vAlpha;
          void main(){vColor=color;vAlpha=0.62+0.15*sin(aPhase+uTime*0.45);
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uDpr;}`,
        fragmentShader: `varying vec3 vColor;varying float vAlpha;
          void main(){float d=length(gl_PointCoord-0.5)*2.0;float a=1.0-smoothstep(0.0,1.0,d);
            gl_FragColor=vec4(vColor,a*vAlpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      })));
    }
    stars = pointField(compact ? 240 : 390, false);
    particles = pointField(compact ? 25 : 42, true);
    scene.add(stars);
    system.add(particles);
    measure();
    // 首幀不依賴動畫開關；初始 reduced 模式也完整呈現地表、軌道和衛星。
    if (sized) {
      update(0);
      draw();
      lastDraw = performance.now();
    }
    schedule();
  } catch (error) {
    fail(error);
  }

  return {
    container,
    get disposed() { return disposed; },
    dispose() {
      if (disposed) return;
      disposed = true;
      cleanup.forEach(remove => remove());
      cleanup.length = 0;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      motionObserver?.disconnect();
      releaseGPU();
      // 保留無動畫 CSS 海報供離頁快照；BFCache 返回時會重新掛載。
      container.dataset.renderer = 'fallback';
    },
  };
}

let activeScene = null;

/** 可供前端路由重新掛載；同一容器重複呼叫不會建立第二個繪圖環境。 */
export function initMarsScene() {
  if (typeof document === 'undefined') return null;
  const container = document.getElementById('mars-scene');
  if (!container) return null;
  if (activeScene?.container === container && !activeScene.disposed) return activeScene;
  activeScene?.dispose();
  activeScene = createScene(container);
  return activeScene;
}

export function disposeMarsScene() {
  activeScene?.dispose();
  activeScene = null;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMarsScene, { once: true });
  else initMarsScene();
  window.addEventListener('pagehide', disposeMarsScene);
  window.addEventListener('pageshow', event => { if (event.persisted) initMarsScene(); });
}
