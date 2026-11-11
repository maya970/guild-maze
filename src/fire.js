let audio;
let synthTimer;

export async function startCampfire() {
  stopCampfire();
  audio = new Audio('./fire-crackle.ogg');
  audio.loop = true;
  audio.volume = 0.55;
  try {
    await audio.play();
    return 'ogg';
  } catch {
    audio = null;
    startSynth();
    return 'synth';
  }
}

function startSynth() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 280;
  const gain = ctx.createGain();
  gain.gain.value = 0.08;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
  synthTimer = window.setInterval(() => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 180 + Math.random() * 900;
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.04 + Math.random() * 0.05, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.06);
  }, 140);
  audio = { ctx, noise, stop() { window.clearInterval(synthTimer); noise.stop(); ctx.close(); } };
}

export function stopCampfire() {
  if (!audio) return;
  if (audio instanceof HTMLAudioElement) {
    audio.pause();
    audio.src = '';
  } else audio.stop?.();
  audio = null;
}
