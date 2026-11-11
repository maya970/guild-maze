export function createParty() {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  let channel = null;
  const listeners = new Set();

  function emit(msg) {
    for (const fn of listeners) fn(msg);
  }

  function open(room) {
    close();
    channel = new BroadcastChannel(`guildmaze-${room}`);
    channel.onmessage = (ev) => emit(ev.data || {});
    return channel;
  }

  function send(msg) {
    channel?.postMessage(msg);
  }

  function close() {
    channel?.close();
    channel = null;
  }

  return {
    code,
    open,
    send,
    close,
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
