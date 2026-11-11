import * as THREE from 'three';
import { CELL, HALL, STORY } from './gen.js';
import { ELEMENT_COLOR } from './data.js';
import { portraitCanvas } from './icons.js';
import { metalCanvas, woodCanvas } from './materials.js';

function stoneTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const wall = kind.startsWith('wall');
  const cold = kind.endsWith('d');
  g.fillStyle = cold ? (wall ? '#3c434a' : '#4e555c') : wall ? '#6a5c4c' : '#6d6458';
  g.fillRect(0, 0, 256, 256);
  if (wall) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 3; x++) {
        const ox = (y % 2) * 36 + x * 84;
        g.fillStyle = cold ? `hsl(206, 8%, ${30 + ((x + y) % 3) * 4}%)` : `hsl(28, 16%, ${30 + ((x + y) % 3) * 5}%)`;
        g.fillRect(ox + 4, y * 64 + 6, 76, 50);
      }
    }
  } else {
    g.strokeStyle = 'rgba(20,16,12,0.65)';
    g.lineWidth = 8;
    g.strokeRect(6, 6, 244, 244);
    g.beginPath();
    g.moveTo(128, 8);
    g.lineTo(128, 248);
    g.moveTo(8, 128);
    g.lineTo(248, 128);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function yawToward(from, to) {
  return Math.atan2(-(to.x - from.x), -(to.y - from.y));
}

export class WorldView {
  constructor(parent) {
    this.parent = parent;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    parent.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(64, 1, 0.08, 90);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.scene.add(new THREE.HemisphereLight(0xfff1d6, 0x4a3b2e, 1.05));
    this.playerLight = new THREE.PointLight(0xfff0d0, 3.2, 24, 1.15);
    this.camera.add(this.playerLight);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.monsters = new Map();
    this.weapon = new THREE.Group();
    this.camera.add(this.weapon);
    this.form = 'sword';
    this.setWeapon({ form: 'sword', color: '#d9dde2', metal: 'iron' });
    this.textures = {
      townFloor: stoneTexture('floor'),
      townWall: stoneTexture('wall'),
      dunFloor: stoneTexture('floord'),
      dunWall: stoneTexture('walld'),
    };
    this.fire = this.makeFire();
    this.scene.add(this.fire);
    this.px = 0;
    this.py = 0;
    this.pz = 0;
    this.yaw = 0;
    this.shake = 0;
    this.swing = null;
    this.gz = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = this.parent.clientWidth || 1;
    const h = this.parent.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  makeFire() {
    const group = new THREE.Group();
    group.visible = false;
    const logMat = new THREE.MeshStandardMaterial({ color: 0x5a341c, roughness: 0.9 });
    const logA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 6), logMat);
    const logB = logA.clone();
    logA.rotation.z = Math.PI / 2;
    logA.rotation.y = 0.4;
    logB.rotation.z = Math.PI / 2;
    logB.rotation.y = -0.5;
    logA.position.y = 0.12;
    logB.position.y = 0.18;
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.7, 8),
      new THREE.MeshBasicMaterial({ color: 0xff7a2a }),
    );
    flame.position.y = 0.55;
    const inner = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.45, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe08a }),
    );
    inner.position.y = 0.48;
    const light = new THREE.PointLight(0xff7a2a, 2.4, 8, 2);
    light.position.y = 0.6;
    group.add(logA, logB, flame, inner, light);
    group.userData.flame = flame;
    group.userData.inner = inner;
    group.userData.light = light;
    return group;
  }

  surfaced(canvas, opts = {}) {
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({
      map,
      color: opts.color || '#ffffff',
      metalness: opts.metalness ?? 0.55,
      roughness: opts.roughness ?? 0.38,
      emissive: opts.emissive || '#000000',
      emissiveIntensity: opts.emissiveIntensity || 0,
    });
  }

  setWeapon(def) {
    const form = def?.form || 'sword';
    const tint = def?.color || '#f4f4f6';
    while (this.weapon.children.length) {
      const child = this.weapon.children.pop();
      child.geometry?.dispose();
      child.material?.dispose();
    }
    const metal = this.surfaced(metalCanvas(def?.metal || 'iron', tint), {
      metalness: form === 'staff' ? 0.12 : def?.metal === 'rust' ? 0.35 : 0.72,
      roughness: def?.metal === 'rust' || def?.metal === 'bone' ? 0.68 : 0.28,
      emissive: def?.element ? tint : '#000000',
      emissiveIntensity: def?.element ? 0.28 : 0,
    });
    const wood = this.surfaced(woodCanvas(), { metalness: 0.05, roughness: 0.86, color: '#c4a07a' });
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), wood);
    this.weapon.add(grip);
    if (form === 'spear') {
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.15, 0.045), wood);
      shaft.position.set(0, 0.55, -0.15);
      shaft.rotation.x = 0.5;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), metal);
      tip.position.set(0, 1.18, -0.46);
      tip.rotation.x = 0.5;
      this.weapon.add(shaft, tip);
    } else if (form === 'axe') {
      const haft = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.72, 0.055), wood);
      haft.position.y = 0.35;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.07), metal);
      head.position.set(0.14, 0.74, 0);
      this.weapon.add(haft, head);
    } else if (form === 'staff') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.05, 8), wood);
      shaft.position.y = 0.45;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), metal);
      orb.position.y = 1.05;
      this.weapon.add(shaft, orb);
    } else {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 0.02), metal);
      blade.position.y = 0.52;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.05), metal);
      guard.position.y = 0.12;
      this.weapon.add(blade, guard);
    }
    this.weapon.position.set(0.42, -0.36, -0.55);
  }

  clearRoot() {
    while (this.root.children.length) {
      const obj = this.root.children.pop();
      obj.traverse?.((n) => {
        if (n.geometry) n.geometry.dispose();
      });
    }
    this.monsters.clear();
  }

  touchesFloor(grid, x, y) {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx] === 1);
  }

  setWorld(map, actors) {
    this.clearRoot();
    const dungeon = map.palette === 'dungeon';
    this.scene.fog = new THREE.Fog(dungeon ? 0x243038 : 0x3a2e24, 14, 40);
    this.scene.background = new THREE.Color(dungeon ? 0x243038 : 0x3a2e24);
    const floorTex = dungeon ? this.textures.dunFloor : this.textures.townFloor;
    const wallTex = dungeon ? this.textures.dunWall : this.textures.townWall;
    map.levels.forEach((grid, z) => {
      const base = z * STORY;
      const floors = [];
      const walls = [];
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          if (grid[y][x] === 1) floors.push([x, y]);
          else if (this.touchesFloor(grid, x, y)) walls.push([x, y]);
        }
      }
      this.addSlabs(floors, floorTex, 0.16, 0.94, dungeon ? 0x9aa3ab : 0xc8b49a, base, 0);
      this.addSlabs(walls, wallTex, HALL, 1, dungeon ? 0x8d98a2 : 0xb7a08a, base + HALL / 2, 0);
    });
    for (const stair of map.stairs || []) this.addStair(stair);
    for (const poi of map.pois || []) this.addMarker(poi);
    if (map.exit && actors?.exitOpen) this.addExit(map.exit);
    for (const m of actors?.monsters || []) if (!m.dead) this.addMonster(m);
    if (map.palette === 'town') this.addBoard(map.pois.find((p) => p.kind === 'leaderboard'));
  }

  addSlabs(cells, tex, height, span, color, lift) {
    if (!cells.length) return;
    const geo = new THREE.BoxGeometry(CELL * span, height, CELL * span);
    const mat = new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.94 });
    const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
    const dummy = new THREE.Object3D();
    cells.forEach(([x, y], i) => {
      dummy.position.set((x + 0.5) * CELL, lift, (y + 0.5) * CELL);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    this.root.add(mesh);
  }

  addStair(stair) {
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(CELL * 0.8, 0.18, CELL * 0.22),
        new THREE.MeshStandardMaterial({ color: 0xd7c07a, roughness: 0.7 }),
      );
      step.position.set((stair.x + 0.5) * CELL, stair.z * STORY + 0.2 + i * (STORY / 4), (stair.y + 0.15 + i * 0.18) * CELL);
      this.root.add(step);
    }
  }

  addExit(cell) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xe6c27a, emissive: 0x4a3a16 }),
    );
    mesh.position.set((cell.x + 0.5) * CELL, cell.z * STORY + 0.25, (cell.y + 0.5) * CELL);
    this.root.add(mesh);
  }

  addPortrait(group, id, y, w, h) {
    const tex = new THREE.CanvasTexture(portraitCanvas(id));
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.position.y = y;
    sprite.scale.set(w, h, 1);
    group.add(sprite);
  }

  addMarker(poi) {
    const group = new THREE.Group();
    group.position.set((poi.x + 0.5) * CELL, (poi.z || 0) * STORY, (poi.y + 0.5) * CELL);
    const colors = { shop: 0xc4864a, auction: 0x8e6bb5, leaderboard: 0xd7c07a, pk: 0xc4473a, forge: 0xe07a3d, warden: 0x6ea4b8 };
    const color = colors[poi.kind] || 0xdddddd;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    if (poi.kind === 'warden') {
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.6, 0.28), mat);
      const right = left.clone();
      left.position.set(-1.05, 1.3, 0);
      right.position.set(1.05, 1.3, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.28), mat);
      lintel.position.y = 2.65;
      group.add(left, right, lintel);
    } else {
      const stall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.7), mat);
      stall.position.set(0, 0.45, 0.15);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 1.1), mat);
      roof.position.set(0, 2.15, 0);
      group.add(stall, roof);
    }
    this.addPortrait(group, poi.kind, 1.15, 1.55, 1.95);
    group.add(this.makeLabel(poi.name));
    this.root.add(group);
  }

  makeLabel(text) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(16,12,8,0.75)';
    g.fillRect(8, 10, 240, 44);
    g.fillStyle = '#f4e7c8';
    g.font = '28px "Microsoft YaHei", sans-serif';
    g.textAlign = 'center';
    g.fillText(text, 128, 40);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
    sprite.position.y = 2.6;
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
  }

  addBoard(poi) {
    if (!poi) return;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    this.boardCanvas = c;
    this.boardTex = new THREE.CanvasTexture(c);
    this.boardTex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: this.boardTex }));
    mesh.position.set((poi.x + 0.5) * CELL, 1.9, (poi.y + 0.5) * CELL + 1.2);
    this.root.add(mesh);
  }

  paintBoard(lines) {
    if (!this.boardCanvas) return;
    const g = this.boardCanvas.getContext('2d');
    g.fillStyle = '#1b1712';
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = '#e6c27a';
    g.lineWidth = 8;
    g.strokeRect(16, 16, 480, 480);
    g.fillStyle = '#f0e2c4';
    g.font = '36px sans-serif';
    g.textAlign = 'center';
    g.fillText('排行', 256, 70);
    g.font = '26px sans-serif';
    g.textAlign = 'left';
    lines.slice(0, 8).forEach((line, i) => g.fillText(line, 40, 130 + i * 42));
    this.boardTex.needsUpdate = true;
  }

  addMonster(m) {
    const group = new THREE.Group();
    const color = new THREE.Color(ELEMENT_COLOR[m.element] || '#88aa77');
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(m.boss ? 0.48 : 0.32, m.boss ? 0.9 : 0.6, 4, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
    );
    body.position.y = m.boss ? 1.25 : 1;
    group.add(body);
    this.addPortrait(group, `foe-${m.element}${m.boss ? '-boss' : ''}`, m.boss ? 1.45 : 1.2, m.boss ? 1.35 : 1.05, m.boss ? 1.7 : 1.35);
    group.position.set((m.x + 0.5) * CELL, m.z * STORY, (m.y + 0.5) * CELL);
    this.root.add(group);
    this.monsters.set(m.id, group);
  }

  setPose(px, py, pz, yaw) {
    this.px = px;
    this.py = py;
    this.pz = pz;
    this.yaw = yaw;
  }

  showFire(on) {
    this.fire.visible = on;
  }

  swing() {
    return new Promise((resolve) => {
      this.swing = { start: performance.now(), dur: this.form === 'spear' ? 320 : 460, hit: false, resolve };
    });
  }

  lunge(id) {
    const group = this.monsters.get(id);
    if (!group) return Promise.resolve();
    const from = group.position.clone();
    return new Promise((resolve) => {
      this.lungeState = { id, start: performance.now(), dur: 260, from, resolve };
    });
  }

  killMonster(id) {
    const group = this.monsters.get(id);
    if (!group) return;
    group.rotation.z = 1.2;
    group.position.y -= 0.6;
  }

  pickFloor(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.ray ||= new THREE.Raycaster();
    this.ray.setFromCamera(ndc, this.camera);
    const y = this.gz * STORY + 0.2;
    const hit = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), hit)) return null;
    return { x: Math.floor(hit.x / CELL), y: Math.floor(hit.z / CELL), z: this.gz };
  }

  update(now) {
    const t = now * 0.001;
    const bob = Math.sin(t * 1.7) * 0.012;
    if (this.swing) {
      const k = Math.min(1, (now - this.swing.start) / this.swing.dur);
      const a = Math.sin(k * Math.PI);
      if (this.form === 'spear') {
        this.weapon.position.z = -0.55 - a * 0.45;
        this.weapon.rotation.set(0.2, 0, 0);
      } else if (this.form === 'axe') {
        this.weapon.rotation.set(-1.4 + a * 2.2, 0, 0.2);
      } else if (this.form === 'staff') {
        this.weapon.rotation.set(-0.4, a * 1.4, 0.2 - a);
      } else {
        this.weapon.rotation.set(-1.05 + a * 1.85, -0.35 + k * 0.8, 0.55 - k * 2.1);
        this.weapon.position.x = 0.42 - k * 0.45;
      }
      if (!this.swing.hit && k > 0.42) {
        this.swing.hit = true;
        this.shake = 1;
      }
      if (k >= 1) {
        this.swing.resolve();
        this.swing = null;
        this.weapon.position.set(0.42, -0.36, -0.55);
        this.weapon.rotation.set(0, 0, 0);
      }
    } else {
      this.weapon.rotation.set(-0.25 + bob, -0.2, 0.12);
      this.weapon.position.set(0.42, -0.36, -0.55);
    }
    if (this.lungeState) {
      const k = Math.min(1, (now - this.lungeState.start) / this.lungeState.dur);
      const group = this.monsters.get(this.lungeState.id);
      const a = Math.sin(k * Math.PI);
      if (group) {
        group.position.x = this.lungeState.from.x + Math.sin(this.yaw) * -0.25 * a;
        group.position.z = this.lungeState.from.z + -Math.cos(this.yaw) * -0.25 * a;
      }
      if (k >= 1) {
        if (group) group.position.copy(this.lungeState.from);
        this.lungeState.resolve();
        this.lungeState = null;
      }
    }
    const shake = this.shake > 0 ? Math.sin(this.shake * 14) * 0.03 * this.shake : 0;
    this.shake = Math.max(0, this.shake - 0.08);
    this.camera.position.set(this.px, this.py + 1.58 + bob + shake, this.pz);
    this.camera.rotation.set(shake * 0.35, this.yaw, 0);
    if (this.fire.visible) {
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      this.fire.position.set(this.px + fx * 1.35, this.py, this.pz + fz * 1.35);
      const flick = 0.85 + Math.sin(t * 17) * 0.15;
      this.fire.userData.flame.scale.y = flick;
      this.fire.userData.light.intensity = 1.6 + Math.sin(t * 23) * 0.6;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
