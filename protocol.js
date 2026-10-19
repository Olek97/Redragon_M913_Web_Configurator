// Redragon M913 Impact Elite — protocol (JS port of Qehbr/m913-ctl, GPL-3.0)
//
// 17-byte frame:
//   [0]     0x08 — config command marker (Report ID, Feature)
//   [1]     sub-command (0x07=write, 0x04=commit)
//   [2]     0x00
//   [3]     0x00 (or address-hi for keyboard sub-packets)
//   [4]     memory address
//   [5]     payload length
//   [6..13] payload
//   [14-15] padding 0x00
//   [16]    checksum: (0x55 - sum(bytes[0..15])) & 0xFF
//
// Transport: device.sendFeatureReport(0x08, 16-byte-data) over WebHID.

export const M913_VID = 0x25a7;
export const M913_PID = 0xfa07;        // 2.4G wireless receiver (dongle)
export const M913_PID_WIRED = 0xfa08;  // wired / dual-mode USB
export const M913_PIDS = [M913_PID, M913_PID_WIRED];
export const PACKET_SIZE = 17;
export const REPORT_ID = 0x08;

export function computeChecksum(packet) {
  let s = 0;
  for (let i = 0; i < PACKET_SIZE - 1; i++) s += packet[i];
  return (0x55 - s) & 0xff;
}

function finalizePacket(p) {
  p[16] = computeChecksum(p);
  return p;
}

function fromTemplate(arr) {
  const p = new Uint8Array(PACKET_SIZE);
  p.set(arr);
  return p;
}

// 16 firmware button indices.
export const BUTTONS = {
  side1: 0,  side2: 1,  side3: 2,  side4: 3,
  side5: 4,  side6: 5,  right: 6,  left: 7,
  side7: 8,  side8: 9,  middle: 10, fire: 11,
  side9: 12, side10: 13, side11: 14, side12: 15,
};

export const BUTTON_LABELS = {
  0: 'Side 1', 1: 'Side 2', 2: 'Side 3', 3: 'Side 4',
  4: 'Side 5', 5: 'Side 6', 6: 'Right', 7: 'Left',
  8: 'Side 7', 9: 'Side 8', 10: 'Middle', 11: 'Fire',
  12: 'Side 9', 13: 'Side 10', 14: 'Side 11', 15: 'Side 12',
};

// Direct actions (mouse, dpi, special). Format: [type, modifier/extra, scancode/extra, reserved].
export const DIRECT_ACTIONS = {
  left:           [0x01, 0x01, 0x00, 0x53],
  right:          [0x01, 0x02, 0x00, 0x52],
  middle:         [0x01, 0x04, 0x00, 0x50],
  backward:       [0x01, 0x08, 0x00, 0x4c],
  back:           [0x01, 0x08, 0x00, 0x4c],
  forward:        [0x01, 0x10, 0x00, 0x44],
  double_click:   [0x01, 0x20, 0x00, 0x34],
  r_double_click: [0x01, 0x40, 0x00, 0x14],
  scroll_up:      [0x01, 0x00, 0x01, 0x53],
  scroll_down:    [0x01, 0x00, 0xff, 0x55],
  'dpi-':         [0x02, 0x03, 0x00, 0x50],
  'dpi+':         [0x02, 0x02, 0x00, 0x51],
  'dpi-cycle':    [0x02, 0x01, 0x00, 0x52],
  snipe:          [0x02, 0x04, 0x00, 0x4f],
  led_toggle:     [0x08, 0x00, 0x00, 0x4d],
  profile_switch: [0x08, 0x01, 0x00, 0x4c],
  none:           [0x00, 0x00, 0x00, 0x55],
  three_click:    [0x04, 0x32, 0x03, 0x1c],
  polling_switch: [0x07, 0x00, 0x00, 0x4e],
  fire:           [0x04, 0x3a, 0x03, 0x14],
};

// Multimedia (action type 0x92, USB HID Consumer page).
export const MEDIA_ACTIONS = {
  media_play:     [0x92, 0x00, 0xcd, 0x00],
  media_player:   [0x92, 0x01, 0x83, 0x01],
  media_next:     [0x92, 0x00, 0xb5, 0x00],
  media_prev:     [0x92, 0x00, 0xb6, 0x00],
  media_stop:     [0x92, 0x00, 0xb7, 0x00],
  media_vol_up:   [0x92, 0x00, 0xe9, 0x00],
  media_vol_down: [0x92, 0x00, 0xea, 0x00],
  media_mute:     [0x92, 0x00, 0xe2, 0x00],
  media_email:    [0x92, 0x01, 0x8a, 0x01],
  media_calc:     [0x92, 0x01, 0x92, 0x01],
  media_computer: [0x92, 0x01, 0x94, 0x01],
  media_home:     [0x92, 0x02, 0x23, 0x02],
  media_search:   [0x92, 0x02, 0x21, 0x02],
  www_forward:    [0x92, 0x02, 0x25, 0x02],
  www_back:       [0x92, 0x02, 0x24, 0x02],
  www_stop:       [0x92, 0x02, 0x26, 0x02],
  www_refresh:    [0x92, 0x02, 0x27, 0x02],
  www_favorites:  [0x92, 0x02, 0x2a, 0x02],
};

