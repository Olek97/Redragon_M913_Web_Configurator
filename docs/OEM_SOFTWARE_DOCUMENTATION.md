# Technical Documentation of the Original Redragon M913 Impact Elite Software

This document provides a comprehensive technical analysis, obtained via reverse engineering (x86 disassembly, PE binary analysis, resource extraction, and USB HID traffic captures), of the official configuration software for the **Redragon M913 Impact Elite** gaming mouse (`M913_Gaming_Mouse_Software.exe`).

---

## 1. System Overview and Hardware Identifiers

The original OEM software suite is developed by **Areson Technology / SinoWealth** (also known within the Rapoo/DragonRise OEM framework) under internal project code **JM01**.

### 1.1 USB Identifiers
- **Vendor ID (VID):** `0x25A7` (Areson Technology Corp.)
- **Wired Product ID (PID):** `0xFA08` (USB-C cable connected directly to the PC)
- **Wireless Product ID (PID2):** `0xFA07` (2.4 GHz wireless USB dongle receiver)
- **Configuration Interface:** Proprietary Vendor-Defined HID Collection (`Usage Page: 0xFF00..0xFF04`)
- **Configuration Report ID:** `0x08` (standard 17-byte frame: 1 byte Report ID + 16 bytes payload/checksum)

### 1.2 Mouse Hardware Architecture
- **Microcontroller (MCU):** SinoWealth SH68F90 / Areson JM01 (enhanced 8051-compatible architecture with internal Flash/EEPROM and integrated USB/RF 2.4 GHz transceiver).
- **Optical Sensors:**
  - Wired Mode (`[SENSOR_1]` in `Cfg.ini`): **PixArt PMW3325** (native resolution up to 5,000 CPI, firmware-interpolated/multiplied up to 10,000 DPI).
  - Wireless Mode (`[SENSOR_2]` in `Cfg.ini`): **PixArt PAW3335** (low-power optical sensor, native resolution up to 16,000 DPI).
- **Battery:** Integrated 1,000 mAh rechargeable lithium-ion battery.
- **Physical Buttons:** 16 reprogrammable buttons (12 numbered thumb buttons, Left Click, Right Click, Middle Click, Rapid Fire key) + 2 dedicated hardware DPI step buttons + 1 physical "Mode Switch" slider under the base.

---

## 2. Original Software File Structure

The installer `M913_Gaming_Mouse_Software.exe` unpacks the following modules into the application directory (`%ProgramFiles(x86)%\Redragon\M913`):

| File | Type / Format | Description & Function |
|---|---|---|
| `OemDrv.exe` | Win32 PE Executable (i386, MFC/WTL) | Main frontend application. Manages the GUI, validation logic, PC-side user profiles, and hex packet assembly. |
| `Lowerdev.dll` | C++ Dynamic Library (`HidParse.dll` v1.8) | USB HID hardware abstraction layer. Interacts with Windows system APIs (`SetupAPI.dll`, `hid.dll`) to enumerate devices, open handles, and issue `SetFeature`/`GetFeature` calls. |
| `MenuEx.dll` | C++ Dynamic Library | Custom UI rendering engine for popups and context menus used in button reassignment. |
| `Cfg.ini` | INI Configuration File (ASCII) | Master OEM configuration file: specifies VID/PID, sensor limits, button GUI coordinates, and default profiles. |
| `skins/` | Graphical Assets Directory | Contains PNG/BMP graphics for button states (`_nr` normal, `_ov` hover, `_dn` pressed), battery status icons (`powerbar1..3.png`), and compiled binary skin files (`mak.skn`). |
| `Text/` | Localization Directory | Contains UTF-16LE XML dictionaries (`en/text.xml` and `sc/text.xml`) containing all displayed UI strings. |
| `InitSetup.dll` / `uninstall.dll` | Setup & Teardown Modules | Registry key setup and clean uninstaller routines. |

