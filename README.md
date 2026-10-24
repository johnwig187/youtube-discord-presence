# YouTube Discord Presence

Lethal's YouTube bot shares the video currently playing in Brave as a Discord **Listening** activity, with the title, channel, artwork, watch link, and elapsed/remaining time. It supports regular YouTube watch pages and the active mini-player while browsing playlists.

This repository is a development copy. The existing installed extension and AlwaysUp service continue to use their original location. Preparing this repository does not move, re-pair, or restart that installation.

## Requirements

- Windows, Discord desktop, Brave, and Node.js 22 or newer.
- A Discord application ID. The application name supplies the activity branding.
- No npm packages, Discord account token, bot token, or YouTube credentials are required.

## Fresh setup

Do not run a second bridge beside an existing installation: both use port 32145.

1. Create or select your Discord application in the [Discord Developer Portal](https://discord.com/developers/applications) and copy its public Application ID.
2. Run `Setup.cmd`. It creates an independent private pairing code and local runtime configuration. Existing configuration is never overwritten automatically.
3. Start Discord desktop, then run `Start.cmd`.
4. Open `brave://extensions`, enable Developer mode, choose **Load unpacked**, and select this repository's `extension` folder.
5. Open the extension options, paste the locally generated pairing code, enable **Share playing videos**, and select **Save and check connection**.
6. Refresh an already-open YouTube tab once, then play a video and check your Discord profile.

`bridge/config.example.json` documents the local configuration shape. Real `bridge/config.json` and `runtime.txt` are generated locally and ignored by Git.

## Automatic startup

The current installed copy already uses AlwaysUp with automatic delayed startup and crash recovery. Leave that entry pointed at its existing runtime until a deliberate migration is tested.

For a separate fresh installation, first verify manual operation. Then configure your service supervisor to run the Node executable with the absolute path to `bridge/server.js`, using the bridge folder as its working directory. Configure automatic startup and restart after failure. Do not create duplicate supervisor entries. Discord desktop must be running for activity to appear; the PC must stay on and awake.

## Development

Run `npm test` for the six focused playback, timestamp, RPC, and authenticated local HTTP tests. Run `npm run check` for JavaScript syntax checks. No dependency installation is needed. If npm is unavailable, run `node --test bridge/test.js test/player.test.js` directly; syntax can be checked with `node --check` for each JavaScript file.

| Location | Purpose |
| --- | --- |
| `extension/player.js` | Reads active YouTube player metadata in the page world |
| `extension/content.js` | Validates and forwards playback snapshots |
| `extension/background.js` | Sends paired updates to the local bridge |
| `extension/options.*` | Local pairing and sharing controls |
| `bridge/server.js` | Playback selection and local HTTP service |
| `bridge/rpc.js` | Discord named-pipe RPC connection and recovery |
| `bridge/test.js`, `test/player.test.js` | Offline verification with mock playback and local transports |
| `docs/maintenance.md` | Troubleshooting and safe deployment workflow |

## Behaviour and limits

- Pausing, ads, or closing YouTube clears the activity after the stale-playback window, normally within about 20 seconds.
- Separate Discord application IDs allow music to coexist with other activities. This bridge does not suppress music while a Kick stream is live. Discord controls which activity appears first.
- Incognito is excluded by default. Only `https://www.youtube.com/` is supported; YouTube Music is not currently covered.
- The bridge listens only on `127.0.0.1:32145`, requires the local pairing code, and rejects ordinary website origins. That code is a local secret, not a Discord credential.
- Sharing makes the playing title and channel visible to people who can view your Discord activity.

## Repository privacy

The repository is intended for private GitHub storage. `private: true` in `package.json` separately prevents accidental npm publication; GitHub repository visibility must also remain private. Review staged files and ignored configuration before pushing changes. Choose a license before sharing publicly; no license has been assumed.
