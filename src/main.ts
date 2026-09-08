import * as THREE from "three";
import * as C from "cannon-es";
import "./style.css";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { SlapstickFX, type EffectFrame } from "./effects";

const $ = (id: string) => document.getElementById(id)!;
$("app").innerHTML = `<div id="scene"></div>
<div class="hud">
  <header class="top">
    <div><div class="brand">FRIEND <span>CANNON.</span></div><div class="edition">HUMAN FLIGHT CLUB</div></div>
    <div class="right"><div class="scoreboard"><div class="stat chaos"><label>CHAOS</label><strong id="chaos">0</strong></div><div class="stat"><label>DISTANCE</label><strong id="distance">0</strong><small>m</small></div></div><button class="sound" id="sound" aria-label="Mute sound" aria-pressed="false" title="Toggle sound">♫</button></div>
  </header>
  <div class="zone" id="zone">01 / THE NEIGHBORHOOD</div>
  <div class="intro" id="intro"><div class="eyebrow">A VERY BAD GOOD IDEA</div><h1>BAD IDEA.<br>GREAT <em>FLIGHT.</em></h1><p>Launch your friend. Aim for trouble.<br>Save them… just to do it again.</p><div class="tag">More bonks. Bigger streak. One more try.</div></div>
  <div class="streak-card" id="streakCard"><div><span id="streakHud">MAKE A MESS</span><b id="runTimer">40s</b></div><div class="streak-track"><i id="streakFill"></i></div><p id="chainFeed">Hit props to build your chaos streak</p></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="target" id="target"><small>NEXT BAD IDEA</small><strong id="targetName">GLASS →</strong><span id="targetHint">Flail into it</span></div>
  <div class="badge" id="badge">100%<strong>FRIEND</strong>POWERED</div>
  <div class="bottom">
    <div class="panel" id="launch"><div class="panel-title">1. AIM FOR QUESTIONABLE SCIENCE <span class="dot">●</span></div><label class="slider-row">ANGLE<input id="angle" type="range" min="15" max="75" value="36"><span id="angleValue">36°</span></label><label class="slider-row">POWER<input id="power" type="range" min="35" max="100" value="76"><span id="powerValue">76%</span></label><button class="fire" id="fire">2. LAUNCH FRIEND <small>SPACE ↗</small></button><details class="face-details"><summary>Give your friend a face <span>optional</span></summary><div class="face-picker-label">FRIEND FACE <span id="face-status" role="status">None · cartoon</span></div><div class="face-picker" id="face-picker" role="group" aria-label="Optional face presets"></div><button class="face" id="face">＋ Upload your own photo</button><input id="file" type="file" accept="image/*"></details></div>
    <div class="panel flight" id="flight"><div class="panel-title"><span id="agency">3. FLAIL INTO TROUBLE</span><span id="speed">0 km/h</span></div><div class="flight-actions"><button id="liftTouch" class="maneuver"><kbd>Q</kbd><strong>FLAIL UP</strong><small>Lift + brake</small></button><button id="flailTouch" class="maneuver"><kbd>E</kbd><strong>DIVE</strong><small>Down + forward</small></button><button id="boostTouch" class="boost-button"><kbd>F</kbd><strong>FART BOOST</strong><small id="fuel">5 left</small></button></div><div class="boosts" id="boosts" aria-label="Boost fuel"></div><div class="flight-footer"><span>3 prop hits = +1 puff</span><button id="reset">↻ Retry <kbd>R</kbd></button></div></div>
    <div class="side-hints"><div class="hint" id="hint">YOUR FRIEND HAS SIGNED THE WAIVER. PROBABLY.</div><div class="controls"><span><kbd>A</kbd><kbd>D</kbd> Angle</span><span><kbd>W</kbd><kbd>S</kbd> Power</span><span><kbd>SPACE</kbd> Fire</span></div><div class="credit" id="recordHint">A LITTLE PHYSICS. A LOT OF POOR DECISIONS.</div></div>
  </div>
</div>
<div class="end" id="end" role="dialog" aria-modal="true" aria-labelledby="reportTitle"><div class="end-card"><div class="eyebrow" id="reportEyebrow">FLIGHT REPORT / FRIEND INTACT</div><h2 id="reportTitle">BEAUTIFUL MESS.</h2><p id="verdict"></p><div class="end-stats" id="results"></div><div class="worst-moment"><img id="worstPhoto" alt="Your friend's worst impact this flight"><div><small>WORST HIT</small><strong id="worstLabel">Soft landing. Suspicious.</strong></div></div><p id="challenge"></p><div class="report-actions"><button id="replay">▶ Watch worst 8s</button><button id="savePhoto">↓ Save disaster</button></div><button class="fire" id="retry">ONE MORE DISASTER <small>R / SPACE ↻</small></button><p id="best"></p></div></div>
<div id="replayBar"><span>DISASTER REPLAY <b id="replayTime"></b></span><button id="closeReplay">Back to report <kbd>ESC</kbd></button></div>
`;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#cce4df");
scene.fog = new THREE.Fog("#cce4df", 100, 330);
const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.1,
  700,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor("#cce4df");
$("scene").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff8e8, 0x839b8b, 2.1));
const sun = new THREE.DirectionalLight(0xfff4d8, 2.4);
sun.position.set(-30, 65, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -70,
  right: 110,
  top: 65,
  bottom: -65,
  far: 220,
});
sun.shadow.bias = -0.0003;
scene.add(sun);
scene.add(sun.target);
const world = new C.World({ gravity: new C.Vec3(0, -15, 0) });
world.broadphase = new C.SAPBroadphase(world);
(world.solver as C.GSSolver).iterations = 12;
const rubber = new C.Material("rubber"),
  groundMat = new C.Material("ground");
world.addContactMaterial(
  new C.ContactMaterial(rubber, groundMat, {
    friction: 0.16,
    restitution: 0.28,
  }),
);
const ground = new C.Body({
  mass: 0,
  material: groundMat,
  shape: new C.Plane(),
});
ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(ground);
const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    );
  return materials.get(color)!;
}
function box(
  w: number,
  h: number,
  d: number,
  color: string,
  x = 0,
  y = 0,
  z = 0,
  parent: THREE.Object3D = scene,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function ball(
  r: number,
  color: string,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = scene,
) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function cylinder(
  r: number,
  r2: number,
  h: number,
  color: string,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = scene,
) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r2, h, 24),
    mat(color),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function label(
  text: string,
  x: number,
  y: number,
  z: number,
  color = "#334b43",
  scale = 5,
) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.font = "900 50px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 80);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, depthWrite: false }),
  );
  s.position.set(x, y, z);
  s.scale.set(scale, scale / 4, 1);
  scene.add(s);
  return s;
}
box(1600, 0.3, 180, "#b9cf91", 700, -0.19, 0);
box(1600, 0.08, 14, "#8eaaa2", 700, 0.01, 0);
box(1600, 0.15, 1, "#f3eeda", 700, 0.05, 7.4);
box(1600, 0.15, 1, "#f3eeda", 700, 0.05, -7.4);
for (let x = -50; x < 1500; x += 12)
  box(4, 0.025, 0.17, "#dde3cf", x, 0.065, 0);
