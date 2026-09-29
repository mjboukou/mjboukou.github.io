// The 3D computer: a desk with a monitor, keyboard and mouse, drawn with Three.js.
// The monitor's screen is the real HTML desktop (#screen), placed on the glass
// with CSS3DRenderer so its text stays sharp, selectable and clickable.
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const Desktop = window.Desktop;

// Screen size in HTML pixels and in scene units (metres).
const SCREEN_PX = { w: 1280, h: 800 };
const SCREEN = { w: 0.96, h: 0.6, y: 0.55, z: -0.18 };

if (Desktop && Desktop.mode === '3d') {
  try {
    start();
  } catch (err) {
    console.error(err);
    Desktop.fallbackTo2D();
  }
}

function start() {
  const stage = document.getElementById('stage');
  const screenEl = document.getElementById('screen');
  const toggle = document.getElementById('view-toggle');

  // ---- renderers ----
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.appendChild(renderer.domElement);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  Object.assign(cssRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  stage.appendChild(cssRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1118);
  scene.fog = new THREE.Fog(0x0b1118, 3.2, 7);

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 30);

  // ---- lights ----
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x2a1d14, 0.55));

  const key = new THREE.DirectionalLight(0xffe2bd, 2.2);
  key.position.set(-1.6, 2.6, 1.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.5, far: 7 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7fa6d6, 0.9);
  rim.position.set(2, 1.4, -1.8);
  scene.add(rim);

  // A warm lamp somewhere off to the left, lighting the wall.
  const lamp = new THREE.PointLight(0xffb877, 1.6, 4, 2);
  lamp.position.set(-1.5, 1.5, -0.35);
  scene.add(lamp);

  // Light the screen throws onto the desk once it's on.
  const screenGlow = new THREE.PointLight(0x8fb8ff, 0, 2.2, 2);
  screenGlow.position.set(0, SCREEN.y - 0.1, SCREEN.z + 0.25);
  scene.add(screenGlow);

  // ---- materials ----
  const mat = {
    wood: new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.62, metalness: 0 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x1a2735, roughness: 0.95 }),
    shell: new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.42, metalness: 0.25 }),
    shellBack: new THREE.MeshStandardMaterial({ color: 0x24292f, roughness: 0.55, metalness: 0.3 }),
    glass: new THREE.MeshBasicMaterial({ color: 0x030507 }),
    kb: new THREE.MeshStandardMaterial({ color: 0xd8d0bd, roughness: 0.55 }),
    key: new THREE.MeshStandardMaterial({ color: 0xf1ebdc, roughness: 0.5 }),
    keyDark: new THREE.MeshStandardMaterial({ color: 0x8f8878, roughness: 0.5 }),
    keyAccent: new THREE.MeshStandardMaterial({ color: 0xa5372f, roughness: 0.5 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x1c2b3a, roughness: 0.9 }),
    mouse: new THREE.MeshStandardMaterial({ color: 0xf1ebdc, roughness: 0.4 }),
    mug: new THREE.MeshStandardMaterial({ color: 0xa5372f, roughness: 0.35 }),
    coffee: new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.2 }),
    pot: new THREE.MeshStandardMaterial({ color: 0xb4623f, roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f6b4a, roughness: 0.7 }),
    bookA: new THREE.MeshStandardMaterial({ color: 0x2f5450, roughness: 0.8 }),
    bookB: new THREE.MeshStandardMaterial({ color: 0xb6913c, roughness: 0.8 }),
    pages: new THREE.MeshStandardMaterial({ color: 0xf4efe0, roughness: 0.9 }),
    ledOff: new THREE.MeshBasicMaterial({ color: 0x331111 }),
    ledOn: new THREE.MeshBasicMaterial({ color: 0x6dff9a })
  };

  const shadowy = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- room + desk ----
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), mat.wall);
  wall.position.set(0, 1.2, -0.75);
  wall.receiveShadow = true;
  scene.add(wall);

  const desk = shadowy(new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.06, 1.25, 3, 0.01), mat.wood));
  desk.position.set(0, -0.03, 0.02);
  scene.add(desk);

  // ---- monitor ----
  const monitor = new THREE.Group();
  scene.add(monitor);

  const bezelDepth = 0.035;
  const bezel = shadowy(new THREE.Mesh(new RoundedBoxGeometry(SCREEN.w + 0.035, SCREEN.h + 0.06, bezelDepth, 4, 0.012), mat.shell));
  bezel.position.set(0, SCREEN.y - 0.012, SCREEN.z - bezelDepth / 2);
  monitor.add(bezel);

  const back = shadowy(new THREE.Mesh(new RoundedBoxGeometry(SCREEN.w * 0.7, SCREEN.h * 0.62, 0.05, 4, 0.02), mat.shellBack));
  back.position.set(0, SCREEN.y, SCREEN.z - bezelDepth - 0.02);
  monitor.add(back);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), mat.glass);
  glass.position.set(0, SCREEN.y, SCREEN.z + 0.0006);
  monitor.add(glass);

  const neck = shadowy(new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.34, 0.03, 3, 0.01), mat.shellBack));
  neck.position.set(0, 0.17, SCREEN.z - 0.09);
  neck.rotation.x = -0.12;
  monitor.add(neck);

  const base = shadowy(new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.016, 0.2, 3, 0.007), mat.shell));
  base.position.set(0, 0.008, SCREEN.z - 0.07);
  monitor.add(base);

  const led = new THREE.Mesh(new THREE.CircleGeometry(0.004, 16), mat.ledOff);
  led.position.set(SCREEN.w / 2 - 0.01, SCREEN.y - SCREEN.h / 2 - 0.022, SCREEN.z + 0.0005);
  monitor.add(led);

  // The HTML desktop, sized so 1280px spans the glass.
  screenEl.classList.add('in-3d');
  const cssScreen = new CSS3DObject(screenEl);
  cssScreen.scale.setScalar(SCREEN.w / SCREEN_PX.w);
  cssScreen.position.set(0, SCREEN.y, SCREEN.z + 0.001);
  scene.add(cssScreen);

  // ---- keyboard ----
  const U = 0.036; // one key unit
  const keyboard = new THREE.Group();
  keyboard.position.set(-0.06, 0.012, 0.24);
  keyboard.rotation.x = 0.04;
  scene.add(keyboard);

  const kbBody = shadowy(new THREE.Mesh(new RoundedBoxGeometry(15 * U + 0.03, 0.02, 5 * U + 0.03, 3, 0.008), mat.kb));
  keyboard.add(kbBody);

  const rows = [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', ['Backspace', 2]],
    [['Tab', 1.5], 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', ['Backslash', 1.5]],
    [['CapsLock', 1.75], 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', ['Enter', 2.25]],
    [['ShiftLeft', 2.25], 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', ['ShiftRight', 2.75]],
    [['ControlLeft', 1.25], ['MetaLeft', 1.25], ['AltLeft', 1.25], ['Space', 6.25], ['AltRight', 1.25], ['MetaRight', 1.25], ['ContextMenu', 1.25], ['ControlRight', 1.25]]
  ];
  const keyGeoms = {};
  const keys = {};
  const keyList = [];
  rows.forEach((row, r) => {
    let x = -7.5 * U;
    row.forEach((k) => {
      const [code, w] = Array.isArray(k) ? k : [k, 1];
      keyGeoms[w] = keyGeoms[w] || new RoundedBoxGeometry(w * U - 0.0055, 0.012, U - 0.0055, 2, 0.003);
      const wide = w > 1 && code !== 'Space';
      const m = new THREE.Mesh(keyGeoms[w], code === 'Escape' || code === 'Enter' ? mat.keyAccent : wide ? mat.keyDark : mat.key);
      m.castShadow = true;
      m.position.set(x + (w * U) / 2, 0.014, (r - 2) * U);
      m.userData = { baseY: 0.014, down: 0 };
      keyboard.add(m);
      keys[code] = m;
      keyList.push(m);
      x += w * U;
    });
  });

  // ---- mouse + pad ----
  const pad = shadowy(new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.004, 0.22, 2, 0.002), mat.pad));
  pad.position.set(0.48, 0.002, 0.24);
  scene.add(pad);

  const mouse = new THREE.Group();
  const mouseBase = new THREE.Vector3(0.48, 0.004, 0.25);
  mouse.position.copy(mouseBase);
  scene.add(mouse);
  const mouseBody = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat.mouse));
  mouseBody.scale.set(0.033, 0.022, 0.056);
  mouse.add(mouseBody);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 16), mat.keyDark);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.021, -0.022);
  mouse.add(wheel);

  // ---- props ----
  const mug = new THREE.Group();
  mug.position.set(-0.72, 0, 0.18);
  mug.rotation.y = 0.6;
  scene.add(mug);
  mug.add(shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.1, 32), mat.mug)).translateY(0.05));
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.037, 32), mat.coffee);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.092;
  mug.add(coffee);
  const handle = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 12, 24, Math.PI), mat.mug));
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.042, 0.05, 0);
  mug.add(handle);

  const plant = new THREE.Group();
  plant.position.set(-0.86, 0, -0.32);
  scene.add(plant);
  plant.add(shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.13, 24), mat.pot)).translateY(0.065));
  for (let i = 0; i < 9; i++) {
    const leaf = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat.leaf));
    const a = (i / 9) * Math.PI * 2;
    leaf.scale.set(0.022, 0.11 + (i % 3) * 0.03, 0.01);
    leaf.position.set(Math.cos(a) * 0.03, 0.2 + (i % 3) * 0.02, Math.sin(a) * 0.03);
    leaf.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5);
    plant.add(leaf);
  }

  const books = new THREE.Group();
  books.position.set(0.82, 0, -0.3);
  books.rotation.y = -0.25;
  scene.add(books);
  [[mat.bookA, 0.034, 0.02], [mat.bookB, 0.03, -0.01], [mat.bookA, 0.026, 0.015]].reduce((y, [m, h, off]) => {
    const book = shadowy(new THREE.Mesh(new RoundedBoxGeometry(0.24, h, 0.17, 2, 0.003), m));
    book.position.set(off, y + h / 2, off);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.232, h * 0.8, 0.005), mat.pages);
    pages.position.z = 0.084;
    book.add(pages);
    books.add(book);
    return y + h;
  }, 0);

  // ---- camera views ----
  const target = new THREE.Vector3();
  const views = {
    start: { pos: new THREE.Vector3(1.9, 1.5, 3.1), look: new THREE.Vector3(0, 0.35, 0) },
    desk: { pos: new THREE.Vector3(0.95, 0.95, 1.75), look: new THREE.Vector3(-0.02, 0.33, -0.05) },
    screen: { pos: new THREE.Vector3(), look: new THREE.Vector3(0, SCREEN.y, SCREEN.z) }
  };

  // Distance at which the screen fills most of the window.
  function fitScreenView() {
    const aspect = window.innerWidth / window.innerHeight;
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const fill = 0.8;
    const d = Math.max((SCREEN.h / fill) / 2 / Math.tan(vHalf), (SCREEN.w / fill) / 2 / Math.tan(hHalf));
    views.screen.pos.set(0, SCREEN.y + 0.03 * d, SCREEN.z + d);
  }
  fitScreenView();

  const cam = { from: views.start, to: views.start, t: 1, dur: 1, current: 'start' };
  const camPos = views.start.pos.clone();
  const camLook = views.start.look.clone();
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  function flyTo(name, dur) {
    cam.from = { pos: camera.position.clone().sub(parallax), look: camLook.clone() };
    cam.to = views[name];
    cam.t = 0;
    cam.dur = dur;
    cam.current = name;
    toggle.textContent = name === 'screen' ? 'View the desk' : 'Back to the screen';
  }

  toggle.addEventListener('click', () => flyTo(cam.current === 'screen' ? 'desk' : 'screen', 1.4));
  renderer.domElement.addEventListener('click', () => { if (cam.current !== 'screen') flyTo('screen', 1.4); });
  screenEl.addEventListener('pointerdown', () => { if (cam.current === 'desk') flyTo('screen', 1.4); });

  // ---- input: parallax, mouse and keys follow the visitor ----
  const pointer = new THREE.Vector2();
  const parallax = new THREE.Vector3();
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  });
  window.addEventListener('keydown', (e) => { if (keys[e.code]) keys[e.code].userData.down = 1; });
  window.addEventListener('keyup', (e) => { if (keys[e.code]) keys[e.code].userData.down = 0; });
  screenEl.addEventListener('pointerdown', () => { mouseBody.position.y = -0.002; });
  window.addEventListener('pointerup', () => { mouseBody.position.y = 0; });

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    cssRenderer.setSize(w, h);
    fitScreenView();
  });

  // ---- intro: arrive at the desk, power on, zoom into the screen ----
  let powerAt = Infinity;
  let glowLevel = 0;
  flyTo('desk', 2.0);
  setTimeout(() => {
    led.material = mat.ledOn;
    powerAt = performance.now();
    Desktop.powerOn();
  }, 1200);
  setTimeout(() => {
    flyTo('screen', 2.2);
    toggle.hidden = false;
  }, 2600);

  // ---- loop ----
  const clock = new THREE.Clock();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const tmp = new THREE.Vector3();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);

    // Camera flight.
    if (cam.t < 1) {
      cam.t = Math.min(1, cam.t + dt / cam.dur);
      const k = ease(cam.t);
      camPos.lerpVectors(cam.from.pos, cam.to.pos, k);
      camLook.lerpVectors(cam.from.look, cam.to.look, k);
    } else {
      camPos.copy(cam.to.pos);
      camLook.copy(cam.to.look);
    }
    // Gentle parallax away from the screen view, none while reading.
    const amount = cam.current === 'screen' && cam.t >= 1 ? 0 : 0.12;
    tmp.set(pointer.x * amount, -pointer.y * amount * 0.5, 0);
    parallax.lerp(tmp, 1 - Math.exp(-dt * 4));
    camera.position.copy(camPos).add(parallax);
    camera.lookAt(camLook);

    // Screen glow fades in with power.
    const on = performance.now() - powerAt;
    glowLevel = on > 0 ? Math.min(1, on / 600) : 0;
    screenGlow.intensity = glowLevel * 0.9;
    mat.glass.color.setHex(glowLevel > 0.5 ? 0x0f1a26 : 0x030507);

    // Mouse slides with the pointer; keys spring back.
    tmp.set(mouseBase.x + pointer.x * 0.045, mouseBase.y, mouseBase.z + pointer.y * 0.04);
    mouse.position.lerp(tmp, 1 - Math.exp(-dt * 10));
    for (const m of keyList) {
      const y = m.userData.baseY - m.userData.down * 0.006;
      m.position.y += (y - m.position.y) * (1 - Math.exp(-dt * 30));
    }

    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
  Desktop.sceneReady = true;
}

// A simple wood grain, painted once on a canvas.
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#6e4a30';
  g.fillRect(0, 0, c.width, c.height);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const y = rand() * c.height;
    const light = rand() > 0.5;
    g.strokeStyle = light ? `rgba(160,112,72,${0.12 + rand() * 0.18})` : `rgba(52,32,18,${0.12 + rand() * 0.2})`;
    g.lineWidth = 1 + rand() * 3;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 32) {
      g.lineTo(x, y + Math.sin(x * 0.006 + i) * 6 + (rand() - 0.5) * 2);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
