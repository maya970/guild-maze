const cache = new Map();

function key(metal, tint) {
  return `${metal}|${tint || ''}`;
}

export function metalCanvas(metal = 'iron', tint = '#d9dde2') {
  const id = key(metal, tint);
  if (cache.has(id)) return cache.get(id);
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  const palettes = {
    rust: ['#8a5a3a', '#c2b09a', '#6a3a28', '#e6d2b0'],
    iron: ['#8d97a3', '#f2f4f6', '#5c6770', '#d9dde2'],
    star: ['#8a5a28', '#f0c36a', '#fff1c2', '#c47a32'],
    tide: ['#3d6d78', '#b7e0ea', '#d8fbff', '#4aa4c9'],
    bone: ['#d7c7a4', '#f6efe2', '#a89070', '#fffaf0'],
    ember: ['#7a3018', '#e07a3d', '#ffd0a4', '#c4473a'],
    wind: ['#6a8a62', '#e7f6d8', '#ffffff', '#b7d9a8'],
    thunder: ['#3a4a78', '#d5e4ff', '#ffffff', '#8eb0e8'],
  };
  const [dark, mid, light, edge] = palettes[metal] || palettes.iron;
  g.fillStyle = dark;
  g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 2) {
    const n = (y * 17) % 23;
    g.fillStyle = y % 8 < 4 ? mid : light;
    g.globalAlpha = 0.35 + (n % 5) * 0.08;
    g.fillRect(8 + (n % 7), y, 112 - (n % 11), 2);
  }
  g.globalAlpha = 1;
  g.fillStyle = edge;
  g.fillRect(58, 0, 8, 256);
  g.fillStyle = tint || edge;
  g.globalAlpha = 0.55;
  g.fillRect(0, 0, 10, 256);
  g.fillRect(118, 0, 10, 256);
  g.globalAlpha = 1;
  if (metal === 'rust') {
    g.fillStyle = '#6a3018';
    for (let i = 0; i < 18; i++) g.fillRect((i * 37) % 120, (i * 53) % 240, 14, 8);
  }
  if (metal === 'bone') {
    g.strokeStyle = 'rgba(90,70,40,0.45)';
    g.lineWidth = 2;
    for (let y = 20; y < 240; y += 28) {
      g.beginPath();
      g.moveTo(20, y);
      g.lineTo(108, y + 8);
      g.stroke();
    }
  }
  cache.set(id, c);
  return c;
}

export function woodCanvas() {
  if (cache.has('wood')) return cache.get('wood');
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#6b4428';
  g.fillRect(0, 0, 64, 128);
  g.strokeStyle = '#3a2414';
  g.lineWidth = 2;
  for (let x = 6; x < 64; x += 8) {
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + 4, 40, x - 4, 80, x + 2, 128);
    g.stroke();
  }
  cache.set('wood', c);
  return c;
}

export function metalURL(metal, tint) {
  const c = metalCanvas(metal, tint);
  if (!c._url) c._url = c.toDataURL();
  return c._url;
}