function tree(x: number, z: number, s = 1) {
  cylinder(0.18 * s, 0.25 * s, 2.4 * s, "#9c8669", x, 1.2 * s, z);
  ball(1.3 * s, "#82ae6b", x, 3 * s, z);
  ball(0.95 * s, "#99bb78", x + 0.5 * s, 3.7 * s, z);
}
for (let i = 0; i < 100; i++) {
  const x = i * 14 - 35;
  for (const side of [-1, 1]) {
    const z = side * (14 + (i % 3) * 5);
    if (i % 3 === 0) {
      if (!(side === 1 && x > -15 && x < 18)) tree(x, z, 1 + (i % 4) * 0.2);
      continue;
    }
    const city = x > 240 && x < 650;
    const h = city ? 8 + ((i * 7) % 22) : 3 + (i % 3);
    const color = ["#e6c8a3", "#f2e9cb", "#a9c8be", "#c2b9cf", "#e4ac91"][
      i % 5
    ];
    box(7, h, 6, color, x, h / 2, z);
    if (!city) {
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(5.5, 2, 4),
        mat("#c28266"),
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, h + 1, z);
      roof.castShadow = true;
      scene.add(roof);
    } else box(7.5, 0.4, 6.5, "#ecdfc7", x, h, z);
    for (let yy = 1.7; yy < h; yy += 2.6) {
      for (const xx of [-2, 1])
        box(1.1, 1.3, 0.08, "#648d90", x + xx, yy, z - side * 3.05);
    }
    box(1, 1.9, 0.1, "#8c9d85", x, 0.95, z - side * 3.08);
  }
}
for (let i = 0; i < 25; i++) {
  const cloud = new THREE.Group();
  for (let j = 0; j < 4; j++)
    ball(3 + (j % 2) * 1.5, "#f2f5df", j * 3, Math.sin(j) * 1, 0, cloud);
  cloud.position.set(i * 65 - 30, 45 + (i % 4) * 13, -45 - (i % 3) * 20);
  scene.add(cloud);
}
label("LAUNCH CLUB", -4, 0.3, -8, "#f5f1cf", 8);
label("THE NEIGHBORHOOD", 65, 12, -12, "#506c5b", 12);
label("DOWNTOWN", 320, 33, -13, "#506c5b", 13);
label("THINGS GET WEIRD", 720, 42, -8, "#947698", 16);

// Batch static scenery by material and 70m neighborhood block. Shadow traversal
// and draw calls stay bounded as the camera travels; individual props remain animated.
const sceneryChunks: { x: number; mesh: THREE.Mesh }[] = [];
scene.updateMatrixWorld(true);
const buckets = new Map<string, { x: number; material: THREE.Material; geometries: THREE.BufferGeometry[] }>();
const sceneryRoots = scene.children.filter(o => o instanceof THREE.Mesh || o instanceof THREE.Group);
for (const root of sceneryRoots) {
  if (root instanceof THREE.Mesh && root.geometry instanceof THREE.BoxGeometry && root.geometry.parameters.width > 100) continue;
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    const x = Math.floor(o.matrixWorld.elements[12] / 70) * 70 + 35;
    const key = x + ":" + o.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { x, material: o.material, geometries: [] });
    buckets.get(key)!.geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
    o.geometry.dispose();
  });
  scene.remove(root);
}
for (const bucket of buckets.values()) {
  const geometry = mergeGeometries(bucket.geometries);
  bucket.geometries.forEach(g => g.dispose());
  if (!geometry) continue;
  const mesh = new THREE.Mesh(geometry, bucket.material);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  sceneryChunks.push({ x: bucket.x, mesh });
}
buckets.clear();

