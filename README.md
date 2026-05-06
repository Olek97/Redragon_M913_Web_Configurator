# Redragon M913 Impact Elite — Web Configurator

A **WebHID** application to configure the **Redragon M913 Impact Elite** gaming mouse directly from your browser. Works in both wireless (`25a7:fa07`, 2.4G dongle) and wired (`25a7:fa08`, USB-C) modes. No drivers, no daemons, no native installs.

---

## Credits

Concept by Olek, code by Claude AI.

Based on reverse engineering of the open-source projects [`m913-ctl`](https://github.com/Qehbr/m913-ctl) by Qehbr and [`mouse_m908`](https://github.com/dokutan/mouse_m908) by dokutan, both released under GPL-3.0.

---

## End-user setup

| OS | What you need to do |
|---|---|
| Windows | Nothing. Open the page and it works. |
| macOS | Nothing. Open the page and it works. |
| Linux | A one-time udev rule (~30 seconds, integrated into the app) |

On Linux, the first time you open the app you'll see a setup card with a "Download install-m913-udev.sh" button. Download it, run it once with `sudo`, unplug and re-plug the mouse, and you're done — permanently for your user.

The script installs one rule in `/etc/udev/rules.d/99-m913.rules` using `TAG+="uaccess"`, which grants access to whichever user owns the active local session. Works on any modern systemd-based distro (Debian, Ubuntu, Fedora, Arch, openSUSE, etc.) without any per-distro tweaks.

---

## Supported browsers

Chromium-based only: **Chrome, Edge, Brave, Opera, Vivaldi**. Firefox and Safari do not support WebHID. The app detects this on startup and shows a clear "unsupported browser" message instead of letting the user fight a non-functional UI.

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

- **Full button mapping** for all 16 firmware-addressable buttons: 12 side buttons, LMB, RMB, middle (scroll click), fire
- **Interactive mouse SVG**: click any visible button to edit it, with hover preview and visual feedback for modified/selected state
- **Keyboard capture**: press a key combo on your keyboard while editing — modifiers, single keys, and modifier-only bindings are detected automatically
- **Quick actions** ("Other" tab): mouse buttons, DPI cycle, multimedia keys, fire button, special functions, and **left/right modifier variants** (`ctrl_l` vs `ctrl_r`, etc.)
- **Raw input** for advanced syntax: multi-key combos like `a+b+c`, custom fire profiles like `fire:50:2`
- **Custom fire button**: speed (3–255) and repeat count (0–3)
- **DPI**: 5 slots, 100–16000 in steps of 100, per-slot enable (contiguous slots from slot 1, enforced)
- **RGB lighting**: off / steady / breathe / rainbow + 16M color picker + brightness + animation speed
- **Polling rate**: 125 / 250 / 500 / 1000 Hz
- **Factory reset**: one click to queue a full reset of all 16 buttons
- **Configuration import/export** as `.ini` files, compatible with `m913-ctl --config`
- **State persistence**: configurations are cached in `localStorage` so the UI shows what you last applied across page reloads

All changes are **persisted in the mouse's flash memory** — they follow the mouse to any PC, even without the app.

---

## Dual profiles

The M913 firmware supports **two independent configuration profiles**. Each profile holds its own button mapping, DPI levels, RGB settings and polling rate — effectively giving you 32 button configurations on a single mouse.

The profile is selected by a **physical "mode switch" button on the bottom of the mouse**. Press it once to switch to profile 2 (the LED behaviour usually changes, confirming the switch). Press it again to go back to profile 1.

The web app — and any software based on `m913-ctl` — always writes to the **currently active profile**. So to configure profile 2:

1. Press the mode switch on the bottom of the mouse to activate profile 2
2. Set up your buttons / DPI / lighting in the web app
3. Click **Apply to mouse**
4. Press the mode switch again to switch back to profile 1 if desired

The two profiles live in separate flash regions inside the mouse and don't interfere with each other. Note: the app's `localStorage` cache is shared between profiles — if you switch profile and reload the page, the cached UI may show stale data for the wrong profile. The actual mouse configuration is unaffected.

---

## Known limitations

**The two DPI buttons** (above/below the scroll wheel) **cannot be remapped**. They are hardwired to the chip and have no address in the mapping protocol. They change DPI and that's it.

**No N-key rollover for remapped buttons.** Confirmed on a brand-new M913 with factory firmware: the mouse cannot register two remapped buttons pressed simultaneously. While you hold one remapped side button, the second one is ignored until the first is released. This is a firmware limitation of the M913 itself — the same behaviour occurs with the official Redragon Windows software. Workaround: put multi-key combos inside a single button using the Raw tab (e.g. `shift+space`), or keep held modifiers on your keyboard.

**Reading the current configuration from the mouse is not possible.** The M913's read protocol is undocumented and not implemented in any open-source project. The app maintains a best-effort cache in `localStorage` of what was last applied, but if you reset the mouse via different software, the cache won't reflect it.

**No battery indicator.** The protocol for reading battery level is also undocumented in `m913-ctl`. On Linux some desktop environments may surface it via the standard HID Battery Usage Page (`upower -e | grep -i mouse`).

**WebHID HID blocklist.** Browsers maintain a blocklist that prevents access to standard HID devices (mice, keyboards) on collections that overlap with their typical OS handling. The M913 exposes vendor-specific collections (`0xff00–0xff04`), so the blocklist is not a problem here.

---

## Reverse engineering

The protocol is a JavaScript port of [`m913-ctl`](https://github.com/Qehbr/m913-ctl) (GPL-3.0), which itself derives from [`mouse_m908`](https://github.com/dokutan/mouse_m908). The 70 parity tests in `test_protocol.mjs` confirm that every packet generated is bit-for-bit identical to the C++ CLI's output.

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

The full button mapping must always be sent on every Apply: the protocol rewrites all 16 button slots from a fixed 8-packet template, so omitting a button means resetting it to the template default. The app handles this by merging `effectiveButtons` (last-applied state) with `pendingButtons` (current edits) before sending.

---

## Project structure

```
protocol.js       ← M913 protocol in JavaScript (port of m913-ctl)
index.html        ← Complete UI (CSS + JS in one file) with integrated setup wizard
test_protocol.mjs ← 70 parity tests against m913-ctl templates
README.md         ← this file
```

---

## License

GPL-3.0, in line with `m913-ctl` and `mouse_m908` from which the protocol was derived.