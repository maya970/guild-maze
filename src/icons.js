import { itemDef } from './data.js';

const canvases = new Map();

function round(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wash(g, sky, ground) {
  g.clearRect(0, 0, 160, 200);
  const grd = g.createLinearGradient(0, 0, 0, 200);
  grd.addColorStop(0, sky);
  grd.addColorStop(1, ground);
  g.fillStyle = grd;
  round(g, 2, 2, 156, 196, 18);
  g.fill();
}

function person(g, p) {
  wash(g, p.sky, p.ground);
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath();
  g.ellipse(80, 186, 40, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = p.cloth;
  g.beginPath();
  g.moveTo(46, 198);
  g.quadraticCurveTo(80, p.waist || 118, 114, 198);
  g.fill();
  g.fillStyle = p.skin;
  g.fillRect(71, 98, 18, 14);
  g.beginPath();
  g.ellipse(80, 76, p.fw || 26, p.fh || 30, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = p.hair;
  if (p.hairStyle === 'bun') {
    g.beginPath();
    g.arc(80, 46, 12, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(80, 68, 28, Math.PI * 1.05, Math.PI * 1.95);
    g.fill();
  } else if (p.hairStyle === 'long') {
    g.fillRect(52, 58, 56, 18);
    g.fillRect(50, 70, 12, 70);
    g.fillRect(98, 70, 12, 70);
  } else if (p.hairStyle === 'hood') {
    g.fillStyle = p.cloth;
    g.beginPath();
    g.arc(80, 78, 40, Math.PI, 0);
    g.lineTo(120, 128);
    g.lineTo(40, 128);
    g.fill();
    g.fillStyle = '#0c0a08';
    g.beginPath();
    g.ellipse(80, 86, 24, 16, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = p.skin;
    g.fillRect(62, 96, 36, 16);
  } else if (p.hairStyle === 'bald') {
    g.beginPath();
    g.arc(80, 62, 8, 0, Math.PI);
    g.fill();
  } else if (p.hairStyle === 'tail') {
    g.beginPath();
    g.arc(80, 68, 28, Math.PI, 0);
    g.fill();
    g.fillRect(104, 62, 10, 48);
  } else {
    g.beginPath();
    g.arc(80, 66, 28, Math.PI * 1.02, Math.PI * 1.98);
    g.fill();
  }
  if (p.hairStyle !== 'hood') {
    g.fillStyle = '#1a120c';
    g.fillRect(66, 74, 8, 6);
    g.fillRect(88, 74, 8, 6);
    g.fillStyle = p.eye || '#f7f1e6';
    g.fillRect(67, 75, 4, 3);
    g.fillRect(89, 75, 4, 3);
  }
  p.draw?.(g);
}

function door(g, wood, glow, mark) {
  g.clearRect(0, 0, 160, 200);
  g.fillStyle = '#241910';
  round(g, 2, 2, 156, 196, 18);
  g.fill();
  g.fillStyle = '#8d7b66';
  g.fillRect(18, 16, 18, 168);
  g.fillRect(124, 16, 18, 168);
  g.fillRect(18, 12, 124, 18);
  g.fillStyle = wood;
  round(g, 40, 36, 80, 148, 8);
  g.fill();
  g.fillStyle = glow;
  g.globalAlpha = 0.9;
  g.beginPath();
  g.arc(80, 96, 28, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#1a120c';
  g.font = 'bold 36px Microsoft YaHei, sans-serif';
  g.textAlign = 'center';
  g.fillText(mark, 80, 110);
  g.fillStyle = '#e6c27a';
  g.beginPath();
  g.arc(108, 112, 5, 0, Math.PI * 2);
  g.fill();
}

function foe(g, color, boss) {
  g.clearRect(0, 0, 160, 200);
  g.fillStyle = '#1a1410';
  round(g, 2, 2, 156, 196, 22);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(30, 190);
  g.lineTo(80, 96);
  g.lineTo(130, 190);
  g.fill();
  g.beginPath();
  g.ellipse(80, 86, boss ? 48 : 40, boss ? 42 : 36, 0, 0, Math.PI * 2);
  g.fill();
  if (boss) {
    g.fillStyle = '#e6c27a';
    g.beginPath();
    g.moveTo(40, 70);
    g.lineTo(58, 28);
    g.lineTo(70, 72);
    g.fill();
    g.beginPath();
    g.moveTo(120, 70);
    g.lineTo(102, 28);
    g.lineTo(90, 72);
    g.fill();
  }
  g.fillStyle = '#1a120c';
  g.beginPath();
  g.ellipse(62, 86, 8, 10, 0, 0, Math.PI * 2);
  g.ellipse(98, 86, 8, 10, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#1a120c';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(58, 118);
  g.lineTo(80, 128);
  g.lineTo(102, 118);
  g.stroke();
}

const PEOPLE = {
  shop: { sky: '#6a4a32', ground: '#2a1c12', cloth: '#c4864a', skin: '#f3c7a2', hair: '#3a2414', hairStyle: 'bun', fw: 24, fh: 28, draw(g) { g.fillStyle = '#f4efe6'; g.fillRect(58, 118, 44, 28); g.fillStyle = '#e6c27a'; g.beginPath(); g.arc(108, 158, 12, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8a5a28'; g.fillRect(104, 154, 8, 8); } },
  auction: { sky: '#3a2a48', ground: '#1a1220', cloth: '#6d4f92', skin: '#f0d2b4', hair: '#1a1020', hairStyle: 'long', fw: 22, fh: 32, waist: 108, draw(g) { g.fillStyle = '#f6f1e6'; g.fillRect(96, 124, 34, 42); g.strokeStyle = '#3a2418'; g.strokeRect(100, 132, 26, 8); g.strokeRect(100, 146, 26, 8); } },
  leaderboard: { sky: '#5a4a28', ground: '#241c10', cloth: '#d7c07a', skin: '#e4b48e', hair: '#f2efe6', hairStyle: 'short', fw: 28, fh: 30, draw(g) { g.fillStyle = '#1a120c'; g.fillRect(104, 128, 28, 36); g.fillStyle = '#e6c27a'; g.fillRect(108, 136, 20, 4); g.fillRect(108, 146, 14, 4); } },
  pk: { sky: '#5a241c', ground: '#1c0c0a', cloth: '#a33b32', skin: '#e8b090', hair: '#1a120c', hairStyle: 'tail', eye: '#e25b3a', draw(g) { g.strokeStyle = '#f4efe6'; g.lineWidth = 5; g.beginPath(); g.moveTo(112, 112); g.lineTo(142, 176); g.stroke(); g.strokeStyle = '#c4473a'; g.beginPath(); g.moveTo(70, 92); g.lineTo(92, 96); g.stroke(); } },
  forge: { sky: '#4a2a18', ground: '#1c100c', cloth: '#5c4638', skin: '#c9896a', hair: '#2a180e', hairStyle: 'bald', fw: 30, fh: 28, waist: 126, draw(g) { g.fillStyle = '#2a180e'; g.fillRect(62, 96, 36, 8); g.fillStyle = '#8d97a3'; g.fillRect(108, 118, 8, 40); g.fillStyle = '#6a5344'; g.fillRect(98, 112, 28, 12); g.fillStyle = '#e07a3d'; g.beginPath(); g.arc(122, 108, 6, 0, Math.PI * 2); g.fill(); } },
  warden: { sky: '#1c3a44', ground: '#0e181c', cloth: '#2c4a58', skin: '#e8c4a4', hair: '#0e181c', hairStyle: 'hood', draw(g) { g.fillStyle = '#e6c27a'; g.beginPath(); g.arc(118, 150, 12, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f4e7c8'; g.beginPath(); g.arc(118, 150, 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#6ea4b8'; g.lineWidth = 3; g.beginPath(); g.moveTo(118, 162); g.lineTo(118, 186); g.stroke(); } },
  player: { sky: '#3a3428', ground: '#16120e', cloth: '#6e6256', skin: '#f0c9a0', hair: '#4a3424', hairStyle: 'short', draw(g) { g.fillStyle = '#3a2a1c'; g.beginPath(); g.arc(112, 132, 14, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c2b09a'; g.lineWidth = 3; g.beginPath(); g.moveTo(48, 140); g.lineTo(36, 176); g.stroke(); } },
  lin: { sky: '#1a4048', ground: '#0e2428', cloth: '#2f6f86', skin: '#f0c9a0', hair: '#102028', hairStyle: 'long', fw: 23, fh: 30, draw(g) { g.strokeStyle = '#d7e6ea'; g.lineWidth = 4; g.beginPath(); g.moveTo(118, 108); g.lineTo(118, 186); g.stroke(); g.fillStyle = '#9fd4e4'; g.beginPath(); g.moveTo(108, 108); g.lineTo(118, 88); g.lineTo(128, 108); g.fill(); } },
  he: { sky: '#5a2418', ground: '#1c0e0c', cloth: '#8a3024', skin: '#e0a888', hair: '#3a140e', hairStyle: 'tail', eye: '#e25b3a', draw(g) { g.fillStyle = '#e25b3a'; g.fillRect(58, 100, 44, 10); g.fillStyle = '#f0c36a'; g.beginPath(); g.arc(40, 150, 10, 0, Math.PI * 2); g.fill(); } },
  qiu: { sky: '#4a3c24', ground: '#1c160e', cloth: '#a48448', skin: '#e7c09a', hair: '#3a2a14', hairStyle: 'bun', fw: 26, fh: 28, draw(g) { g.fillStyle = '#f2efe6'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(58 + i * 8, 124, 4, 0, Math.PI * 2); g.fill(); } g.strokeStyle = '#6a5344'; g.beginPath(); g.moveTo(100, 150); g.lineTo(132, 168); g.stroke(); } },
  su: { sky: '#243048', ground: '#10141c', cloth: '#d5e4ff', skin: '#f0d0b0', hair: '#e8eef8', hairStyle: 'short', fw: 24, fh: 30, eye: '#8eb0e8', draw(g) { g.strokeStyle = '#8eb0e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(112, 120); g.lineTo(128, 104); g.lineTo(120, 140); g.lineTo(140, 128); g.stroke(); } },
};

const DOORS = {
  drain: ['#3d5c68', '#4aa4c9', '渠'],
  crypt: ['#5c5040', '#c4a15a', '墓'],
  ridge: ['#3c5040', '#b7d9a8', '脊'],
  spark: ['#303848', '#8eb0e8', '雷'],
  tide: ['#2c4450', '#7ec8d6', '潮'],
  well: ['#503028', '#e07a3d', '井'],
  haul: ['#4a4030', '#d7c07a', '途'],
  daily: ['#3a4038', '#e6c27a', '日'],
  climb: ['#503028', '#e25b3a', '攀'],
  raid: ['#243048', '#c5d7f5', '团'],
};

const FOE_COLOR = {
  water: '#4aa4c9',
  fire: '#e25b3a',
  earth: '#c4a15a',
  wind: '#b7d9a8',
  thunder: '#8eb0e8',
};

function paint(g, id) {
  if (PEOPLE[id]) return person(g, PEOPLE[id]);
  if (DOORS[id]) return door(g, ...DOORS[id]);
  if (id.startsWith('foe-')) {
    const boss = id.endsWith('-boss');
    const element = id.slice(4).replace(/-boss$/, '');
    return foe(g, FOE_COLOR[element] || '#88aa77', boss);
  }
  return person(g, PEOPLE.player);
}

export function portraitCanvas(id) {
  if (canvases.has(id)) return canvases.get(id);
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 200;
  paint(canvas.getContext('2d'), id);
  canvases.set(id, canvas);
  return canvas;
}

export function portraitURL(id) {
  const canvas = portraitCanvas(id);
  if (!canvas._url) canvas._url = canvas.toDataURL();
  return canvas._url;
}

const itemCanvases = new Map();

function blade(g, color, nicks) {
  g.fillStyle = '#6b4428';
  g.fillRect(40, 70, 16, 16);
  g.fillStyle = '#c4a15a';
  g.fillRect(28, 66, 40, 6);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(44, 66);
  g.lineTo(52, 66);
  g.lineTo(50, 12);
  g.lineTo(46, 12);
  g.fill();
  if (nicks) {
    g.fillStyle = '#6a3a28';
    g.fillRect(46, 28, 6, 4);
    g.fillRect(46, 44, 6, 3);
  }
}

function spear(g, color) {
  g.fillStyle = '#6b4428';
  g.fillRect(44, 28, 8, 62);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(48, 6);
  g.lineTo(60, 28);
  g.lineTo(36, 28);
  g.fill();
}

function axe(g, color, bone) {
  g.fillStyle = bone ? '#e6d2b0' : '#6b4428';
  g.fillRect(46, 28, 8, 60);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(50, 16);
  g.lineTo(82, 28);
  g.lineTo(78, 48);
  g.lineTo(50, 40);
  g.fill();
}

function staff(g, color) {
  g.fillStyle = '#6b4428';
  g.fillRect(45, 30, 8, 58);
  g.fillStyle = color;
  g.beginPath();
  g.arc(49, 22, 14, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.globalAlpha = 0.45;
  g.beginPath();
  g.arc(44, 16, 4, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

function paintItem(g, id, d) {
  const color = d.color || '#d9dde2';
  g.fillStyle = '#1b1612';
  round(g, 2, 2, 92, 92, 14);
  g.fill();
  g.fillStyle = color;
  g.globalAlpha = 0.18;
  g.fillRect(8, 8, 80, 80);
  g.globalAlpha = 1;
  if (id === 'rust_blade') blade(g, '#c2b09a', true);
  else if (id === 'iron_blade') blade(g, '#e8eef2', false);
  else if (id === 'star_edge') { blade(g, '#f0c36a', false); g.fillStyle = '#fff1c2'; g.beginPath(); g.arc(70, 24, 6, 0, Math.PI * 2); g.fill(); }
  else if (id === 'canal_spear') spear(g, '#8fb8a8');
  else if (id === 'tide_spear') { spear(g, '#7ec8d6'); g.strokeStyle = '#d8fbff'; g.strokeRect(36, 36, 24, 8); }
  else if (id === 'bone_axe') axe(g, '#f2efe6', true);
  else if (id === 'well_axe') axe(g, '#e07a3d', false);
  else if (id === 'wind_staff') staff(g, '#d5ecc4');
  else if (id === 'thunder_staff') staff(g, '#c5d7f5');
  else if (id === 'oak_board') { g.fillStyle = '#a56b32'; round(g, 22, 16, 52, 64, 8); g.fill(); g.strokeStyle = '#6b4428'; g.strokeRect(34, 28, 28, 36); }
  else if (id === 'mail_scrap') { g.fillStyle = '#8d97a3'; g.fillRect(28, 22, 40, 48); g.fillStyle = '#3a4248'; for (let y = 26; y < 66; y += 8) g.fillRect(30, y, 36, 2); }
  else if (id === 'tide_coat') { g.fillStyle = '#6ea4b8'; g.beginPath(); g.moveTo(30, 20); g.lineTo(66, 20); g.lineTo(78, 78); g.lineTo(18, 78); g.fill(); g.fillStyle = '#d8fbff'; g.fillRect(40, 32, 16, 8); }
  else if (id === 'well_plate') { g.fillStyle = '#e0a15a'; g.fillRect(24, 22, 48, 52); g.fillStyle = '#8a3018'; g.fillRect(40, 34, 16, 20); }
  else if (id === 'corner_plate') { g.fillStyle = '#8d97a3'; g.beginPath(); g.moveTo(18, 18); g.lineTo(70, 18); g.lineTo(18, 70); g.fill(); }
  else if (id === 'vial') { g.fillStyle = '#f4efe6'; g.fillRect(40, 16, 16, 8); g.fillStyle = '#d4534a'; round(g, 36, 24, 24, 48, 10); g.fill(); }
  else if (id === 'flask') { g.fillStyle = '#f4efe6'; g.fillRect(40, 12, 16, 14); g.fillStyle = '#e07a3d'; g.beginPath(); g.moveTo(34, 28); g.lineTo(62, 28); g.lineTo(70, 80); g.lineTo(26, 80); g.fill(); }
  else if (id === 'charm') { g.fillStyle = '#d7b15a'; g.beginPath(); g.arc(48, 40, 16, 0, Math.PI * 2); g.fill(); g.fillRect(44, 54, 8, 22); }
  else if (id === 'fang') { g.fillStyle = '#f2efe6'; g.beginPath(); g.moveTo(40, 16); g.quadraticCurveTo(70, 40, 48, 82); g.quadraticCurveTo(36, 40, 40, 16); g.fill(); }
  else if (id === 'grit') { g.fillStyle = '#9a8f84'; g.beginPath(); g.moveTo(24, 60); g.lineTo(48, 22); g.lineTo(74, 58); g.lineTo(60, 74); g.lineTo(30, 72); g.fill(); }
  else if (id === 'echo') { g.strokeStyle = '#d5ecc4'; g.lineWidth = 4; g.beginPath(); g.arc(48, 48, 12, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(48, 48, 24, 0.4, 2.2); g.stroke(); }
  else if (id === 'edge_charm') { g.fillStyle = '#e0c48a'; g.fillRect(40, 14, 16, 64); g.fillRect(28, 28, 40, 12); }
  else if (id.startsWith('brew_')) { g.fillStyle = color; g.beginPath(); g.arc(48, 50, id === 'brew_earth' ? 16 : 12, 0, Math.PI * 2); g.fill(); if (id === 'brew_wind') { g.strokeStyle = '#fff'; g.beginPath(); g.arc(48, 50, 22, 0, 1.4); g.stroke(); } if (id === 'brew_thunder') { g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(48, 28); g.lineTo(40, 50); g.lineTo(52, 50); g.lineTo(42, 72); g.stroke(); } }
  else if (id.startsWith('skill_')) { g.fillStyle = '#f6f1e6'; g.fillRect(22, 24, 52, 48); g.fillStyle = color; g.fillRect(28, 32, 40, 8); g.fillRect(28, 46, 28, 6); }
  else if (id === 'tome_power') { g.fillStyle = '#f2efe6'; g.fillRect(28, 16, 40, 64); g.fillStyle = '#c4473a'; g.fillRect(34, 28, 28, 6); g.fillRect(34, 40, 20, 4); }
  else if (id === 'iron_chip') { g.fillStyle = '#b7b1a8'; g.beginPath(); g.moveTo(24, 40); g.lineTo(60, 20); g.lineTo(78, 48); g.lineTo(40, 72); g.fill(); }
  else if (id === 'bone_dust') { g.fillStyle = '#e6d2b0'; for (const [x, y] of [[30, 40], [48, 28], [62, 50], [40, 62]]) { g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); } }
  else if (id === 'tide_salt') { g.fillStyle = '#9fd4e4'; for (let i = 0; i < 5; i++) { g.save(); g.translate(30 + (i % 3) * 18, 30 + Math.floor(i / 3) * 22); g.rotate(i); g.fillRect(-6, -6, 12, 12); g.restore(); } }
  else if (id === 'slag') { g.fillStyle = '#e07a3d'; g.beginPath(); g.moveTo(20, 64); g.lineTo(40, 24); g.lineTo(70, 36); g.lineTo(76, 70); g.fill(); g.fillStyle = '#3a2018'; g.fillRect(44, 40, 10, 8); }
  else if (id === 'plume') { g.fillStyle = '#d5ecc4'; g.beginPath(); g.moveTo(48, 78); g.quadraticCurveTo(20, 40, 48, 14); g.quadraticCurveTo(76, 40, 48, 78); g.fill(); g.strokeStyle = '#6a8a62'; g.beginPath(); g.moveTo(48, 18); g.lineTo(48, 76); g.stroke(); }
  else if (d.form === 'sword') blade(g, color, false);
  else if (d.form === 'spear') spear(g, color);
  else if (d.form === 'axe') axe(g, color, false);
  else if (d.form === 'staff') staff(g, color);
  else { g.fillStyle = color; round(g, 28, 28, 40, 40, 8); g.fill(); }
}

export function itemIconCanvas(id) {
  if (itemCanvases.has(id)) return itemCanvases.get(id);
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  paintItem(canvas.getContext('2d'), id, itemDef(id) || {});
  itemCanvases.set(id, canvas);
  return canvas;
}

export function itemIconURL(id) {
  const canvas = itemIconCanvas(id);
  if (!canvas._url) canvas._url = canvas.toDataURL();
  return canvas._url;
}