// Cannon rests along local +Y; a pivot aims the entire barrel and loaded friend.
const cannon = new THREE.Group();
cannon.position.set(0, 1.5, 0);
scene.add(cannon);
box(3.8, 0.65, 2.7, "#526861", 0, 0.8, 0);
for (const z of [-1.5, 1.5]) {
  const wheel = cylinder(0.83, 0.83, 0.4, "#344b48", 0, 0.7, z);
  wheel.rotation.x = Math.PI / 2;
  const hub = cylinder(0.32, 0.32, 0.43, "#e9bd65", 0, 0.7, z);
  hub.rotation.x = Math.PI / 2;
}
cylinder(0.85, 1, 3.3, "#ed7751", 0, 1.5, 0, cannon);
cylinder(0.98, 0.98, 0.35, "#f2cd7d", 0, 3.05, 0, cannon);
cylinder(0.7, 0.7, 0.03, "#344d4b", 0, 3.24, 0, cannon);
box(0.45, 1.9, 0.06, "#f5cf7c", 0, 1.5, 0.84, cannon);
const faceCanvas = document.createElement("canvas");
faceCanvas.width = 256;
faceCanvas.height = 256;
const ctx = faceCanvas.getContext("2d")!;
type FaceMood = "normal" | "blink" | "panic" | "dizzy";
let faceMood: FaceMood = "normal";
let faceMoodUntil = 0;
let photoBase: HTMLImageElement | HTMLCanvasElement | null = null;
let faceTexture: THREE.CanvasTexture;
function drawFace(mood: FaceMood = "normal") {
  faceMood = mood;
  ctx.clearRect(0, 0, 256, 256);
  if (photoBase) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(128, 128, 108, 122, 0, 0, Math.PI * 2);
    ctx.clip();
    const size = Math.min(photoBase.width, photoBase.height);
    ctx.drawImage(
      photoBase,
      (photoBase.width - size) / 2,
      (photoBase.height - size) / 2,
      size,
      size,
      0,
      0,
      256,
      256,
    );
    ctx.restore();
    if (mood === "normal") {
      faceTexture.needsUpdate = true;
      return;
    }
    ctx.fillStyle = "rgba(255,248,230,0.62)";
    ctx.beginPath();
    ctx.ellipse(128, 128, 100, 110, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mood === "blink") {
    ctx.strokeStyle = "#453e39";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(72, 102);
    ctx.lineTo(102, 102);
    ctx.moveTo(154, 102);
    ctx.lineTo(184, 102);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 138, 22, 0.15, Math.PI - 0.15);
    ctx.stroke();
  } else if (mood === "panic") {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(87, 100, 18, 22, 0, 0, 7);
    ctx.ellipse(169, 100, 18, 22, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#453e39";
    ctx.beginPath();
    ctx.ellipse(87, 102, 8, 12, 0, 0, 7);
    ctx.ellipse(169, 102, 8, 12, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#2a2420";
    ctx.beginPath();
    ctx.ellipse(128, 155, 22, 28, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#ed9b84";
    ctx.beginPath();
    ctx.ellipse(58, 128, 18, 10, -0.2, 0, 7);
    ctx.ellipse(198, 128, 18, 10, 0.2, 0, 7);
    ctx.fill();
  } else if (mood === "dizzy") {
    ctx.strokeStyle = "#453e39";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(72, 88);
    ctx.lineTo(102, 118);
    ctx.moveTo(102, 88);
    ctx.lineTo(72, 118);
    ctx.moveTo(154, 88);
    ctx.lineTo(184, 118);
    ctx.moveTo(184, 88);
    ctx.lineTo(154, 118);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(108, 150);
    ctx.quadraticCurveTo(128, 175, 148, 145);
    ctx.stroke();
    ctx.fillStyle = "#ed9b84";
    ctx.beginPath();
    ctx.ellipse(60, 140, 16, 9, 0.3, 0, 7);
    ctx.ellipse(196, 140, 16, 9, -0.3, 0, 7);
    ctx.fill();
  } else {
    ctx.fillStyle = "#453e39";
    ctx.beginPath();
    ctx.ellipse(87, 102, 9, 14, 0, 0, 7);
    ctx.ellipse(169, 102, 9, 14, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#453e39";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(128, 132, 26, 0.1, Math.PI - 0.1);
    ctx.stroke();
    ctx.fillStyle = "#ed9b84";
    ctx.beginPath();
    ctx.ellipse(66, 133, 16, 9, 0, 0, 7);
    ctx.ellipse(190, 133, 16, 9, 0, 0, 7);
    ctx.fill();
  }
  faceTexture.needsUpdate = true;
}
faceTexture = new THREE.CanvasTexture(faceCanvas);
drawFace();
type Part = { body: C.Body; mesh: THREE.Object3D; offset: C.Vec3 };
const parts: Part[] = [];
const constraints: C.Constraint[] = [];
function part(
  shape: C.Shape,
  mesh: THREE.Object3D,
  mass: number,
  offset: C.Vec3,
) {
  const b = new C.Body({
    mass,
    shape,
    material: rubber,
    linearDamping: 0.025,
    angularDamping: 0.3,
  });
  b.collisionFilterGroup = 2;
  b.collisionFilterMask = 1;
  world.addBody(b);
  scene.add(mesh);
  const p = { body: b, mesh, offset };
  parts.push(p);
  return p;
}
const torsoMesh = new THREE.Group();
const shirt = ball(0.67, "#f4c95f", 0, 0, 0, torsoMesh);
shirt.scale.set(1, 1.12, 0.78);
box(0.7, 0.17, 0.8, "#e8aa4b", 0, -0.47, 0, torsoMesh);
const torso = part(new C.Sphere(0.65), torsoMesh, 5, new C.Vec3(0, 0, 0));
const headMesh = new THREE.Group();
const skull = ball(0.76, "#f4c6a1", 0, 0, 0, headMesh);
skull.scale.set(1, 1.04, 0.95);
ball(0.18, "#f4c6a1", -0.73, -0.04, 0, headMesh);
ball(0.18, "#f4c6a1", 0.73, -0.04, 0, headMesh);
const face = new THREE.Mesh(
  new THREE.PlaneGeometry(1.2, 1.2),
  new THREE.MeshBasicMaterial({
    map: faceTexture,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  }),
);
face.position.set(0, 0, 0.71);
headMesh.add(face);
const hair = ball(0.25, "#695446", -0.18, 0.72, 0.04, headMesh);
hair.scale.set(1.2, 0.6, 0.7);
const head = part(new C.Sphere(0.76), headMesh, 2, new C.Vec3(0, 1.25, 0));
function joint(a: Part, b: Part, pa: C.Vec3, pb: C.Vec3) {
  const c = new C.ConeTwistConstraint(a.body, b.body, {
    pivotA: pa,
    pivotB: pb,
    axisA: new C.Vec3(0, 1, 0),
    axisB: new C.Vec3(0, 1, 0),
    angle: 0.8,
    twistAngle: 1.3,
    maxForce: 1e5,
    collideConnected: false,
  });
  world.addConstraint(c);
  constraints.push(c);
}
joint(torso, head, new C.Vec3(0, 0.63, 0), new C.Vec3(0, -0.6, 0));
for (const side of [-1, 1]) {
  const armMesh = new THREE.Group();
  const arm = ball(0.26, "#f4c6a1", 0, 0, 0, armMesh);
  arm.scale.y = 1.6;
  ball(0.29, "#f4c6a1", 0, -0.28, 0, armMesh);
  const a = part(
    new C.Sphere(0.31),
    armMesh,
    0.7,
    new C.Vec3(side * 0.85, 0.08, 0),
  );
  joint(torso, a, new C.Vec3(side * 0.58, 0.3, 0), new C.Vec3(0, 0.3, 0));
  const legMesh = new THREE.Group();
  const pants = ball(0.32, "#4c9293", 0, 0, 0, legMesh);
  pants.scale.y = 1.45;
  const shoe = ball(0.34, "#f6f0d6", 0, -0.35, 0.12, legMesh);
  shoe.scale.set(1, 0.65, 1.3);
  const l = part(
    new C.Sphere(0.35),
    legMesh,
    1,
    new C.Vec3(side * 0.36, -0.95, 0),
  );
  joint(torso, l, new C.Vec3(side * 0.32, -0.5, 0), new C.Vec3(0, 0.35, 0));
}

type Prop = {
  body: C.Body;
  group: THREE.Group;
  type: string;
  x: number;
  last: number;
  hits: number;
  size: C.Vec3;
  home: THREE.Vector3;
  caption: THREE.Sprite;
  active: boolean;
  aerial: boolean;
};
const props: Prop[] = [];
function prop(type: string, x: number, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  scene.add(g);
  let w = 5,
    h = 1.2,
    d = 6;
  let color = "#e87b54";
  if (type === "TRAMPOLINE") {
    w = 8.5;
    h = 1.2;
    d = 8.5;
    box(w, 0.3, d, "#6b5990", 0, 0.85, 0, g);
    box(w - 0.5, 0.08, d - 0.5, "#b9a4d1", 0, 1.03, 0, g);
    for (const a of [-2.8, 2.8])
      for (const b of [-2.8, 2.8])
        cylinder(0.09, 0.09, 0.8, "#ede1c4", a, 0.4, b, g);
  }
  if (type === "SPRING") {
    w = 4;
    h = 2;
    d = 6;
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.12, 8, 20),
        mat("#e5a953"),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.25 + i * 0.3;
      g.add(ring);
    }
    box(4, 0.35, 6, "#f7d96b", 0, 1.8, 0, g);
  }
  if (type === "CAR") {
    w = 6.4;
    h = 2.5;
    d = 4.0;
    box(5.5, 1.1, 3, "#ef9874", 0, 1, 0, g);
    box(2.8, 0.85, 2.6, "#f2c497", -0.3, 1.85, 0, g);
    box(2, 0.6, 0.04, "#8ab3af", -0.3, 1.9, 1.32, g);
    for (const a of [-1.7, 1.7])
      for (const b of [-1.5, 1.5]) {
        const t = cylinder(0.58, 0.58, 0.32, "#405759", a, 0.55, b, g);
        t.rotation.x = Math.PI / 2;
      }
  }
  if (type === "FAN") {
    w = 5;
    h = 0.6;
    d = 7;
    box(w, 0.4, d, "#5a9f99", 0, 0.3, 0, g);
    const blades = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const blade = box(2.2, 0.1, 0.55, "#d2e4cf", 1, 0.6, 0, blades);
      blade.rotation.y = (i * Math.PI) / 2;
      blade.position.set(
        Math.cos((i * Math.PI) / 2),
        0.6,
        Math.sin((i * Math.PI) / 2),
      );
    }
    g.add(blades);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.1 + i * 0.35, 0.035, 6, 30),
        mat("#e3efd3"),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.8;
      g.add(ring);
    }
  }
  if (type === "BOOM") {
    w = 2;
    h = 2.6;
    d = 5;
    cylinder(1, 1, 2.5, "#e9694d", 0, 1.25, 0, g);
    for (const yy of [0.4, 2.1])
      cylinder(1.03, 1.03, 0.12, "#6b7063", 0, yy, 0, g);
    box(0.6, 0.6, 0.05, "#f6dc81", 0, 1.4, 1.02, g);
  }
  if (type === "GLASS") {
    w = 4;
    h = 7;
    d = 3;
    const glass = box(4, 7, 0.22, "#9edbd8", 0, 3.5, 0, g);
    glass.material = new THREE.MeshStandardMaterial({
      color: "#a9e8e1",
      transparent: true,
      opacity: 0.42,
      metalness: 0.2,
      roughness: 0.1,
    });
    for (const xx of [-2, 2]) box(0.18, 7.3, 0.3, "#f9f3d9", xx, 3.5, 0, g);
    for (const yy of [0, 3.5, 7]) box(4.3, 0.18, 0.3, "#f9f3d9", 0, yy, 0, g);
    const gleam = box(0.1, 2, 0.03, "#ffffff", 0.9, 4.5, 0.18, g);
    gleam.rotation.z = -0.45;
  }
  if (type === "SIGN") {
    w = 4.5;
    h = 3;
    d = 3;
    cylinder(0.12, 0.12, 2.8, "#506d65", 0, 1.4, 0, g);
    box(4.5, 2.4, 0.4, "#f5ce67", 0, 1.8, 0, g);
    const arrow = box(1.8, 0.2, 0.05, "#80543c", 0, 1.8, 0.24, g);
    arrow.rotation.z = -0.3;
    box(0.8, 0.2, 0.05, "#80543c", 0.7, 2.05, 0.24, g).rotation.z = -0.9;
  }
  if (type === "BALLOON") {
    w = 4;
    h = 5;
    d = 6;
    color = "#c18eaf";
    ball(2.6, color, 0, 2.7, 0, g);
    cylinder(0.04, 0.04, 5, "#ebe4ca", 0, -1, 0, g);
  }
  const b = new C.Body({
    mass: 0,
    material: groundMat,
    shape: new C.Box(new C.Vec3(w / 2, h / 2, d / 2)),
    position: new C.Vec3(x, y + h / 2, z),
  });
  // Swept sensors handle fast ragdolls without thin-prop tunnelling. Only the ground
  // enters the physics solver; authored kicks are resolved after a complete step.
  b.collisionResponse = false;
  const caption = label(type === "BOOM" ? "BOOM!" : type, 0, h + 1.2, 0, "#345951", 4);
  g.add(caption);
  const p: Prop = { body: b, group: g, type, x, last: -100, hits: 0,
    size: new C.Vec3(w / 2, h / 2, d / 2), home: g.position.clone(), caption, active: true, aerial: false };
  props.push(p);
  return p;
}
const pattern = ["TRAMPOLINE", "CAR", "FAN", "BOOM", "SPRING", "GLASS", "CAR", "TRAMPOLINE"];
for (let i = 0; i < 34; i++) prop(pattern[i % pattern.length], 18 + i * 28, 0, 0);
// A small reusable cast fills the air. Targets commit ahead of the player, then
// stay put: Q/E and boost can choose a hit, a headbutt, or a deliberate miss.
const airProps = Array.from({ length: 9 }, (_, i) => {
  const p = prop(["GLASS", "SIGN", "BALLOON"][i % 3], 0, 0);
  p.aerial = true;
  p.active = false;
  p.group.visible = false;
  return p;
});
let airIndex = 0, nextAirAt = 0, targetProp: Prop | null = null;
let runSeed = 1, runNumber = 0, propChain = 0, saves = 0, headbutts = 0;
function runRandom() {
  runSeed = (Math.imul(runSeed, 1664525) + 1013904223) >>> 0;
  return runSeed / 4294967296;
}
function placeAirTarget(first = false) {
  const b = torso.body;
  const p = airProps[airIndex++ % airProps.length];
  const travel = first ? 0.85 : 1.55 + runRandom() * 0.35;
  const x = b.position.x + Math.max(17, b.velocity.x) * travel;
  const prediction = b.position.y + b.velocity.y * travel - 7.5 * travel * travel;
  const offset = first ? 0 : (runRandom() - 0.5) * 4;
  const center = THREE.MathUtils.clamp(prediction + offset, 4.5, 40);
  p.x = x;
  p.group.position.set(x, center - p.size.y, 0);
  p.group.scale.set(1, 1, 1);
  p.group.rotation.set(0, 0, 0);
  p.body.position.set(x, center, 0);
  p.hits = 0;
  p.last = -100;
  p.active = true;
  p.group.visible = true;
  p.caption.visible = true;
  targetProp = p;
  nextAirAt = elapsed + travel + 0.35;
}
const beforeStep = parts.map(() => new C.Vec3());
const sweepNormal = new C.Vec3();
function sweepProp(from: C.Vec3, to: C.Vec3, p: Prop, radius: number) {
  let enter = 0, leave = 1, axis = "x" as "x" | "y" | "z", sign = -1;
  for (const k of ["x", "y", "z"] as const) {
    const half = p.size[k] + radius + (p.type === "TRAMPOLINE" ? 0.5 : 0.12);
    const start = from[k] - p.body.position[k], delta = to[k] - from[k];
    if (Math.abs(delta) < 0.00001) {
      if (Math.abs(start) > half) return false;
      continue;
    }
    let near = (-half - start) / delta, far = (half - start) / delta;
    if (near > far) [near, far] = [far, near];
    if (near > enter) { enter = near; axis = k; sign = delta > 0 ? -1 : 1; }
    leave = Math.min(leave, far);
    if (enter > leave) return false;
  }
  if (leave < 0 || enter > 1) return false;
  sweepNormal.setZero();
  sweepNormal[axis] = sign;
  return true;
}
function checkProps() {
  const b = torso.body;
  for (const p of props) {
    if (!p.active || Math.abs(p.x - b.position.x) > 12 || elapsed - p.last < 1.6) continue;
    if (p.type === "FAN" && Math.abs(b.position.x - p.x) < 4.5 && b.position.y > 0.5 && b.position.y < 15) {
      hit(p, 4, new C.Vec3(0, 1, 0));
      continue;
    }
    // Head gets first refusal when it actually touches a surface this frame.
    for (const i of [1, 0, 2, 3, 4, 5]) {
      const part = parts[i];
      const radius = (part.body.shapes[0] as C.Sphere).radius;
      if (sweepProp(beforeStep[i], part.body.position, p, radius)) {
        const impact = Math.abs(part.body.velocity.dot(sweepNormal));
        hit(p, impact, sweepNormal, part === head);
        break;
      }
    }
  }
  if (elapsed < 36 && b.position.x < 910 && (elapsed > nextAirAt || (targetProp && (targetProp.hits > 0 || b.position.x > targetProp.x + 7))))
    placeAirTarget();
}
for (let i = 0; i < 15; i++) {
  const x = 690 + i * 38;
  const island = ball(6, "#b6a5bf", x, 18 + (i % 3) * 12, -12);
  island.scale.set(1, 0.3, 0.7);
  ball(1.8, "#f3d17b", x, 22 + (i % 3) * 12, -12);
}