export const MODIFIERS = {
  ctrl_l: 0x01, shift_l: 0x02, alt_l: 0x04, super_l: 0x08,
  ctrl_r: 0x10, shift_r: 0x20, alt_r: 0x40, super_r: 0x80,
  ctrl: 0x01, shift: 0x02, alt: 0x04, super: 0x08, meta: 0x08,
};

// USB HID keyboard usage codes (HID spec, Section 10).
export const KEY_CODES = {
  a: 0x04, b: 0x05, c: 0x06, d: 0x07, e: 0x08, f: 0x09, g: 0x0a, h: 0x0b,
  i: 0x0c, j: 0x0d, k: 0x0e, l: 0x0f, m: 0x10, n: 0x11, o: 0x12, p: 0x13,
  q: 0x14, r: 0x15, s: 0x16, t: 0x17, u: 0x18, v: 0x19, w: 0x1a, x: 0x1b,
  y: 0x1c, z: 0x1d,
  '1': 0x1e, '2': 0x1f, '3': 0x20, '4': 0x21, '5': 0x22,
  '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
  enter: 0x28, escape: 0x29, esc: 0x29, backspace: 0x2a, tab: 0x2b, space: 0x2c,
  minus: 0x2d, equal: 0x2e, lbracket: 0x2f, rbracket: 0x30, backslash: 0x31,
  semicolon: 0x33, quote: 0x34, grave: 0x35, comma: 0x36, dot: 0x37, slash: 0x38,
  capslock: 0x39,
  f1: 0x3a, f2: 0x3b, f3: 0x3c, f4: 0x3d, f5: 0x3e, f6: 0x3f,
  f7: 0x40, f8: 0x41, f9: 0x42, f10: 0x43, f11: 0x44, f12: 0x45,
  printscreen: 0x46, scrolllock: 0x47, pause: 0x48, insert: 0x49,
  home: 0x4a, pageup: 0x4b, delete: 0x4c, end: 0x4d, pagedown: 0x4e,
  arrowright: 0x4f, arrowleft: 0x50, arrowdown: 0x51, arrowup: 0x52,
  // Numpad
  numlock: 0x53, numdiv: 0x54, nummul: 0x55, numminus: 0x56, numplus: 0x57,
  numenter: 0x58,
  num1: 0x59, num2: 0x5a, num3: 0x5b, num4: 0x5c, num5: 0x5d,
  num6: 0x5e, num7: 0x5f, num8: 0x60, num9: 0x61, num0: 0x62,
  numdot: 0x63,
};

// Parses an action string ("ctrl+c", "f1", "media_play", "fire:58:3", ...).
// Returns { ab, keyboard? } where ab is the 4 action bytes; keyboard
// (if present) describes a keyboard-type sub-packet to emit.
export function parseAction(actionStr) {
  const action = actionStr.toLowerCase().trim();

  if (action.startsWith('fire:')) {
    const parts = action.split(':');
    if (parts.length === 3) {
      const speed = parseInt(parts[1], 10);
      const times = parseInt(parts[2], 10);
      if (speed >= 3 && speed <= 255 && times >= 0 && times <= 3) {
        const cs = (0x55 - (0x04 + speed + times)) & 0xff;
        return { ab: [0x04, speed, times, cs] };
      }
    }
    return null;
  }

  if (DIRECT_ACTIONS[action]) return { ab: DIRECT_ACTIONS[action] };
  if (MEDIA_ACTIONS[action]) return { ab: MEDIA_ACTIONS[action] };

  const parts = action.split('+').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  let mods = 0;
  const keys = [];
  for (const part of parts) {
    if (MODIFIERS[part] !== undefined) mods |= MODIFIERS[part];
    else if (KEY_CODES[part] !== undefined) keys.push(KEY_CODES[part]);
    else return null;
  }

  if (mods === 0 && keys.length === 1) {
    return { ab: [0x90, 0x00, keys[0], 0x00], keyboard: { type: 'plain', key: keys[0] } };
  }
  if (mods !== 0 && keys.length === 1) {
    return { ab: [0x90, mods, keys[0], 0x00], keyboard: { type: 'combo', mods, keys } };
  }
  if (keys.length >= 2 && keys.length <= 3) {
    return { ab: [0x91, mods, keys[0], keys.length], keyboard: { type: 'combo', mods, keys } };
  }
  if (mods !== 0 && keys.length === 0) {
    return { ab: [0x90, mods, 0x00, 0x00], keyboard: { type: 'mod_only', mods } };
  }
  return null;
}

// Per-button keyboard addresses (bytes [3] and [4] of the sub-packet).
// Source: mouse_m913::_c_keyboard_key_buttons
export const KB_KEY_ADDR = [
  [0x01, 0x00], [0x01, 0x20], [0x01, 0x40], [0x01, 0x60],
  [0x01, 0x80], [0x01, 0xa0], [0x01, 0xc0], [0x01, 0xe0],
  [0x02, 0x00], [0x02, 0x20], [0x02, 0x40], [0x02, 0x60],
  [0x02, 0x80], [0x02, 0xa0], [0x02, 0xc0], [0x02, 0xe0],
];

