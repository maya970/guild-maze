import { WAVE_PATTERNS, ELEMENTS } from './data.js';

export const CELL = 2.15;
export const HALL = 3.45;
export const STORY = 3.8;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function inGrid(grid, x, y) {
  return y >= 0 && x >= 0 && grid[y] && x < grid[y].length;
}

export function isFloor(grid, x, y) {
  return inGrid(grid, x, y) && grid[y][x] === 1;
}

function carve(grid, x, y, w, h) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (inGrid(grid, i, j)) grid[j][i] = 1;
    }
  }
}

function wideMaze(cw, ch, rng) {
  const stride = 4;
  const W = cw * stride + 1;
  const H = ch * stride + 1;
  const grid = Array.from({ length: H }, () => Array(W).fill(0));
  const seen = Array.from({ length: ch }, () => Array(cw).fill(false));
  const order = [];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  function openRoom(cx, cy) {
    const x = 1 + cx * stride;
    const y = 1 + cy * stride;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) grid[y + j][x + i] = 1;
    return { x: x + 1, y: y + 1 };
  }

  function link(cx, cy, dx, dy) {
    const x = 1 + cx * stride;
    const y = 1 + cy * stride;
    if (dx === 1) for (let j = 0; j < 3; j++) grid[y + j][x + 3] = 1;
    if (dx === -1) for (let j = 0; j < 3; j++) grid[y + j][x - 1] = 1;
    if (dy === 1) for (let i = 0; i < 3; i++) grid[y + 3][x + i] = 1;
    if (dy === -1) for (let i = 0; i < 3; i++) grid[y - 1][x + i] = 1;
  }

  function visit(cx, cy) {
    seen[cy][cx] = true;
    order.push(openRoom(cx, cy));
    const shuffled = dirs.map((d) => ({ d, k: rng() })).sort((a, b) => a.k - b.k);
    for (const { d } of shuffled) {
      const [dx, dy] = d;
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cw || ny >= ch || seen[ny][nx]) continue;
      link(cx, cy, dx, dy);
      visit(nx, ny);
    }
  }
  visit(0, 0);
  return { grid, rooms: order, w: W, h: H };
}

function floorCells(grid) {
  const cells = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) if (grid[y][x] === 1) cells.push({ x, y });
  }
  return cells;
}

export function buildTown() {
  const W = 45;
  const H = 45;
  const grid = Array.from({ length: H }, () => Array(W).fill(0));
  carve(grid, 2, 20, 41, 5);
  carve(grid, 20, 2, 5, 41);
  carve(grid, 3, 4, 12, 9);
  carve(grid, 30, 4, 12, 9);
  carve(grid, 3, 32, 12, 9);
  carve(grid, 30, 32, 12, 9);
  carve(grid, 7, 13, 5, 8);
  carve(grid, 33, 13, 5, 8);
  carve(grid, 7, 25, 5, 8);
  carve(grid, 33, 25, 5, 8);
  const pois = [
    { id: 'board', name: '排行榜', kind: 'leaderboard', x: 8, y: 8, z: 0 },
    { id: 'auction', name: '拍卖行', kind: 'auction', x: 36, y: 8, z: 0 },
    { id: 'shop', name: '商店', kind: 'shop', x: 8, y: 36, z: 0 },
    { id: 'arena', name: '决斗场', kind: 'pk', x: 36, y: 36, z: 0 },
    { id: 'gate', name: '守门人', kind: 'warden', x: 22, y: 8, z: 0 },
    { id: 'forge', name: '熔炉', kind: 'forge', x: 22, y: 36, z: 0 },
  ];
  return {
    kind: 'town',
    levels: [grid],
    stairs: [],
    pois,
    spawn: { x: 22, y: 22, z: 0 },
    palette: 'town',
    monsters: [],
  };
}

function meanPower(dungeon, floor, z) {
  return 6 + dungeon.tier * 5 + floor * 3 + z * 2;
}

function rolePower(mean, role, rng) {
  if (role === 'W') return Math.max(4, Math.round(mean * 0.72));
  if (role === 'S') return Math.round(mean * 1.38);
  return Math.round(mean * (0.9 + rng() * 0.2));
}