let state: "aim" | "fly" | "end" | "replay" = "aim",
  angle = 36,
  power = 76,
  farts = 5,
  chaos = 0,
  maxHeight = 0,
  maxSpeed = 0,
  distance = 0,
  elapsed = 0,
  quiet = 0,
  streak = 0,
  hits = 0,
  glassHits = 0,
  carHits = 0,
  explosions = 0,
  special = 0,
  shake = 0,
  recoil = 0,
  lastBoost = -10,
  toastUntil = 0,
  boostAngle = 0,
  chaosMult = 1,
  chaosMultUntil = 0,
  lastReaction = -10,
  hitStop = 0,
  impactCam = 0,
  squashT = 0,
  squashAmt = 1,
  squashAxis = new THREE.Vector3(0, 1, 0),
  trembleT = 0,
  worstHitSpeed = 0,
  worstHitLabel = "—",
  impactAge = 0,
  maxStreak = 0;
type ContactBeat = { impact: number; normal: C.Vec3; headFirst: boolean };
const pendingHits = new Map<Prop, ContactBeat>();
let pendingGround: ContactBeat | null = null;
const eventLog: { time: number; label: string; impact: number; score: number }[] = [];
const fx = new SlapstickFX(scene);
const floatTexts: { mesh: THREE.Sprite; life: number; v: THREE.Vector3 }[] = [];
const chainWords: string[] = [];
const keys = new Set<string>();
let boostsUsed = 0;
let audioCtx: AudioContext | undefined,
  muted = false;