---

## 3. In-Depth Analysis of the Master File `Cfg.ini`

The `Cfg.ini` file dictates to `OemDrv.exe` the hardware capabilities of the connected device and controls which UI panels are enabled or suppressed.

### 3.1 `[OPT]` Section (Global Options)
```ini
[OPT]
Debug=0              ; Disable console debug output
UIDebug=0            ; Disable UI debug bounding boxes
Pop=1                ; Enable system tray popup notifications
Sensor=0x3325        ; Default fallback sensor if uninitialized
Title=Redragon M913  ; Main window title
Appdir=JM01          ; Subdirectory under %AppData% for saving profiles and macros
TrayIcon=3           ; System tray notification icon index
AutoSw=1             ; Enable automatic profile switching per foreground process
ApplyNow=0           ; 0 = Requires clicking "Apply"; 1 = Immediate hardware write
GoWithNoDev=0        ; 0 = Locks the GUI if mouse is disconnected
ShowMainEffect=0     ; Suppress chassis light strip RGB controls (not present on M913)
ShowDpiEffect=0      ; Suppress scroll wheel RGB DPI controls (not present on M913)
ShowLogoEffect=1     ; 1 = Enable Logo RGB lighting panel (only RGB zone on M913)
ShowProSw=0          ; 0 = Hide profile switch button in main UI
ShowDpiColor=0       ; 0 = DPI stage colors are fixed in hardware (not customizable)
VID=0x25A7           ; Areson Vendor ID
PID=0xFA08           ; Wired USB mode Product ID
PID2=0xFA07          ; 2.4 GHz wireless mode Product ID
ShowFWUpdate=0       ; Suppress firmware update button
DpiSliderY=0         ; 0 = Hide Y-axis DPI slider (sensor only has 1 global step register)
```

### 3.2 `[SENSOR_1]` and `[SENSOR_2]` Sections
- `[SENSOR_1]` is loaded when the mouse is connected via USB-C cable (PMW3325):
  - DPI limits: `1000, 2000, 4000, 8000, 10000`
  - Fixed hardware indicator colors (`DC`): Red, Blue, Green, Yellow, Orange.
- `[SENSOR_2]` is loaded when the mouse is connected via 2.4G wireless dongle (PAW3335):
  - DPI limits: `1000, 2000, 4000, 8000, 16000`

---

## 4. Driver Architecture of `Lowerdev.dll`

`Lowerdev.dll` exposes 10 pure C exported functions for hardware communication:

```c
BOOL OpenHidDevice(HANDLE* hDev, DWORD vid, DWORD pid);
BOOL CloseHidDevice(HANDLE hDev);
BOOL FindHidDevice(DWORD vid, DWORD pid);
BOOL SetFeature(HANDLE hDev, BYTE* pBuffer, DWORD length);
BOOL GetFeature(HANDLE hDev, BYTE* pBuffer, DWORD length);
BOOL SetOutputReport(HANDLE hDev, BYTE* pBuffer, DWORD length);
BOOL GetInputReport(HANDLE hDev, BYTE* pBuffer, DWORD length);
DWORD GetProductID(HANDLE hDev);
BOOL GetProductString(HANDLE hDev, WCHAR* pOutStr, DWORD maxLen);
DWORD GetVersionNumber(HANDLE hDev);
```

Every configuration packet transmitted by `OemDrv.exe` is routed through `SetFeature` using a 17-byte buffer (Report ID `0x08`).

---

## 5. USB HID Communication Protocol (Report ID `0x08`)

All packets exchanged with the mouse follow this low-level layout:

```
+------+------+------+--------+--------+--------+------------------+----------+
| Byte |  0   |  1   |   2    |   3    |   4    |      5..14       |    16    |
+------+------+------+--------+--------+--------+------------------+----------+
| Sign | 0x08 | Sub  |  0x00  | AddrHi | AddrLo | Data Payload     | Checksum |
+------+------+------+--------+--------+--------+------------------+----------+
```

