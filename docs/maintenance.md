# Maintenance

## Safe changes

Keep this source repository separate from the working installation. Run `npm test` and `npm run check` before deployment. Back up the installed source, preserve its private local pairing/configuration, and deploy only reviewed source changes. Do not copy development configuration over a working installation. Never start both copies on port 32145.

Loading this source as a new unpacked extension can produce a different extension ID. Pair it deliberately before replacing a working extension. An extension reload can leave existing YouTube tabs with stale scripts; refresh those tabs once after reloading.

## No music on Discord

1. Confirm Discord desktop is running and a video is actually playing on regular YouTube.
2. Open extension options. Verify **Share playing videos** and use **Save and check connection**.
3. If `connected` is true but `playing` is false while music plays, refresh just the playing YouTube tab once. This repaired a stalled browser playback feed during live verification on 25 October 2026.
4. If the bridge cannot be reached, inspect the existing supervisor entry and port 32145. Restart only the existing bridge if needed; avoid starting a second copy.
5. If playback reaches the bridge but Discord is disconnected, inspect Discord desktop and its activity-sharing settings. Do not use a Discord account token as a workaround.

The options connection result is a snapshot taken when its button is clicked, not a continuously updating monitor. Activity acceptance confirms Discord received the update; check the profile to verify its visible presentation.

## Source verification

`bridge/test.js` covers validated activity fields, elapsed/remaining timestamps and seeks, fragmented RPC frames and ping, and authenticated local HTTP handling. `test/player.test.js` covers playlist mini-player tracking, song changes, pause/ad clearing, and rejecting foreign playback messages. The tests use a temporary local port and mock Discord pipe rather than the installed service.

The operating-system service configuration, installed extension path, pairing code, browser storage, runtime paths, logs, screenshots, and other integrations are deliberately not part of this repository.