const DEFAULT_BUTTON_MAPPING = [
  [0x08,0x07,0x00,0x00,0x60,0x08, 0x00,0x00,0x00,0x55, 0x05,0x00,0x00,0x50, 0x00,0x00,0x34],
  [0x08,0x07,0x00,0x00,0x68,0x08, 0x05,0x00,0x00,0x50, 0x01,0x08,0x00,0x4c, 0x00,0x00,0x2c],
  [0x08,0x07,0x00,0x00,0x70,0x08, 0x05,0x00,0x00,0x50, 0x05,0x00,0x00,0x50, 0x00,0x00,0x24],
  [0x08,0x07,0x00,0x00,0x78,0x08, 0x01,0x02,0x00,0x52, 0x01,0x01,0x00,0x53, 0x00,0x00,0x1c],
  [0x08,0x07,0x00,0x00,0x80,0x08, 0x05,0x00,0x00,0x50, 0x05,0x00,0x00,0x50, 0x00,0x00,0x14],
  [0x08,0x07,0x00,0x00,0x88,0x08, 0x01,0x04,0x00,0x50, 0x04,0x3a,0x03,0x14, 0x00,0x00,0x0c],
  [0x08,0x07,0x00,0x00,0x90,0x08, 0x05,0x00,0x00,0x50, 0x05,0x00,0x00,0x50, 0x00,0x00,0x04],
  [0x08,0x07,0x00,0x00,0x98,0x08, 0x05,0x00,0x00,0x50, 0x05,0x00,0x00,0x50, 0x00,0x00,0xfc],
];

const KB_KEY_TEMPLATE = [
  0x08,0x07,0x00,0x01,0x60,0x08,
  0x02,0x81,0x21,0x00,0x41,0x21,0x00,0x4f,
  0x00,0x00,0x88
];

const KB_MARKER = [0x05, 0x00, 0x00, 0x50];

// Each of the 8 mapping packets holds 2 button slots (4 bytes each).
// Slot 0 of a packet starts at offset 6, slot 1 at offset 10.
function writeSlot(packets, btnIdx, fourBytes) {
  const pkt = btnIdx >> 1;
  const off = (btnIdx & 1) === 0 ? 6 : 10;
  for (let k = 0; k < 4; k++) packets[pkt][off + k] = fourBytes[k];
}

// Builds the packet sequence for button mapping.
// changes: { btnIdx -> { ab, keyboard } } produced by parseAction
export function buildButtonMapping(changes) {
  const buf = DEFAULT_BUTTON_MAPPING.map(fromTemplate);
  const result = [];

  for (const [btnIdxStr, parsed] of Object.entries(changes)) {
    const btnIdx = parseInt(btnIdxStr, 10);
    if (btnIdx < 0 || btnIdx >= 16) continue;
    const ab = parsed.ab;

    if (ab[0] === 0x90 || ab[0] === 0x91) {
      const [addrHi, addrLo] = KB_KEY_ADDR[btnIdx];
      const kb = parsed.keyboard;

      if (kb.type === 'plain') {
        const sub = fromTemplate(KB_KEY_TEMPLATE);
        sub[3] = addrHi; sub[4] = addrLo;
        sub[8] = kb.key; sub[11] = kb.key;
        sub[13] = (0x91 - 2 * kb.key) & 0xff;
        finalizePacket(sub);
        result.push(sub);
      } else if (kb.type === 'mod_only') {
        const sub = fromTemplate(KB_KEY_TEMPLATE);
        sub[3] = addrHi; sub[4] = addrLo;
        sub[7] = 0x80; sub[8] = kb.mods;
        sub[10] = 0x40; sub[11] = kb.mods;
        const isum = 0x02 + 0x80 + kb.mods + 0x40 + kb.mods;
        sub[13] = (0x55 - isum) & 0xff;
        finalizePacket(sub);
        result.push(sub);
      } else {
        // combo: pattern is mod-down*, key-down (in order),
        // then mod-up*, key-up (reverse order). Emitted across 2 packets.
        const MOD_BITS = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];
        const evts = [];
        for (const b of MOD_BITS) if (kb.mods & b) evts.push(0x80, b, 0x00);
        for (const k of kb.keys) evts.push(0x81, k, 0x00);
        for (const b of MOD_BITS) if (kb.mods & b) evts.push(0x40, b, 0x00);
        for (let i = kb.keys.length - 1; i >= 0; i--) evts.push(0x41, kb.keys[i], 0x00);

        const count = evts.length / 3;
        const innerCs = (0x55 - ((count + evts.reduce((a, b) => a + b, 0)) & 0xff)) & 0xff;

        // First packet: header + count + first 9 event bytes
        const p1 = new Uint8Array(PACKET_SIZE);
        p1[0] = 0x08; p1[1] = 0x07; p1[2] = 0x00;
        p1[3] = addrHi; p1[4] = addrLo; p1[5] = 0x0a;
        p1[6] = count;
        const p1Used = Math.min(9, evts.length);
        for (let i = 0; i < p1Used; i++) p1[7 + i] = evts[i];
        finalizePacket(p1);
        result.push(p1);

        // Second packet: remaining event bytes + inner checksum
        const remaining = evts.length - p1Used;
        const p2 = new Uint8Array(PACKET_SIZE);
        p2[0] = 0x08; p2[1] = 0x07; p2[2] = 0x00;
        p2[3] = addrHi; p2[4] = (addrLo + 0x0a) & 0xff;
        p2[5] = remaining + 1;
        for (let i = 0; i < remaining; i++) p2[6 + i] = evts[p1Used + i];
        p2[6 + remaining] = innerCs;
        finalizePacket(p2);
        result.push(p2);
      }

      writeSlot(buf, btnIdx, KB_MARKER);
    } else if (ab[0] === 0x92) {
      // Multimedia (Consumer page) sub-packet
      const [addrHi, addrLo] = KB_KEY_ADDR[btnIdx];
      const extra = ab[1], code = ab[2], extra2 = ab[3];
      const sub = new Uint8Array(PACKET_SIZE);
      sub[0] = 0x08; sub[1] = 0x07; sub[2] = 0x00;
      sub[3] = addrHi; sub[4] = addrLo; sub[5] = 0x08;
      sub[6] = 0x02; sub[7] = 0x82; sub[8] = code; sub[9] = extra;
      sub[10] = 0x42; sub[11] = code; sub[12] = extra2;
      const isum = 0x02 + 0x82 + code + extra + 0x42 + code + extra2;
      sub[13] = (0x55 - isum) & 0xff;
      finalizePacket(sub);
      result.push(sub);

      writeSlot(buf, btnIdx, KB_MARKER);
    } else {
      // Direct action: copy 4 bytes into the slot
      writeSlot(buf, btnIdx, ab);
    }
  }

  for (let i = 0; i < 8; i++) finalizePacket(buf[i]);
  // Keyboard sub-packets must be sent BEFORE the 8 mapping packets.
  for (let i = 0; i < 8; i++) result.push(buf[i]);
  return result;
}