### 5.1 Global Checksum Algorithm
Byte 16 of the 17-byte frame is computed using a base-`0x55` complement:
$$\text{Checksum} = \left( 0x55 - \sum_{i=0}^{15} \text{byte}[i] \right) \pmod{256}$$

### 5.2 Primary Sub-Commands (Byte 1)
- `0x07` (**Write Chunk**): Writes up to 10 bytes of data into the EEPROM offset specified by `[AddrHi, AddrLo]`.
- `0x08` (**Read Chunk**): Requests 10 bytes from the EEPROM offset specified by `[AddrHi, AddrLo]`. The response is subsequently retrieved via bidirectional `inputreport`.
- `0x04` (**Commit / Execution**): Hardware finalize command. Sent twice consecutively following write sequences to prompt the microcontroller to flush RAM into non-volatile Flash (`[0x08, 0x04, 0x00, 0x00, 0x00, 0x00, ..., Checksum = 0x49]`).
- `0x04` at address `0x0000` with length `1` (**Battery Query**): Queries power state and remaining battery charge.

---

## 6. EEPROM Memory Map (160 Bytes, Offsets `0x00..0x9F`)

The active configuration profile in the mouse is mapped linearly across a 160-byte block:

```
Offset        Size         Description
-----------------------------------------------------------------------------
0x00          1 byte       USB Polling Rate (125, 250, 500, 1000 Hz)
0x01          1 byte       Internal polling checksum (0x55 - PollingRate)
0x02          1 byte       Number of active DPI stages (1 to 5)
0x03..0x06    4 bytes      Sensor configuration parameters
0x07          1 byte       DPI stage enable mask register
0x08..0x0B    4 bytes      Reserved
0x0C..0x1F    20 bytes     5 DPI stage definitions (4 bytes per stage)
0x20..0x2B    12 bytes     Scroll and acceleration parameters
0x2C..0x3F    20 bytes     DPI stage indicator palette (RGB + checksum per stage)
0x40..0x53    20 bytes     Advanced sensor sensitivity parameters
0x54..0x5D    10 bytes     Logo RGB lighting (Mode, Color, Speed, Brightness)
0x5E..0x5F    2 bytes      Reserved
0x60..0x9F    64 bytes     16 Button slot mappings (4 bytes per button)
0x0100..0x04FF             Macro tables and keyboard sub-packets
```

---

## 7. Key Register Specifications

### 7.1 Polling Rate (`0x00`)
- `0x01`: 1000 Hz (1 ms response time)
- `0x02`: 500 Hz (2 ms response time)
- `0x04`: 250 Hz (4 ms response time)
- `0x08`: 125 Hz (8 ms response time)
- `0x01`: `0x55 - PollingRate`

### 7.2 DPI Stages (`0x0C + i * 4`, where $i = 0..4$)
Each DPI stage is stored as a 4-byte structure:
`[ CodeX, CodeY, MultiplierFlag, LocalChecksum ]`
- `CodeX` / `CodeY`: Optical step byte mapped from the PixArt sensor register.
- `MultiplierFlag`: `0x01` if DPI exceeds 5,000 (`DPI > 5000`), otherwise `0x00` (`cmp edi, 0x1388; setg dl` in `OemDrv.exe` @ `0x43731f`).
- `LocalChecksum`: `(0x55 - CodeX - CodeY - MultiplierFlag) & 0xFF`.

### 7.3 Logo RGB Lighting (`0x54..0x5D`)
- **Address `0x54` (8 bytes):** `[ R, G, B, (0x55 - R - G - B), Mode, (0x55 - Mode), Brightness, (0x55 - Brightness) ]`
  - **Supported Modes:**
    - `0x00` = Off (Additionally writes `[0x00, 0x55]` to address `0x58`)
    - `0x01` = Steady (Static solid color, adjustable brightness 0..255)
    - `0x02` = Respiration / Breathe (Single-color breathing, speed 1..5; brightness dynamically modulated by MCU PWM)
    - `0x03` = Rainbow / Neon Cycle (Continuous dynamic spectrum rotation, speed 1..5)
