# Redragon M913 Impact Elite — Web Configurator

A **WebHID** application to configure the **Redragon M913 Impact Elite** wireless gaming mouse (VID `25a7`, PID `fa07`) directly from your browser. No drivers, no daemons, no native installs.

---

## Credits

**Concept and direction by Olek.** Code written by **Claude AI** (Anthropic), based on reverse engineering of the open-source projects [`m913-ctl`](https://github.com/Qehbr/m913-ctl) by Qehbr and [`mouse_m908`](https://github.com/dokutan/mouse_m908) by dokutan, both released under GPL-3.0.

---

## End-user setup

| OS | What you need to do |
|---|---|
| Windows | Nothing. Open the page and it works. |
| macOS | Nothing. Open the page and it works. |
| Linux | A one-time udev rule (~30 seconds, integrated into the app) |

On Linux, the first time you open the app you'll see a setup card with a "Download install-m913-udev.sh" button. Download it, run it once with `sudo`, unplug and re-plug the USB dongle, and you're done — permanently for your user.

The script installs one rule in `/etc/udev/rules.d/99-m913.rules` granting the `plugdev` group access to the M913. Same mechanism Piper, Solaar, and OpenRGB use. Nothing else is touched.

---

## Supported browsers

Chromium-based only: **Chrome, Edge, Brave, Opera, Vivaldi**. Firefox and Safari do not support WebHID. The app detects this and disables the connect button with a clear message.

---

## Hosting

WebHID requires a **secure origin**: `https://` or `http://localhost`. It does not work via `file://` (double-clicking the HTML file).

To serve it locally during development:

```bash
cd m913-webapp
python3 -m http.server 8080
# then open http://localhost:8080
```

To publish it, deploy to any static host with HTTPS (Netlify, Vercel, GitHub Pages, S3, Cloudflare Pages, etc.).

---

## Features

- **Full button mapping** for all 16 firmware-addressable buttons: 12 side buttons, LMB, RMB, middle, fire
- **Keyboard combos**: `ctrl+c`, `ctrl+shift+z`, modifier-only bindings (`super`)
- **Multi-key** simultaneous press (max 3 keys, optional modifier)
- **Multimedia keys**: play/pause, volume +/−, mute, browser back/forward, calculator, etc.
- **Custom fire button**: speed (3–255) and repeat count (0–3)
- **DPI**: 5 slots, 100–16000 in steps of 100, per-slot enable
- **RGB**: off / steady / breathe / rainbow + color + brightness + speed
- **Polling rate**: 125 / 250 / 500 / 1000 Hz
- **INI export** compatible with `m913-ctl --config`

All changes are **persisted in the mouse's flash memory** — they follow the mouse to any PC, even without the app.

---

## Known limitations

The two **DPI buttons** (above/below the scroll wheel) **cannot be remapped**. They are hardwired to the chip and have no address in the mapping protocol. They change DPI and that's it. They do emit an input report (`0a 00 00 00 0a 01 0X 01 ...`) which can be intercepted via JS, but the hardware DPI-cycle behaviour cannot be disabled.

WebHID enforces a **HID blocklist**: the M913 exposes vendor-specific collections (`0xff00–0xff04`), so the blocklist is not a problem here. On other Redragon mice using standard usage pages, the config collection might be blocked by Chrome — in that case a Tauri/Electron wrapper would be needed.

---

## Reverse engineering

The protocol is a faithful JavaScript port of [`m913-ctl`](https://github.com/Qehbr/m913-ctl) (GPL-3.0).

Protocol frame:

```
[0]    0x08              ← report ID (Feature)
[1]    sub-cmd           ← 0x07=write, 0x04=commit
[2]    0x00
[3]    0x00              ← (or address-hi for keyboard sub-packets)
[4]    address           ← memory address byte
[5]    payload-length
[6..13] payload          ← command data
[14-15] padding 0x00
[16]   checksum          ← (0x55 - sum(bytes[0..15])) & 0xFF
```

WebHID transport: `device.sendFeatureReport(0x08, payload[16])`.

---

## Project structure

```
protocol.js       ← M913 protocol in JavaScript (port of m913-ctl)
index.html        ← Complete UI (CSS + JS in one file) with integrated setup wizard
README.md         ← this file
```

---

## License

GPL-3.0, in line with `m913-ctl` and `mouse_m908` from which the protocol was derived.
