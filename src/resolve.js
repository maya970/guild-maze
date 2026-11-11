import { BEATS, FEEDS, COLS, ROWS, combatPower, itemDef, itemStats, rollDropId } from './data.js';

export function elementMod(attackEl, defendEl) {
  if (!attackEl || !defendEl) return 1;
  if (BEATS[attackEl] === defendEl) return 1.4;
  if (BEATS[defendEl] === attackEl) return 0.72;
  if (FEEDS[attackEl] === defendEl) return 1.12;
  return 1;
}

export function bestElement(elements, enemy) {
  let mul = 1;
  let el = null;
  let relation = '';
  for (const id of elements) {
    const m = elementMod(id, enemy);
    if (m > mul) {
      mul = m;
      el = id;
      relation = BEATS[id] === enemy ? '克' : '生';
    }
  }
  if (!el) {
    for (const id of elements) {
      if (BEATS[enemy] === id) return { mul: 0.72, el: id, relation: '被克' };
    }
  }
  return { mul, el, relation };
}

export function attackElements(player, allies) {
  const list = [];
  const skill = itemDef(player.skillId);
  if (skill?.element) list.push(skill.element);
  for (const it of player.bag) {
    const d = itemStats(it);
    if (d?.kind === 'weapon' && it.equipped && d.element) list.push(d.element);
    if (!d) continue;
    for (const rune of player.runes || []) {
      const cover = rune.x >= it.x && rune.x < it.x + it.w && rune.y >= it.y && rune.y < it.y + it.h;
      if (cover && rune.element) list.push(rune.element);
    }
  }
  for (const b of player.buffs || []) if (b.fights > 0) list.push(b.element);
  for (const m of allies || []) if (m.element) list.push(m.element);
  return list;
}

export function cellsFor(item, x, y) {
  const cells = [];
  for (let j = 0; j < item.h; j++) for (let i = 0; i < item.w; i++) cells.push({ x: x + i, y: y + j });
  return cells;
}

export function canPlace(bag, item, x, y, ignoreUid, rows = ROWS) {
  if (x < 0 || y < 0 || x + item.w > COLS || y + item.h > rows) return false;
  const occ = new Set();
  for (const it of bag) {
    if (it.uid === ignoreUid) continue;
    for (const c of cellsFor(it, it.x, it.y)) occ.add(`${c.x},${c.y}`);
  }
  return cellsFor(item, x, y).every((c) => !occ.has(`${c.x},${c.y}`));
}

export function autoPlace(bag, item, rows = ROWS) {
  const options = [
    { w: item.w, h: item.h },
    { w: item.h, h: item.w },
  ];
  const seen = new Set();
  for (const opt of options) {
    const key = `${opt.w}x${opt.h}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        const trial = { ...item, w: opt.w, h: opt.h };
        if (canPlace(bag, trial, x, y, undefined, rows)) return { ...trial, x, y };
      }
    }
  }
  return null;
}

export function resolveFight(player, monster, rng, allies) {
  const power = combatPower(player);
  const allyAtk = (allies || []).reduce((sum, m) => sum + Math.round((m.atk || 0) * 0.5), 0);
  const elements = attackElements(player, allies);
  const rel = bestElement(elements, monster.element);
  let php = player.hp;
  let mhp = monster.hp;
  const swings = [];
  while (php > 0 && mhp > 0 && swings.length < 24) {
    const guard = Math.max(0, monster.def - (power.pierce || 0));
    const raw = Math.max(1, power.atk + allyAtk - guard + Math.floor(rng() * 3) - 1);
    let dmg = Math.max(1, Math.round(raw * rel.mul * (1 + (power.speed || 0) * 0.04)));
    const crit = (power.crit || 0) > 0 && rng() * 100 < power.crit;
    if (crit) dmg = Math.round(dmg * 1.5);
    mhp -= dmg;
    swings.push({ side: 'player', dmg, crit, php, mhp: Math.max(0, mhp), element: rel.el, relation: rel.relation });
    if (mhp <= 0) break;
    const back = Math.max(1, monster.atk - power.def + Math.floor(rng() * 3) - 1);
    php -= back;
    swings.push({ side: 'monster', dmg: back, php: Math.max(0, php), mhp });
  }
  const win = mhp <= 0 && php > 0;
  const loot = [];
  if (win) {
    const count = monster.boss ? 2 : 1;
    for (let i = 0; i < count; i++) {
      loot.push({
        uid: `drop-${monster.id}-${i}`,
        itemId: rollDropId(rng, monster.tier, monster.boss),
      });
    }
  }
  return { win, php: Math.max(0, php), swings, loot, gold: win ? monster.gold : 0, xp: win ? monster.xp : 0, relation: rel };
}

export function gainXp(player, xp) {
  player.xp += xp;
  let ups = 0;
  let need = 30 + player.level * 18;
  while (player.xp >= need) {
    player.xp -= need;
    player.level += 1;
    ups += 1;
    need = 30 + player.level * 18;
  }
  const maxHp = combatPower(player).maxHp;
  if (ups > 0) player.hp = maxHp;
  return ups;
}

export function tickBuffs(player) {
  player.buffs = (player.buffs || []).map((b) => ({ ...b, fights: b.fights - 1 })).filter((b) => b.fights > 0);
}
