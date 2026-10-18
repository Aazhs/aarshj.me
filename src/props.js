// Ground scenery as pixel sprites. Each sprite is drawn in its true daytime
// colours, then lit for the time of day: warmed at golden hour, sunk into the
// night palette after dark, and lit warm by the lamp when it is on.

const DAY = {
  L: '#8fc46a', // leaf light
  M: '#5f9e4a', // leaf mid
  D: '#3d7038', // leaf dark
  T: '#7a5234', // trunk
  t: '#553723', // trunk dark
  C: '#3f444e', // lamp cap
  G: '#dfe5ea', // lamp glass (day)
  P: '#6b7280', // metal post
  p: '#474c57', // metal post dark
  W: '#b07a4c', // wood
  w: '#7e5434', // wood dark
  I: '#3a3f4a', // iron
  F: '#b8865a', // fence
  f: '#8a5f3c', // fence dark
  K: '#9aa0a6', // stone
  k: '#6f757b', // stone dark
  R: '#e46a6a', // flower red
  Y: '#f2c94c', // flower yellow
  V: '#f5f0e6', // flower white
  g: '#5f9e4a', // grass
  S: '#c08a58', // sign board
  s: '#7e5434' // sign post
};

// Big round tree, built from overlapping leaf clusters so each cluster is lit
// on its upper-left and shaded on its lower-right, with a forked trunk.
function makeTree() {
  const w = 27;
  const canopyH = 21;
  const clusters = [[13, 9, 7.5], [6.5, 12, 5.5], [20, 12, 5.5], [9.5, 5.5, 4.8], [17, 5.5, 4.8], [13, 14, 6.5], [3.5, 15, 3.2], [23, 15, 3.2]];
  const rows = [];
  for (let y = 0; y < canopyH; y += 1) {
    let row = '';
    for (let x = 0; x < w; x += 1) {
      let best = null;
      let bestD = 1;
      clusters.forEach(([cx, cy, r]) => {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d < bestD) {
          bestD = d;
          best = [cx, cy, r];
        }
      });
      if (!best) {
        row += '.';
        continue;
      }
      const nx = (x + 0.5 - best[0]) / best[2];
      const ny = (y + 0.5 - best[1]) / best[2];
      const light = -(nx * 0.6 + ny * 0.8) - (y > canopyH - 5 ? 0.5 : 0);
      const speck = (x * 7 + y * 3) % 11 === 0;
      if (light > 0.38) row += speck ? 'M' : 'L';
      else if (light < -0.28) row += speck ? 'M' : 'D';
      else row += speck ? 'D' : 'M';
    }
    rows.push(row);
  }
  const trunk = [
    '..........tT..T...........',
    '...........tTT............',
    '...........tTT............',
    '...........tTT............',
    '...........tTT............',
    '...........tTTT...........',
    '..........ttTTT...........',
    '.........tt...TT..........'
  ].map((r) => r.padEnd(w, '.'));
  return [...rows, ...trunk];
}

const TREE = makeTree();

const BUSH = [
  '..LLLM...',
  '.LMMMMMD.',
  'LMMMMMDDD',
  '.DDDDDDD.'
];

const LAMP = [
  '.CCC.',
  'CGGGC',
  '.GGG.',
  '..C..',
  ...Array(13).fill('..P..'),
  '.pPp.',
  'ppPpp'
];

const BENCH = [
  '.WWWWWWWWWWW.',
  '.w.........w.',
  '.WWWWWWWWWWW.',
  'WWWWWWWWWWWWW',
  'wwwwwwwwwwwww',
  '.I.........I.',
  '.I.........I.',
  'II.........II'
];

const SIGN = [
  'SSSSSSSS.',
  'SwSSwSSSS',
  'SSSSSSSS.',
  '...ss....',
  '...ss....',
  '...ss....',
  '...ss....',
  '..ssss...'
];

const ROCK = ['.KKK.', 'KKKKk', 'kkkkk'];
// Low flower clump: plus-shaped blooms resting on leaves, no visible stems.
const FLOWERS = [
  '.R...V..',
  'RYR.VYV.',
  'MMDMMMDM'
];
const TUFT = ['g.g', 'ggg'];

// Fence: a post every 6 pixels, two rails between them.
function fence(length) {
  const rows = ['', '', '', '', '', '', ''];
  for (let x = 0; x <= length; x += 1) {
    const post = x % 6 === 0;
    rows[0] += post ? 'F' : '.';
    rows[1] += 'F';
    rows[2] += post ? 'f' : '.';
    rows[3] += 'F';
    rows[4] += post ? 'f' : '.';
    rows[5] += post ? 'F' : '.';
    rows[6] += post ? 'f' : '.';
  }
  return rows;
}

