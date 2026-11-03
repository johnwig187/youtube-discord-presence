chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onInstalled.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.kind !== 'playback' || !sender.tab || !/^https:\/\/(www|music)\.youtube\.com\//.test(sender.url || '')) return;
  (async () => {
    const {token, enabled = true} = await chrome.storage.local.get(['token', 'enabled']);
    if (!token) return {error: 'Open extension options to pair the bridge.'};
    const response = await fetch('http://127.0.0.1:32145/update', {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({...message, playing: enabled && message.playing, tab: sender.tab.id})});
    return response.json();
  })().then(reply).catch(error => reply({error: error.message}));
  return true;
});
