const net = require('node:net');
const {randomUUID} = require('node:crypto');
function frame(op, data) {
  const body = Buffer.from(JSON.stringify(data));
  const header = Buffer.alloc(8); header.writeUInt32LE(op); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
class RPC {
  constructor(clientId, pathFor = i => `\\\\?\\pipe\\discord-ipc-${i}`) { this.clientId = clientId; this.pathFor = pathFor; this.ready = false; this.status = 'Waiting for Discord'; }
  connect(index = 0) {
    if (this.socket || index > 9) return;
    const socket = this.socket = net.createConnection(this.pathFor(index));
    let buffer = Buffer.alloc(0), handshaken = false;
    const timeout = setTimeout(() => socket.destroy(), 5000);
    socket.on('connect', () => socket.write(frame(0, {v: 1, client_id: this.clientId})));
    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      try {
        while (buffer.length >= 8) {
          const op = buffer.readUInt32LE(), length = buffer.readUInt32LE(4);
          if (length > 1048576) throw Error('Oversized RPC frame');
          if (buffer.length < 8 + length) break;
          const data = JSON.parse(buffer.subarray(8, 8 + length)); buffer = buffer.subarray(8 + length);
          if (op === 3) socket.write(frame(4, data));
          if (op === 2) { this.status = data.message || 'Discord closed connection'; socket.destroy(); }
          if (data.evt === 'READY') { clearTimeout(timeout); handshaken = this.ready = true; this.status = 'Connected to Discord'; this.onReady?.(); }
          if (data.evt === 'ERROR') this.status = `Discord error: ${data.data?.message || 'Unknown error'}`;
          if (data.cmd === 'SET_ACTIVITY' && data.evt !== 'ERROR') this.status = 'Discord accepted activity';
        }
      } catch { socket.destroy(); }
    });
    socket.on('error', () => {});
    socket.on('close', () => { clearTimeout(timeout); if (this.socket !== socket) return; this.socket = null; this.ready = false; if (!handshaken && index < 9) this.connect(index + 1); });
  }
  set(activity) { if (this.ready) this.socket.write(frame(1, {cmd: 'SET_ACTIVITY', args: {pid: process.pid, activity}, nonce: randomUUID()})); }
}
module.exports = {RPC, frame};
