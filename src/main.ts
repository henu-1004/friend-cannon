import * as THREE from "three";
import * as C from "cannon-es";
import "./style.css";

const $ = (id: string) => document.getElementById(id)!;
$("app").innerHTML =
  `<div id="scene"></div><div class="hud"><div class="top"><div><div class="brand">FRIEND<br><span>CANNON.</span></div><div class="edition">HUMAN FLIGHT CLUB / EST. TODAY</div></div><div class="right"><div class="scoreboard"><div class="stat"><label>DISTANCE</label><strong id="distance">0</strong><small>m</small></div><div class="stat chaos"><label>CHAOS SCORE</label><strong id="chaos">0</strong></div></div><button class="sound" id="sound" title="Toggle sound">♫</button></div></div><div class="zone" id="zone">01 / THE NEIGHBORHOOD</div><div class="intro" id="intro"><div class="eyebrow">A VERY BAD GOOD IDEA</div><h1>HAVE A<br>NICE <em>FLIGHT!</em></h1><p>One friend. One cannon.<br>Absolutely no landing plan.</p><div class="tag">↓ Aim high. Make a mess.</div></div><div class="toast" id="toast"></div><div class="badge" id="badge">100%<strong>FRIEND</strong>POWERED</div><div class="bottom"><div><div class="panel" id="launch"><div class="panel-title">READY FOR QUESTIONABLE SCIENCE <span class="dot">●</span></div><label class="slider-row">ANGLE<input id="angle" type="range" min="15" max="75" value="36"><span id="angleValue">36°</span></label><label class="slider-row">POWER<input id="power" type="range" min="35" max="100" value="76"><span id="powerValue">76%</span></label><button class="fire" id="fire">LET’S FLY! <small>SPACE ↗</small></button><div class="face-picker-label">OPTIONAL FACE <span id="face-status" role="status">None · cartoon</span></div><div class="face-picker" id="face-picker" role="group" aria-label="Optional face presets"></div><button class="face" id="face">＋ Upload your own photo (optional)</button><input id="file" type="file" accept="image/*"></div><div class="panel flight" id="flight"><div class="panel-title">EMERGENCY FLIGHT DEPARTMENT <span id="speed">0 km/h</span></div><div class="boosts" id="boosts"></div><p><kbd>F / SHIFT</kbd> Fart boost · <b id="fuel">5 left</b><br><kbd>Q</kbd><kbd>E</kbd> Flail & steer your next boost</p><button class="face" id="reset">↻ Start over [ R ]</button></div></div><div><div class="hint" id="hint">YOUR FRIEND HAS SIGNED THE WAIVER. PROBABLY.</div><div class="controls"><span><kbd>A</kbd><kbd>D</kbd> Aim</span><span><kbd>W</kbd><kbd>S</kbd> Power</span><span><kbd>F</kbd> Boost</span><span><kbd>Q</kbd><kbd>E</kbd> Flail</span><span><kbd>R</kbd> Retry</span></div><div class="touch"><button id="boostTouch">FART 💨</button><button id="flailTouch">FLAIL ↻</button></div><div class="credit">A LITTLE PHYSICS. A LOT OF POOR DECISIONS.</div></div></div></div><div class="end" id="end"><div class="end-card"><div class="eyebrow">FLIGHT REPORT / FRIEND INTACT</div><h2>WHAT A<br>BEAUTIFUL MESS.</h2><p id="verdict"></p><div class="end-stats" id="results"></div><button class="fire" id="retry">ONE MORE FLIGHT <small>R ↻</small></button><p id="best"></p></div></div>`;

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
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor("#cce4df");
$("scene").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x7d9472, 2.6));
const sun = new THREE.DirectionalLight(0xfff4d8, 3.1);
sun.position.set(-30, 65, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
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
    restitution: 0.6,
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
function drawFace() {
  ctx.clearRect(0, 0, 256, 256);
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
drawFace();
const faceTexture = new THREE.CanvasTexture(faceCanvas);
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
    w = 7;
    h = 1;
    d = 7;
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
    w = 5.5;
    h = 2.1;
    d = 3.4;
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
    w = 0.3;
    h = 8;
    d = 9;
    const glass = box(0.18, 8, 9, "#9edbd8", 0, 4, 0, g);
    glass.material = new THREE.MeshStandardMaterial({
      color: "#a9e8e1",
      transparent: true,
      opacity: 0.42,
      metalness: 0.2,
      roughness: 0.1,
    });
    for (const zz of [-4.5, 4.5]) box(0.3, 8, 0.2, "#dee6cc", 0, 4, zz, g);
  }
  if (type === "SIGN") {
    w = 1;
    h = 6;
    d = 7;
    cylinder(0.12, 0.12, 5, "#506d65", 0, 2.5, 0, g);
    box(0.5, 2, 7, "#f5ce67", 0, 5, 0, g);
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
  world.addBody(b);
  const p = { body: b, group: g, type, x, last: -100, hits: 0 };
  props.push(p);
  b.addEventListener("collide", () => hit(p));
  label(
    type === "BOOM" ? "BOOM!" : type,
    x,
    y + h + 1.4,
    z,
    "#48645d",
    type === "TRAMPOLINE" ? 5 : 3.5,
  );
}
const pattern = [
  "TRAMPOLINE",
  "CAR",
  "FAN",
  "SPRING",
  "BOOM",
  "GLASS",
  "SIGN",
  "TRAMPOLINE",
  "BALLOON",
];
for (let i = 0; i < 65; i++) {
  const x = 20 + i * 19;
  const type = pattern[i % pattern.length];
  prop(type, x, type === "BALLOON" ? 12 + (i % 3) * 8 : 0, ((i % 3) - 1) * 1.4);
  if (i > 12 && i % 5 === 0) prop("TRAMPOLINE", x + 5, 18 + (i % 4) * 6, 0);
}
for (let i = 0; i < 15; i++) {
  const x = 690 + i * 38;
  const island = ball(6, "#b6a5bf", x, 18 + (i % 3) * 12, -12);
  island.scale.set(1, 0.3, 0.7);
  ball(1.8, "#f3d17b", x, 22 + (i % 3) * 12, -12);
}

let state: "aim" | "fly" | "end" = "aim",
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
  boostAngle = 0;
const keys = new Set<string>();
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
type Particle = {
  mesh: THREE.Mesh;
  v: THREE.Vector3;
  life: number;
  total: number;
};
const particles: Particle[] = [];
function burst(
  pos: C.Vec3 | THREE.Vector3,
  color: string,
  count = 15,
  force = 7,
) {
  for (let i = 0; i < count; i++) {
    const m = ball(0.12 + Math.random() * 0.3, color, pos.x, pos.y, pos.z);
    m.material = mat(color).clone();
    const life = 0.4 + Math.random() * 0.7;
    particles.push({
      mesh: m,
      v: new THREE.Vector3(
        (Math.random() - 0.5) * force,
        Math.random() * force,
        (Math.random() - 0.5) * force,
      ),
      life,
      total: life,
    });
  }
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
function hit(p: Prop) {
  if (state !== "fly" || elapsed - p.last < 1.1) return;
  p.last = elapsed;
  p.hits++;
  hits++;
  streak++;
  const b = torso.body;
  const type = p.type;
  chaos += Math.round(
    (type === "GLASS" ? 200 : type === "BOOM" ? 350 : 100) *
      (1 + Math.min(streak, 8) * 0.15),
  );
  shake = 0.28;
  burst(
    b.position,
    type === "BOOM" ? "#f5b14f" : type === "GLASS" ? "#b9f4f3" : "#fff3b8",
    type === "BOOM" ? 32 : 14,
  );
  sound(type === "BOOM" ? 90 : 360, 0.18);
  if (type === "GLASS") {
    glassHits++;
    p.group.visible = false;
    p.body.collisionResponse = false;
    impulse(7, 3);
    toast("CRASH! +200");
  } else {
    const lift =
      type === "TRAMPOLINE"
        ? 27
        : type === "SPRING"
          ? 32
          : type === "FAN"
            ? 23
            : type === "BOOM"
              ? 30
              : type === "BALLOON"
                ? 20
                : 18;
    impulse(
      Math.max(5, 27 - b.velocity.x),
      Math.max(5, lift - b.velocity.y),
      -b.position.z * 0.7,
    );
    torso.body.angularVelocity.z += (Math.random() - 0.5) * 8;
    if (type === "CAR") carHits++;
    if (type === "BOOM") {
      explosions++;
      p.group.visible = false;
      p.body.collisionResponse = false;
    }
    if (["FAN", "BALLOON", "SIGN"].includes(type)) special++;
    toast(
      `${type === "CAR" ? "BOING!" : type === "BOOM" ? "BAD PARKING!" : type === "FAN" ? "FAN-TASTIC!" : type === "BALLOON" ? "POP & GO!" : "NICE BOUNCE!"} ×${streak}`,
    );
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
torso.body.addEventListener("collide", (event: { body: C.Body }) => {
  if (
    state === "fly" &&
    event.body === ground &&
    elapsed - lastGroundHit > 0.35 &&
    torso.body.velocity.length() > 8
  ) {
    lastGroundHit = elapsed;
    shake = Math.max(shake, 0.18);
    burst(torso.body.position, "#e6dfbb", 8, 4);
    sound(100, 0.1);
  }
});
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
  $("hint").textContent = "MAKE EVERY LANDING A LAUNCH.";
  dots.forEach((d) => (d.visible = false));
  const r = (angle * Math.PI) / 180,
    s = power * 0.48 + 10;
  for (const p of parts) {
    p.body.wakeUp();
    p.body.velocity.set(Math.cos(r) * s, Math.sin(r) * s, 0);
    p.body.angularVelocity.set(0, 0, -2);
  }
  recoil = 0.7;
  shake = 0.55;
  burst(torso.body.position, "#fff2d6", 35, 12);
  sound(120, 0.35);
  toast("BON VOYAGE, BUDDY!");
}
function boost() {
  if (state !== "fly" || !farts || elapsed - lastBoost < 0.4) return;
  lastBoost = elapsed;
  farts--;
  const steer = THREE.MathUtils.clamp(boostAngle, -0.8, 0.8);
  impulse(
    12 * Math.cos(steer),
    12 + 10 * Math.sin(steer),
    -torso.body.position.z * 0.25,
  );
  torso.body.angularVelocity.z -= 2;
  chaos += 75;
  shake = 0.13;
  burst(
    new C.Vec3(
      torso.body.position.x - 0.5,
      torso.body.position.y - 0.6,
      torso.body.position.z,
    ),
    "#c9df79",
    22,
    7,
  );
  sound(65, 0.28);
  toast(["PFFFFT. +75", "ORGANIC JET FUEL!", "EXCUSE ME!"][farts % 3]);
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
  keys.clear();
  for (const p of props) {
    p.last = -100;
    p.hits = 0;
    p.group.visible = true;
    p.body.collisionResponse = true;
  }
  for (const p of particles) {
    scene.remove(p.mesh);
    p.mesh.geometry.dispose();
    (p.mesh.material as THREE.Material).dispose();
  }
  particles.length = 0;
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
$("flailTouch").onclick = () => {
  if (state === "fly") {
    torso.body.angularVelocity.z -= 9;
    boostAngle = 0.65;
  }
};
$("sound").onclick = () => {
  muted = !muted;
  $("sound").textContent = muted ? "♪̸" : "♫";
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
  ctx.clearRect(0, 0, 256, 256);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(128, 128, 108, 122, 0, 0, Math.PI * 2);
  ctx.clip();
  const size = Math.min(source.width, source.height);
  ctx.drawImage(
    source,
    (source.width - size) / 2,
    (source.height - size) / 2,
    size,
    size,
    0,
    0,
    256,
    256,
  );
  ctx.restore();
  faceTexture.needsUpdate = true;
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
        markFace(choice, "None · cartoon");
        drawFace();
        faceTexture.needsUpdate = true;
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
const look = new THREE.Vector3(5, 3, 0),
  clock = new THREE.Clock();
reset();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.04);
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
    elapsed += dt;
    const spin = (keys.has("KeyQ") ? 1 : 0) - (keys.has("KeyE") ? 1 : 0);
    torso.body.torque.z += spin * 75;
    boostAngle = THREE.MathUtils.clamp(boostAngle + spin * dt * 2, -0.8, 0.8);
    if (spin) {
      torso.body.force.x += 12;
      torso.body.force.y += 9;
    }
    const b = torso.body;
    for (const p of parts) {
      p.body.force.z = -p.body.position.z * 14 - p.body.velocity.z * 5;
    }
    world.step(1 / 60, dt, 3);
    // Wide fan columns are opportunities even when the friend misses the fan housing.
    for (const p of props)
      if (
        p.type === "FAN" &&
        Math.abs(b.position.x - p.x) < 3.7 &&
        b.position.y < 20 &&
        b.position.y > 1 &&
        elapsed - p.last > 1.2
      )
        hit(p);
    distance = Math.max(distance, b.position.x - 3);
    maxHeight = Math.max(maxHeight, b.position.y);
    maxSpeed = Math.max(maxSpeed, b.velocity.length());
    if (b.position.y < 1.7 && b.velocity.length() < 7) quiet += dt;
    else quiet = 0;
    if (
      quiet > 1.5 ||
      elapsed > 65 ||
      b.position.y < -12 ||
      b.position.x > 1250
    )
      finish();
    const target = new THREE.Vector3(
      b.position.x + 7,
      b.position.y * 0.78 + 7,
      23 + Math.min(b.velocity.length() * 0.17, 14),
    );
    camera.position.lerp(target, 1 - Math.exp(-3 * dt));
    look.lerp(
      new THREE.Vector3(b.position.x + 5, Math.max(2, b.position.y - 1.8), 0),
      1 - Math.exp(-5 * dt),
    );
    sun.position.set(b.position.x - 30, 65, b.position.z + 35);
    sun.target.position.set(b.position.x, 0, 0);
  }
  for (const p of parts) {
    p.mesh.position.copy(p.body.position as unknown as THREE.Vector3);
    p.mesh.quaternion.copy(p.body.quaternion as unknown as THREE.Quaternion);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.v, dt);
    p.v.y -= 3 * dt;
    p.mesh.scale.setScalar(1 + (p.total - p.life) * 2);
    const m = p.mesh.material as THREE.MeshStandardMaterial;
    m.transparent = true;
    m.opacity = Math.max(0, p.life / p.total);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      m.dispose();
      particles.splice(i, 1);
    }
  }
  shake = Math.max(0, shake - dt * 1.5);
  camera.lookAt(look);
  if (shake) {
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
  renderer.render(scene, camera);
}
tick();
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
