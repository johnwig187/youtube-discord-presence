const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const extension = path.join(__dirname,'../extension');
test('active player metadata works away from watch page and follows track changes, pause, and ads', () => {
  const sent=[];let poll;let ad=false;
  const video={paused:false,ended:false,readyState:4,currentTime:141,duration:264,playbackRate:1};
  let track={video_id:'aGellcYTmO8',title:'Kerser - Wait A Minute',author:'TheKERSER'};
  const player={querySelector:()=>video,getVideoData:()=>track,classList:{contains:()=>ad}};
  vm.runInNewContext(fs.readFileSync(path.join(extension,'player.js'),'utf8'),{
    document:{getElementById:()=>player,addEventListener:()=>{}},location:{origin:'https://www.youtube.com',pathname:'/playlist'},
    window:{postMessage:data=>sent.push(data)},setInterval:callback=>poll=callback
  });
  assert.equal(sent.at(-1).playing,true);assert.equal(sent.at(-1).title,track.title);assert.equal(sent.at(-1).id,track.video_id);
  track={video_id:'JEjNT2rI7TA',title:'Kerser - The Vibe',author:'TheKERSER'};poll();assert.equal(sent.at(-1).title,track.title);assert.equal(sent.at(-1).id,track.video_id);
  video.paused=true;poll();assert.equal(sent.at(-1).playing,false);
  video.paused=false;ad=true;poll();assert.equal(sent.at(-1).playing,false);
});
test('isolated content script forwards validated player snapshots without trusting foreign messages',()=>{
  const sent=[];let onMessage;
  const window={addEventListener:(_event,callback)=>onMessage=callback};
  vm.runInNewContext(fs.readFileSync(path.join(extension,'content.js'),'utf8'),{
    window, location:{origin:'https://www.youtube.com',href:'https://www.youtube.com/playlist?list=test',pathname:'/playlist'},URL,
    document:{querySelector:()=>null,title:'Playlist - YouTube',addEventListener:()=>{}},setInterval:()=>{},
    chrome:{runtime:{sendMessage:data=>{sent.push(data);return Promise.resolve();}}}
  });
  const data={kind:'lethal-youtube-player-v2',playing:true,id:'aGellcYTmO8',title:'Kerser - Wait A Minute',channel:'TheKERSER',position:141,duration:264,rate:1};
  const original=sent.length;
  onMessage({source:{},origin:'https://www.youtube.com',data});
  onMessage({source:window,origin:'https://other.example',data});
  onMessage({source:window,origin:'https://www.youtube.com',data:{...data,id:'not-valid'}});
  assert.equal(sent.length,original);
  onMessage({source:window,origin:'https://www.youtube.com',data});
  assert.equal(sent.at(-1).playing,true);assert.equal(sent.at(-1).id,data.id);assert.equal(sent.at(-1).title,data.title);
});