const DPI_TABLE = {
  100:[0x00,0x00,0x55], 200:[0x02,0x02,0x51], 300:[0x03,0x03,0x4f],
  400:[0x04,0x04,0x4d], 500:[0x05,0x05,0x4b], 600:[0x06,0x06,0x49],
  700:[0x07,0x07,0x47], 800:[0x09,0x09,0x43], 900:[0x0a,0x0a,0x41],
  1000:[0x0b,0x0b,0x3f], 1100:[0x0c,0x0c,0x3d], 1200:[0x0d,0x0d,0x3b],
  1300:[0x0e,0x0e,0x39], 1400:[0x10,0x10,0x35], 1500:[0x11,0x11,0x33],
  1600:[0x12,0x12,0x31], 1700:[0x13,0x13,0x2f], 1800:[0x14,0x14,0x2d],
  1900:[0x16,0x16,0x29], 2000:[0x17,0x17,0x27], 2100:[0x18,0x18,0x25],
  2200:[0x19,0x19,0x23], 2300:[0x1a,0x1a,0x21], 2400:[0x1b,0x1b,0x1f],
  2500:[0x1d,0x1d,0x1b], 2600:[0x1e,0x1e,0x19], 2700:[0x1f,0x1f,0x17],
  2800:[0x20,0x20,0x15], 2900:[0x21,0x21,0x13], 3000:[0x23,0x23,0x0f],
  3200:[0x26,0x26,0x09], 3600:[0x2a,0x2a,0x01], 4000:[0x2f,0x2f,0xf7],
  4800:[0x39,0x39,0xe3], 5000:[0x3b,0x3b,0xdf], 5500:[0x41,0x41,0xd3],
  6000:[0x47,0x47,0xc7], 6400:[0x4c,0x4c,0xbd], 6600:[0x4f,0x4f,0xb7],
  7000:[0x53,0x53,0xaf], 7200:[0x56,0x56,0xa9], 7300:[0x57,0x57,0xa7],
  7400:[0x58,0x58,0xa5], 7500:[0x59,0x59,0xa3], 8000:[0x5f,0x5f,0x97],
  8500:[0x65,0x65,0x8b], 9000:[0x6b,0x6b,0x7f], 9600:[0x73,0x73,0x6f],
  10000:[0x77,0x77,0x67], 11000:[0x83,0x83,0x4f], 12000:[0x8f,0x8f,0x37],
  13000:[0x9b,0x9b,0x1f], 14000:[0xa7,0xa7,0x07], 15000:[0xb3,0xb3,0xef],
  16000:[0xbd,0xbd,0xdb],
};

export const VALID_DPI_VALUES = Object.keys(DPI_TABLE).map(Number).sort((a,b)=>a-b);

const DPI_TEMPLATES = [
  [0x08,0x07,0x00,0x00,0x0c,0x08, 0x00,0x00,0x00,0x55, 0x02,0x02,0x00,0x51, 0x00,0x00,0x88],
  [0x08,0x07,0x00,0x00,0x14,0x08, 0x03,0x03,0x00,0x4f, 0x04,0x04,0x00,0x4d, 0x00,0x00,0x80],
  [0x08,0x07,0x00,0x00,0x1c,0x04, 0x05,0x05,0x00,0x4b, 0x00,0x00,0x00,0x00, 0x00,0x00,0xd1],
  [0x08,0x07,0x00,0x00,0x02,0x02, 0x05,0x50,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0xed],
];

export const DEFAULT_DPI_COLORS = [
  0xff0000, // Slot 1: Red
  0x0000ff, // Slot 2: Blue
  0x00ff00, // Slot 3: Green
  0xffff00, // Slot 4: Yellow
  0xff8000, // Slot 5: Orange
];