function sound(freq = 200, duration = 0.13) {
  if (muted) return;
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
    const o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq * 0.25),
      audioCtx.currentTime + duration,
    );
    g.gain.setValueAtTime(0.13, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + duration);
  } catch {}
}
function burst(pos: C.Vec3 | THREE.Vector3, color: string, count = 12, force = 7) {
  fx.burst(pos, color, Math.min(count, 24), force);
}
const textTextures = new Map<string, THREE.CanvasTexture>();
function makeTextSprite(text: string, color = "#2b3d38") {
  const key = text + color;
  let texture = textTextures.get(key);
  if (!texture) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    const g = c.getContext("2d")!;
    g.font = "900 70px sans-serif";
    g.textAlign = "center";
    g.lineJoin = "round";
    g.lineWidth = 10;
    g.strokeStyle = "#fffbee";
    g.strokeText(text, 256, 87);
    g.fillStyle = color;
    g.fillText(text, 256, 87);
    texture = new THREE.CanvasTexture(c);
    textTextures.set(key, texture);
  }
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
  spr.scale.set(4.8, 1.2, 1);
  scene.add(spr);
  return spr;
}
function spawnStars(count: number, life = 1) { fx.halo(count, life); }
function spawnDroplets(pos: C.Vec3, count: number, force = 5, color = "#d7f0ff") { fx.burst(pos, color, count, force, 0.11); }
function setFaceReaction(mood: FaceMood, duration: number) {
  faceMoodUntil = elapsed + duration;
  drawFace(mood);
}
function bumpChaos(base: number, label: string) {
  if (elapsed < chaosMultUntil) chaosMult = Math.min(8, chaosMult + 1);
  else { chaosMult = 1; chainWords.length = 0; }
  chaosMultUntil = elapsed + 3.4;
  maxStreak = Math.max(maxStreak, chaosMult);
  const gained = Math.round(base * chaosMult);
  chaos += gained;
  toast(`${label} +${gained}`);
  chainWords.push(label);
  if (chainWords.length > 3) chainWords.shift();
  $("chainFeed").textContent = chainWords.join(" → ");
  const hud = $("streakHud");
  if (hud)
    hud.textContent = chaosMult > 1 ? `CHAOS STREAK ×${chaosMult}` : "FIRST BONK! ×1";
  return gained;
}
function comedyImpact(impact: number, label: string, normal = new C.Vec3(0, 1, 0)) {
  // Record the true normal impact speed even when secondary contacts share a reaction.
  if (impact > worstHitSpeed) {
    worstHitSpeed = impact;
    worstHitLabel = `${Math.round(impact * 3.6)} km/h · ${label}`;
  }
  if (elapsed - lastReaction < 0.24 || impact < 2) return;
  lastReaction = elapsed;
  impactAge = 0;
  squashAxis.set(Math.abs(normal.x), Math.abs(normal.y), 0);
  impactCam = impact >= 10 ? 1.05 : 0.5;
  const tier = impact < 5 ? 0 : impact < 10 ? 1 : impact < 18 ? 2 : 3;
  shake = [0.04, 0.1, 0.22, 0.34][tier];
  squashAmt = [0.94, 0.82, 0.68, 0.54][tier];
  squashT = 0.28;
  setFaceReaction(tier === 0 ? "blink" : tier === 3 ? "dizzy" : "panic", [0.2, 0.55, 0.9, 1.25][tier]);
  if (tier > 0) spawnDroplets(head.body.position, [0, 2, 5, 7][tier], 4 + tier);
  if (tier > 1) {
    spawnStars(tier === 3 ? 5 : 3, 1.05);
    hitStop = tier === 3 ? 0.085 : 0.055;
    trembleT = tier === 3 ? 0.4 : 0;
    const spr = makeTextSprite(tier === 3 ? "KABONK!" : "WHAP!", "#e56746");
    spr.position.set(head.body.position.x, head.body.position.y + 2.2, head.body.position.z + 0.8);
    floatTexts.push({ mesh: spr, life: 0.85, v: new THREE.Vector3(torso.body.velocity.x * 0.6, 1, 0) });
  }
  // One onset per collision; the descending pitch is the squash, the chirp the recovery.
  sound([460, 310, 180, 95][tier], [0.07, 0.11, 0.15, 0.2][tier]);
}
function toast(t: string) {
  $("toast").textContent = t;
  toastUntil = performance.now() + 1500;
}
function impulse(x: number, y: number, z = 0) {
  for (const p of parts) {
    p.body.velocity.x += x;
    p.body.velocity.y += y;
    p.body.velocity.z += z;
  }
}
const callouts: Record<string, string[]> = {
  CAR: ["HOOD ORNAMENT", "BAD PARKING"], GLASS: ["WINDOW SHOPPING", "EXPRESS ENTRANCE"],
  BOOM: ["INSURANCE SAYS NO", "HOT SEAT"], FAN: ["FAN MAIL", "AIR SUPPORT"],
  BALLOON: ["PARTY POOPER", "POP STAR"], TRAMPOLINE: ["RETURN TO SENDER", "BOING!"],
  SPRING: ["SPRING BREAK", "YEET!"], SIGN: ["READ THE SIGN", "WRONG WAY, BUDDY"],
};
function hit(p: Prop, impact = 5, normal = new C.Vec3(0, 1, 0), headFirst = false) {
  if (state !== "fly" || !p.active || elapsed - p.last < 1.6) return;
  p.last = elapsed;
  p.hits++;
  hits++;
  propChain++;
  const b = torso.body, type = p.type;
  const headBonus = headFirst && impact >= 8 && type !== "FAN";
  if (headBonus) headbutts++;
  const base = (type === "GLASS" ? 150 : type === "BOOM" ? 220 : type === "CAR" ? 120 : 90) + (headBonus ? 80 : 0);
  const word = headBonus ? "HEADBUTT!" : callouts[type][(p.hits + runNumber) % 2];
  bumpChaos(base, word);
  comedyImpact(impact, headFirst ? `Head-first into ${type.toLowerCase()}` : type, normal);
  eventLog.push({ time: elapsed, label: type + (headBonus ? " · HEADBUTT" : ""), impact, score: chaos });
  burst(b.position, type === "BOOM" ? "#f5b14f" : type === "GLASS" ? "#b9f4f3" : "#fff3b8", type === "BOOM" ? 16 : 6, 6);
  // Each prop has its own rhythm. Breakables preserve forward motion; landing
  // props relaunch. No additive lift stacking that sends the friend into orbit.
  if (type === "GLASS" || type === "SIGN" || type === "BALLOON" || type === "BOOM") {
    p.active = false;
    p.caption.visible = false;
    if (type === "SIGN") { p.group.rotation.z = -0.9; p.group.position.y -= 1; }
    else p.group.visible = false;
  } else p.group.scale.y = 0.72;
  if (type === "GLASS") { glassHits++; impulse(2, 2); }
  if (type === "SIGN") { impulse(-3, 5); torso.body.angularVelocity.z += headBonus ? -5 : 3; special++; }
  if (type === "BALLOON") { impulse(4, Math.max(5, 13 - b.velocity.y)); special++; }
  if (type === "CAR") { carHits++; impulse(Math.max(0, 27 - b.velocity.x), Math.max(5, 18 - b.velocity.y)); }
  if (type === "BOOM") { explosions++; impulse(9, Math.max(6, 23 - b.velocity.y)); }
  if (type === "FAN") { special++; impulse(2, Math.max(2, 17 - b.velocity.y)); }
  if (type === "TRAMPOLINE" || type === "SPRING") impulse(Math.max(0, 26 - b.velocity.x), Math.max(0, (type === "SPRING" ? 25 : 22) - b.velocity.y));
  torso.body.angularVelocity.z += normal.x * 2;
  if (propChain % 3 === 0 && farts < 5) {
    farts++;
    updateFuel();
    $("fuel").textContent = "+1 PUFF · " + farts + " left";
  }
}
function updateAim() {
  const r = THREE.MathUtils.degToRad(angle);
  cannon.rotation.z = r - Math.PI / 2;
  cannon.position.x = -recoil;
  const muzzle = new THREE.Vector3(0, 3.8, 0)
    .applyQuaternion(cannon.quaternion)
    .add(cannon.position);
  for (const p of parts) {
    p.body.position.set(
      muzzle.x + p.offset.x,
      muzzle.y + p.offset.y,
      muzzle.z + p.offset.z,
    );
    p.body.quaternion.set(0, 0, 0, 1);
    p.body.velocity.setZero();
    p.body.angularVelocity.setZero();
  }
  $("angleValue").textContent = `${Math.round(angle)}°`;
  $("powerValue").textContent = `${Math.round(power)}%`;
  ($("angle") as HTMLInputElement).value = String(angle);
  ($("power") as HTMLInputElement).value = String(power);
}
let lastGroundHit = -10;
for (const part of parts) part.body.addEventListener("collide", (event: { body: C.Body; contact: C.ContactEquation }) => {
  if (state !== "fly" || event.body !== ground) return;
  const impact = Math.abs(event.contact.getImpactVelocityAlongNormal());
  if (!pendingGround || impact > pendingGround.impact)
    pendingGround = { impact, normal: event.contact.ni.clone(), headFirst: part === head };
});
function resolveContacts() {
  for (const [prop, beat] of pendingHits) hit(prop, beat.impact, beat.normal, beat.headFirst);
  pendingHits.clear();
  const beat = pendingGround;
  pendingGround = null;
  if (beat && beat.impact > 3 && elapsed - lastGroundHit > 0.45) {
    lastGroundHit = elapsed;
    comedyImpact(beat.impact, beat.headFirst ? "Face-first into grass" : "LAWN DART", beat.normal);
    if (beat.impact > 8) bumpChaos(40, "LAWN DART");
    burst(torso.body.position, "#e6dfbb", 5, 3);
    eventLog.push({ time: elapsed, label: "GROUND", impact: beat.impact, score: chaos });
  }
}
const dots: THREE.Mesh[] = [];
for (let i = 1; i <= 16; i++)
  dots.push(ball(0.07 + i * 0.006, "#fff9d7", 0, 0, 0));
