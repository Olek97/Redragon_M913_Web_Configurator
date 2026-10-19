# Redragon M913 Impact Elite — Web Configurator

[![WebHID API](https://img.shields.io/badge/WebHID-Enabled-success?style=flat-square&logo=googlechrome)](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
[![Dual-Mode Hardware](https://img.shields.io/badge/Hardware-2.4G%20Wireless%20%7C%20USB--C-orange?style=flat-square)](#supported-hardware)

A modern, standalone **WebHID** configurator for the **Redragon M913 Impact Elite** wireless/wired gaming mouse. Configure buttons, DPI stages, RGB lighting, polling rates, and rapid fire directly in your browser without proprietary drivers, background bloatware, or native daemons.

All settings are written directly to the mouse's on-board EEPROM and flash memory, remaining active when plugging the mouse into any PC, Mac, Linux machine, or gaming console.

---

## Table of Contents

- [Supported Hardware & Environments](#supported-hardware--environments)
- [Architecture & Design Principles](#architecture--design-principles)
- [Key Features](#key-features)
- [Hardware Realities & Reverse-Engineered Findings](#hardware-realities--reverse-engineered-findings)
- [Operating System Setup](#operating-system-setup)
- [Hosting & Local Development](#hosting--local-development)
- [USB HID Protocol Specification](#usb-hid-protocol-specification)
- [Project Structure](#project-structure)
- [Credits & License](#credits--license)

---

## Supported Hardware & Environments

### Mouse Identifiers
- **Wireless Mode (2.4 GHz USB Dongle):** `VID: 0x25A7`, `PID: 0xFA07` (Areson Technology Corp.)
- **Wired Mode (USB-C Cable):** `VID: 0x25A7`, `PID: 0xFA08`
- **Vendor-Defined Usage Page:** `0xFF00..0xFF04`
- **Report ID:** `0x08` (17-byte frame)

### Supported Browsers
Any modern browser with **WebHID API** support:
- Google Chrome (Desktop, version 89+)
- Microsoft Edge (Desktop, version 89+)
- Brave Browser
- Opera / Opera GX
- Vivaldi

*(Note: Firefox and Safari do not support the WebHID standard).*

---

## Architecture & Design Principles

1. **Zero Local Storage / Zero Memory Cache:**  
   The configurator does not use browser `localStorage`, cookies, or indexed caches. Upon connecting, the application reads the raw 160-byte EEPROM memory plus keyboard sub-packets straight from the mouse microcontroller, accurately reflecting the true hardware state.
2. **Pure Vanilla Web Stack:**  
   Zero build tools, zero bundlers, and zero npm dependencies. Written in modular modern ES6 JavaScript, HTML5, and responsive CSS.
3. **1:1 Hardware Parity with OEM Firmware:**  
   Every register, command code, and packet layout was verified by reverse engineering the official OEM driver (`OemDrv.exe`, `Lowerdev.dll`, and `Cfg.ini`). Placebo controls (such as independent X/Y DPI or DPI stage RGB pickers) that do not exist on the M913 hardware are intentionally omitted.

---

## Key Features

### 1. Interactive 3-Column Ergonomic UI
- **Left Panel (Button Assignments):** Comprehensive list of all 16 programmable buttons, complete with friendly human-readable action names, formatted descriptions (e.g. `Rapid Fire (3x, 58ms)`), and raw action badges.
- **Center Panel (Interactive Visualizer):** Accurate SVG rendering of the Redragon M913 with bi-directional hover and click synchronization. Hovering an assignment highlights the button on the mouse, and clicking a hotspot selects it for editing.
- **Right Panel (Performance & Lighting):** Consolidated controls for DPI sensitivity stages, logo RGB effects, polling rate, profile management, and factory reset.

### 2. Full 16-Button Mapping
All 16 physical buttons are remappable:
- **12 Side Thumb Buttons** (Side 1 through Side 12)
- **Primary Buttons:** Left Click, Right Click, Middle Click (Scroll Wheel)
- **Rapid Fire Button** (Index Finger Key)

#### Supported Action Types
- **Native Mouse Actions:** Left Click, Right Click, Middle Click, Forward (Mouse 5), Backward / Back (Mouse 4), Double Click, Right Double Click, Scroll Up, Scroll Down.
- **Keyboard Keystrokes & Combos:** Single keys (`A-Z`, `0-9`, `F1-F12`, `Enter`, `Esc`, `Space`, Arrows, etc.), modifiers only (`Ctrl`, `Alt`, `Shift`, `Super/Win`), and complex key combinations (e.g., `Ctrl+C`, `Alt+F4`, `Ctrl+Shift+T`).
- **Complete Numpad Range:** Dedicated numpad keys (`num0`–`num9`, `numplus`, `numminus`, `nummul`, `numdiv`, `numdot`, `numenter`, `numlock`).
- **Consumer & Multimedia Controls:** Play/Pause, Stop, Next Track, Previous Track, Volume Up, Volume Down, Mute, Email, Calculator, My Computer, Media Player.
- **Web Navigation:** Browser Home, Web Search, WWW Forward, WWW Back, WWW Stop, WWW Refresh, Favorites.
- **Special Hardware Actions:**
  - `fire`: Hardware rapid fire with custom speed (3–255 ms) and repeat count (0–3).
  - `three_click`: Hardware triple click.
  - `dpi+` / `dpi-`: Incremental DPI adjustment.
  - `dpi-cycle`: Sequential loop through active DPI levels.
  - `snipe`: DPI Lock (temporarily drops resolution while held).
  - `profile_switch`: Switches active on-board hardware profile.
  - `led_toggle`: Hardware RGB lighting toggle.
  - `polling_switch`: Cycles through USB report rates.
  - `none`: Disables the button.

### 3. DPI Sensitivity Engine
- **Range:** 100 to 16,000 DPI (in discrete steps of 100 DPI).
- **Contiguous Stage Masking:** Configure 1 to 5 stages. Firmware requires contiguous stages starting from Stage 1 (enforced by the UI).
- **Sensor Multiplier Byte:** Automatically computes and sets the high-DPI multiplier flag (Byte 2) for resolutions exceeding 5,000 DPI, matching PixArt PMW3325 / PAW3335 silicon specifications.
- **EEPROM Preservation:** Emits fixed factory trailer packets for addresses `0x2C..0x3F` to maintain memory alignment without EEPROM corruption.

### 4. Logo RGB Lighting
- **OFF Mode:** Completely turns off illumination to maximize wireless battery life.
- **STEADY Mode:** Static custom color selection via color picker or quick swatches, with full luminance control (Brightness: 0–255).
- **BREATHE Mode (Respiration):** Single-color pulsing effect with adjustable cycle speed (1–5). Brightness is automatically modulated by the MCU's sinusoidal PWM timer generator.
- **RAINBOW Mode (Neon Cycle):** Continuous dynamic spectrum rotation with adjustable speed (1–5).

### 5. USB Polling Rate
Select from 4 discrete hardware reporting intervals:
- **1000 Hz** (1 ms response time — maximum gaming precision)
- **500 Hz** (2 ms response time)
- **250 Hz** (4 ms response time)
- **125 Hz** (8 ms response time — optimal battery conservation)

### 6. Battery Telemetry & Diagnostics
- Real-time battery status querying via sub-command `0x04`.
- High-visibility battery percentage bar with dynamic color indicators (Green $\ge 50\%$, Yellow $30..49\%$, Red $\le 20\%$).
- Built-in collapsible Telemetry & Debug Console displaying live hexadecimal USB packets and firmware transactions.

### 7. Profile Management & Factory Defaults
- **Export Configuration:** Save current settings to a standardized `.ini` file.
- **Import Configuration:** Load and stage settings from `.ini` files (fully compatible with `m913-ctl`).
- **Factory Reset:** Instantly revert all 16 buttons, DPI levels, RGB lighting, and polling rate to original out-of-the-box factory defaults.

---

## Hardware Realities & Reverse-Engineered Findings

Reverse engineering of the original Windows software (`OemDrv.exe`, `Lowerdev.dll`, and `Cfg.ini`) confirmed several critical low-level facts regarding the SinoWealth SH68F90 MCU and PixArt optical sensors:

1. **No Independent X/Y DPI Axes:**  
   The PixArt PMW3325 (wired) and PAW3335 (wireless) sensors feature a single shared optical CPI step register. The OEM configuration file explicitly enforces `DpiSliderY=0`. Byte 2 of the DPI packet is a high-speed multiplier (`cmp edi, 0x1388; setg dl` for DPI $> 5000$), not a separate Y-axis scale. Claims of separate X/Y support in older open-source utilities were misconceptions that broke firmware timing.
2. **Physical Red Tick LEDs for DPI (No DPI RGB):**  
   The M913 does not have RGB LEDs for DPI stages. Active DPI levels are indicated by **4 physical red tick LEDs** located beside the DPI buttons (0 LEDs = Stage 1, 1 LED = Stage 2, 2 LEDs = Stage 3, 3 LEDs = Stage 4, 4 LEDs = Stage 5). The only RGB diode is inside the Redragon Dragon Logo.
3. **Dynamic PWM Modulation in Breathe Mode:**  
   In Respiration mode (Mode 2), the MCU's internal hardware timer automatically sweeps the PWM duty cycle from 0% to 100% and back. The static brightness register (`0x5A`) is completely bypassed by the firmware. Brightness control is only physically active in Steady mode.
4. **Dual Hardware Profile Banks:**  
   The mouse stores two hardware profile banks in flash memory. Switching between Profile 1 and Profile 2 occurs via the physical "Mode Switch" button under the base or via a button bound to `profile_switch`. There is no USB command to force bank switching remotely.
5. **One-Shot Sequencer for Keyboard Sub-Packets:**  
   Due to MCU firmware constraints, keyboard key sub-packets (`Type 0x05`) emit an instantaneous Key Down followed by Key Up. Holding down a mouse button mapped to a keyboard key will not continuously repeat the keystroke. In contrast, native mouse clicks (`Type 0x01`) support continuous hardware hold.
6. **No N-Key Rollover on Side Buttons:**  
   The MCU scans side buttons sequentially; pressing two remapped side buttons simultaneously results in the second event being suppressed until the first is released.

---

## Operating System Setup

### Windows & macOS
No setup required. Connect the mouse (via 2.4G dongle or USB-C cable), open the page in Chrome, Edge, or Brave, and click **Connect Mouse**.

### Linux (udev Configuration)
By default, Linux restricts access to raw USB HID nodes (`/dev/hidraw*`) to the `root` user. To allow your non-root user account to configure the mouse via WebHID:

1. Click the **Linux Setup** card in the web configurator header, or create `/etc/udev/rules.d/99-m913.rules` manually:

```udev
# Redragon M913 Impact Elite (Wireless Receiver & Wired USB-C)
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="25a7", ATTRS{idProduct}=="fa07", MODE="0666", TAG+="uaccess", GROUP="plugdev"
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="25a7", ATTRS{idProduct}=="fa08", MODE="0666", TAG+="uaccess", GROUP="plugdev"
```

2. Reload and trigger udev rules:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

3. Unplug and reconnect the mouse or USB dongle.

---

## Hosting & Local Development

The WebHID API requires a **Secure Context** (`https://` or `http://localhost`). It will not run from a local `file://` path.

### Running Locally
To launch a quick local server using Python, Node.js, or PHP:

```bash
# Clone the repository
git clone https://github.com/YourUsername/Redragon_M913_Web_Configurator.git
cd Redragon_M913_Web_Configurator

# Python 3
python3 -m http.server 8080

# Or Node.js
npx serve -l 8080

# Or PHP
php -S localhost:8080
```

Open `http://localhost:8080` in any Chromium-based browser.

### Deploying Online
Deploy the repository directly to any static web host providing HTTPS:
- **GitHub Pages**
- **Cloudflare Pages**
- **Vercel**
- **Netlify**

---

## USB HID Protocol Specification

All configuration transactions use 17-byte HID Feature Reports (Report ID `0x08`):

```
+------+------+------+--------+--------+--------+------------------+----------+
| Byte |  0   |  1   |   2    |   3    |   4    |      5..14       |    16    |
+------+------+------+--------+--------+--------+------------------+----------+
| Sign | 0x08 | Sub  |  0x00  | AddrHi | AddrLo | Data Payload     | Checksum |
+------+------+------+--------+--------+--------+------------------+----------+
```

### Global Checksum Algorithm
Byte 16 is calculated using a modulo-256 complement relative to base `0x55`:
$$\text{Checksum} = \left( 0x55 - \sum_{i=0}^{15} \text{byte}[i] \right) \pmod{256}$$

### Sub-Commands (Byte 1)
- `0x07` (**Write Chunk**): Writes up to 10 bytes of configuration into the EEPROM offset `[AddrHi, AddrLo]`.
- `0x08` (**Read Chunk**): Requests 10 bytes from EEPROM offset `[AddrHi, AddrLo]`. Received via bidirectional `inputreport`.
- `0x04` (**Commit / Execution**): Finalizes staged changes into non-volatile flash. Sent twice with a 10 ms delay.
- `0x04` at address `0x0000` (**Battery Telemetry**): Queries current battery charge level (`0..10`).

### EEPROM Register Map (0x00..0x9F)

| Memory Offset | Length | Description |
|---|---|---|
| `0x00` | 1 byte | USB Polling Rate (`0x01`=1000Hz, `0x02`=500Hz, `0x04`=250Hz, `0x08`=125Hz) |
| `0x01` | 1 byte | Polling checksum complement (`0x55 - PollingRate`) |
| `0x02` | 1 byte | Number of active DPI stages (`0x01..0x05`) |
| `0x07` | 1 byte | DPI enabled-stage mask register |
| `0x0C..0x1F` | 20 bytes | 5 DPI stage definitions (4 bytes each: `[CodeX, CodeY, MultiplierFlag, Checksum]`) |
| `0x2C..0x3F` | 20 bytes | DPI indicator color trailers (fixed factory palette) |
| `0x54..0x57` | 4 bytes | Logo LED RGB Color (`[R, G, B, 0x55 - R - G - B]`) |
| `0x58..0x59` | 2 bytes | Logo LED Mode (`0x00`=Off, `0x01`=Steady, `0x02`=Breathe, `0x03`=Rainbow) |
| `0x5A..0x5B` | 2 bytes | Logo LED Brightness (`0..255`) and local checksum |
| `0x5C..0x5D` | 2 bytes | Logo LED Animation Speed (`1..5`) and local checksum |
| `0x60..0x9F` | 64 bytes | 16 Button slots (4 bytes each: `[ActionType, Param1, Param2, Checksum]`) |
| `0x0100..0x02E0` | Sub-packets | Extended keyboard keystroke and macro sub-packets (32 bytes per button slot) |

---

## Project Structure

```
.
├── index.html                       # Standalone single-page web application (UI, CSS & WebHID engine)
├── protocol.js                      # ES6 protocol engine (packet builder, parser, EEPROM decoder)
├── README.md                        # Project documentation (this file)
└── docs/
    └── OEM_SOFTWARE_DOCUMENTATION.md # Full technical reverse engineering report of OemDrv.exe
```

---

## Credits & License

- **Concept & Direction:** Olek
- **Hardware Reverse Engineering:** Analyzed from original binaries `OemDrv.exe` & `Lowerdev.dll` (Areson / SinoWealth framework).
- **Prior Open-Source Research:** Based in part on foundational research from [`m913-ctl`](https://github.com/Qehbr/m913-ctl) by Qehbr and [`mouse_m908`](https://github.com/dokutan/mouse_m908) by dokutan.

Released under the **[GNU General Public License v3.0](LICENSE)**.