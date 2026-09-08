import * as THREE from 'three';

type Point = { x: number; y: number; z: number };
export type EffectFrame = { bubbles: Float32Array; stars: Float32Array };
const CAPACITY = 80;

/** Fixed-capacity confetti and puff batch. No geometry/material allocation on a hit. */
export class SlapstickFX {
  private pool = Array.from({ length: CAPACITY }, () => ({
    p: new THREE.Vector3(), v: new THREE.Vector3(), color: new THREE.Color(), life: 0, total: 1, size: 1,
  }));
  private cursor = 0;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private batch: THREE.InstancedMesh;
  private stars: THREE.Mesh[] = [];
  private starLife = 0;
  private starCount = 0;
  private bubbleData = new Float32Array(CAPACITY * 7);
  private bubbleCount = 0;
  private starData = new Float32Array(5 * 4);
  constructor(scene: THREE.Scene) {
    this.batch = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.78, depthWrite: false, toneMapped: false,
    }), CAPACITY);
    this.batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.batch.frustumCulled = false;
    this.batch.count = 0;
    scene.add(this.batch);
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? 0.13 : 0.29;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    const material = new THREE.MeshBasicMaterial({ color: '#ffdc62', toneMapped: false });
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Mesh(geo, material);
      star.visible = false;
      scene.add(star);
      this.stars.push(star);
    }
  }
  burst(pos: Point, color: string, count = 10, force = 6, size = 0.18) {
    for (let i = 0; i < count; i++) {
      const p = this.pool[this.cursor++ % CAPACITY];
      p.p.set(pos.x, pos.y, pos.z);
      p.v.set((Math.random() - 0.5) * force, Math.random() * force, (Math.random() - 0.5) * force * 0.5);
      p.color.set(color);
      p.life = p.total = 0.4 + Math.random() * 0.45;
      p.size = size * (0.6 + Math.random() * 0.8);
    }
  }
  puff(pos: Point, bx: number, by: number) {
    for (let i = 0; i < 7; i++) {
      const p = this.pool[this.cursor++ % CAPACITY];
      p.p.set(pos.x, pos.y, pos.z);
      p.v.set(-bx * 0.55 + (Math.random() - 0.5) * 3, -by * 0.35 + i * 0.4, (Math.random() - 0.5) * 2);
      p.color.set(i % 2 ? '#c9df88' : '#adcb72');
      p.life = p.total = 0.65 + Math.random() * 0.25;
      p.size = 0.35 + Math.random() * 0.25;
    }
  }
  halo(count: number, life: number) { this.starCount = count; this.starLife = life; }
  update(dt: number, head: Point, time: number) {
    this.bubbleCount = 0;
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) continue;
      p.p.addScaledVector(p.v, dt);
      p.v.y -= dt * 5;
      const size = p.size * (1 + (p.total - p.life) * 1.5) * Math.min(1, p.life * 6);
      const j = this.bubbleCount++ * 7;
      this.bubbleData[j] = p.p.x; this.bubbleData[j + 1] = p.p.y; this.bubbleData[j + 2] = p.p.z;
      this.bubbleData[j + 3] = size;
      this.bubbleData[j + 4] = p.color.r; this.bubbleData[j + 5] = p.color.g; this.bubbleData[j + 6] = p.color.b;
    }
    this.starLife = Math.max(0, this.starLife - dt);
    for (let i = 0; i < 5; i++) {
      const a = time * 6 + i * Math.PI * 2 / this.starCount, j = i * 4;
      this.starData[j] = head.x + Math.cos(a) * 1.2;
      this.starData[j + 1] = head.y + 1 + Math.sin(a * 2) * 0.2;
      this.starData[j + 2] = head.z + Math.sin(a) * 0.7 + 0.2;
      this.starData[j + 3] = i < this.starCount ? Math.min(1, this.starLife * 5) : 0;
    }
    this.draw(this.bubbleData.subarray(0, this.bubbleCount * 7), this.starData);
  }
  private draw(bubbles: Float32Array, stars: Float32Array) {
    this.batch.count = bubbles.length / 7;
    for (let i = 0; i < this.batch.count; i++) {
      const j = i * 7;
      this.dummy.position.set(bubbles[j], bubbles[j + 1], bubbles[j + 2]);
      this.dummy.scale.setScalar(bubbles[j + 3]);
      this.dummy.updateMatrix();
      this.batch.setMatrixAt(i, this.dummy.matrix);
      this.color.setRGB(bubbles[j + 4], bubbles[j + 5], bubbles[j + 6]);
      this.batch.setColorAt(i, this.color);
    }
    this.batch.instanceMatrix.needsUpdate = true;
    if (this.batch.instanceColor) this.batch.instanceColor.needsUpdate = true;
    for (let i = 0; i < 5; i++) {
      const j = i * 4, m = this.stars[i];
      m.visible = stars[j + 3] > 0;
      m.position.set(stars[j], stars[j + 1], stars[j + 2]);
      m.scale.setScalar(stars[j + 3]);
      m.rotation.z = stars[j] * 0.2;
    }
  }
  capture(): EffectFrame {
    return { bubbles: this.bubbleData.slice(0, this.bubbleCount * 7), stars: this.starData.slice() };
  }
  restore(frame: EffectFrame) { this.draw(frame.bubbles, frame.stars); }
  clear() {
    for (const p of this.pool) p.life = 0;
    this.batch.count = this.bubbleCount = 0;
    this.starLife = this.starCount = 0;
    this.starData.fill(0);
    this.stars.forEach(s => s.visible = false);
  }
  get count() { return this.bubbleCount; }
}