function launch() {
  if (state !== "aim") return;
  state = "fly";
  $("intro").style.display = "none";
  $("launch").style.display = "none";
  $("flight").style.display = "block";
  $("badge").style.display = "none";
  $("hint").textContent = "Q LIFTS. E DIVES. F SAVES BAD DECISIONS.";
  dots.forEach((d) => (d.visible = false));
  document.body.dataset.state = "fly";
  const r = (angle * Math.PI) / 180,
    s = power * 0.48 + 10;
  for (const p of parts) {
    p.body.wakeUp();
    p.body.velocity.set(Math.cos(r) * s, Math.sin(r) * s, 0);
    p.body.angularVelocity.set(0, 0, -2);
  }
  placeAirTarget(true);
  recoil = 0.7;
  shake = 0.55;
  burst(torso.body.position, "#fff2d6", 35, 12);
  sound(120, 0.35);
  toast("BON VOYAGE, BUDDY!");
}
function boost() {
  if (state !== "fly" || elapsed - lastBoost < 0.65) return;
  if (!farts) { toast("EMPTY! 3 PROP HITS = +1 PUFF"); return; }
  lastBoost = elapsed;
  farts--;
  boostsUsed++;
  const b = torso.body;
  const save = b.velocity.y < -5 && (b.position.y < 10 || elapsed - lastReaction < 1.1);
  const steer = THREE.MathUtils.clamp(boostAngle, -1, 1);
  const bx = 13 - steer * 6;
  const by = save ? Math.max(18, 13 - b.velocity.y) : 15 + steer * 8;
  impulse(bx, by, -b.position.z * 0.3);
  torso.body.angularVelocity.z -= 2;
  if (save) { saves++; bumpChaos(160, "FART SAVE!"); }
  else { chaos += 25; toast(steer > 0.3 ? "PUFF UP! +25" : steer < -0.3 ? "TURBO TOOT! +25" : "PFFT! +25"); }
  eventLog.push({ time: elapsed, label: save ? "FART SAVE" : "BOOST", impact: 0, score: chaos });
  impactCam = Math.max(impactCam, 0.3);
  shake = Math.max(shake, 0.1);
  const origin = new C.Vec3(b.position.x - 0.5, b.position.y - 0.6, b.position.z);
  burst(origin, "#bfd87d", 8, 5);
  fx.puff(origin, bx, by);
  const spr = makeTextSprite(save ? "SAVED?!" : "PFFT!", "#496d3a");
  spr.position.set(origin.x, origin.y - 0.6, origin.z + 1);
  floatTexts.push({ mesh: spr, life: 0.85, v: new THREE.Vector3(4, 1.2, 0) });
  sound(65, 0.22);
  setFaceReaction("panic", 0.45);
  updateFuel();
}
function updateFuel() {
  $("boosts").innerHTML = Array.from(
    { length: 5 },
    (_, i) => `<i class="${i >= farts ? "used" : ""}"></i>`,
  ).join("");
  $("fuel").textContent = `${farts} left`;
}
function finish() {
  if (state !== "fly") return;
  state = "end";
  let best = 0;
  try {
    best = Math.max(
      Number(localStorage.getItem("friend-cannon-best") || 0),
      Math.floor(distance),
    );
    localStorage.setItem("friend-cannon-best", String(best));
  } catch {}
  $("end").style.display = "grid";
  $("verdict").textContent =
    distance > 500
      ? "A local legend. A citywide insurance problem."
      : "Gravity called. Your friend finally answered.";
  $("results").innerHTML = [
    [`${Math.floor(distance)} m`, "distance"],
    [chaos.toLocaleString(), "chaos score"],
    [`×${maxStreak}`, "best chaos streak"],
    [worstHitLabel, "worst hit"],
    [`${Math.round(maxHeight)} m`, "max altitude"],
    [`${Math.round(maxSpeed * 3.6)}`, "top speed · km/h"],
    [`${carHits} / ${glassHits}`, "cars / glass"],
    [`${hits} / ${explosions}`, "bounces / booms"],
    [`${5 - farts}`, "farts deployed"],
    [`${special}`, "special hits"],
  ]
    .map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`)
    .join("");
  $("best").textContent = `PERSONAL BEST · ${best} m`;
}
function reset() {
  state = "aim";
  document.body.dataset.state = "aim";
  runNumber++;
  runSeed = 5319 + runNumber * 977;
  airIndex = runNumber % 3;
  nextAirAt = 0;
  targetProp = null;
  propChain = 0; saves = 0; headbutts = 0; boostsUsed = 0;
  chainWords.length = 0;
  farts = 5;
  chaos = 0;
  maxHeight = 0;
  maxSpeed = 0;
  distance = 0;
  elapsed = 0;
  quiet = 0;
  streak = 0;
  hits = 0;
  glassHits = 0;
  carHits = 0;
  explosions = 0;
  special = 0;
  boostAngle = 0;
  lastBoost = -10;
  lastGroundHit = -10;
  shake = 0;
  recoil = 0;
  chaosMult = 1;
  chaosMultUntil = 0;
  lastReaction = -10;
  hitStop = 0;
  impactCam = 0;
  squashT = 0;
  squashAmt = 1;
  trembleT = 0;
  worstHitSpeed = 0;
  worstHitLabel = "—";
  impactAge = 0;
  pendingHits.clear();
  pendingGround = null;
  eventLog.length = 0;
  maxStreak = 0;
  keys.clear();
  for (const p of props) {
    p.last = -100;
    p.hits = 0;
    p.active = !p.aerial;
    p.group.visible = !p.aerial;
    p.group.position.copy(p.home);
    p.group.rotation.set(0, 0, 0);
    p.group.scale.set(1, 1, 1);
    p.caption.visible = true;
  }
  fx.clear();
  for (const t of floatTexts) {
    scene.remove(t.mesh);
    (t.mesh.material as THREE.Material).dispose();
  }
  floatTexts.length = 0;
  headMesh.scale.set(1, 1, 1);
  photoBase = selectedFace === "none" ? null : photoBase;
  if (!photoBase) drawFace("normal");
  else drawFace("normal");
  const hud = $("streakHud");
  if (hud) hud.textContent = "MAKE A MESS";
  $("end").style.display = "none";
  $("intro").style.display = "block";
  $("launch").style.display = "block";
  $("flight").style.display = "none";
  $("badge").style.display = "grid";
  $("toast").textContent = "";
  $("hint").textContent = "YOUR FRIEND HAS SIGNED THE WAIVER. PROBABLY.";
  dots.forEach((d) => (d.visible = true));
  updateFuel();
  updateAim();
  camera.position.set(17, 12, 27);
  look.set(5, 3, 0);
}
$("fire").onclick = launch;
$("retry").onclick = reset;
$("reset").onclick = reset;
$("boostTouch").onclick = boost;
for (const [id, code] of [["liftTouch", "KeyQ"], ["flailTouch", "KeyE"]]) {
  const button = $(id);
  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    if (state !== "fly") return;
    button.setPointerCapture(e.pointerId);
    keys.add(code);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(event, () => keys.delete(code));
}
$("sound").onclick = () => {
  muted = !muted;
  $("sound").textContent = muted ? "♪̸" : "♫";
  $("sound").setAttribute("aria-pressed", String(muted));
  $("sound").setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
};
($("angle") as HTMLInputElement).oninput = (e) =>
  (angle = Number((e.target as HTMLInputElement).value));
($("power") as HTMLInputElement).oninput = (e) =>
  (power = Number((e.target as HTMLInputElement).value));
window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === "Space") launch();
  if (e.code === "KeyF" || e.code === "ShiftLeft" || e.code === "ShiftRight")
    boost();
  if (e.code === "KeyR") reset();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
// All samples start with a local illustrated fallback. Remote loading never blocks play.
function fallbackFace(index: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d")!;
  c.fillStyle = ["#b4d3cd", "#eac9a6", "#ccc0de", "#d8df9e", "#e9b6ad"][index];
  c.fillRect(0, 0, 256, 256);
  c.fillStyle = ["#f3c59c", "#bd815c", "#e3ac7f", "#8c5c44", "#f0c5ad"][index];
  c.beginPath();
  c.ellipse(128, 135, 78, 98, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ["#554137", "#322c29", "#a4683d", "#383335", "#786148"][index];
  c.beginPath();
  c.ellipse(128, 65, 80, 38, -0.12, Math.PI, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(98, 120, 7, 10, 0, 0, Math.PI * 2);
  c.ellipse(158, 120, 7, 10, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#51392f";
  c.lineWidth = 6;
  c.beginPath();
  c.arc(128, 153, 25, 0, Math.PI);
  c.stroke();
  return canvas;
}
function applyFace(source: HTMLImageElement | HTMLCanvasElement) {
  photoBase = source;
  drawFace(faceMood === "normal" ? "normal" : faceMood);
}
let selectedFace = "none",
  faceRequest = 0;
const sampleFaces = [12, 47, 13, 49, 14].map((id, index) => ({
  url: `https://i.pravatar.cc/256?img=${id}`,
  source: fallbackFace(index) as HTMLCanvasElement | HTMLImageElement,
  loaded: false,
}));
function markFace(selection: string, status: string) {
  selectedFace = selection;
  $("face-status").textContent = status;
  $("face-picker")
    .querySelectorAll<HTMLButtonElement>("button")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.face === selection),
      );
    });
}
$("face-picker").innerHTML =
  `<button type="button" class="face-option" data-face="none" aria-label="None — default cartoon face" aria-pressed="true">None</button>` +
  sampleFaces
    .map(
      (sample, index) =>
        `<button type="button" class="face-option" data-face="${index}" aria-label="Sample face ${index + 1}" aria-pressed="false"><img alt="" src="${(sample.source as HTMLCanvasElement).toDataURL()}"></button>`,
    )
    .join("");
