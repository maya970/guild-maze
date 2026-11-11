import { DUNGEONS, ITEMS, itemDef, itemStats, elementName, SHOP_TABS, CAMPFIRE_PRICE, equippedWeapon, combatPower, MERCENARIES, GENESIS_LISTINGS, ELEMENT_COLOR, MODE_NAME, canStack, fusePair, COLS, ROWS } from './data.js';
import { CELL, STORY, buildTown, buildDungeonFloor, bfs3, standBeside, hashSeed, isFloor } from './gen.js';
import { autoPlace, canPlace, resolveFight, gainXp, tickBuffs } from './resolve.js';
import { loadSave, saveSave, pushRecord, loadLog, newId, loadBook, saveBook } from './ledger.js';
import { createParty } from './party.js';
import { startCampfire, stopCampfire } from './fire.js';
import { WorldView, yawToward } from './view.js';
import { fillBag } from './bag.js';

function loadoutKey(player) {
  const w = equippedWeapon(player);
  const buffs = (player.buffs || []).map((b) => `${b.element}${b.fights}`).join(',');
  return `${w?.itemId || ''}|${player.skillId || ''}|${buffs}`;
}

function angDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function defaultPlayer() {
  return {
    name: '旅人',
    level: 1,
    xp: 0,
    gold: 80,
    hp: 36,
    fires: 2,
    skillId: 'skill_water',
    buffs: [],
    pk: 1000,
    bosses: 0,
    deepest: 0,
    runes: [],
    tomeAtk: 0,
    bag: [
      { uid: 'start-sword', itemId: 'rust_blade', x: 0, y: 0, w: 1, h: 3, equipped: true },
      { uid: 'start-vial', itemId: 'vial', x: 2, y: 0, w: 1, h: 1 },
      { uid: 'start-brew', itemId: 'brew_water', x: 3, y: 0, w: 1, h: 1 },
      { uid: 'start-skill', itemId: 'skill_water', x: 4, y: 0, w: 2, h: 1 },
    ],
  };
}

