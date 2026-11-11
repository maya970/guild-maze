export const COLS = 8;
export const ROWS = 6;

export const ELEMENTS = [
  { id: 'wind', name: '风' },
  { id: 'fire', name: '火' },
  { id: 'earth', name: '土' },
  { id: 'thunder', name: '雷' },
  { id: 'water', name: '水' },
];

export const ELEMENT_COLOR = {
  wind: '#b7d9a8',
  fire: '#e25b3a',
  earth: '#c4a15a',
  thunder: '#8eb0e8',
  water: '#4aa4c9',
};

/** 克：水克火，火克风，风克雷，雷克土，土克水 */
export const BEATS = { water: 'fire', fire: 'wind', wind: 'thunder', thunder: 'earth', earth: 'water' };
/** 生：水生风，风生火，火生土，土生雷，雷生水 */
export const FEEDS = { water: 'wind', wind: 'fire', fire: 'earth', earth: 'thunder', thunder: 'water' };

export const WAVE_PATTERNS = [
  ['W', 'W', 'W', 'S'],
  ['R', 'R', 'S', 'S'],
  ['W', 'R', 'S', 'R'],
];

export const DUNGEONS = [
  { id: 'drain', name: '灰渠', min: 1, floors: 5, tier: 1, heights: 3, element: 'water', mode: 'delve', blurb: '水气回廊，五层，每层三楼' },
  { id: 'crypt', name: '锈骨墓', min: 4, floors: 7, tier: 2, heights: 3, element: 'earth', mode: 'delve', blurb: '土气墓道，七层' },
  { id: 'ridge', name: '风脊', min: 3, floors: 6, tier: 2, heights: 3, element: 'wind', mode: 'delve', blurb: '风从楼梯口灌下来' },
  { id: 'spark', name: '雷廊', min: 6, floors: 8, tier: 3, heights: 4, element: 'thunder', mode: 'delve', blurb: '四楼高，雷气贴墙' },
  { id: 'tide', name: '潮鸣洞', min: 8, floors: 9, tier: 3, heights: 4, element: 'water', mode: 'delve', blurb: '九层，每层四楼' },
  { id: 'well', name: '星炉井', min: 12, floors: 12, tier: 4, heights: 4, element: 'fire', mode: 'delve', blurb: '十二层，火气最重' },
  { id: 'haul', name: '长途', min: 1, floors: 999, tier: 1, heights: 3, element: 'earth', mode: 'haul', blurb: '不封顶，越走越重' },
  { id: 'daily', name: '日课', min: 1, floors: 6, tier: 2, heights: 3, element: 'water', mode: 'daily', blurb: '今天所有人走同一张图' },
  { id: 'climb', name: '攀登', min: 2, floors: 8, tier: 2, heights: 3, element: 'fire', mode: 'climb', blurb: '金币更厚，休息要两份篝火' },
  { id: 'raid', name: '团本', min: 5, floors: 6, tier: 3, heights: 4, element: 'thunder', mode: 'raid', blurb: '队友越多，怪越厚' },
];

export const MODE_NAME = { delve: '逐层', haul: '长途', daily: '日课', climb: '攀登', raid: '团本' };