$("face-picker")
  .querySelectorAll<HTMLButtonElement>("button")
  .forEach((button) => {
    button.onclick = () => {
      faceRequest++;
      const choice = button.dataset.face!;
      if (choice === "none") {
        photoBase = null;
        markFace(choice, "None · cartoon");
        drawFace("normal");
      } else {
        const sample = sampleFaces[Number(choice)];
        markFace(
          choice,
          `Sample ${Number(choice) + 1}${sample.loaded ? "" : " · illustrated"}`,
        );
        applyFace(sample.source);
      }
    };
  });
sampleFaces.forEach((sample, index) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.referrerPolicy = "no-referrer";
  image.onload = () => {
    // CORS-enabled images are safe to copy into the WebGL face texture.
    sample.source = image;
    sample.loaded = true;
    const thumbnail = $("face-picker").querySelector<HTMLImageElement>(
      `[data-face="${index}"] img`,
    )!;
    thumbnail.src = sample.url;
    if (selectedFace === String(index)) {
      applyFace(image);
      markFace(String(index), `Sample ${index + 1}`);
    }
  };
  image.onerror = () => {
    /* Keep the immediately available canvas portrait. */
  };
  image.src = sample.url;
});
$("face").onclick = () => ($("file") as HTMLInputElement).click();
($("file") as HTMLInputElement).onchange = (e) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const request = ++faceRequest;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (request === faceRequest) {
      applyFace(img);
      markFace("upload", "Your photo");
      toast("LOOKING BRAVE!");
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    if (request === faceRequest)
      toast("Couldn’t read that photo. Try another!");
  };
  img.src = url;
  input.value = "";
};
function updateFlightUI() {
  if (state !== "fly") return;
  const remaining = Math.max(0, chaosMultUntil - elapsed);
  $("streakFill").style.transform = `scaleX(${remaining / 3.4})`;
  $("runTimer").textContent = `${Math.max(0, Math.ceil(40 - elapsed))}s`;
  if (remaining === 0) {
    $("streakHud").textContent = `BEST STREAK ×${maxStreak}`;
    $("chainFeed").textContent = "Next prop starts a fresh disaster";
  }
  const up = keys.has("KeyQ"), down = keys.has("KeyE");
  $("liftTouch").classList.toggle("held", up);
  $("flailTouch").classList.toggle("held", down);
  const low = torso.body.position.y < 10 && torso.body.velocity.y < -5 && farts > 0;
  $("agency").textContent = low ? "F NOW! SAVE YOUR FRIEND" : up ? "LIFTING · BOOST GOES UP ↗" : down ? "DIVING · BOOST GOES FORWARD →" : "Q LIFTS · E DIVES · F BOOSTS";
  if (targetProp && elapsed < 36) {
    $("target").style.visibility = "visible";
    const delta = targetProp.body.position.y - torso.body.position.y;
    $("targetName").textContent = `${targetProp.type === "BALLOON" ? "BALLOON" : targetProp.type} ${delta > 5 ? "↗" : delta < -5 ? "↘" : "→"}`;
    $("targetHint").textContent = `${Math.max(0, Math.round(targetProp.x - torso.body.position.x))}m · ${delta > 5 ? "Q to lift" : delta < -5 ? "E to dive" : "Head-first = bonus"}`;
    $("target").classList.toggle("urgent", targetProp.x - torso.body.position.x < 14);
  } else $("target").style.visibility = "hidden";
}
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let frameMs = 16.7, slowTime = 0, renderScale = Math.min(devicePixelRatio, 1.5);
const frameTimes: number[] = [];
const qaEnabled = new URLSearchParams(location.search).has("qa");
const cameraTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3(), rollAxis = new THREE.Vector3(0, 0, 1);
const look = new THREE.Vector3(5, 3, 0),
  clock = new THREE.Clock();