function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function mix(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

const css = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;

// Lay out the scene for the current width. Narrow screens get fewer pieces.
export function layoutProps(W) {
  const at = (f) => Math.round(W * f);
  const items = [
    { sprite: SIGN, x: at(0.03) },
    { sprite: TUFT, x: at(0.14) },
    { sprite: FLOWERS, x: at(0.2) },
    { sprite: BUSH, x: at(0.3) },
    { sprite: ROCK, x: at(0.42) },
    { sprite: TUFT, x: at(0.47) },
    { sprite: LAMP, x: at(0.58), lamp: true },
    { sprite: TREE, x: at(0.735) },
    { sprite: FLOWERS, x: at(0.715) },
    { sprite: BUSH, x: at(0.845) }
  ];
  if (W >= 160) {
    items.push({ sprite: BENCH, x: at(0.58) + 5, bench: true });
    items.push({ sprite: fence(Math.min(30, at(0.08))), x: at(0.9) });
    items.push({ sprite: ROCK, x: at(0.685) });
  }
  return items;
}

// One lighting model for scenery and the character.
// light = { night, dim, golden, overcast, wet (all 0..1), ambient (hex), lampColour (hex) }
// Returns colourAt(hex, x, y, strength) -> css colour; strength < 1 keeps things brighter.
export function makeLighting(items, groundY, light) {
  const ambient = rgb(light.ambient);
  const warm = [255, 176, 112];
  const lampRgb = rgb(light.lampColour);
  // dim: 0 in full daylight, 1 once it is dark (follows the sun's altitude).
  const darken = Math.min(0.9, 0.06 + 0.8 * light.dim + 0.45 * light.wet);
  const lampItem = items.find((it) => it.lamp);
  const lampOn = Boolean(lampItem) && light.night > 0.08;
  const lamp = { x: lampItem ? lampItem.x + 2 : -999, y: groundY - LAMP.length + 1, on: lampOn };
  const reach = 22;
  const cache = new Map();
  const colourAt = (hex, x, y, strength = 1) => {
    let c = cache.get(hex);
    if (!c) {
      c = rgb(hex);
      cache.set(hex, c);
    }
    c = mix(c, warm, light.golden * 0.28);
    // Overcast light is flat: pull colours towards grey.
    const lum = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    c = mix(c, [lum, lum, lum], (light.overcast ?? 0) * 0.45);
    c = mix(c, ambient, darken * strength);
    if (lampOn) {
      const d = Math.hypot(x - lamp.x, y - lamp.y);
      if (d < reach) c = mix(c, lampRgb, (1 - d / reach) ** 2 * 0.6 * light.night);
    }
    return css(c);
  };
  return { colourAt, lamp };
}

export function drawProps(ctx, items, groundY, light) {
  const { colourAt, lamp } = makeLighting(items, groundY, light);

  // Lamp glow and its pool of light on the ground, under everything else.
  if (lamp.on) {
    [[16, 0.05], [11, 0.07], [6, 0.11]].forEach(([r, a]) => {
      ctx.globalAlpha = a * light.night;
      ctx.fillStyle = light.lampColour;
      for (let y = -r; y <= r; y += 1) {
        const half = Math.round(Math.sqrt(r * r - y * y));
        ctx.fillRect(lamp.x - half, lamp.y + y, half * 2 + 1, 1);
      }
    });
    ctx.globalAlpha = 0.22 * light.night;
    ctx.fillRect(lamp.x - 10, groundY, 21, 1);
    ctx.fillRect(lamp.x - 6, groundY + 1, 13, 1);
    ctx.globalAlpha = 1;
  }

  items.forEach((it) => {
    const rows = it.sprite;
    const y0 = groundY - rows.length;
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx += 1) {
        const key = row[rx];
        if (key === '.') continue;
        if (key === 'G' && it.lamp) {
          ctx.fillStyle = lamp.on ? light.lampColour : DAY.G;
        } else {
          ctx.fillStyle = colourAt(DAY[key], it.x + rx, y0 + ry);
        }
        ctx.fillRect(it.x + rx, y0 + ry, 1, 1);
      }
    });
  });
}

// Umbrella the character holds in the rain (drawn above the head).
export const UMBRELLA = ['..RRRRR..', '.RRRRRRR.', 'RRRRRRRRR', '....I....', '....I....'];
export const UMBRELLA_COLOURS = { R: '#e46a6a', I: '#3a3f4a' };

// Where the character sits on the bench: sprite x and the seat's row.
export function benchSeat(items, groundY) {
  const bench = items.find((it) => it.bench);
  if (!bench) return null;
  return { x: bench.x + 3, seatY: groundY - BENCH.length + 3 };
}