export function buildDungeonFloor(dungeon, floor, seed) {
  const rng = mulberry32(seed);
  const heights = Math.max(3, dungeon.heights || 3);
  const levels = [];
  const stairs = [];
  for (let z = 0; z < heights; z++) {
    levels.push(wideMaze(2 + dungeon.tier, 2 + (z % 2), rng));
  }
  for (let z = 0; z < heights - 1; z++) {
    const rooms = levels[z].rooms.filter((_, i) => i > 0);
    const room = rooms[Math.floor(rng() * rooms.length)] || levels[z].rooms[0];
    carve(levels[z].grid, room.x - 1, room.y - 1, 3, 3);
    carve(levels[z + 1].grid, room.x - 1, room.y - 1, 3, 3);
    stairs.push({ x: room.x, y: room.y, z });
  }
  const spawn = { ...levels[0].rooms[0], z: 0 };
  const used = new Set([`${spawn.x},${spawn.y},0`]);
  const monsters = [];
  for (let z = 0; z < heights; z++) {
    const pattern = WAVE_PATTERNS[z % WAVE_PATTERNS.length];
    const cells = floorCells(levels[z].grid).filter((c) => !used.has(`${c.x},${c.y},${z}`));
    pattern.forEach((role, i) => {
      if (!cells.length) return;
      const pick = cells.splice(Math.floor(rng() * cells.length), 1)[0];
      used.add(`${pick.x},${pick.y},${z}`);
      const mean = meanPower(dungeon, floor, z);
      const power = rolePower(mean, role, rng);
      const boss = z === heights - 1 && role === 'S' && i === pattern.lastIndexOf('S');
      const rolled = ELEMENTS[(dungeon.tier + floor + z + i) % ELEMENTS.length].id;
      const element = rng() < 0.55 && dungeon.element ? dungeon.element : rolled;
      const hp = Math.round(power * (boss ? 3.1 : 2.1));
      monsters.push({
        id: `${dungeon.id}-f${floor}-z${z}-${i}`,
        x: pick.x,
        y: pick.y,
        z,
        role,
        boss,
        element,
        name: boss ? '守层者' : role === 'S' ? '强敌' : role === 'W' ? '弱敌' : '游敌',
        hp,
        maxHp: hp,
        atk: Math.max(2, Math.round(power * 0.34)),
        def: Math.floor(power / 9),
        gold: Math.round(power * (boss ? 2.4 : 0.7)),
        xp: Math.round(power * (boss ? 2 : 0.8)),
        tier: dungeon.tier,
        dead: false,
      });
    });
  }
  const top = levels[heights - 1].rooms[levels[heights - 1].rooms.length - 1];
  return {
    kind: 'dungeon',
    dungeon,
    floor,
    levels: levels.map((l) => l.grid),
    stairs,
    exit: { x: top.x, y: top.y, z: heights - 1 },
    pois: [],
    spawn,
    palette: 'dungeon',
    monsters,
    heights,
  };
}

function stairAt(stairs, x, y, z, dir) {
  if (dir > 0) return stairs.some((s) => s.x === x && s.y === y && s.z === z);
  return stairs.some((s) => s.x === x && s.y === y && s.z === z - 1);
}

export function bfs3(map, sx, sy, sz, gx, gy, gz) {
  const key = (x, y, z) => `${x},${y},${z}`;
  const q = [[sx, sy, sz]];
  const prev = new Map([[key(sx, sy, sz), null]]);
  const dirs = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ];
  while (q.length) {
    const [x, y, z] = q.shift();
    if (x === gx && y === gy && z === gz) break;
    const next = dirs
      .map(([dx, dy]) => [x + dx, y + dy, z])
      .filter(([nx, ny, nz]) => isFloor(map.levels[nz], nx, ny));
    if (stairAt(map.stairs, x, y, z, 1) && map.levels[z + 1] && isFloor(map.levels[z + 1], x, y)) next.push([x, y, z + 1]);
    if (stairAt(map.stairs, x, y, z, -1) && map.levels[z - 1] && isFloor(map.levels[z - 1], x, y)) next.push([x, y, z - 1]);
    for (const [nx, ny, nz] of next) {
      const k = key(nx, ny, nz);
      if (prev.has(k)) continue;
      prev.set(k, [x, y, z]);
      q.push([nx, ny, nz]);
    }
  }
  if (!prev.has(key(gx, gy, gz))) return null;
  const path = [];
  let cur = [gx, gy, gz];
  while (cur) {
    path.push({ x: cur[0], y: cur[1], z: cur[2] });
    cur = prev.get(key(cur[0], cur[1], cur[2]));
  }
  path.reverse();
  return path;
}

export function standBeside(map, x, y, z = 0) {
  const grid = map.levels[z];
  for (const [dx, dy] of [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]) {
    if (isFloor(grid, x + dx, y + dy)) return { x: x + dx, y: y + dy, z, face: { x, y, z } };
  }
  return { x, y, z, face: { x, y, z } };
}