- **Address `0x5C` (2 bytes):** `[ Speed (1..5), (0x55 - Speed) ]`

### 7.4 Battery Register (Query and Response Parsing)
- The command `[0x08, 0x04, 0x00, 0x00, 0x00, 0x01, ..., Checksum 0x48]` returns a response packet:
  - `byte[5]` contains the battery charge level from `0` to `10`.
  - Level `10` = 100% capacity.
  - Level $\le 2$ = Low battery (triggers red battery indicator `powerbar3.png`).
  - Level $3..4$ = Medium battery (triggers amber battery indicator `powerbar2.png`).
  - Level $\ge 5$ = Good battery (triggers green battery indicator `powerbar1.png`).
  - When connected via USB-C cable (PID `0xFA08`), the device is continuously powered and charging.

---

## 8. Button Mapping & Action Encoding

Each of the 16 programmable buttons occupies 4 bytes (`0x60 + i * 4`, where $i = 0..15$).

### 8.1 Physical Button Indices
- `0..5`: Side Thumb Buttons `1` through `6`
- `6`: Right Mouse Button (RMB)
- `7`: Left Mouse Button (LMB)
- `8..9`: Side Thumb Buttons `7` and `8`
- `10`: Middle Mouse Button / Scroll Wheel Click (MMB)
- `11`: Rapid Fire Key
- `12..13`: Side Thumb Buttons `9` and `10`
- `14..15`: Side Thumb Buttons `11` and `12`

### 8.2 Action Types (Byte 0)

| Type (Byte 0) | Param 1 (Byte 1) | Param 2 (Byte 2) | Description |
|---|---|---|---|
| `0x01` | Mouse Function ID | `0x00` | Left Click (`0x13`), Right Click (`0x11`), Middle Click (`0x12`), Forward (`0x14`), Backward (`0x15`), Double Click (`0x23`), Scroll Up (`0x16`), Scroll Down (`0x17`). |
| `0x02` | DPI Action Code | `0x00` | `0x01` = DPI Cycle, `0x02` = DPI +, `0x03` = DPI -, `0x04` = DPI Lock (Snipe). |
| `0x03` | Multimedia Code 1 | Multimedia Code 2 | Consumer/multimedia keys (Volume, Mute, Next/Prev Track, Browser, Calculator). |
| `0x04` | Repeat Speed | Repeat Count | Rapid Fire (`fire:speed:times`) and Triple Click (`three_click`). |
| `0x05` | `0x00` | `0x00` | Keyboard key or combination managed via extended sub-packet at `0x0100 + i * 0x40`. |
| `0x07` | `0x00` | `0x00` | Sequential polling rate cycle (`[0x07, 0x00, 0x00, 0x4e]`). |
| `0x08` | `0x00` or `0x01` | `0x00` | Hardware function: `0x00` = Toggle Logo RGB, `0x01` = Hardware Profile Switch. |
| `0x00` | `0x00` | `0x00` | Disabled button / No Action (`[0x00, 0x00, 0x00, 0x55]`). |

### 8.3 Keyboard Sub-Packets (Type `0x05`)
When a button is programmed to emit keyboard strokes (e.g., `Ctrl+C` or `F5`), the firmware relies on a sub-packet stored at address `0x0100 + i * 0x40` (or `0x20` step):
- **Byte 0:** Total number of recorded events (from 1 to 10).
- **Sequential Events (3 bytes each):**
  - `0x80, Modifiers, 0x00`: Modifier Key Down (`0x01`=Ctrl, `0x02`=Shift, `0x04`=Alt, `0x08`=GUI/Super).
  - `0x81, KeyCode, 0x00`: Standard HID Key Down.
  - `0x41, KeyCode, 0x00`: Standard HID Key Up.
  - `0x40, Modifiers, 0x00`: Modifier Key Up.