export const ITEMS = {
  rust_blade: { name: '锈刃', w: 1, h: 3, kind: 'weapon', form: 'sword', atk: 4, price: 36, color: '#c2b09a' },
  iron_blade: { name: '铁直剑', w: 1, h: 3, kind: 'weapon', form: 'sword', atk: 7, price: 90, color: '#d9dde2' },
  star_edge: { name: '星炉刃', w: 1, h: 3, kind: 'weapon', form: 'sword', element: 'fire', atk: 14, price: 360, color: '#f0c36a' },
  canal_spear: { name: '渠矛', w: 1, h: 3, kind: 'weapon', form: 'spear', element: 'water', atk: 8, price: 120, color: '#8fb8a8' },
  tide_spear: { name: '潮矛', w: 1, h: 3, kind: 'weapon', form: 'spear', element: 'water', atk: 12, price: 240, color: '#7ec8d6' },
  bone_axe: { name: '骨斧', w: 2, h: 3, kind: 'weapon', form: 'axe', element: 'earth', atk: 11, price: 200, color: '#e6d2b0' },
  well_axe: { name: '炉斧', w: 2, h: 3, kind: 'weapon', form: 'axe', element: 'fire', atk: 15, price: 380, color: '#e07a3d' },
  wind_staff: { name: '风杖', w: 1, h: 3, kind: 'weapon', form: 'staff', element: 'wind', atk: 7, price: 110, color: '#d5ecc4' },
  thunder_staff: { name: '雷杖', w: 1, h: 3, kind: 'weapon', form: 'staff', element: 'thunder', atk: 13, price: 300, color: '#c5d7f5' },
  oak_board: { name: '橡木板', w: 2, h: 2, kind: 'armor', def: 2, price: 40, color: '#a56b32' },
  mail_scrap: { name: '残甲', w: 2, h: 3, kind: 'armor', def: 4, price: 120, color: '#8d97a3' },
  tide_coat: { name: '潮衣', w: 2, h: 3, kind: 'armor', def: 6, price: 240, color: '#6ea4b8' },
  well_plate: { name: '炉片甲', w: 3, h: 3, kind: 'armor', def: 9, price: 460, color: '#e0a15a' },
  vial: { name: '小药瓶', w: 1, h: 1, kind: 'potion', heal: 16, price: 12, color: '#d4534a' },
  flask: { name: '粗颈瓶', w: 1, h: 2, kind: 'potion', heal: 30, price: 28, color: '#e07a3d' },
  charm: { name: '铜符', w: 1, h: 1, kind: 'trinket', atk: 1, def: 1, price: 50, color: '#d7b15a' },
  fang: { name: '兽牙', w: 1, h: 2, kind: 'trinket', atk: 3, price: 100, color: '#f2efe6' },
  brew_wind: { name: '风散', w: 1, h: 1, kind: 'brew', element: 'wind', price: 18, color: '#b7d9a8' },
  brew_fire: { name: '火油', w: 1, h: 1, kind: 'brew', element: 'fire', price: 18, color: '#e25b3a' },
  brew_earth: { name: '土丸', w: 1, h: 1, kind: 'brew', element: 'earth', price: 18, color: '#c4a15a' },
  brew_thunder: { name: '雷晶', w: 1, h: 1, kind: 'brew', element: 'thunder', price: 18, color: '#8eb0e8' },
  brew_water: { name: '露水', w: 1, h: 1, kind: 'brew', element: 'water', price: 18, color: '#4aa4c9' },
  skill_wind: { name: '风切', w: 2, h: 1, kind: 'skill', element: 'wind', atk: 2, price: 55, color: '#d5ecc4' },
  skill_fire: { name: '焚符', w: 2, h: 1, kind: 'skill', element: 'fire', atk: 2, price: 55, color: '#f0a090' },
  skill_earth: { name: '垒印', w: 2, h: 1, kind: 'skill', element: 'earth', atk: 2, price: 55, color: '#e0c48a' },
  skill_thunder: { name: '引雷', w: 2, h: 1, kind: 'skill', element: 'thunder', atk: 2, price: 55, color: '#c5d7f5' },
  skill_water: { name: '潮击', w: 2, h: 1, kind: 'skill', element: 'water', atk: 2, price: 55, color: '#9fd4e4' },
  grit: { name: '砺石', w: 1, h: 1, kind: 'trinket', adj: 'weapon', adjAtk: 2, price: 70, color: '#9a8f84' },
  echo: { name: '回响', w: 1, h: 1, kind: 'trinket', adj: 'any', adjAtk: 1, price: 80, color: '#d5ecc4' },
  corner_plate: { name: '角甲', w: 2, h: 2, kind: 'armor', place: 'corner', def: 5, price: 150, color: '#8d97a3' },
  edge_charm: { name: '边符', w: 1, h: 2, kind: 'trinket', place: 'edge', atk: 3, price: 90, color: '#e0c48a' },
  tome_power: { name: '力量残页', w: 1, h: 1, kind: 'tome', price: 60, color: '#f2efe6' },
  iron_chip: { name: '碎铁', w: 1, h: 1, kind: 'material', atk: 2, price: 8, color: '#b7b1a8' },
  bone_dust: { name: '骨粉', w: 1, h: 1, kind: 'material', def: 2, price: 8, color: '#e6d2b0' },
  tide_salt: { name: '潮盐', w: 1, h: 1, kind: 'material', element: 'water', atk: 1, price: 8, color: '#9fd4e4' },
  slag: { name: '炉渣', w: 1, h: 1, kind: 'material', element: 'fire', atk: 1, price: 8, color: '#e07a3d' },
  plume: { name: '风羽', w: 1, h: 1, kind: 'material', element: 'wind', atk: 1, price: 8, color: '#d5ecc4' },
};

