const token = document.getElementById('token'), enabled = document.getElementById('enabled'), status = document.getElementById('status');
chrome.storage.local.get(['token','enabled']).then(value => { token.value = value.token || ''; enabled.checked = value.enabled !== false; });
document.getElementById('save').onclick = async () => {
  await chrome.storage.local.set({token: token.value.trim(), enabled: enabled.checked});
  try {
    const response = await fetch('http://127.0.0.1:32145/status', {headers: {Authorization: `Bearer ${token.value.trim()}`}});
    const result = await response.json();
    status.textContent = response.ok ? JSON.stringify(result, null, 2) : 'Pairing failed. Check the pairing code.';
  } catch { status.textContent = 'Cannot reach the bridge. Start Start.cmd and try again.'; }
};
