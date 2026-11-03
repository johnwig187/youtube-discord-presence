(() => {
  // Runs in the page world on YouTube and YouTube Music.
  function reportPlayer() {
    const music = location.hostname === 'music.youtube.com';
    const player = document.getElementById('movie_player') || document.querySelector('ytmusic-player');
    const video = player?.querySelector('video') || document.querySelector('video');
    let data;
    try { data = player?.getVideoData?.(); } catch { return; }
    const media = navigator.mediaSession?.metadata;
    const id = data?.video_id || new URL(location.href).searchParams.get('v');
    const valid = /^[\w-]{11}$/.test(id || '');
    const playing = valid && video && !video.paused && !video.ended && video.readyState >= 2 && !player?.classList.contains('ad-showing');
    const title = data?.title || media?.title || (music && document.querySelector('.title.ytmusic-player-bar')?.textContent?.trim());
    const channel = data?.author || media?.artist || (music && document.querySelector('.subtitle.ytmusic-player-bar')?.textContent?.trim());
    window.postMessage({kind: 'lethal-youtube-player-v2', playing: !!playing, id: valid ? id : null,
      title: String(title || '').slice(0,512), channel: String(channel || (music ? 'YouTube Music' : 'YouTube')).slice(0,256),
      position: video?.currentTime || 0, duration: Number.isFinite(video?.duration) ? video.duration : 0,
      rate: video?.playbackRate || 1}, location.origin);
  }
  setInterval(reportPlayer, 2000);
  for (const event of ['play','pause','ended','seeked','ratechange','yt-navigate-finish']) document.addEventListener(event, reportPlayer, true);
  reportPlayer();
})();