// Generates the 3 trailer packets containing the 5 DPI stage LED indicator colors.
export function buildDpiTrailerPackets(colors = DEFAULT_DPI_COLORS) {
  const c = colors && colors.length >= 5 ? colors : DEFAULT_DPI_COLORS;
  const p1 = new Uint8Array(PACKET_SIZE);
  p1[0] = 0x08; p1[1] = 0x07; p1[2] = 0x00; p1[3] = 0x00; p1[4] = 0x2c; p1[5] = 0x08;
  // Slot 1
  const r1 = (c[0] >> 16) & 0xff, g1 = (c[0] >> 8) & 0xff, b1 = c[0] & 0xff;
  p1[6] = r1; p1[7] = g1; p1[8] = b1; p1[9] = (0x55 - r1 - g1 - b1) & 0xff;
  // Slot 2
  const r2 = (c[1] >> 16) & 0xff, g2 = (c[1] >> 8) & 0xff, b2 = c[1] & 0xff;
  p1[10] = r2; p1[11] = g2; p1[12] = b2; p1[13] = (0x55 - r2 - g2 - b2) & 0xff;
  finalizePacket(p1);

  const p2 = new Uint8Array(PACKET_SIZE);
  p2[0] = 0x08; p2[1] = 0x07; p2[2] = 0x00; p2[3] = 0x00; p2[4] = 0x34; p2[5] = 0x08;
  // Slot 3
  const r3 = (c[2] >> 16) & 0xff, g3 = (c[2] >> 8) & 0xff, b3 = c[2] & 0xff;
  p2[6] = r3; p2[7] = g3; p2[8] = b3; p2[9] = (0x55 - r3 - g3 - b3) & 0xff;
  // Slot 4
  const r4 = (c[3] >> 16) & 0xff, g4 = (c[3] >> 8) & 0xff, b4 = c[3] & 0xff;
  p2[10] = r4; p2[11] = g4; p2[12] = b4; p2[13] = (0x55 - r4 - g4 - b4) & 0xff;
  finalizePacket(p2);

  const p3 = new Uint8Array(PACKET_SIZE);
  p3[0] = 0x08; p3[1] = 0x07; p3[2] = 0x00; p3[3] = 0x00; p3[4] = 0x3c; p3[5] = 0x04;
  // Slot 5
  const r5 = (c[4] >> 16) & 0xff, g5 = (c[4] >> 8) & 0xff, b5 = c[4] & 0xff;
  p3[6] = r5; p3[7] = g5; p3[8] = b5; p3[9] = (0x55 - r5 - g5 - b5) & 0xff;
  finalizePacket(p3);

  return [p1, p2, p3];
}

// dpi: { values: [v1..v5], enabled: [b1..b5], colors?: [c1..c5] }
export function buildDpiPackets(dpi) {
  const buf = DPI_TEMPLATES.map(fromTemplate);

  const setLevel = (pkt, baseOff, val) => {
    const n = nearestDpi(val);
    const code = DPI_TABLE[n] || DPI_TABLE[1000];
    // In OemDrv.exe @ 0x43731f: cmp edi, 0x1388 (5000 DPI); setg dl;
    // Byte 2 is the sensor multiplier flag (0x01 if DPI > 5000, 0x00 otherwise).
    const highDpiFlag = n > 5000 ? 0x01 : 0x00;
    buf[pkt][baseOff] = code[0];
    buf[pkt][baseOff + 1] = code[1];
    buf[pkt][baseOff + 2] = highDpiFlag;
    buf[pkt][baseOff + 3] = (0x55 - code[0] - code[1] - highDpiFlag) & 0xff;
  };

  for (let i = 0; i < 5; i++) {
    const pkt = i === 4 ? 2 : (i >> 1);
    const baseOff = (i === 4 || (i & 1) === 0) ? 6 : 10;
    const v = dpi.values?.[i] ?? 1000;
    if (v) setLevel(pkt, baseOff, v);
  }

  // Enabled-slots encoding: highest disabled level determines the two bytes.
  // The M913 firmware only supports a contiguous range of enabled slots from slot 1.
  if (dpi.enabled && dpi.enabled.filter(Boolean).length > 0) {
    let e1 = 0x05, e2 = 0x50;
    if (!dpi.enabled[4]) { e1 = 0x04; e2 = 0x51; }
    if (!dpi.enabled[3]) { e1 = 0x03; e2 = 0x52; }
    if (!dpi.enabled[2]) { e1 = 0x02; e2 = 0x53; }
    if (!dpi.enabled[1]) { e1 = 0x01; e2 = 0x54; }
    buf[3][6] = e1;
    buf[3][7] = e2;
  }

  for (let i = 0; i < 4; i++) finalizePacket(buf[i]);
  const result = [...buf];
  // DPI indicator colors are fixed in M913 hardware (ShowDpiColor=0 in Cfg.ini).
  // Always emit the standard factory colors to avoid EEPROM desync.
  const trailerPackets = buildDpiTrailerPackets(DEFAULT_DPI_COLORS);
  for (const t of trailerPackets) result.push(t);
  return result;
}

export function nearestDpi(value) {
  return VALID_DPI_VALUES.reduce(
    (best, v) => Math.abs(v - value) < Math.abs(best - value) ? v : best,
    VALID_DPI_VALUES[0]
  );
}

