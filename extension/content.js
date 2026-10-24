(() => {
  let playerSnapshot = null;
  let snapshotAt = 0;
  window.addEventListener('message', event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin || data?.kind !== 'lethal-youtube-player-v2') return;
    if (typeof data.playing !== 'boolean' || (data.id !== null && !/^[\w-]{11}$/.test(data.id || ''))) return;
    playerSnapshot = {playing: data.playing, id: data.id, title: String(data.title || '').slice(0,512), channel: String(data.channel || 'YouTube').slice(0,256),
      position: Number.isFinite(data.position) ? Math.max(0,data.position) : 0,
      duration: Number.isFinite(data.duration) ? Math.max(0,data.duration) : 0,
      rate: Number.isFinite(data.rate) && data.rate > 0 ? data.rate : 1};
    snapshotAt = Date.now();
    report();
  });
  function report() {
    if (playerSnapshot && Date.now() - snapshotAt < 8000) {
      chrome.runtime.sendMessage({kind: 'playback', ...playerSnapshot}).catch(() => {});
      return;
    }
    const video = document.querySelector('video');
    const id = new URL(location.href).searchParams.get('v');
    const playing = location.pathname === '/watch' && /^[\w-]{11}$/.test(id || '') && video && !video.paused && !video.ended && video.readyState >= 2 && !document.querySelector('.html5-video-player.ad-showing');
    const title = document.querySelector('ytd-watch-metadata h1 yt-formatted-string')?.textContent?.trim() || document.title.replace(/ - YouTube$/, '');
    const channel = document.querySelector('ytd-watch-metadata #channel-name a')?.textContent?.trim() || 'YouTube';
    chrome.runtime.sendMessage({kind: 'playback', playing: !!playing, id, title, channel, position: video?.currentTime || 0, duration: Number.isFinite(video?.duration) ? video.duration : 0, rate: video?.playbackRate || 1}).catch(() => {});
  }
  setInterval(report, 5000);
  for (const event of ['play', 'pause', 'ended', 'seeked', 'ratechange', 'yt-navigate-finish']) document.addEventListener(event, report, true);
  report();
})();