export class Game {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div id="view"></div>
      <div id="top">
        <div class="stat bars">
          <div id="place">主城</div>
          <div class="track"><div id="hp" class="fill"></div></div>
          <div class="track"><div id="xp" class="fill xp"></div></div>
          <div id="wallet"></div>
        </div>
        <canvas id="minimap" width="138" height="138"></canvas>
      </div>
      <div id="hud"></div>
      <div id="panel"></div>
      <div id="toast"></div>
      <div id="float"></div>`;
    this.viewEl = root.querySelector('#view');
    this.panel = root.querySelector('#panel');
    this.hud = root.querySelector('#hud');
    this.toastEl = root.querySelector('#toast');
    this.floatEl = root.querySelector('#float');
    this.view = new WorldView(this.viewEl);
    this.player = loadSave() || defaultPlayer();
    this.allies = [];
    this.party = createParty();
    this.party.codeRoom = '';
    this.walkGen = 0;
    this.motion = null;
    this.busy = false;
    this.auto = false;
    this.gx = 22;
    this.gy = 22;
    this.gz = 0;
    this.px = 0;
    this.py = 0;
    this.pz = 0;
    this.yaw = 0;
    this.map = null;
    this.last = 0;
    this.party.on((msg) => this.onParty(msg));
    this.tab = newId();
    this.bagMode = 'use';
    this.forgePicks = [];
    this.shopTab = '武器';
    this.txState = (localStorage.getItem('gm-tx-v1') || '').slice(0, 6);
    this.player.runes = this.player.runes || [];
    this.player.tomeAtk = this.player.tomeAtk || 0;
    this.market = new BroadcastChannel('guildmaze-market');
    this.market.onmessage = (ev) => this.onMarket(ev.data);
    this.ranks = new BroadcastChannel('guildmaze-ranks');
    this.ranks.onmessage = (ev) => this.onRank(ev.data);
    this.viewEl.addEventListener('pointerdown', (ev) => this.onPointer(ev));
  }

  start() {
    this.syncWeapon();
    this.enterTown(false);
    this.refreshHud();
    this.paintBoard();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      this.tick(dt);
      this.view.setPose(this.px, this.py, this.pz, this.yaw);
      this.view.update(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  toast(text) {
    this.toastEl.textContent = text;
    this.toastEl.style.display = 'block';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastEl.style.display = 'none'; }, 2200);
  }

  float(text) {
    this.floatEl.textContent = text;
    this.floatEl.style.display = 'block';
    clearTimeout(this.floatTimer);
    this.floatTimer = setTimeout(() => { this.floatEl.style.display = 'none'; }, 450);
  }

  refreshHud() {
    const p = this.player;
    const max = combatPower(p).maxHp;
    this.root.querySelector('#hp').style.width = `${Math.max(0, Math.min(100, (p.hp / max) * 100))}%`;
    const need = 30 + p.level * 18;
    this.root.querySelector('#xp').style.width = `${Math.min(100, (p.xp / need) * 100)}%`;
    const weapon = equippedWeapon(p);
    const where = this.map?.kind === 'dungeon'
      ? `${this.map.dungeon.name} ${this.map.floor}层 · ${this.gz + 1}/${this.map.heights}楼 · ${elementName(this.map.dungeon.element)}气`
      : '主城回廊';
    this.root.querySelector('#place').textContent = where;
    const tx = this.txState || '—';
    this.root.querySelector('#wallet').textContent = `${p.name} Lv${p.level}  金${p.gold}  篝火${p.fires}  ${weapon ? weapon.def.name : '空手'}  技${elementName(itemDef(p.skillId)?.element)}  档${tx}`;
    const buttons = this.map?.kind === 'dungeon'
      ? [
          ['开战', () => this.pull()],
          ['连续战斗', () => this.exploreAll()],
          ['停止', () => this.stopAuto()],
          ['上楼', () => this.busy ? this.toast('先把这一场结算完') : this.climbExit()],
          ['回城', () => this.busy ? this.toast('先把这一场结算完') : this.enterTown(true)],
        ]
      : [
          ['商店', () => this.goPoi('shop')],
          ['熔炉', () => this.goPoi('forge')],
          ['拍卖', () => this.goPoi('auction')],
          ['入口', () => this.goPoi('gate')],
          ['排行', () => this.goPoi('board')],
          ['决斗', () => this.goPoi('arena')],
        ];
    this.hud.innerHTML = '';
    for (const [label, fn] of buttons) {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = () => fn();
      this.hud.appendChild(b);
    }
    this.drawMini();
  }

  drawMini() {
    const c = this.root.querySelector('#minimap');
    const g = c.getContext('2d');
    g.clearRect(0, 0, 138, 138);
    if (!this.map) return;
    const grid = this.map.levels[this.gz] || this.map.levels[0];
    const s = Math.min(130 / grid[0].length, 130 / grid.length);
    g.fillStyle = '#241910';
    g.fillRect(0, 0, 138, 138);
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x] !== 1) continue;
        g.fillStyle = '#8d7b66';
        g.fillRect(4 + x * s, 4 + y * s, Math.max(1, s - 0.4), Math.max(1, s - 0.4));
      }
    }
    for (const m of this.map.monsters || []) {
      if (m.dead || m.z !== this.gz) continue;
      g.fillStyle = ELEMENT_COLOR[m.element];
      g.fillRect(4 + m.x * s, 4 + m.y * s, s, s);
    }
    g.fillStyle = '#fff4d2';
    g.fillRect(4 + this.gx * s, 4 + this.gy * s, s, s);
  }

  syncWeapon() {
    const w = equippedWeapon(this.player);
    this.view.setWeapon(w?.def.form || 'sword', w?.def.color || '#f4f4f6');
  }

  placeAt(cell, yaw) {
    this.gx = cell.x;
    this.gy = cell.y;
    this.gz = cell.z || 0;
    this.view.gz = this.gz;
    this.px = (this.gx + 0.5) * CELL;
    this.py = this.gz * STORY;
    this.pz = (this.gy + 0.5) * CELL;
    if (yaw != null) this.yaw = yaw;
  }

  enterTown(save) {
    this.auto = false;
    this.map = buildTown();
    this.placeAt(this.map.spawn, 0);
    this.view.setWorld(this.map, { monsters: [] });
    this.closePanel();
    this.refreshHud();
    this.paintBoard();
    if (save) saveSave(this.player);
  }

  enterFloor(dungeon, floor) {
    const stamp = dungeon.mode === 'daily' ? new Date().toISOString().slice(0, 10) : (this.party.codeRoom || 'solo');
    const seed = hashSeed(`${dungeon.id}:${floor}:${stamp}`);
    this.map = buildDungeonFloor(dungeon, floor, seed);
    if (dungeon.mode === 'raid' && this.allies.length) {
      const scale = 1 + this.allies.length * 0.45;
      for (const m of this.map.monsters) m.hp = Math.round(m.hp * scale);
    }
    this.placeAt(this.map.spawn, 0);
    this.view.setWorld(this.map, { monsters: this.map.monsters, exitOpen: false });
    this.closePanel();
    this.refreshHud();
    this.toast(`${dungeon.name} 第 ${floor} 层`);
    this.snap('enter', { dungeon: dungeon.id, floor });
  }

  rebuildView() {
    const bossDead = !(this.map.monsters || []).some((m) => m.boss && !m.dead);
    const allDead = !(this.map.monsters || []).some((m) => !m.dead);
    this.view.setWorld(this.map, { monsters: this.map.monsters, exitOpen: bossDead && allDead });
  }

  paintBoard() {
    const rows = this.rankRows().slice(0, 8).map((r, i) => `${i + 1} ${r.name} 层${r.deepest} 斗${r.pk}`);
    this.view.paintBoard(rows);
  }

  rankRows() {
    const me = { name: this.player.name, deepest: this.player.deepest, pk: this.player.pk, bosses: this.player.bosses, gold: this.player.gold };
    return [me, ...MERCENARIES.map((m) => ({ name: m.name, deepest: m.level * 20, pk: m.pk, bosses: m.level, gold: 0 }))]
      .sort((a, b) => b.deepest - a.deepest || b.pk - a.pk);
  }

  closePanel() {
    this.panel.classList.remove('open', 'wide');
    this.panel.dataset.kind = '';
    this.panel.innerHTML = '';
    this.bagMode = 'use';
    this.view.showFire(false);
    stopCampfire();
  }

  openPanel(html, opts = {}) {
    this.panel.innerHTML = html;
    this.panel.classList.add('open');
    this.panel.classList.toggle('wide', !!opts.wide);
    this.panel.dataset.kind = opts.kind || '';
  }

  tick(dt) {
    if (!this.motion) return;
    this.motion.t += dt;
    const k = Math.min(1, this.motion.t / this.motion.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
    const a = this.motion.from;
    const b = this.motion.to;
    this.px = a.px + (b.px - a.px) * e;
    this.py = a.py + (b.py - a.py) * e;
    this.pz = a.pz + (b.pz - a.pz) * e;
    this.yaw = a.yaw + (b.yaw - a.yaw) * e;
    if (k >= 1) {
      const done = this.motion.resolve;
      this.motion = null;
      done();
    }
  }

  moveTo(cell) {
    const gen = this.walkGen;
    const targetYaw = cell.x !== this.gx || cell.y !== this.gy ? yawToward({ x: this.gx, y: this.gy }, cell) : this.yaw;
    return new Promise((resolve) => {
      this.motion = {
        t: 0,
        dur: cell.z !== this.gz ? 0.62 : 0.24,
        from: { px: this.px, py: this.py, pz: this.pz, yaw: this.yaw },
        to: {
          px: (cell.x + 0.5) * CELL,
          py: cell.z * STORY,
          pz: (cell.y + 0.5) * CELL,
          yaw: this.yaw + angDiff(this.yaw, targetYaw),
        },
        resolve: () => {
          const ok = !this.motionCancelled;
          this.motionCancelled = false;
          if (ok) {
            this.gx = cell.x;
            this.gy = cell.y;
            this.gz = cell.z;
            this.view.gz = this.gz;
            this.refreshHud();
          }
          resolve(ok && this.walkGen === gen);
        },
      };
    });
  }

  cancelWalk() {
    this.walkGen += 1;
    if (this.motion) {
      this.motionCancelled = true;
      const done = this.motion.resolve;
      this.motion = null;
      done();
    }
  }

  async walkPath(path) {
    const gen = this.walkGen;
    for (const cell of path.slice(1)) {
      if (this.walkGen !== gen) return false;
      const ok = await this.moveTo(cell);
      if (!ok) return false;
    }
    return this.walkGen === gen;
  }

  async goPoi(id) {
    if (this.map?.kind !== 'town') return;
    const poi = this.map.pois.find((p) => p.id === id);
    if (!poi) return;
    const stand = standBeside(this.map, poi.x, poi.y, 0);
    const path = bfs3(this.map, this.gx, this.gy, this.gz, stand.x, stand.y, stand.z);
    if (!path) return this.toast('这条廊走不通');
    this.cancelWalk();
    const ok = await this.walkPath(path);
    if (!ok) return;
    this.yaw = yawToward({ x: this.gx, y: this.gy }, poi);
    this.openPoi(poi);
  }

  openPoi(poi) {
    if (poi.kind === 'shop') this.openShop();
    else if (poi.kind === 'auction') this.openAuction();
    else if (poi.kind === 'leaderboard') this.openBoard();
    else if (poi.kind === 'pk') this.openPk();
    else if (poi.kind === 'forge') this.openForge();
    else if (poi.kind === 'warden') this.openGate();
  }

  onPointer(ev) {
    if (this.busy || !this.map) return;
    const hit = this.view.pickFloor(ev.clientX, ev.clientY);
    if (!hit || !isFloor(this.map.levels[this.gz], hit.x, hit.y)) return;
    const path = bfs3(this.map, this.gx, this.gy, this.gz, hit.x, hit.y, this.gz);
    if (!path) return;
    this.cancelWalk();
    this.walkPath(path).then((ok) => {
      if (!ok || this.map?.kind !== 'town') return;
      const poi = this.map.pois.find((p) => Math.abs(p.x - this.gx) + Math.abs(p.y - this.gy) <= 1);
      if (poi) this.openPoi(poi);
    });
  }

  living() {
    return (this.map?.monsters || []).filter((m) => !m.dead);
  }

  nextMonster() {
    const alive = this.living();
    const pool = alive.some((m) => !m.boss) ? alive.filter((m) => !m.boss) : alive;
    let best = null;
    let bestLen = 1e9;
    for (const m of pool) {
      const path = bfs3(this.map, this.gx, this.gy, this.gz, m.x, m.y, m.z);
      if (path && path.length < bestLen) {
        best = { m, path };
        bestLen = path.length;
      }
    }
    return best;
  }

  async pull() {
    if (this.busy || this.map?.kind !== 'dungeon') return false;
    const nxt = this.nextMonster();
    if (!nxt) {
      await this.climbExit();
      return this.map?.kind === 'dungeon';
    }
    this.busy = true;
    const stand = nxt.path.length > 1 ? nxt.path[nxt.path.length - 2] : { x: this.gx, y: this.gy, z: this.gz };
    const arrived = await this.moveTo(stand);
    if (!arrived) {
      this.busy = false;
      return false;
    }
    await this.fight(nxt.m);
    return true;
  }

  async exploreAll() {
    if (this.busy) return;
    this.auto = true;
    while (this.auto && this.map?.kind === 'dungeon') {
      const ok = await this.pull();
      if (!ok || !this.auto) break;
    }
  }

  stopAuto() {
    this.auto = false;
    clearTimeout(this.autoTimer);
    this.toast('停下来了');
  }

  async fight(monster) {
    if (monster.dead) return;
    this.busy = true;
    this.cancelWalk();
    this.yaw = yawToward({ x: this.gx, y: this.gy }, monster);
    const rng = mulberry32Fight(monster.id + this.player.level);
    const preview = resolveFight(this.player, monster, rng, this.allies);
    if (preview.relation?.el) this.toast(`${elementName(preview.relation.el)}${preview.relation.relation}了${elementName(monster.element)}`);
    if (this.map.dungeon.mode === 'climb') preview.gold = Math.round(preview.gold * 1.5);
    const restCost = this.map.dungeon.mode === 'climb' ? 2 : 1;
    for (const sw of preview.swings) {
      if (sw.side === 'player') await this.view.swing();
      else await this.view.lunge(monster.id);
      this.float(sw.side === 'player' ? `${sw.dmg}` : `-${sw.dmg}`);
    }
    if (preview.win) {
      monster.dead = true;
      this.view.killMonster(monster.id);
      tickBuffs(this.player);
      const choice = await this.decide(preview, monster, restCost);
      this.player.hp = Math.max(1, preview.php);
      this.player.gold += preview.gold;
      const ups = gainXp(this.player, preview.xp);
      if (this.rested) {
        this.player.fires -= this.restCost || 1;
        this.player.hp = combatPower(this.player).maxHp;
        this.rested = false;
      }
      let sold = 0;
      for (const item of choice.taken) {
        const def = itemDef(item.itemId);
        const placed = autoPlace(this.player.bag, { uid: newId(), itemId: item.itemId, w: def.w, h: def.h });
        if (placed) this.player.bag.push(placed);
        else {
          const back = Math.max(1, Math.floor(def.price * 0.5));
          this.player.gold += back;
          sold += back;
        }
      }
      if (sold) this.toast(`背包满了，兑成 ${sold} 金`);
      if (monster.boss) {
        this.player.bosses += 1;
        this.dropRune(monster.element);
      }
      this.player.deepest = Math.max(this.player.deepest, this.map.dungeon.tier * 100 + this.map.floor);
      this.announce({ t: 'kill', id: newId(), name: this.player.name, boss: monster.boss, floor: this.map.floor, gold: this.player.gold, level: this.player.level });
      this.snap('kill', { floor: this.map.floor, name: monster.name, boss: monster.boss ? 1 : 0 });
      this.rebuildView();
      if (ups) this.toast(`升级到 ${this.player.level}`);
    } else {
      this.player.hp = Math.max(1, Math.round(combatPower(this.player).maxHp * 0.45));
      const choice = await this.loseCard(monster, restCost);
      if (this.rested) {
        this.player.fires -= this.restCost || 1;
        this.player.hp = combatPower(this.player).maxHp;
        this.rested = false;
      }
      this.snap('fall', { floor: this.map.floor, name: monster.name });
      this.toast('被击退了，还在这一层');
    }
    this.busy = false;
    this.refreshHud();
    if (this.queuePull && !this.auto) {
      this.queuePull = false;
      await this.pull();
    }
  }

  shouldHold(monster, preview) {
    const max = combatPower(this.player).maxHp;
    const rare = preview.loot.some((d) => (itemDef(d.itemId)?.price || 0) >= 200 || itemDef(d.itemId)?.kind === 'skill');
    return monster.boss || rare || preview.php < max * 0.35;
  }

  decide(preview, monster, restCost = 1) {
    const drops = preview.loot.map((d) => ({ ...d, on: true }));
    const before = loadoutKey(this.player);
    const rel = preview.relation?.relation ? `${elementName(preview.relation.el)}${preview.relation.relation}了${elementName(monster.element)}` : elementName(monster.element);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (again) => {
        if (settled) return;
        settled = true;
        this.pendingSettle = null;
        clearTimeout(this.autoTimer);
        if (again && !this.auto) this.queuePull = true;
        this.closePanel();
        resolve({ taken: drops.filter((d) => d.on), changed: loadoutKey(this.player) !== before });
      };
      this.pendingSettle = () => finish(false);
      const draw = () => {
        clearTimeout(this.autoTimer);
        this.openPanel(`
          <h2>${monster.name}倒下</h2>
          <p class="note">${rel}。金币 +${preview.gold}，经验 +${preview.xp}。换装会另上一份档，从下一场生效。这一层${elementName(this.map.dungeon.element)}气重。右键旋转，相同的两件拖到一起会升级。</p>
          <div class="loot-field" id="loot"></div>
          <div class="row">
            <button id="rest" ${this.player.fires >= restCost ? '' : 'disabled'}>休息（篝火 ${this.player.fires}）</button>
            <button id="go">继续</button>
          </div>
          <div id="firebox" class="flame-wrap" style="display:none"><canvas id="flame" width="400" height="180"></canvas><p class="note">篝火声：CC0 Fire Crackling，AntumDeluge，OpenGameArt。休息时可吃药。</p><div class="row" id="brews"></div></div>
          <h2>换装</h2>
          <div id="gear"></div>`);
        const field = this.panel.querySelector('#loot');
        drops.forEach((d, i) => {
          const card = document.createElement('div');
          card.className = `loot-card${d.on ? ' on' : ''}`;
          card.style.left = `${16 + (i % 4) * 90}px`;
          card.style.top = `${24 + Math.floor(i / 4) * 70}px`;
          const def = itemDef(d.itemId);
          card.textContent = def.name;
          card.style.background = def.color;
          field.appendChild(card);
          d.el = card;
        });
        this.bindBox(field, drops);
        this.bagMode = 'use';
        this.mountGear(this.panel.querySelector('#gear'));
        this.panel.querySelector('#go').onclick = () => finish(true);
        this.panel.querySelector('#rest').onclick = () => {
          this.auto = false;
          clearTimeout(this.autoTimer);
          this.restInside(draw);
        };
        this.panel.addEventListener('pointerdown', (ev) => {
          if (ev.target.id === 'go') return;
          clearTimeout(this.autoTimer);
          this.auto = false;
        });
        if (this.auto && this.shouldHold(monster, preview)) this.auto = false;
        if (this.auto) this.autoTimer = setTimeout(() => finish(false), 1400);
      };
      draw();
    });
  }

  loseCard(monster, restCost = 1) {
    return new Promise((resolve) => {
      this.auto = false;
      this.bagMode = 'use';
      this.openPanel(`
        <h2>被击退</h2>
        <p class="note">${monster.name}（${elementName(monster.element)}）把你逼退了。你还在这一层。右键旋转，拖到相同的一件上升级。</p>
        <div class="row"><button id="rest" ${this.player.fires >= restCost ? '' : 'disabled'}>休息</button><button id="go">再战</button></div>
        <div id="firebox" class="flame-wrap" style="display:none"><canvas id="flame" width="400" height="180"></canvas><div class="row" id="brews"></div></div>
        <div id="gear"></div>`);
      this.mountGear(this.panel.querySelector('#gear'));
      this.panel.querySelector('#go').onclick = () => {
        this.queuePull = true;
        this.closePanel();
        resolve({});
      };
      this.panel.querySelector('#rest').onclick = () => this.restInside(() => {});
    });
  }

  bindBox(field, drops) {
    let start = null;
    const rectOf = (el) => el.getBoundingClientRect();
    field.onpointerdown = (ev) => {
      start = { x: ev.clientX, y: ev.clientY };
    };
    field.onpointerup = (ev) => {
      if (!start) return;
      const box = {
        l: Math.min(start.x, ev.clientX),
        r: Math.max(start.x, ev.clientX),
        t: Math.min(start.y, ev.clientY),
        b: Math.max(start.y, ev.clientY),
      };
      if (box.r - box.l < 6 && box.b - box.t < 6) {
        const hit = drops.find((d) => {
          const r = rectOf(d.el);
          return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        });
        if (hit) hit.on = !hit.on;
      } else {
        for (const d of drops) {
          const r = rectOf(d.el);
          const hit = !(r.right < box.l || r.left > box.r || r.bottom < box.t || r.top > box.b);
          if (hit) d.on = true;
        }
      }
      drops.forEach((d) => d.el.classList.toggle('on', d.on));
      start = null;
    };
  }

  mountGear(host) {
    if (!host) return;
    fillBag(host, this.player.bag, this.player.runes, {
      selected: this.forgePicks,
      onRotate: (it) => this.rotateItem(it, () => this.mountGear(host)),
      onDrop: (it, x, y) => this.dropItem(it, x, y, () => this.mountGear(host)),
      onClick: (it) => this.clickItem(it, () => this.mountGear(host)),
    });
  }

  rotateItem(it, redraw) {
    const w = it.h;
    const h = it.w;
    if (!canPlace(this.player.bag, { ...it, w, h }, it.x, it.y, it.uid)) return this.toast('转不开');
    it.w = w;
    it.h = h;
    this.snap('gear');
    redraw();
  }

  dropItem(it, x, y, redraw) {
    const hit = this.player.bag.find((b) => b.uid !== it.uid && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    if (hit && canStack(it, hit)) {
      hit.plus = (hit.plus || 0) + 1;
      if (it.equipped) hit.equipped = true;
      this.player.bag = this.player.bag.filter((b) => b.uid !== it.uid);
      this.syncWeapon();
      this.snap('gear');
      this.toast(`升到 +${hit.plus}`);
      redraw();
      return;
    }
    if (!canPlace(this.player.bag, it, x, y, it.uid)) return this.toast('放不下');
    it.x = x;
    it.y = y;
    this.snap('gear');
    redraw();
  }

  clickItem(it, redraw) {
    if (this.bagMode === 'forge') {
      const i = this.forgePicks.indexOf(it.uid);
      if (i >= 0) this.forgePicks.splice(i, 1);
      else {
        this.forgePicks.push(it.uid);
        if (this.forgePicks.length > 2) this.forgePicks.shift();
      }
      const el = this.panel.querySelector('#pick');
      if (el) {
        el.textContent = this.forgePicks.map((uid) => itemStats(this.player.bag.find((b) => b.uid === uid))?.name || '').join('  +  ') || '先点两件不同的';
      }
      redraw();
      return;
    }
    if (this.bagMode === 'sell') {
      if (it.equipped) return this.toast('先换下再卖');
      const price = Math.max(1, Math.round((itemDef(it.itemId)?.price || 1) * 0.5));
      this.player.gold += price;
      this.player.bag = this.player.bag.filter((b) => b.uid !== it.uid);
      this.snap('gear');
      this.toast(`卖出 ${price} 金`);
      this.openShop();
      return;
    }
    if (this.bagMode === 'ask') {
      this.listAsk(it);
      return;
    }
    const d = itemDef(it.itemId);
    if (d.kind === 'weapon') {
      this.player.bag.forEach((b) => { if (itemDef(b.itemId)?.kind === 'weapon') b.equipped = false; });
      it.equipped = true;
      this.syncWeapon();
      this.snap('gear');
      this.toast(`换上${itemStats(it).name}`);
    } else if (d.kind === 'skill') {
      this.player.skillId = it.itemId;
      this.snap('gear');
      this.toast(`技能改为${d.name}`);
    } else if (d.kind === 'potion') {
      this.player.hp = Math.min(combatPower(this.player).maxHp, this.player.hp + d.heal);
      this.player.bag = this.player.bag.filter((b) => b.uid !== it.uid);
      this.snap('gear');
      this.toast(`喝下${d.name}`);
    } else if (d.kind === 'tome') {
      this.player.tomeAtk = (this.player.tomeAtk || 0) + 2;
      this.player.bag = this.player.bag.filter((b) => b.uid !== it.uid);
      this.snap('gear');
      this.toast('永久攻击 +2');
    }
    this.refreshHud();
    redraw();
  }

  dropRune(element) {
    this.player.runes = this.player.runes || [];
    if (this.player.runes.length >= 6) return;
    const used = new Set(this.player.runes.map((r) => `${r.x},${r.y}`));
    const free = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!used.has(`${x},${y}`)) free.push({ x, y });
    if (!free.length) return;
    this.player.runes.push({ ...free[Math.floor(Math.random() * free.length)], element });
    this.toast('背包格子上落下一块符');
  }

  snap(why, extra) {
    saveSave(this.player);
    this.txState = '…';
    import('./uplink.js').then(({ publish }) => publish(why, this.player, extra || {})).then((id) => {
      this.txState = String(id).slice(0, 6);
      this.refreshHud();
    }).catch((err) => {
      this.txState = '失败';
      this.refreshHud();
      this.toast(String(err.message || err).slice(0, 90));
    });
  }

  announce(record) {
    pushRecord(record);
    this.ranks?.postMessage({ ...record, from: this.tab });
  }

  onRank(msg) {
    if (!msg?.id || msg.from === this.tab) return;
    if (loadLog().some((r) => r.id === msg.id)) return;
    pushRecord(msg);
  }

  gearNode() {
    const wrap = document.createElement('div');
    this.mountGear(wrap);
    return wrap;
  }

  async restInside(redraw) {
    const cost = this.map?.dungeon?.mode === 'climb' ? 2 : 1;
    if (this.player.fires < cost || this.rested) return;
    this.rested = true;
    this.restCost = cost;
    this.view.showFire(true);
    await startCampfire();
    const box = this.panel.querySelector('#firebox');
    if (box) box.style.display = 'block';
    const canvas = this.panel.querySelector('#flame');
    this.animateFlame(canvas);
    const brews = this.panel.querySelector('#brews');
    brews.innerHTML = '';
    for (const it of this.player.bag.filter((b) => itemDef(b.itemId)?.kind === 'brew')) {
      const d = itemDef(it.itemId);
      const btn = document.createElement('button');
      btn.textContent = `${d.name}（${elementName(d.element)} 3战）`;
      btn.onclick = () => {
        this.player.buffs.push({ element: d.element, fights: 3 });
        this.loadoutDirty = true;
        this.player.bag = this.player.bag.filter((b) => b.uid !== it.uid);
        this.snap('gear');
        this.toast(`${d.name}生效`);
        btn.remove();
      };
      brews.appendChild(btn);
    }
    this.toast('篝火点着了，下一只之前会回满');
  }

  animateFlame(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const tick = (now) => {
      if (!this.rested || !canvas.isConnected) return;
      ctx.fillStyle = '#1a100c';
      ctx.fillRect(0, 0, 400, 180);
      ctx.fillStyle = '#5a341c';
      ctx.fillRect(150, 130, 100, 16);
      ctx.fillRect(170, 122, 70, 14);
      for (let i = 0; i < 7; i++) {
        const h = 40 + Math.sin(now / 120 + i) * 18;
        ctx.fillStyle = i % 2 ? '#ffb703' : '#e85d04';
        ctx.beginPath();
        ctx.ellipse(175 + i * 10, 120 - h / 2, 8, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async climbExit() {
    if (this.map?.kind !== 'dungeon') return;
    if (this.living().length) return this.toast('这一层还没清完');
    this.placeAt(this.map.exit);
    const dungeon = this.map.dungeon;
    if (this.map.floor >= dungeon.floors) {
      this.auto = false;
      this.toast(`${dungeon.name}打完了`);
      this.enterTown(true);
      return;
    }
    this.enterFloor(dungeon, this.map.floor + 1);
  }

  give(itemId, extra = {}) {
    const d = itemDef(itemId);
    const placed = autoPlace(this.player.bag, {
      uid: newId(), itemId, w: extra.w || d.w, h: extra.h || d.h, plus: extra.plus || 0, fuse: extra.fuse || null,
    });
    if (!placed) return false;
    this.player.bag.push(placed);
    return true;
  }

  openShop() {
    this.bagMode = 'sell';
    const ids = SHOP_TABS[this.shopTab] || SHOP_TABS['武器'];
    const tabs = Object.keys(SHOP_TABS).map((name) => `<button data-tab="${name}">${name}</button>`).join('');
    this.openPanel(`
      <div class="split">
        <div>
          <h2>货架</h2>
          <div class="row">${tabs}<button id="buy-fire">篝火 ${CAMPFIRE_PRICE}金</button><button id="leave">离开</button></div>
          <div id="shelf"></div>
        </div>
        <div>
          <h2>背包</h2>
          <p class="note">点货架买下。点背包里的东西卖出一半价钱。右键旋转。</p>
          <div id="bag"></div>
        </div>
      </div>`, { wide: true, kind: 'shop' });
    const shelf = [];
    for (const id of ids) {
      const d = itemDef(id);
      const placed = autoPlace(shelf, { uid: id, itemId: id, w: d.w, h: d.h, price: d.price }, 8);
      if (placed) shelf.push(placed);
    }
    fillBag(this.panel.querySelector('#shelf'), shelf, [], { rows: 8, onClick: (it) => this.buyItem(it.itemId) });
    this.mountGear(this.panel.querySelector('#bag'));
    this.panel.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.onclick = () => { this.shopTab = btn.dataset.tab; this.openShop(); };
    });
    this.panel.querySelector('#buy-fire').onclick = () => {
      if (this.player.gold < CAMPFIRE_PRICE) return this.toast('金币不够');
      this.player.gold -= CAMPFIRE_PRICE;
      this.player.fires += 1;
      saveSave(this.player);
      this.refreshHud();
      this.toast('篝火 +1');
    };
    this.panel.querySelector('#leave').onclick = () => this.closePanel();
  }

  buyItem(id) {
    const d = itemDef(id);
    if (this.player.gold < d.price) return this.toast('金币不够');
    if (!this.give(id)) return this.toast('背包满了');
    this.player.gold -= d.price;
    this.snap('gear');
    this.toast(`买下${d.name}`);
    this.openShop();
  }

  book() {
    const saved = loadBook();
    if (saved) return saved;
    const asks = GENESIS_LISTINGS.map((g) => {
      const d = itemDef(g.itemId);
      return { ...g, plus: 0, fuse: null, w: d.w, h: d.h };
    });
    const book = { asks, bids: [] };
    saveBook(book);
    return book;
  }

  takeFills(book) {
    const fills = [];
    const asks = [];
    for (const ask of book.asks) {
      const bid = book.bids
        .filter((b) => b.itemId === ask.itemId && b.price >= ask.price && b.buyer !== ask.seller)
        .sort((a, b) => b.price - a.price)[0];
      if (!bid) {
        asks.push(ask);
        continue;
      }
      book.bids = book.bids.filter((b) => b.id !== bid.id);
      fills.push({ ask, bid });
    }
    book.asks = asks;
    return fills;
  }

  applyFill(fill) {
    const { ask, bid } = fill;
    if (bid && bid.buyer === this.player.name) {
      if (!this.give(ask.itemId, ask)) {
        this.player.gold += bid.price;
        this.toast('背包满了，买单退回');
        return false;
      }
      this.player.gold += Math.max(0, bid.price - ask.price);
    }
    if (ask.seller === this.player.name) this.player.gold += ask.price;
    return true;
  }

  commitBook(book, fills = [], pay = true) {
    if (pay) {
      const kept = [];
      for (const fill of fills) {
        if (this.applyFill(fill)) kept.push(fill);
        else book.asks.push(fill.ask);
      }
      fills = kept;
    }
    saveBook(book);
    this.market?.postMessage({ from: this.tab, book, fills });
    this.snap('order');
    this.refreshHud();
  }

  onMarket(msg) {
    if (!msg || msg.from === this.tab) return;
    if (msg.book) saveBook(msg.book);
    for (const fill of msg.fills || []) this.applyFill(fill);
    saveSave(this.player);
    if (this.panel.dataset.kind === 'auction') this.openAuction();
  }

  listAsk(it) {
    if (it.equipped) return this.toast('先换下再挂');
    const price = Math.max(1, Math.round(Number(this.panel.querySelector('#price')?.value) || itemDef(it.itemId).price));
    this.player.bag = this.player.bag.filter((b) => b.uid !== it.uid);
    const book = this.book();
    book.asks.push({
      id: newId(), seller: this.player.name, itemId: it.itemId, price,
      plus: it.plus || 0, fuse: it.fuse || null, w: it.w, h: it.h,
    });
    const fills = this.takeFills(book);
    this.commitBook(book, fills, true);
    this.toast(fills.length ? '卖单被买单吃掉了' : '已挂卖单');
    this.openAuction();
  }

  openAuction() {
    this.bagMode = 'ask';
    const book = this.book();
    const options = Object.keys(ITEMS).map((id) => `<option value="${id}">${ITEMS[id].name}</option>`).join('');
    const asks = book.asks.map((row) => `<div class="ask">${itemStats(row).name} ${row.price}金 ${row.seller} <button data-cancel-ask="${row.id}">撤</button></div>`).join('') || '<div>没有卖单</div>';
    const bids = book.bids.map((row) => `<div class="bid">${itemDef(row.itemId).name} ${row.price}金 ${row.buyer} <button data-cancel-bid="${row.id}">撤</button></div>`).join('') || '<div>没有买单</div>';
    this.openPanel(`
      <h2>拍卖行</h2>
      <div class="split">
        <div>
          <h2>卖单货架</h2>
          <div id="shelf"></div>
        </div>
        <div>
          <h2>背包</h2>
          <div class="row"><input id="price" type="number" min="1" value="20" style="width:80px" /><span class="note">点背包按这个价挂卖</span></div>
          <div id="bag"></div>
          <div class="row"><select id="bid-item">${options}</select><input id="bid-price" type="number" min="1" value="30" style="width:80px" /><button id="bid">挂买</button><button id="leave">离开</button></div>
        </div>
      </div>
      <div class="book"><div><h2>卖单</h2>${asks}</div><div><h2>买单</h2>${bids}</div></div>`, { wide: true, kind: 'auction' });
    const shelf = [];
    for (const ask of book.asks) {
      const d = itemDef(ask.itemId);
      const placed = autoPlace(shelf, { ...ask, uid: ask.id, w: ask.w || d.w, h: ask.h || d.h, price: ask.price }, 8);
      if (placed) shelf.push(placed);
    }
    fillBag(this.panel.querySelector('#shelf'), shelf, [], {
      rows: 8,
      onClick: (it) => this.buyAsk(book.asks.find((a) => a.id === it.uid)),
    });
    this.mountGear(this.panel.querySelector('#bag'));
    this.panel.querySelector('#bid').onclick = () => this.placeBid();
    this.panel.querySelector('#leave').onclick = () => this.closePanel();
    this.panel.querySelectorAll('[data-cancel-bid]').forEach((btn) => {
      btn.onclick = () => this.cancelBid(btn.dataset.cancelBid);
    });
    this.panel.querySelectorAll('[data-cancel-ask]').forEach((btn) => {
      btn.onclick = () => this.cancelAsk(btn.dataset.cancelAsk);
    });
  }

  buyAsk(ask) {
    if (!ask) return;
    if (ask.seller === this.player.name) return this.toast('这是你自己的单');
    if (this.player.gold < ask.price) return this.toast('金币不够');
    if (!this.give(ask.itemId, ask)) return this.toast('背包满了');
    this.player.gold -= ask.price;
    const book = this.book();
    book.asks = book.asks.filter((a) => a.id !== ask.id);
    this.commitBook(book, [{ ask, bid: { buyer: this.player.name, price: ask.price } }], false);
    this.toast(`买下${itemDef(ask.itemId).name}`);
    this.openAuction();
  }

  placeBid() {
    const itemId = this.panel.querySelector('#bid-item').value;
    const price = Math.max(1, Math.round(Number(this.panel.querySelector('#bid-price').value) || 1));
    if (this.player.gold < price) return this.toast('金币不够');
    this.player.gold -= price;
    const book = this.book();
    book.bids.push({ id: newId(), buyer: this.player.name, itemId, price });
    const fills = this.takeFills(book);
    this.commitBook(book, fills, true);
    this.toast(fills.length ? '买单成交' : '已挂买单');
    this.openAuction();
  }

  cancelBid(id) {
    const book = this.book();
    const bid = book.bids.find((b) => b.id === id && b.buyer === this.player.name);
    if (!bid) return;
    this.player.gold += bid.price;
    book.bids = book.bids.filter((b) => b.id !== id);
    this.commitBook(book);
    this.openAuction();
  }

  cancelAsk(id) {
    const book = this.book();
    const ask = book.asks.find((a) => a.id === id && a.seller === this.player.name);
    if (!ask) return this.toast('只能撤自己的卖单');
    if (!this.give(ask.itemId, ask)) return this.toast('背包满了');
    book.asks = book.asks.filter((a) => a.id !== id);
    this.commitBook(book);
    this.openAuction();
  }

  openForge() {
    this.bagMode = 'forge';
    this.openPanel(`
      <h2>熔炉</h2>
      <p class="note">点两件不同的，熔成一件，花 10 金。母件留下形状和种类，子件的攻击、防御和属性折半叠上去。相同的两件不要熔，拖到一起，最高 +10。角甲要放在四角，边符要靠边上，砺石挨着武器才生效。同属性两件以上额外 +2 攻击。守层者会在格子上落符。</p>
      <div id="bag"></div>
      <p id="pick">先点两件不同的</p>
      <div class="row"><button id="fuse">熔合</button><button id="leave">离开</button></div>`, { wide: true, kind: 'forge' });
    this.mountGear(this.panel.querySelector('#bag'));
    this.panel.querySelector('#fuse').onclick = () => this.fuseSelected();
    this.panel.querySelector('#leave').onclick = () => { this.forgePicks = []; this.closePanel(); };
  }

  fuseSelected() {
    const [idA, idB] = this.forgePicks;
    const a = this.player.bag.find((it) => it.uid === idA);
    const b = this.player.bag.find((it) => it.uid === idB);
    if (!a || !b) return this.toast('点两件');
    if (canStack(a, b)) return this.toast('相同的两件拖到一起升级');
    if (this.player.gold < 10) return this.toast('熔合要 10 金');
    const next = fusePair(a, b);
    this.player.gold -= 10;
    Object.assign(a, next);
    if (b.equipped) a.equipped = true;
    this.player.bag = this.player.bag.filter((it) => it.uid !== b.uid);
    this.forgePicks = [];
    this.syncWeapon();
    this.snap('gear');
    this.toast(`熔成 ${itemStats(a).name}`);
    this.openForge();
  }

  openBoard() {
    const rows = this.rankRows().map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.deepest}</td><td>${r.bosses || 0}</td><td>${r.pk}</td></tr>`).join('');
    const tx = localStorage.getItem('gm-tx-v1') || '';
    this.openPanel(`<h2>排行榜</h2><table><tr><th>#</th><th>名字</th><th>层数</th><th>守层</th><th>决斗</th></tr>${rows}</table><p class="note">杀一只、换一次装、进一层，各上传一整份档。浏览器留最近一份，是为了刷新后马上接着打，不用等交易确认。最近档号 ${tx || '还没有'}。</p><div class="row"><input id="txid" placeholder="档号" style="width:220px" /><button id="load-tx">按档号继续</button></div>`);
    this.panel.querySelector('#load-tx').onclick = () => this.restoreTx();
    this.paintBoard();
  }

  async restoreTx() {
    const id = this.panel.querySelector('#txid').value.trim();
    if (!id) return;
    try {
      const { fetchSnap } = await import('./uplink.js');
      const snap = await fetchSnap(id);
      this.player = snap.player;
      this.player.runes = this.player.runes || [];
      this.player.tomeAtk = this.player.tomeAtk || 0;
      saveSave(this.player);
      this.syncWeapon();
      this.refreshHud();
      this.toast('已按这份档继续');
    } catch (err) {
      this.toast(String(err.message || err));
    }
  }

  openGate() {
    const cards = DUNGEONS.map((d) => {
      const floors = d.mode === 'haul' ? '不封顶' : `${d.floors}层`;
      const locked = this.player.level < d.min;
      return `<button class="card" data-gate="${d.id}" ${locked ? 'disabled' : ''}><b>${d.name}</b>${MODE_NAME[d.mode]} · ${elementName(d.element)}气 · ${floors} · ${d.heights}楼高<br>${d.blurb}<br>需要 Lv${d.min}</button>`;
    }).join('');
    this.openPanel(`
      <h2>守门人</h2>
      <p class="note">要下哪一座？队伍在这儿凑。逐层是一关一关走；长途不封顶；日课今天全员同一张图；攀登金币更厚，休息要两份篝火；团本带了队友，怪会变厚。</p>
      <div class="cards">${cards}</div>
      <h2>队伍</h2>
      <p class="note">同一浏览器再开一个标签，用房间码加入。没有人时可以带佣兵。</p>
      <div class="row"><button id="host">开房</button><input id="code" placeholder="房间码" style="width:90px" /><button id="join">加入</button><button id="merc">带两名佣兵</button><button id="leave">离开</button></div>
      <div id="members"></div>`, { wide: true, kind: 'gate' });
    this.panel.querySelectorAll('[data-gate]').forEach((btn) => {
      btn.onclick = () => {
        const dungeon = DUNGEONS.find((d) => d.id === btn.dataset.gate);
        if (this.player.level < dungeon.min) return;
        this.enterFloor(dungeon, 1);
      };
    });
    this.panel.querySelector('#leave').onclick = () => this.closePanel();
    const show = () => {
      this.panel.querySelector('#members').textContent = this.allies.length
        ? this.allies.map((a) => `${a.name}·${elementName(a.element)}`).join('，')
        : '还没有队友';
    };
    show();
    this.panel.querySelector('#host').onclick = () => {
      this.party.codeRoom = this.party.code;
      this.party.open(this.party.code);
      this.panel.querySelector('#code').value = this.party.code;
      this.toast(`房间 ${this.party.code}`);
    };
    this.panel.querySelector('#join').onclick = () => {
      const code = this.panel.querySelector('#code').value.trim().toUpperCase();
      if (!code) return;
      this.party.codeRoom = code;
      this.party.open(code);
      const power = combatPower(this.player);
      this.party.send({ t: 'join', id: this.player.name, name: this.player.name, atk: power.atk, element: itemDef(this.player.skillId)?.element || 'wind' });
    };
    this.panel.querySelector('#merc').onclick = () => {
      this.allies = MERCENARIES.slice(0, 2).map((m) => ({ ...m }));
      show();
      this.toast('林渠和何炉入队');
    };
  }

  openParty() {
    this.openPanel(`<h2>团本</h2><p class="note">同一浏览器再开一个标签，用房间码加入。加入者的属性和攻击会算进每一次结算。没有人时可以带佣兵。</p><div class="row"><button id="host">开房</button><input id="code" placeholder="房间码" style="width:90px" /><button id="join">加入</button><button id="merc">带两名佣兵</button></div><div id="members"></div>`);
    const show = () => {
      this.panel.querySelector('#members').textContent = this.allies.length
        ? this.allies.map((a) => `${a.name}·${elementName(a.element)}`).join('，')
        : '还没有队友';
    };
    show();
    this.panel.querySelector('#host').onclick = () => {
      this.party.codeRoom = this.party.code;
      this.party.open(this.party.code);
      this.panel.querySelector('#code').value = this.party.code;
      this.toast(`房间 ${this.party.code}`);
    };
    this.panel.querySelector('#join').onclick = () => {
      const code = this.panel.querySelector('#code').value.trim().toUpperCase();
      if (!code) return;
      this.party.codeRoom = code;
      this.party.open(code);
      const power = combatPower(this.player);
      this.party.send({ t: 'join', id: this.player.name, name: this.player.name, atk: power.atk, element: itemDef(this.player.skillId)?.element || 'wind' });
    };
    this.panel.querySelector('#merc').onclick = () => {
      this.allies = MERCENARIES.slice(0, 2).map((m) => ({ ...m }));
      show();
      this.toast('林渠和何炉入队');
    };
  }

  onParty(msg) {
    if (msg.t === 'join' && !this.allies.some((a) => a.id === msg.id) && this.allies.length < 2) {
      this.allies.push({ id: msg.id, name: msg.name, atk: msg.atk, element: msg.element });
      this.toast(`${msg.name}加入队伍`);
    }
  }

  openPk() {
    const foes = MERCENARIES.map((m) => `<button data-pk="${m.id}">${m.name} · ${elementName(m.element)} · ${m.pk}</button>`).join('');
    this.openPanel(`<h2>组队决斗</h2><p class="note">你和当前队伍打对方一队。一场只结算一次。</p><div class="row">${foes}</div>`);
    this.panel.querySelectorAll('[data-pk]').forEach((btn) => {
      btn.onclick = () => this.teamPk(btn.dataset.pk);
    });
  }

  async teamPk(id) {
    const foe = MERCENARIES.find((m) => m.id === id);
    const monster = {
      id: `pk-${id}`,
      name: foe.name,
      element: foe.element,
      hp: 20 + foe.level * 8,
      atk: 3 + foe.level,
      def: Math.floor(foe.level / 2),
      gold: 0,
      xp: 0,
      tier: 1,
      boss: false,
      x: this.gx + 1,
      y: this.gy,
      z: this.gz,
    };
    this.closePanel();
    this.busy = true;
    const rng = mulberry32Fight(id + this.player.pk);
    const preview = resolveFight(this.player, monster, rng, this.allies);
    for (const sw of preview.swings) {
      if (sw.side === 'player') await this.view.swing();
      else this.float(String(sw.dmg));
    }
    const delta = preview.win ? 16 : -12;
    this.player.pk = Math.max(0, this.player.pk + delta);
    this.announce({ t: 'pk', id: newId(), win: preview.win, pk: this.player.pk, foe: foe.name });
    saveSave(this.player);
    this.busy = false;
    this.refreshHud();
    this.toast(preview.win ? `胜，决斗分 ${this.player.pk}` : `负，决斗分 ${this.player.pk}`);
  }
}

function mulberry32Fight(text) {
  let seed = hashSeed(String(text));
  return function rng() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
