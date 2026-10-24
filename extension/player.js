(() => {
  // Runs in YouTube's page world to read the active player, including its mini-player.
  function reportPlayer() {
    const player = document.getElementById('movie_player');
    const video = player?.querySelector('video');
    let data;
    try { data = player?.getVideoData?.(); } catch { return; }
    const id = data?.video_id;
    const valid = /^[\w-]{11}$/.test(id || '');
    const playing = valid && video && !video.paused && !video.ended && video.readyState >= 2 && !player.classList.contains('ad-showing');
    window.postMessage({kind: 'lethal-youtube-player-v2', playing: !!playing, id: valid ? id : null,
      title: String(data?.title || '').slice(0,512), channel: String(data?.author || 'YouTube').slice(0,256),
      position: video?.currentTime || 0, duration: Number.isFinite(video?.duration) ? video.duration : 0,
      rate: video?.playbackRate || 1}, location.origin);
  }
  setInterval(reportPlayer, 2000);
  for (const event of ['play','pause','ended','seeked','ratechange','yt-navigate-finish']) document.addEventListener(event, reportPlayer, true);
  reportPlayer();
})();
