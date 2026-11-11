import { itemStats } from './data.js';

const CELL = 42;

function glyph(d) {
  if (d.form === 'sword') return '刃';
  if (d.form === 'spear') return '矛';
  if (d.form === 'axe') return '斧';
  if (d.form === 'staff') return '杖';
  if (d.kind === 'armor') return '甲';
  if (d.kind === 'potion' || d.kind === 'brew') return '药';
  if (d.kind === 'skill') return '技';
  if (d.kind === 'material') return '料';
  if (d.kind === 'tome') return '页';
  return '符';
}

export function fillBag(host, bag, runes, api) {
  const rows = api.rows || 6;
  host.innerHTML = '';
  host.className = 'grid';
  host.style.height = `${rows * CELL}px`;
  for (const rune of runes || []) {
    const mark = document.createElement('i');
    mark.className = 'rune';
    mark.style.left = `${rune.x * CELL + 8}px`;
    mark.style.top = `${rune.y * CELL + 8}px`;
    host.appendChild(mark);
  }
  for (const it of bag) {
    const d = itemStats(it);
    if (!d) continue;
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'cell-item';
    if (it.equipped) node.classList.add('eq');
    if (api.selected?.includes(it.uid)) node.classList.add('sel');
    node.style.left = `${it.x * CELL}px`;
    node.style.top = `${it.y * CELL}px`;
    node.style.width = `${it.w * CELL - 4}px`;
    node.style.height = `${it.h * CELL - 4}px`;
    node.style.background = d.color;
    node.title = d.name;
    node.innerHTML = `<b>${glyph(d)}</b><span>${d.name}</span>${it.price ? `<em>${it.price}</em>` : ''}`;
    node.oncontextmenu = (ev) => {
      ev.preventDefault();
      api.onRotate?.(it);
    };
    node.onpointerdown = (ev) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();
      const startX = ev.clientX;
      const startY = ev.clientY;
      const up = (e) => {
        window.removeEventListener('pointerup', up);
        const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (moved < 6 || !api.onDrop) {
          api.onClick?.(it);
          return;
        }
        const rect = host.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / CELL - it.w / 2);
        const y = Math.round((e.clientY - rect.top) / CELL - it.h / 2);
        api.onDrop(it, x, y);
      };
      window.addEventListener('pointerup', up);
    };
    host.appendChild(node);
  }
}