reset();
function tick() {
  requestAnimationFrame(tick);
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  frameMs = THREE.MathUtils.damp(frameMs, Math.min(rawDt, 0.1) * 1000, 2, dt);
  if (state === "fly" && rawDt < 0.1) { frameTimes.push(rawDt * 1000); if (frameTimes.length > 600) frameTimes.shift(); }
  if (frameMs > 29) slowTime += dt; else slowTime = Math.max(0, slowTime - dt);
  if (slowTime > 2 && renderScale > 0.8) {
    renderScale = Math.max(0.8, renderScale - 0.25);
    renderer.setPixelRatio(renderScale);
    slowTime = 0;
  }
  recoil = THREE.MathUtils.damp(recoil, 0, 10, dt);
  cannon.position.x = -recoil;
  if (state === "aim") {
    angle = THREE.MathUtils.clamp(
      angle +
        ((keys.has("KeyA") ? 1 : 0) - (keys.has("KeyD") ? 1 : 0)) * 30 * dt,
      15,
      75,
    );
    power = THREE.MathUtils.clamp(
      power +
        ((keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0)) * 35 * dt,
      35,
      100,
    );
    updateAim();
    const a = (angle * Math.PI) / 180,
      s = power * 0.48 + 10;
    dots.forEach((d, i) => {
      const t = (i + 1) * 0.105;
      d.position.set(
        torso.body.position.x + Math.cos(a) * s * t,
        torso.body.position.y + Math.sin(a) * s * t - 7.5 * t * t,
        0,
      );
    });
  }
  if (state === "fly") {
    // Short hit-stop freezes physics briefly after hard impacts.
    if (hitStop > 0) {
      hitStop = Math.max(0, hitStop - dt);
    } else {
      elapsed += dt;
      const spin = (keys.has("KeyQ") ? 1 : 0) - (keys.has("KeyE") ? 1 : 0);
      torso.body.torque.z += spin * 32;
      boostAngle = THREE.MathUtils.damp(boostAngle, spin, 9, dt);
      const b = torso.body;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        beforeStep[i].copy(p.body.position);
        p.body.force.z = -p.body.position.z * 18 - p.body.velocity.z * 9;
        p.body.force.y += p.body.mass * (spin > 0 ? 10 : spin < 0 ? -10 : 0);
        p.body.force.x += p.body.mass * (spin > 0 ? -4 : spin < 0 ? 7 : 0);
        if (p.body.position.y > 34) p.body.force.y -= (p.body.position.y - 34) * p.body.mass * 4;
        if (p.body.velocity.x > 43) p.body.force.x -= (p.body.velocity.x - 43) * p.body.mass * 5;
        p.body.angularVelocity.z = THREE.MathUtils.clamp(p.body.angularVelocity.z, -12, 12);
      }
      world.step(1 / 60, dt, 3);
      resolveContacts();
      checkProps();
      distance = Math.max(distance, b.position.x - 3);
      maxHeight = Math.max(maxHeight, b.position.y);
      maxSpeed = Math.max(maxSpeed, b.velocity.length());
      if (b.position.y < 1.7 && b.velocity.length() < 7) quiet += dt;
      else quiet = 0;
      if (
        quiet > 0.85 ||
        elapsed > 40 ||
        b.position.y < -12 ||
        b.position.x > 970
      )
        finish();
    }
    const b = torso.body;
    impactCam = Math.max(0, impactCam - dt);
    const zoom = impactCam > 0 ? 13.5 : 18;
    cameraTarget.set(b.position.x + 2.4, Math.max(4.4, b.position.y + 4.1), zoom);
    // Follow promptly through hit-stop too. Freezing only the camera loses the punchline.
    camera.position.lerp(cameraTarget, 1 - Math.exp(-10 * dt));
    lookTarget.set(b.position.x + 2.4, Math.max(1.3, b.position.y + 0.4), 0);
    look.lerp(lookTarget, 1 - Math.exp(-12 * dt));
    sun.position.set(b.position.x - 30, 65, b.position.z + 35);
    sun.target.position.set(b.position.x, 0, 0);
    if (elapsed > chaosMultUntil && chaosMult > 1) {
      chaosMult = 1;
      const hud = $("streakHud");
      if (hud) hud.textContent = "MAKE A MESS";
    }
  }
  for (const chunk of sceneryChunks) chunk.mesh.visible = Math.abs(chunk.x - torso.body.position.x) < 140;
  for (const p of props) {
    if (p.active && p.group.scale.y < 1) p.group.scale.y = THREE.MathUtils.damp(p.group.scale.y, 1, 12, dt);
    if (p.active) p.group.visible = Math.abs(p.x - torso.body.position.x) < 100;
  }
  for (const p of parts) {
    p.mesh.position.copy(p.body.position as unknown as THREE.Vector3);
    p.mesh.quaternion.copy(p.body.quaternion as unknown as THREE.Quaternion);
  }
  // Keep the face toward the audience while retaining physical roll and all joints.
  const q = head.body.quaternion;
  headMesh.quaternion.setFromAxisAngle(rollAxis, 2 * Math.atan2(q.z, q.w));
  if (squashT > 0) {
    squashT = Math.max(0, squashT - dt);
    impactAge += dt;
    const wave = impactAge < 0.09 ? 1 - impactAge / 0.3 : Math.exp(-(impactAge - 0.09) * 14) * Math.cos((impactAge - 0.09) * 25);
    const compression = (1 - squashAmt) * wave;
    const horizontal = squashAxis.x > squashAxis.y;
    headMesh.scale.set(horizontal ? 1 - compression : 1 + compression * 0.45,
      horizontal ? 1 + compression * 0.45 : 1 - compression, 1 + compression * 0.25);
  } else headMesh.scale.set(1, 1, 1);
  // Post-big-impact tremble when slowed
  if (trembleT > 0) {
    trembleT = Math.max(0, trembleT - dt);
    if (torso.body.velocity.length() < 14) {
      const hz = 12;
      const wobble = (Math.sin(elapsed * hz * Math.PI * 2) * 3 * Math.PI) / 180;
      headMesh.rotateZ(wobble * dt * 18);
    }
  }
  fx.update(dt, head.body.position, elapsed);
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const t = floatTexts[i];
    t.life -= dt;
    t.mesh.position.addScaledVector(t.v, dt);
    const mat = t.mesh.material as THREE.SpriteMaterial;
    mat.opacity = Math.max(0, t.life / 0.85);
    if (t.life <= 0) {
      scene.remove(t.mesh);
      mat.dispose();
      floatTexts.splice(i, 1);
    }
  }
  if (faceMood !== "normal" && elapsed > faceMoodUntil) {
    drawFace("normal");
  }
  shake = Math.max(0, shake - dt * 1.5);
  camera.lookAt(look);
  if (shake && !reducedMotion) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;
  }
  $("distance").textContent = String(Math.max(0, Math.floor(distance)));
  $("chaos").textContent = chaos.toLocaleString();
  $("speed").textContent =
    `${Math.round(torso.body.velocity.length() * 3.6)} km/h`;
  $("zone").textContent =
    distance < 240
      ? "01 / THE NEIGHBORHOOD"
      : distance < 650
        ? "02 / DOWNTOWN DETOUR"
        : "03 / THE WEIRD SKY";
  $("toast").style.opacity = performance.now() < toastUntil ? "1" : "0";
  updateFlightUI();
  renderer.render(scene, camera);
  if (qaEnabled) {
    (window as unknown as { __cannon: unknown }).__cannon = {
      state, elapsed, distance, chaos, farts, maxStreak, worstHitLabel, faceMood, hitStop,
      position: { x: torso.body.position.x, y: torso.body.position.y },
      velocity: { x: torso.body.velocity.x, y: torso.body.velocity.y },
      events: eventLog, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
      saves, headbutts, boostsUsed, particles: fx.count, frameMs, renderScale, frameTimes, target: targetProp ? { type: targetProp.type, x: targetProp.x, y: targetProp.body.position.y } : null,
    };
  }
}
tick();
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
