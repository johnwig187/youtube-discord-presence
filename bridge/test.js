const {test} = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const {RPC, frame} = require('./rpc');
const {activity, start} = require('./server');
test('activity sanitizes URLs, caps titles and adjusts remaining time for playback speed', () => {
  assert.equal(activity({playing:false}), null);
  assert.equal(activity({playing:true,id:'bad'}), null);
  const result = activity({playing:true,id:'abcdefghijk',title:'a'.repeat(200),channel:'Music',duration:120,position:20,rate:2},100000);
  assert.equal(result.details.length,128); assert.equal(result.timestamps.end,150);
  assert.equal(result.timestamps.start,90);
  assert.equal(result.status_display_type,2);
  assert.equal(result.type,2);
  assert.equal(result.assets.large_image,'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
  assert.equal(result.assets.large_url,result.buttons[0].url);
  assert.equal(result.buttons[0].url,'https://www.youtube.com/watch?v=abcdefghijk');
});
test('Listening progress has elapsed and remaining timing and recalculates after a seek', () => {
  const track = {playing:true,id:'abcdefghijk',title:'Track',channel:'Artist',duration:264,position:141,rate:1};
  const current = activity(track,2000000);
  assert.equal(2000-current.timestamps.start,141);
  assert.equal(current.timestamps.end-current.timestamps.start,264);
  const sought = activity({...track,position:30},2000000);
  assert.equal(2000-sought.timestamps.start,30);
  assert.equal(sought.timestamps.end-sought.timestamps.start,264);
  assert.equal(activity({...track,rate:Infinity},2000000).timestamps,undefined);
});
test('RPC handles fragmented READY, activity command, and ping', async () => {
  const pipe = process.platform === 'win32' ? `\\\\?\\pipe\\youtube-presence-test-${process.pid}` : `/tmp/youtube-presence-${process.pid}`;
  let peer, received = Buffer.alloc(0);
  const server = net.createServer(socket => { peer = socket; socket.on('data',chunk => received = Buffer.concat([received,chunk])); });
  await new Promise(resolve => server.listen(pipe,resolve));
  const rpc = new RPC('123456789012345678', () => pipe);
  try {
    rpc.connect();
    await new Promise(resolve => { rpc.onReady = resolve; const wait = setInterval(() => { if (peer) {clearInterval(wait); const ready = frame(1,{evt:'READY'});peer.write(ready.subarray(0,5));setTimeout(() => peer.write(ready.subarray(5)),10); } },10); });
    assert.equal(rpc.ready,true); rpc.set({details:'Video'});
    peer.write(frame(3,{check:1})); await new Promise(resolve => setTimeout(resolve,40));
    assert.match(received.toString(), /SET_ACTIVITY/); assert.match(received.toString(), /client_id/);
    assert.ok(received.includes(frame(4,{check:1})));
  } finally {rpc.socket?.destroy();peer?.destroy(); await new Promise(resolve => server.close(resolve));}
});
test('HTTP bridge rejects unauthorized and web origins and accepts paired extension', async () => {
  const app = start({clientId:'123456789012345678',token:'test-token'},0);
  try {
    if (!app.server.listening) await new Promise(resolve => app.server.once('listening',resolve));
    const url = `http://127.0.0.1:${app.server.address().port}`;
    assert.equal((await fetch(url+'/status')).status,401);
    assert.equal((await fetch(url+'/status',{headers:{Origin:'https://www.youtube.com',Authorization:'Bearer test-token'}})).status,403);
    const headers = {Origin:'chrome-extension://'+'a'.repeat(32),Authorization:'Bearer test-token','Content-Type':'application/json'};
    assert.equal((await fetch(url+'/update',{method:'POST',headers,body:JSON.stringify({tab:1,playing:true,id:'abcdefghijk',title:'Test video'})})).status,200);
    assert.equal((await (await fetch(url+'/status',{headers})).json()).playing,true);
    assert.equal((await fetch(url+'/update',{method:'POST',headers,body:'bad'})).status,400);
  } finally { app.close(); }
});
