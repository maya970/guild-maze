import { buildDungeonFloor, buildTown, bfs3, mulberry32 } from '../src/gen.js';
import { DUNGEONS, itemStats } from '../src/data.js';
import { resolveFight } from '../src/resolve.js';

const town = buildTown();
if (!town.levels[0][22][22]) throw new Error('town spawn blocked');
for (const d of DUNGEONS) {
  const map = buildDungeonFloor(d, 1, 7);
  if (map.heights < 3) throw new Error('height ' + d.id);
  if (map.levels.length !== map.heights) throw new Error('levels ' + d.id);
  const alive = map.monsters.filter((m) => !m.boss);
  const boss = map.monsters.filter((m) => m.boss);
  if (boss.length !== 1) throw new Error('boss ' + d.id + ' ' + boss.length);
  if (map.monsters.length < 12) throw new Error('count ' + d.id + ' ' + map.monsters.length);
  const m = map.monsters[0];
  const path = bfs3(map, map.spawn.x, map.spawn.y, map.spawn.z, m.x, m.y, m.z);
  if (!path) throw new Error('path ' + d.id);
  const roles = {};
  for (const mon of map.monsters.filter((x) => x.z === 0)) roles[mon.role] = (roles[mon.role] || 0) + 1;
  if (roles.W !== 3 || roles.S !== 1) throw new Error('wave0 ' + JSON.stringify(roles));
}
const player = {
  level: 1, xp: 0, hp: 40, skillId: 'skill_water', buffs: [],
  bag: [{ uid: 'a', itemId: 'rust_blade', x: 0, y: 0, w: 1, h: 3, equipped: true }],
};
const monster = { id: 'm', element: 'fire', hp: 16, atk: 3, def: 0, gold: 4, xp: 4, tier: 1, boss: false };
const fight = resolveFight(player, monster, mulberry32(1), [{ name: '林渠', element: 'water', atk: 7 }]);
if (!fight.win || fight.swings.length < 1) throw new Error('fight failed');
const fused = itemStats({ itemId: 'rust_blade', plus: 1, fuse: { atk: 2, name: '碎铁', def: 0, element: null } });
if (fused.atk < 6) throw new Error('fuse ' + fused.atk);
console.log('ok', DUNGEONS.map((d) => d.floors).join(','), 'swings', fight.swings.length, 'rel', fight.relation.relation);
