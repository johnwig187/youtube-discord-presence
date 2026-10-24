const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {randomBytes, timingSafeEqual} = require('node:crypto');
const {RPC} = require('./rpc');
function kickHasPriority(file, now = Date.now(), read = fs.readFileSync) {
  if (!file) return false;
  try {
    const lease = JSON.parse(read(file,'utf8'));
    const age = now - lease.updatedAt;
    return lease.live === true && Number.isFinite(lease.updatedAt) && age >= 0 && age < 20000;
  } catch { return false; }
}
function activity(value, now = Date.now()) {
  if (!value || !value.playing || !/^[\w-]{11}$/.test(value.id || '')) return null;
  const result = {status_display_type: 2, details: String(value.title || 'YouTube video').slice(0, 128).padEnd(2), state: String(value.channel || 'YouTube').slice(0,128).padEnd(2), buttons: [{label: 'Watch on YouTube', url: `https://www.youtube.com/watch?v=${value.id}`}], instance: false};
  result.assets = {large_image: `https://i.ytimg.com/vi/${value.id}/hqdefault.jpg`, large_text: result.details, large_url: result.buttons[0].url};
  result.type = 2;
  if (value.duration > value.position && value.position >= 0 && value.rate > 0 && Number.isFinite(value.rate) && Number.isFinite(value.duration) && Number.isFinite(value.position)) {
    result.timestamps = {
      start: Math.floor(now / 1000 - value.position / value.rate),
      end: Math.floor(now / 1000 + (value.duration - value.position) / value.rate)
    };
  }
  return result;
}
function start(config, port = 32145) {
  const rpc = new RPC(config.clientId), tabs = new Map(); let selected = null, lastSent = '', lastAt = 0, suppressedByKick = false;
  function update() {
    const now = Date.now();
    for (const [id, value] of tabs) if (now - value.seen > 18000) tabs.delete(id);
    const candidates = [...tabs.values()].filter(v => v.playing).sort((a,b) => b.started - a.started);
    selected = candidates[0] || null;
    // Separate app IDs let Discord retain Kick and YouTube concurrently.
    // Do not clear music solely because a Kick broadcast is live.
    suppressedByKick = false;
    const next = activity(selected, now), signature = JSON.stringify(next);
    if (rpc.ready && (signature !== lastSent && now - lastAt >= 5000)) { rpc.set(next); lastSent = signature; lastAt = now; }
  }
  rpc.onReady = () => { lastSent = ''; lastAt = 0; update(); };
  const timer = setInterval(() => { if (!rpc.socket) rpc.connect(); update(); }, 2000);
  rpc.connect();
  const server = http.createServer((req,res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const origin = req.headers.origin;
    if (req.headers.host !== `127.0.0.1:${server.address().port}` || (origin && !/^chrome-extension:\/\/[a-p]{32}$/.test(origin))) { res.writeHead(403).end('{}'); return; }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary','Origin'); }
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods','GET, POST'); res.writeHead(204).end(); return; }
    const supplied = Buffer.from(req.headers.authorization || ''), expected = Buffer.from(`Bearer ${config.token}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) { res.writeHead(401).end('{"error":"Invalid pairing code"}'); return; }
    if (req.url === '/status' && req.method === 'GET') { res.end(JSON.stringify({connected: rpc.ready, status: rpc.status, playing: !!selected, suppressedByKick, title: selected?.title || null})); return; }
    if (req.url !== '/update' || req.method !== 'POST') { res.writeHead(404).end('{}'); return; }
    let body = ''; req.on('data', chunk => { body += chunk; if (body.length > 8192) req.destroy(); });
    req.on('end', () => {
      try {
        const value = JSON.parse(body);
        if (!Number.isInteger(value.tab) || typeof value.playing !== 'boolean') throw Error();
        const old = tabs.get(value.tab); const now = Date.now();
        tabs.set(value.tab, {...value, seen: now, started: old?.playing && old.id === value.id ? old.started : now});
        update(); res.end('{"ok":true}');
      } catch { res.writeHead(400).end('{"error":"Invalid playback data"}'); }
    });
  });
  server.on('error', error => { console.error(error.message); clearInterval(timer); rpc.socket?.destroy(); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Bridge running. Pairing code: ${config.token}\nKeep this window open. Ctrl+C stops sharing.`));
  return {server, rpc, close() { clearInterval(timer); rpc.socket?.destroy(); server.close(); }};
}
if (require.main === module) {
  const file = path.join(__dirname, 'config.json');
  if (!fs.existsSync(file)) { console.error('Run Setup.cmd first.'); process.exit(1); }
  const config = JSON.parse(fs.readFileSync(file));
  if (!/^\d{17,22}$/.test(config.clientId) || !/^[a-f0-9]{48}$/.test(config.token)) throw Error('Invalid configuration. Run Setup.cmd again.');
  start(config);
}
module.exports = {activity, start, kickHasPriority};