---

## 9. Profile Management Architecture

### 9.1 Hardware Profiles (On-Board Flash)
- The mouse stores **2 distinct hardware banks** in its internal flash memory.
- Switching between Bank 1 and Bank 2 occurs strictly at the hardware level:
  1. By pressing the physical **"Mode Switch"** button on the bottom of the mouse.
  2. By pressing a button mapped to the **`profile_switch`** action (`[0x08, 0x01, 0x00, 0x4c]`).
- The microcontroller loads the active bank into EEPROM registers `0x00..0x9F`. **There is no USB command in the MCU firmware to remotely swap hardware profile banks.**

### 9.2 PC-Side Software Profiles
- Within `OemDrv.exe`, the driver maintains a local memory buffer of **14,960 bytes** (5 profiles of 2,992 bytes each, stored in `%AppData%\JM01\pro.dct`).
- When a user chooses a profile in the Windows GUI and clicks **Apply**, the software extracts the 160 bytes for that profile and overwrites the mouse's currently active hardware bank via `SetFeature` USB calls.

---

## 10. Documented Hardware Constraints and Firmware Behaviors

1. **Absence of Independent X/Y DPI:**  
   The PixArt PMW3325 and PAW3335 sensors contain a single silicon register for optical step resolution. In `OemDrv.exe` at address `0x404176`, Y-slider support is explicitly suppressed for these sensors, and `DpiSliderY=0` is set in `Cfg.ini`. Byte 2 of the DPI packet does not scale the Y axis, but serves as a hardware multiplier for resolutions $> 5000\text{ DPI}$.
2. **One-Shot Sequencer for Keyboard Keys:**  
   Due to the architecture of the SinoWealth MCU, keyboard sub-packets always fire an immediate `Down` followed by `Up`. Holding a mouse button bound to a keyboard key will not continuously hold the key down in the operating system. In contrast, native mouse clicks (`Type 0x01`) maintain hardware press states continuously while held.
3. **Absence of N-Key Rollover Across Remapped Side Buttons:**  
   Because of sequential MCU thumb-matrix scanning, pressing two remapped side buttons simultaneously causes the second event to be ignored until the first is released.
4. **Absence of RGB LEDs for DPI Stages (Physical 4-Bar Red Indicator):**  
   Unlike older wired models (such as the M908), the M913 **does not possess RGB LEDs for DPI stages**. DPI level indication is handled by **4 physical red tick LEDs** on the top shell to the left of the DPI buttons (Stage 1: all off, Stage 2: 1 LED on, Stage 3: 2 LEDs, Stage 4: 3 LEDs, Stage 5: 4 LEDs on). The only RGB zone illuminates the Redragon Logo and follows the mode configured in Panel 03, regardless of DPI. In the official software, `ShowDpiColor=0` and `ShowDpiEffect=0` in `Cfg.ini` hide any DPI color picker for this reason.
5. **Dynamic PWM Modulation in Breathe Mode:**  
   In Respiration mode (Mode 2), the MCU's internal hardware timer automatically sweeps the PWM duty cycle from 0% to 100% and back based on the `Speed` register (`0x5C`). The static brightness register (`0x5A`) is bypassed by the microcontroller in this mode. In `OemDrv.exe`, Brightness is an active control exclusively for Steady mode (Mode 1).
6. **Windows Cursor Settings are Host OS Directives:**  
   Sliders for pointer speed, pointer precision enhancement, double-click speed, and scroll lines in the OEM driver's "Advanced" tab only invoke Windows APIs (`SystemParametersInfo`). They are never written to mouse EEPROM, do not modify hardware firmware, and have no effect across non-Windows hosts or gaming consoles.