// Builds packets for Logo LED based 1:1 on OemDrv.exe disassembly @ 0x40b375
// mode: 'off' | 'steady' | 'respiration' | 'rainbow'
// color: 0xRRGGBB, brightness: 0-255, speed: 1-5
export function buildLedPackets(mode, color = 0xff0000, brightness = 0xff, speed = 3) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const bClamped = Math.max(0, Math.min(255, brightness));
  const sClamped = Math.max(1, Math.min(5, speed));

  if (mode === 'off') {
    // In OemDrv.exe @ 0x40b526: writes 2 bytes [0x00, 0x55] to address 0x58
    const p = new Uint8Array(PACKET_SIZE);
    p[0] = 0x08; p[1] = 0x07; p[2] = 0x00; p[3] = 0x00;
    p[4] = 0x58; p[5] = 0x02;
    p[6] = 0x00; p[7] = 0x55;
    finalizePacket(p);
    return [p];
  }

  if (mode === 'steady') {
    // In OemDrv.exe @ 0x40b375: writes 8 bytes to address 0x54 (mode 0x01, no speed packet)
    const p = new Uint8Array(PACKET_SIZE);
    p[0] = 0x08; p[1] = 0x07; p[2] = 0x00; p[3] = 0x00;
    p[4] = 0x54; p[5] = 0x08;
    p[6] = r; p[7] = g; p[8] = b;
    p[9] = (0x55 - r - g - b) & 0xff;
    p[10] = 0x01;
    p[11] = 0x54; // (0x55 - 0x01)
    p[12] = bClamped;
    p[13] = (0x55 - bClamped) & 0xff;
    finalizePacket(p);
    return [p];
  }

  if (mode === 'respiration') {
    // In OemDrv.exe @ 0x40b375: writes 8 bytes to address 0x54 (mode 0x02) + 2 bytes to address 0x5C (speed)
    const p1 = new Uint8Array(PACKET_SIZE);
    p1[0] = 0x08; p1[1] = 0x07; p1[2] = 0x00; p1[3] = 0x00;
    p1[4] = 0x54; p1[5] = 0x08;
    p1[6] = r; p1[7] = g; p1[8] = b;
    p1[9] = (0x55 - r - g - b) & 0xff;
    p1[10] = 0x02;
    p1[11] = 0x53; // (0x55 - 0x02)
    p1[12] = bClamped;
    p1[13] = (0x55 - bClamped) & 0xff;
    finalizePacket(p1);

    const p2 = new Uint8Array(PACKET_SIZE);
    p2[0] = 0x08; p2[1] = 0x07; p2[2] = 0x00; p2[3] = 0x00;
    p2[4] = 0x5c; p2[5] = 0x02;
    p2[6] = sClamped;
    p2[7] = (0x55 - sClamped) & 0xff;
    finalizePacket(p2);
    return [p1, p2];
  }

  if (mode === 'rainbow') {
    // In OemDrv.exe @ 0x40b375: writes 8 bytes to address 0x54 (mode 0x03, Neon/Rainbow) + 2 bytes to address 0x5C (speed)
    const p1 = new Uint8Array(PACKET_SIZE);
    p1[0] = 0x08; p1[1] = 0x07; p1[2] = 0x00; p1[3] = 0x00;
    p1[4] = 0x54; p1[5] = 0x08;
    p1[6] = 0xff; p1[7] = 0x00; p1[8] = 0xff;
    p1[9] = 0x57; // (0x55 - 0xff - 0x00 - 0xff) & 0xff
    p1[10] = 0x03;
    p1[11] = 0x52; // (0x55 - 0x03)
    p1[12] = bClamped;
    p1[13] = (0x55 - bClamped) & 0xff;
    finalizePacket(p1);

    const p2 = new Uint8Array(PACKET_SIZE);
    p2[0] = 0x08; p2[1] = 0x07; p2[2] = 0x00; p2[3] = 0x00;
    p2[4] = 0x5c; p2[5] = 0x02;
    p2[6] = sClamped;
    p2[7] = (0x55 - sClamped) & 0xff;
    finalizePacket(p2);
    return [p1, p2];
  }

  return [];
}

// hz → polling-rate code byte. The firmware accepts 4 discrete rates only.
const POLLING_CODES = { 1000: 0x01, 500: 0x02, 250: 0x04, 125: 0x08 };

export function buildPollingRatePacket(hz) {
  // Snap to the highest supported rate that doesn't exceed the request.
  const code = POLLING_CODES[hz]
            ?? POLLING_CODES[[1000, 500, 250, 125].find(r => hz >= r)]
            ?? 0x08; // fallback to 125 Hz

  const p = new Uint8Array(PACKET_SIZE);
  p[0] = 0x08; p[1] = 0x07;
  p[4] = 0x00; p[5] = 0x02;
  p[6] = code;
  p[7] = (0x55 - code) & 0xff;
  finalizePacket(p);
  return p;
}

// Commit (apply-to-flash). Must be sent twice at the end of a config session.
export function buildCommitPacket() {
  const p = new Uint8Array(PACKET_SIZE);
  p[0] = 0x08; p[1] = 0x04;
  finalizePacket(p);
  return p;
}

