import Arweave from 'arweave';
import { ArweaveSigner, createData } from 'arbundles/web';

const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const KEY = 'gm-jwk-v1';
const TX = 'gm-tx-v1';

let chain = Promise.resolve();

async function wallet() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const jwk = await arweave.wallets.generate();
  localStorage.setItem(KEY, JSON.stringify(jwk));
  return jwk;
}

export function lastTx() {
  return localStorage.getItem(TX) || '';
}

export function publish(why, player, extra = {}) {
  const snap = {
    v: 1,
    why,
    at: Date.now(),
    prev: lastTx(),
    extra,
    player,
  };
  const body = JSON.stringify(snap);
  const job = chain.then(() => upload(body));
  chain = job.then(() => {}).catch(() => {});
  return job;
}

async function upload(body) {
  if (body.length > 90000) throw new Error('这一档超过免费额度');
  const jwk = await wallet();
  const signer = new ArweaveSigner(jwk);
  const item = createData(body, signer, {
    tags: [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'GuildMaze' },
    ],
  });
  await item.sign(signer);
  const res = await fetch('https://up.arweave.net/tx', {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream' },
    body: item.getRaw(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 120) || `上传失败 ${res.status}`);
  }
  const id = await item.id;
  localStorage.setItem(TX, id);
  return id;
}

export async function fetchSnap(id) {
  const res = await fetch(`https://arweave.net/${id}`);
  if (!res.ok) throw new Error('这档还读不出来');
  const data = await res.json();
  if (data?.v !== 1 || !data.player) throw new Error('这不是回廊的档');
  return data;
}