const AFFIX = {
  rust_blade: { crit: 4, metal: 'rust' },
  iron_blade: { crit: 6, pierce: 1, metal: 'iron' },
  star_edge: { crit: 12, speed: 1, metal: 'star' },
  canal_spear: { pierce: 4, speed: 1, metal: 'tide' },
  tide_spear: { pierce: 6, speed: 2, metal: 'tide' },
  bone_axe: { crit: 9, hp: 8, metal: 'bone' },
  well_axe: { crit: 12, pierce: 3, metal: 'ember' },
  wind_staff: { speed: 3, crit: 5, metal: 'wind' },
  thunder_staff: { crit: 14, speed: 2, metal: 'thunder' },
  oak_board: { hp: 10 },
  mail_scrap: { hp: 16 },
  tide_coat: { hp: 22, speed: 1 },
  well_plate: { hp: 30 },
  corner_plate: { hp: 18 },
  charm: { crit: 3 },
  fang: { pierce: 2 },
  edge_charm: { speed: 1 },
  grit: { crit: 1 },
  echo: { speed: 1 },
};

const BY_TIER = {
  1: ['rust_blade', 'oak_board', 'vial', 'brew_water', 'charm', 'iron_chip', 'grit'],
  2: ['canal_spear', 'mail_scrap', 'flask', 'brew_earth', 'fang', 'wind_staff', 'bone_dust', 'echo'],
  3: ['bone_axe', 'tide_coat', 'tide_spear', 'brew_thunder', 'skill_water', 'tide_salt', 'edge_charm', 'tome_power'],
  4: ['star_edge', 'well_axe', 'well_plate', 'thunder_staff', 'brew_fire', 'slag', 'plume', 'corner_plate'],
};

export const SHOP_TABS = {
  武器: ['rust_blade', 'iron_blade', 'canal_spear', 'bone_axe', 'wind_staff', 'thunder_staff'],
  护甲: ['oak_board', 'mail_scrap', 'tide_coat', 'corner_plate'],
  药: ['vial', 'flask', 'brew_wind', 'brew_fire', 'brew_earth', 'brew_thunder', 'brew_water'],
  符: ['grit', 'echo', 'edge_charm', 'tome_power', 'skill_wind', 'skill_fire', 'skill_earth', 'skill_thunder', 'skill_water'],
  料: ['iron_chip', 'bone_dust', 'tide_salt', 'slag', 'plume'],
};

export const CAMPFIRE_PRICE = 16;

export function itemDef(id) {
  return ITEMS[id];
}

export function elementName(id) {
  return ELEMENTS.find((e) => e.id === id)?.name || '无';
}

export function shopRows() {
  return Object.values(SHOP_TABS).flat();
}