export function packetToHex(p) {
  return Array.from(p).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

// Builds a 17-byte command packet to read `length` bytes from `address` in mouse EEPROM.
export const FACTORY_BUTTON_DEFAULTS = {
  0: '1', 1: '2', 2: '3', 3: '4', 4: '5', 5: '6',
  6: 'right', 7: 'left',
  8: '7', 9: '8',
  10: 'middle', 11: 'fire',
  12: '9', 13: '0',
  14: 'numplus', 15: 'numminus',
};

// Builds a 17-byte command packet to read `length` bytes from `address` in mouse EEPROM.
// Length is typically 10 (0x0A) bytes per request.
// Sub-command is 0x08 (Read EEPROM), verified from OEM driver disassembly at 0x44087a.
export function buildReadPacket(address, length = 10) {
  const p = new Uint8Array(PACKET_SIZE);
  p[0] = 0x08; // Report ID
  p[1] = 0x08; // Sub-command: 0x08 for Read EEPROM
  p[2] = 0x00;
  p[3] = (address >> 8) & 0xff;
  p[4] = address & 0xff;
  p[5] = length;
  finalizePacket(p);
  return p;
}

// Parses the 16-byte (or 17-byte) buffer returned from mouse via WebHID inputreport or receiveFeatureReport.
// Structure of 16-byte buffer (excluding Report ID):
//   u8[0]: subCmd (0x08)
//   u8[1]: status (0x00 = success)
//   u8[2]: addrHi
//   u8[3]: addrLo
//   u8[4]: length (e.g. 10 / 0x0A)
//   u8[5..14]: data bytes (10 bytes)
//   u8[15]: checksum
export function parseReadResponse(data) {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let off = 0;
  if (u8.length === 17 && (u8[0] === 0x08 || u8[0] === 0x09)) {
    off = 1;
  }
  const subCmd = u8[off];
  const status = u8[off + 1];
  const addrHi = u8[off + 2];
  const addrLo = u8[off + 3];
  const len = u8[off + 4];
  const bytes = [];
  for (let i = 0; i < len && (off + 5 + i) < u8.length; i++) {
    bytes.push(u8[off + 5 + i]);
  }
  return { subCmd, status, addr: (addrHi << 8) | addrLo, length: len, bytes };
}

// Decodes a raw keyboard sub-packet event list into an action string
export function decodeKeyEventList(bytes) {
  if (!bytes || bytes.length < 4) return null;
  const count = bytes[0];
  if (count <= 0 || count > 10 || count === 0xff) return null;

  const mods = [];
  const keys = [];
  let media = null;

  for (let i = 0; i < count && (1 + i * 3 + 2) < bytes.length; i++) {
    const type = bytes[1 + i * 3];
    const val = bytes[2 + i * 3];
    const extra = bytes[3 + i * 3];

    if (type === 0x81) {
      // Key down
      for (const [name, code] of Object.entries(KEY_CODES)) {
        if (code === val) {
          keys.push(name);
          break;
        }
      }
    } else if (type === 0x80) {
      // Modifier down
      if (val & 0x01) mods.push('ctrl');
      if (val & 0x02) mods.push('shift');
      if (val & 0x04) mods.push('alt');
      if (val & 0x08) mods.push('super');
    } else if (type === 0x82) {
      // Consumer / multimedia down
      for (const [mName, mBytes] of Object.entries(MEDIA_ACTIONS)) {
        if (mBytes[2] === val && (mBytes[1] === extra || extra === 0)) {
          media = mName;
          break;
        }
      }
    }
  }

  if (media) return media;
  const uniqueMods = [...new Set(mods)];
  const allParts = [...uniqueMods, ...keys];
  if (allParts.length > 0) return allParts.join('+');
  return null;
}

// Decodes a 4-byte button mapping slot into a user-facing action string.
export function decodeButtonAction(ab, slotIdx = null, subPacketBytes = null) {
  // Check DIRECT_ACTIONS
  for (const [name, bytes] of Object.entries(DIRECT_ACTIONS)) {
    if (ab[0] === bytes[0] && ab[1] === bytes[1] && ab[2] === bytes[2]) {
      return { raw: name, ...parseAction(name) };
    }
  }
  // Check MEDIA_ACTIONS
  for (const [name, bytes] of Object.entries(MEDIA_ACTIONS)) {
    if (ab[0] === bytes[0] && ab[1] === bytes[1] && ab[2] === bytes[2] && ab[3] === bytes[3]) {
      return { raw: name, ...parseAction(name) };
    }
  }
  // Check fire action [0x04, speed, times, cs]
  if (ab[0] === 0x04) {
    const act = `fire:${ab[1]}:${ab[2]}`;
    return { raw: act, ...parseAction(act) };
  }
  // Check keyboard plain [0x90, 0x00, key, 0x00]
  if (ab[0] === 0x90 && ab[1] === 0x00 && ab[2] > 0) {
    for (const [keyName, code] of Object.entries(KEY_CODES)) {
      if (code === ab[2]) {
        return { raw: keyName, ...parseAction(keyName) };
      }
    }
  }
  // Check keyboard with modifier [0x90, mods, key, 0x00]
  if (ab[0] === 0x90 && ab[1] > 0) {
    const parts = [];
    if (ab[1] & 0x01) parts.push('ctrl');
    if (ab[1] & 0x02) parts.push('shift');
    if (ab[1] & 0x04) parts.push('alt');
    if (ab[1] & 0x08) parts.push('super');
    for (const [keyName, code] of Object.entries(KEY_CODES)) {
      if (code === ab[2]) {
        parts.push(keyName);
        break;
      }
    }
    const act = parts.join('+');
    return { raw: act, ...parseAction(act) };
  }
  // Keyboard marker [0x05, 0x00, 0x00, 0x50] (sub-packet managed)
  if (ab[0] === 0x05) {
    if (subPacketBytes) {
      const decoded = decodeKeyEventList(subPacketBytes);
      if (decoded) {
        const parsed = parseAction(decoded);
        if (parsed) return { raw: decoded, ...parsed };
      }
    }
    if (slotIdx !== null && FACTORY_BUTTON_DEFAULTS[slotIdx]) {
      const def = FACTORY_BUTTON_DEFAULTS[slotIdx];
      return { raw: def, ...parseAction(def) };
    }
    return { raw: 'custom_key' };
  }
  // Unconfigured / all zeros
  if (ab[0] === 0x00 && ab[1] === 0x00 && ab[2] === 0x00) {
    if (slotIdx !== null && FACTORY_BUTTON_DEFAULTS[slotIdx]) {
      const def = FACTORY_BUTTON_DEFAULTS[slotIdx];
      return { raw: def, ...parseAction(def) };
    }
    return { raw: 'none', ...parseAction('none') };
  }
  // Fallback to hex
  const hex = `0x${ab.map(b => b.toString(16).padStart(2, '0')).join('')}`;
  return { raw: hex, ab };
}

// Parses 160 bytes of EEPROM dump (addresses 0x00..0x9F) into full mouse configuration.
// subPacketsMap is an optional map of button index -> Uint8Array sub-packet data
export function parseProfileEEPROM(eeprom, subPacketsMap = {}) {
  if (!eeprom || eeprom.length < 160) {
    throw new Error(`EEPROM buffer too short (${eeprom ? eeprom.length : 0} bytes, expected at least 160)`);
  }

  // 1. Polling rate at 0x00
  const REVERSE_POLLING = { 0x01: 1000, 0x02: 500, 0x04: 250, 0x08: 125 };
  const polling = REVERSE_POLLING[eeprom[0x00]] ?? 1000;

  // 2. Enabled stages at 0x02
  const numEnabled = Math.max(1, Math.min(5, eeprom[0x02]));
  const enabled = [false, false, false, false, false];
  for (let i = 0; i < numEnabled; i++) enabled[i] = true;

  // Reverse DPI lookup
  const REVERSE_DPI = {};
  for (const [val, code] of Object.entries(DPI_TABLE)) {
    REVERSE_DPI[code[0]] = Number(val);
  }

  // 3. DPI values at 0x0C, 0x10, 0x14, 0x18, 0x1C
  const values = [];
  for (let i = 0; i < 5; i++) {
    const off = 0x0C + i * 4;
    const cX = eeprom[off];
    const v = REVERSE_DPI[cX] || nearestDpi(cX * 100);
    values.push(v);
  }

  // 4. DPI stage colors at 0x2C, 0x30, 0x34, 0x38, 0x3C
  const colors = [];
  for (let i = 0; i < 5; i++) {
    const off = 0x2C + i * 4;
    const r = eeprom[off];
    const g = eeprom[off + 1];
    const b = eeprom[off + 2];
    colors.push((r << 16) | (g << 8) | b);
  }

  // 5. LED settings at 0x54..0x5C
  const ledR = eeprom[0x54];
  const ledG = eeprom[0x55];
  const ledB = eeprom[0x56];
  const ledColor = (ledR << 16) | (ledG << 8) | ledB;
  const modeByte = eeprom[0x58];
  const REVERSE_LED_MODE = { 0: 'off', 1: 'steady', 2: 'respiration', 3: 'rainbow' };
  const ledMode = REVERSE_LED_MODE[modeByte] || 'rainbow';
  const ledBrightness = eeprom[0x5A] !== undefined ? eeprom[0x5A] : 255;
  const ledSpeed = Math.max(1, Math.min(5, eeprom[0x5C] || 3));

  // 6. 16 Button slots at 0x60..0x9F (4 bytes each)
  const buttons = {};
  for (let i = 0; i < 16; i++) {
    const off = 0x60 + i * 4;
    const ab = [eeprom[off], eeprom[off + 1], eeprom[off + 2], eeprom[off + 3]];
    buttons[i] = decodeButtonAction(ab, i, subPacketsMap[i] || null);
  }

  return {
    polling,
    dpi: {
      values,
      enabled,
      colors,
    },
    led: {
      mode: ledMode,
      color: ledColor,
      brightness: ledBrightness,
      speed: ledSpeed,
    },
    buttons,
  };
}

// Builds a packet to query battery / power status (SubCmd 0x04, verified in OemDrv.exe @ 0x4403e0)
export function buildBatteryQueryPacket() {
  const p = new Uint8Array(PACKET_SIZE);
  p[0] = 0x08;
  p[1] = 0x04; // Sub-command 0x04 = Query Battery
  finalizePacket(p);
  return p;
}

// Parses battery query response (SubCmd 0x04)
// u8[off + 0]: 0x04 (SubCmd)
// u8[off + 1]: 0x00 (Status, 0x00 = success)
// u8[off + 5]: nPow (0..10 power level in tenths, or percentage if > 10)
export function parseBatteryResponse(u8, off = 0) {
  if (!u8 || u8.length <= off + 5) return null;
  if (u8[off] !== 0x04) return null;
  const status = u8[off + 1];
  if (status !== 0x00) return null;
  const rawPow = u8[off + 5];
  const percent = rawPow <= 10 ? (rawPow * 10) : (rawPow <= 100 ? rawPow : null);
  return { percent, rawPow };
}