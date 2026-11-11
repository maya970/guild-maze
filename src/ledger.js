const SAVE = 'gm-save-v2';
const LOG = 'gm-log-v2';
const AUCTION = 'gm-auction-v2';

export function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE) || 'null');
  } catch {
    return null;
  }
}

export function saveSave(player) {
  localStorage.setItem(SAVE, JSON.stringify(player));
}

export function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG) || '[]');
  } catch {
    return [];
  }
}

export function pushRecord(record) {
  const log = loadLog();
  log.push({ ...record, at: Date.now() });
  localStorage.setItem(LOG, JSON.stringify(log.slice(-80)));
  return record;
}

export function loadAuctions(genesis) {
  try {
    const extra = JSON.parse(localStorage.getItem(AUCTION) || '[]');
    const gone = new Set(extra.filter((r) => r.t === 'gone').map((r) => r.id));
    const listed = extra.filter((r) => r.t === 'list' && !gone.has(r.id));
    return [...genesis.filter((g) => !gone.has(g.id)), ...listed];
  } catch {
    return genesis;
  }
}

export function mutateAuction(entry) {
  const extra = JSON.parse(localStorage.getItem(AUCTION) || '[]');
  extra.push(entry);
  localStorage.setItem(AUCTION, JSON.stringify(extra.slice(-100)));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

const QUEUE = 'gm-uplink-v1';

export function enqueue(record) {
  let q = [];
  try { q = JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch { q = []; }
  q.push(record);
  let raw = JSON.stringify(q);
  while (raw.length > 90000 && q.length > 1) {
    q.shift();
    raw = JSON.stringify(q);
  }
  localStorage.setItem(QUEUE, raw);
  return q.length;
}

export function queueSize() {
  try { return JSON.parse(localStorage.getItem(QUEUE) || '[]').length; } catch { return 0; }
}

const BOOK = 'gm-book-v1';

export function loadBook() {
  try {
    const book = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (book?.asks && book?.bids) return book;
  } catch { /* empty book */ }
  return null;
}

export function saveBook(book) {
  localStorage.setItem(BOOK, JSON.stringify(book));
}