export function itemStats(it) {
  const base = itemDef(it?.itemId);
  if (!base) return null;
  const extra = AFFIX[it.itemId] || {};
  const plus = it.plus || 0;
  const mul = 1 + plus * 0.12;
  const fuse = it.fuse || {};
  const name = fuse.name ? `${base.name}·${fuse.name}` : (plus ? `${base.name}+${plus}` : base.name);
  return {
    ...base,
    ...extra,
    name,
    atk: Math.round(((base.atk || 0) + (fuse.atk || 0)) * mul),
    def: Math.round(((base.def || 0) + (fuse.def || 0)) * mul),
    crit: Math.round(((extra.crit || 0) + (fuse.crit || 0)) * mul),
    pierce: (extra.pierce || 0) + (fuse.pierce || 0),
    speed: (extra.speed || 0) + (fuse.speed || 0),
    hp: (extra.hp || 0) + (fuse.hp || 0),
    element: base.element || fuse.element || extra.element || null,
    metal: extra.metal || base.metal || (base.kind === 'weapon' ? 'iron' : ''),
    plus,
  };
}

export function statLines(it, player) {
  const d = itemStats(it);
  if (!d) return [];
  const lines = [];
  if (d.atk) lines.push(`攻击 +${d.atk}`);
  if (d.def) lines.push(`防御 +${d.def}`);
  if (d.crit) lines.push(`暴击 ${d.crit}%`);
  if (d.pierce) lines.push(`穿透 ${d.pierce}`);
  if (d.speed) lines.push(`速度 ${d.speed}`);
  if (d.hp) lines.push(`生命 +${d.hp}`);
  if (d.element) lines.push(`${elementName(d.element)}属性`);
  if (d.metal) lines.push(`材质 ${metalName(d.metal)}`);
  if (player && d.place === 'corner') {
    const on = (it.x === 0 || it.x + it.w === COLS) && (it.y === 0 || it.y + it.h === ROWS);
    lines.push(on ? '角位生效' : '放到四角才有防御');
  }
  if (player && d.place === 'edge') {
    const on = it.x === 0 || it.y === 0 || it.x + it.w === COLS || it.y + it.h === ROWS;
    lines.push(on ? '边位生效' : '靠边上才有攻击');
  }
  if (player && d.adj) {
    const n = orthogonal(player.bag, it).filter((other) => d.adj === 'any' || itemDef(other.itemId)?.kind === d.adj).length;
    lines.push(d.adj === 'weapon' ? `相邻武器 ${n}，每个 +${d.adjAtk || 1} 攻击` : `相邻物品 ${n}，每个 +${d.adjAtk || 1} 攻击`);
  }
  return lines;
}

function metalName(id) {
  return { rust: '锈铁', iron: '精铁', star: '星钢', tide: '潮铜', bone: '骨', ember: '炉钢', wind: '风木', thunder: '雷晶' }[id] || id;
}

export function canStack(a, b) {
  if (!a || !b || a.uid === b.uid) return false;
  if ((a.plus || 0) >= 10 || (b.plus || 0) >= 10) return false;
  return a.itemId === b.itemId
    && (a.plus || 0) === (b.plus || 0)
    && JSON.stringify(a.fuse || null) === JSON.stringify(b.fuse || null);
}

export function fusePair(parent, child) {
  const childStats = itemStats(child);
  const base = itemDef(parent.itemId);
  const prev = parent.fuse || { atk: 0, def: 0, name: '', element: null };
  return {
    ...parent,
    plus: 0,
    fuse: {
      name: [prev.name, childStats.name].filter(Boolean).join('/').slice(0, 24),
      atk: (prev.atk || 0) + Math.ceil((childStats.atk || 0) / 2),
      def: (prev.def || 0) + Math.ceil((childStats.def || 0) / 2),
      element: prev.element || base.element || childStats.element || null,
    },
  };
}

function cellsOf(it) {
  const list = [];
  for (let y = 0; y < it.h; y++) for (let x = 0; x < it.w; x++) list.push({ x: it.x + x, y: it.y + y });
  return list;
}

function orthogonal(bag, it) {
  const mine = new Set(cellsOf(it).map((c) => `${c.x},${c.y}`));
  return bag.filter((other) => {
    if (other.uid === it.uid) return false;
    return cellsOf(other).some((c) => [`${c.x + 1},${c.y}`, `${c.x - 1},${c.y}`, `${c.x},${c.y + 1}`, `${c.x},${c.y - 1}`].some((k) => mine.has(k)));
  });
}

export function rollDropId(rng, tier, boss) {
  const pool = BY_TIER[tier] || BY_TIER[1];
  if (boss && rng() < 0.5) {
    const rare = BY_TIER[Math.min(4, tier + 1)] || pool;
    return rare[Math.floor(rng() * rare.length)];
  }
  return pool[Math.floor(rng() * pool.length)];
}

export function equippedWeapon(player) {
  const it = player.bag.find((b) => b.equipped && itemDef(b.itemId)?.kind === 'weapon');
  return it ? { ...it, def: itemStats(it) } : null;
}

export function combatPower(player) {
  let atk = 4 + player.level + (player.tomeAtk || 0);
  let def = player.level;
  let crit = 0;
  let pierce = 0;
  let speed = 0;
  let hp = 0;
  const bag = player.bag || [];
  const elements = {};
  for (const it of bag) {
    const d = itemStats(it);
    if (!d) continue;
    if (d.kind === 'potion' || d.kind === 'brew' || d.kind === 'material' || d.kind === 'tome') continue;
    if (d.kind === 'weapon' && !it.equipped) continue;
    if (d.kind === 'skill' && player.skillId !== it.itemId) continue;
    const cells = cellsOf(it);
    let addAtk = d.atk || 0;
    let addDef = d.def || 0;
    const corner = cells.some((c) => (c.x === 0 || c.x === COLS - 1) && (c.y === 0 || c.y === ROWS - 1));
    const edge = cells.some((c) => c.x === 0 || c.y === 0 || c.x === COLS - 1 || c.y === ROWS - 1);
    if (d.place === 'corner' && !corner) addDef = 0;
    if (d.place === 'edge' && !edge) addAtk = 0;
    if (d.adj) {
      const n = orthogonal(bag, it).filter((other) => d.adj === 'any' || itemDef(other.itemId)?.kind === d.adj).length;
      addAtk += n * (d.adjAtk || 1);
    }
    for (const rune of player.runes || []) {
      if (cells.some((c) => c.x === rune.x && c.y === rune.y)) addAtk += 2;
    }
    if (d.element) elements[d.element] = (elements[d.element] || 0) + 1;
    atk += addAtk;
    def += addDef;
    crit += d.crit || 0;
    pierce += d.pierce || 0;
    speed += d.speed || 0;
    hp += d.hp || 0;
  }
  if (Object.values(elements).some((n) => n >= 2)) atk += 2;
  return { atk, def, crit, pierce, speed, maxHp: 28 + player.level * 8 + hp };
}

export const MERCENARIES = [
  { id: 'lin', name: '林渠', element: 'water', atk: 7, pk: 1088, level: 6 },
  { id: 'he', name: '何炉', element: 'fire', atk: 9, pk: 1210, level: 11 },
  { id: 'qiu', name: '秋骨', element: 'earth', atk: 8, pk: 1144, level: 8 },
  { id: 'su', name: '苏潮', element: 'thunder', atk: 6, pk: 990, level: 4 },
];

export const GENESIS_LISTINGS = [
  { id: 'g1', seller: '林渠', itemId: 'canal_spear', price: 80 },
  { id: 'g2', seller: '何炉', itemId: 'tide_coat', price: 160 },
  { id: 'g3', seller: '秋骨', itemId: 'brew_fire', price: 14 },
  { id: 'g4', seller: '苏潮', itemId: 'skill_water', price: 40 },
];
