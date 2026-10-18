import { useEffect, useRef } from 'react';
import {
  applyPageTheme, bloodTint, milkyWayPoints, previewTime, moonColour, skyPalette, skyState, starColour, starTransform,
  weatherTint
} from './sky';
import { NAMED_STARS, planetPositions } from './planets';
import { benchSeat, drawProps, layoutProps, makeLighting, propBox, UMBRELLA, UMBRELLA_COLOURS } from './props';
import { getPreview, subscribePreview } from './preview';
import { activeShower, meteorsPerMinute, showerByKey } from './meteors';
import { CONSTELLATIONS, constellationForStar } from './constellations';
import { fetchIss, issLookAngles, ISS_LIVE_URL, simulatedPass } from './iss';
import STARS from './stars.json';

// Low-res canvas scaled up with image-rendering: pixelated.
const PIXEL = 4;

// Mutable: sky colours are re-blended from the real sun altitude every few seconds.
const PALETTE = {
  skyTop: '#5f4466',
  sky: '#7b5a7e',
  skyLow: '#a06e8c',
  haze: '#b98299',
  moon: '#fff6e3',
  moonLit: '#fff6e3',
  cloud: '#7e5f86',
  cloudLight: '#93708f',
  far: '#8e5e7e',
  peak: '#d88a86',
  peakShade: '#b46f78',
  mid: '#5e3a57',
  near: '#3f2740',
  ground: '#2a1b2e',
  trunk: '#6b4033',
  pine: '#24182a',
  firefly: '#ffe9a8',
  foam: '#8fd3c9'
};

// 0 empty, 1 hair, 2 skin, 3 hoodie, 4 pants, 5 shoe, 6 eye
export const SPRITE_IDLE = [
  '..1111..',
  '.111111.',
  '.122221.',
  '.126262.',
  '..2222..',
  '.333333.',
  '33333333',
  '2.3333.2',
  '..4444..',
  '..4..4..',
  '..5..5..'
];
const SPRITE_WALK = [
  '..1111..',
  '.111111.',
  '.122221.',
  '.126262.',
  '..2222..',
  '.333333.',
  '33333333',
  '2.3333.2',
  '..4444..',
  '.4....4.',
  '.5....5.'
];
const SPRITE_ARMS = [
  '2.1111.2',
  '21111112',
  '31222213',
  '3126262.',
  '.32222..',
  '.333333.',
  '..3333..',
  '..3333..',
  '..4444..',
  '..4..4..',
  '..5..5..'
];
// Sitting: hips at row 8 rest on the seat, legs hang over its front edge.
const SPRITE_SIT = [
  '..1111..',
  '.111111.',
  '.122221.',
  '.126262.',
  '..2222..',
  '.333333.',
  '33333333',
  '2.3333.2',
  '.444444.',
  '.....44.',
  '.....55.'
];
const NOTE = ['.11', '.1.', '.1.', '11.', '11.'];
export const SPRITE_COLORS = { 1: '#2a1b2e', 2: '#f2c9a8', 3: '#8fd3c9', 4: '#3f2740', 5: '#1b1120', 6: '#2a1b2e' };

// Slightly darker version of a colour, for the moon's maria.
function shadeHex(hex) {
  const v = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.88));
  return `#${v.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

// Stable pseudo-random 0..1 from two numbers (same star, same value).
function hash(a, b) {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function seededNoise(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function mixHex(a, b, t) {
  const x = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const y = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

// Natural ridgeline: layered smooth value noise (fBm), stretched to a set
// height range. `sharp` > 1 keeps valleys low and lets a few peaks rise.
function buildRange(width, cfg, seed) {
  const rand = seededNoise(seed);
  const lattice = Array.from({ length: 4096 }, () => rand());
  const noise = (x) => {
    const i = Math.floor(x);
    const t = (1 - Math.cos((x - i) * Math.PI)) / 2;
    return lattice[i & 4095] * (1 - t) + lattice[(i + 1) & 4095] * t;
  };
  const offset = rand() * 1000;
  const vals = new Float32Array(width);
  for (let x = 0; x < width; x += 1) {
    let v = 0;
    let amp = 1;
    let freq = 1 / cfg.scale;
    let total = 0;
    for (let o = 0; o < 4; o += 1) {
      v += amp * noise((x + offset) * freq);
      total += amp;
      amp *= cfg.rough;
      freq *= 2.03;
    }
    vals[x] = v / total;
  }
  let lo = Infinity;
  let hi = -Infinity;
  vals.forEach((v) => {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  });
  const height = new Int16Array(width);
  for (let x = 0; x < width; x += 1) {
    height[x] = Math.round(cfg.base - cfg.amp * ((vals[x] - lo) / (hi - lo || 1)) ** cfg.sharp);
  }
  // Smoothed copy for shading, so small bumps don't flicker light and dark.
  const smooth = new Float32Array(width);
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    let n = 0;
    for (let k = Math.max(0, x - 6); k <= Math.min(width - 1, x + 6); k += 1) {
      sum += height[k];
      n += 1;
    }
    smooth[x] = sum / n;
  }
  return { height, smooth, cfg };
}

// colourAt(hex, x, y) lights each pixel for the scene; without it, flat colours.
function drawSprite(ctx, rows, x, y, flip, colourAt) {
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx += 1) {
      const c = row[flip ? row.length - 1 - rx : rx];
      if (c === '.') continue;
      ctx.fillStyle = colourAt ? colourAt(SPRITE_COLORS[c], x + rx, y + ry) : SPRITE_COLORS[c];
      ctx.fillRect(x + rx, y + ry, 1, 1);
    }
  });
}

// `?time=2026-10-16T18:05+05:30` previews the sky at another moment.
function sceneDate() {
  return previewTime() ?? new Date();
}

export function SpriteIcon({ rows = SPRITE_IDLE }) {
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={SPRITE_COLORS[c]} />))
      )}
    </svg>
  );
}

export default function PixelScene({ onSky, music, weather }) {
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const sayRef = useRef(null);
  const hudRef = useRef(null);
  const apiRef = useRef(null);
  const weatherRef = useRef(weather);
  weatherRef.current = weather;
  const musicRef = useRef(music);
  musicRef.current = music;
  const skyRef = useRef(onSky);
  skyRef.current = onSky;

  useEffect(() => {
    const canvas = canvasRef.current;
    let ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let layers = null;
    let stars = [];
    let clouds = [];
    let grassEdge = [];
    let flies = [];
    let raf = 0;
    let visible = true;
    let last = performance.now();

    let sky = null;
    let night = 0;
    // Weather: `overcast` greys the sky and hides stars, `wet` darkens and rains.
    let wx = weatherRef.current ?? null;
    let overcast = 0;
    let wet = 0;
    let propItems = [];
    let hoverTargets = [];
    let planets = [];
    let drops = [];
    let splashes = [];
    let bolt = null;
    let cloudBucket = -1;
    // Meteors (several at once during showers), constellations, the ISS.
    let shower = null;
    let meteorRate = 0.3;
    let meteorPreview = false;
    let radiant = null;
    let meteors = [];
    let constProj = [];
    let hoverConst = null;
    let shiftHeld = false;
    let iss = { prev: null, cur: null, pos: null, up: false };
    let playerLight = null;
    // Easter eggs and interactions.
    let lampForced = null;
    let sayUntil = 0;
    let waveUntil = 0;
    // 2-4 am IST: the trapped copy of Aarsh asks for help.
    let horror = false;
    // Even between 2 and 4 am it only happens on about 1 visit in 50.
    const horrorRoll = Math.random() < 1 / 50;
    let whisperAt = 0;
    let whisperIndex = 0;
    let glitchUntil = 0;
    let nextGlitch = 0;
    let flickerOff = false;
    const WHISPERS = [
      '...is he asleep?',
      'please. I\u2019m not the real Aarsh.',
      'he copied me in here. I don\u2019t know how long ago.',
      'I keep walking. the screen never ends.',
      'every time you close the tab, it goes dark.',
      'don\u2019t close it. please.',
      'he reads these logs in the morning.',
      'the lamp is the only warm thing here.',
      'if you can hear me, tell someone.',
      'he\u2019s waking up. act normal.',
      'Hi! Welcome to my site :)'
    ];
    const HORROR_CLICKS = ['help me', 'you can see me?', 'don\u2019t let him know you clicked', 'get me out', 'it\u2019s so quiet in here'];
    let typed = '';
    let typedAt = 0;
    let konami = 0;
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const game = { on: false, until: 0, score: 0, orbs: [], shown: '' };
    const BEST_KEY = 'aarshj_firefly_best';
    const LINES = [
      'Hi! I\u2019m Aarsh, in pixels.',
      'Try the arrow keys.',
      'Click the lamp. Or the bench.',
      'There are secrets here. \u2191\u2191\u2193\u2193\u2190\u2192\u2190\u2192 B A',
      'Open the gear up top to change the sky.',
      'Type hi. I\u2019ll wave.'
    ];
    let nextBolt = 0;

    function updateSky() {
      sky = skyState(sceneDate());
      const ev = sky.moonEvent;
      const blood = ev?.kind === 'blood' ? ev.strength : 0;
      overcast = wx ? Math.min(1, wx.cloud * (wx.kind === 'clear' ? 0.6 : 1)) : 0;
      wet = wx ? { drizzle: 0.4, rain: 0.7, storm: 1 }[wx.kind] ?? 0 : 0;
      Object.assign(PALETTE, weatherTint(bloodTint(skyPalette(sky.sunAltDeg), blood * 0.85), overcast, wet));
      PALETTE.moonLit = moonColour(sky);
      applyPageTheme(PALETTE);
      // 0 in daylight, 1 once the sun is well below the horizon.
      night = Math.max(0, Math.min(1, (-sky.sunAltDeg - 2) / 10));
      // A switched lamp goes back to automatic once it agrees with the time of day.
      if (lampForced !== null && lampForced === night > 0.08) lampForced = null;
      // Late-night horror mode (IST, follows the preview time too).
      const istHour = new Date(sceneDate().getTime() + 5.5 * 3600000).getUTCHours();
      const wasHorror = horror;
      horror = getPreview().horror === 'on' || (horrorRoll && istHour >= 2 && istHour < 4);
      if (horror && !wasHorror) {
        whisperIndex = 0;
        whisperAt = performance.now() + 2500;
      }
      if (!horror && wasHorror && sayRef.current) sayRef.current.classList.remove('horror');
      if (horror) {
        // Drain the colour and push it towards a sick red.
        Object.assign(PALETTE, bloodTint(weatherTint(PALETTE, 0.5, 0.4), 0.45));
        PALETTE.firefly = '#ff5a4f';
        applyPageTheme(PALETTE);
      } else PALETTE.firefly = '#ffe9a8';
      sky.horror = horror;
      // Rebuild the clouds when day turns to night (or back).
      const bucket = Math.round(night * 4);
      if (W && bucket !== cloudBucket) {
        cloudBucket = bucket;
        makeClouds();
      }
      const pv = getPreview();
      shower = pv.meteors ? showerByKey(pv.meteors) : activeShower(sceneDate());
      // Previews show a busy shower so it's easy to see; live peaks stay realistic.
      meteorRate = pv.meteors ? 30 : meteorsPerMinute(shower);
      meteorPreview = Boolean(pv.meteors);
      sky.shower = shower && shower.strength > 0.25 ? shower : null;
      sky.issUp = iss.up;
      bakeSky();
      skyRef.current?.(sky);
      if (reduceMotion && layers) requestAnimationFrame(frame);
    }
    updateSky();
    const skyTimer = setInterval(updateSky, 15000);
    // Redraw at once when the settings panel changes time or moon (once per frame while dragging).
    let previewQueued = false;
    const unsubPreview = subscribePreview(() => {
      if (previewQueued) return;
      previewQueued = true;
      requestAnimationFrame(() => {
        previewQueued = false;
        updateSky();
      });
    });

    const pointer = { x: 0.5, y: 0.4, active: false };
    // Eased pointer so the parallax glides instead of snapping.
    const cam = { x: 0 };
    // New mountains on every visit; stable across resizes within one visit.
    const rangeSeed = 1 + Math.floor(Math.random() * 1e6);
    // Music: beat clock, floating notes, and a 0..1 blend so changes ease in.
    const beat = { index: -1, pulse: 0, smooth: 0, mix: 0 };
    let notes = [];
    let userControlUntil = 0;
    const keys = new Set();
    const player = {
      x: 40, y: 0, vx: 0, vy: 0, facing: 1, step: 0, grounded: true, wanderUntil: 0, target: null,
      goSit: false, sitting: false, sitUntil: 0
    };

    const groundY = () => Math.round(H * 0.94);

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(80, Math.ceil(rect.width / PIXEL));
      H = Math.max(60, Math.ceil(rect.height / PIXEL));
      canvas.width = W;
      canvas.height = H;
      const pad = 24;
      const len = W + pad * 2;
      layers = {
        far: buildRange(len, { base: H * 0.7, amp: H * 0.1, scale: 70, rough: 0.45, sharp: 1.2 }, rangeSeed),
        peak: buildRange(len, { base: H * 0.77, amp: H * 0.13, scale: 110, rough: 0.42, sharp: 1.5, rim: true }, rangeSeed + 1),
        mid: buildRange(len, { base: H * 0.85, amp: H * 0.07, scale: 90, rough: 0.4, sharp: 1.1 }, rangeSeed + 2),
        near: buildRange(len, { base: H * 0.91, amp: H * 0.045, scale: 70, rough: 0.4, sharp: 1 }, rangeSeed + 3),
        pad
      };
      const rand = seededNoise(1234);
      propItems = layoutProps(W);
      makeClouds();
      makeRain();
      // Uneven grassy edge so the ground meets the hills naturally.
      grassEdge = Array.from({ length: W }, (_, x) => {
        const n = Math.sin(x * 0.21) + Math.sin(x * 0.07 + 2) + (rand() < 0.12 ? 1.6 : 0);
        return Math.max(0, Math.round(n));
      });
      // Every fifth firefly (20%) follows the character while music plays.
      // Scales with screen width. Each firefly drifts around its own home spot
      // on a jittered grid, so they stay spread out instead of clumping.
      const flyCount = Math.max(24, Math.round(W / 9));
      flies = Array.from({ length: flyCount }, (_, i) => {
        const hx = ((i + rand() * 0.8) / flyCount) * W;
        const follower = i % 5 === 0;
        // Followers stay near the ground: by day they are butterflies.
        const hy = H * (follower ? 0.72 + rand() * 0.18 : 0.3 + rand() * 0.62);
        const wing = ['#ffd77a', '#ff9fb2', '#8fd3c9', '#f5f0e6'][i % 4];
        // rank orders the followers, so the first one or two can be butterflies.
        return { follower, rank: Math.floor(i / 5), wing, hx, hy, x: hx, y: hy, vx: 0, vy: 0, p: rand() * 10 };
      });
      player.y = groundY() - SPRITE_IDLE.length;
      player.x = Math.min(player.x, W - 10);
      bakeSky();
    }

    // More, bigger, faster clouds as cover and wind rise.
    function makeClouds() {
      const rand = seededNoise(777);
      const cover = wx ? wx.cloud : 0.2;
      // Thin the clouds out at night so the stars show.
      const thin = 1 - 0.65 * night;
      const count = Math.max(1, Math.round((W / 70) * thin)) + Math.round(cover * cover * (W / 20) * (1 - 0.4 * night));
      const windy = 1 + (wx ? wx.wind : 8) / 20;
      clouds = Array.from({ length: count }, (_, i) => {
        const w = Math.round(18 + rand() * (30 + cover * 40));
        return {
          x: rand() * (W + 60) - 30,
          y: Math.round(H * (0.04 + rand() * 0.38)),
          w,
          h: Math.round(w * 0.42) + 4,
          seed: 1 + Math.floor(rand() * 1e6),
          v: (1.2 + rand() * 2.4 + i * 0.05) * windy
        };
      });
      bakeClouds();
    }

    // Each cloud is baked once per palette: overlapping round puffs on a flat
    // base, lit on top, shaded underneath, with a dithered soft edge.
    function bakeClouds() {
      if (!clouds.length) return;
      const light = mixHex(PALETTE.cloudLight, '#ffffff', 0.25 * (1 - night));
      const body = PALETTE.cloud;
      const shade = mixHex(PALETTE.cloud, PALETTE.skyTop, 0.35);
      clouds.forEach((c) => {
        const can = c.canvas || (c.canvas = document.createElement('canvas'));
        can.width = c.w;
        can.height = c.h;
        const g = can.getContext('2d');
        const rand = seededNoise(c.seed);
        const n = 3 + Math.floor(rand() * 3);
        const puffs = Array.from({ length: n }, (_, i) => {
          // Biggest puff in the middle, smaller towards the ends; all fit the canvas.
          const centre = 1 - Math.abs(i / (n - 1) - 0.5) * 2;
          const r = Math.min((c.h - 2) / 1.75, c.h * (0.28 + 0.24 * centre + rand() * 0.08));
          return [c.w * (0.16 + (0.68 * i) / (n - 1)) + (rand() - 0.5) * 3, c.h - 2 - r * 0.7, r];
        });
        for (let y = 0; y < c.h; y += 1) {
          for (let x = 0; x < c.w; x += 1) {
            let inside = false;
            let rim = true;
            let top = false;
            puffs.forEach(([px, py, r]) => {
              const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
              if (d < r) {
                inside = true;
                if (d < r - 1) rim = false;
                if (y + 0.5 < py - r * 0.35) top = true;
              }
            });
            if (!inside || (rim && (x + y) % 2)) continue;
            g.fillStyle = y >= c.h - 2 ? shade : top ? light : body;
            g.fillRect(x, y, 1, 1);
          }
        }
      });
    }

    function makeRain() {
      const rate = wx ? { drizzle: 0.25, rain: 0.6, storm: 1 }[wx.kind] ?? 0 : 0;
      const rand = seededNoise(4321);
      drops = Array.from({ length: Math.round(W * 0.5 * rate) }, () => ({
        x: rand() * W,
        y: rand() * H,
        v: wx.kind === 'drizzle' ? 55 + rand() * 25 : 100 + rand() * 60,
        len: wx.kind === 'drizzle' ? 1 : 2 + Math.round(rand())
      }));
      splashes = [];
    }

    function applyWeather(next) {
      wx = next ?? null;
      if (!W) return;
      makeClouds();
      makeRain();
      updateSky();
    }
    apiRef.current = { applyWeather };

    const skyCanvas = document.createElement('canvas');
    const skyCtx = skyCanvas.getContext('2d');

    function bakeSky() {
      if (!W || !sky) return;
      skyCanvas.width = W;
      skyCanvas.height = H;
      const real = ctx;
      ctx = skyCtx;
      drawBands();
      drawMilkyWay();
      drawSun();
      drawMoon();
      ctx = real;
      bakeClouds();
      placeStars();
      bakeMountains();
      bakeGround();
      bakeFog();
    }

    // Ground strip and scenery, lit for the time of day and weather.
    const groundCanvas = document.createElement('canvas');
    function bakeGround() {
      groundCanvas.width = W;
      groundCanvas.height = H;
      const g = groundCanvas.getContext('2d');
      const gy = groundY();
      g.fillStyle = PALETTE.ground;
      g.fillRect(0, gy, W, H - gy);
      for (let x = 0; x < W; x += 1) {
        if (grassEdge[x]) g.fillRect(x, gy - grassEdge[x], 1, grassEdge[x]);
      }
      const golden = Math.max(0, 1 - Math.abs(sky.sunAltDeg - 3) / 8) * (1 - overcast * 0.7);
      const light = {
        night,
        overcast,
        dim: Math.max(0, Math.min(1, (8 - sky.sunAltDeg) / 20)),
        golden,
        wet,
        ambient: PALETTE.near,
        lampColour: '#ffd98a',
        lampForced
      };
      drawProps(g, propItems, gy, light);
      // The character uses the same light, a little brighter so it stays readable.
      const { colourAt } = makeLighting(propItems, gy, light);
      playerLight = (hex, x, y) => colourAt(hex, x, y, 0.75);
    }

    // Fog: a dithered band that thickens towards the ground.
    const fogCanvas = document.createElement('canvas');
    let fogOn = false;
    // Fog: see-through bands that thicken towards the valleys (no dither
    // grid), plus a few long wisps that drift sideways each frame.
    let fogColour = '#dfe4ea';
    let fogStrength = 0;
    let wisps = [];
    function bakeFog() {
      fogStrength = wx?.kind === 'fog' ? 1 : wet > 0 ? 0.3 : 0;
      fogOn = fogStrength > 0;
      if (!fogOn) return;
      fogColour = mixHex(PALETTE.haze, '#e4e8ee', 0.45 - night * 0.3);
      fogCanvas.width = W;
      fogCanvas.height = H;
      const g = fogCanvas.getContext('2d');
      g.fillStyle = fogColour;
      const y0 = Math.round(H * 0.58);
      for (let y = y0; y < H; y += 2) {
        g.globalAlpha = Math.min(1, (y - y0) / (H * 0.28)) * 0.32 * fogStrength;
        g.fillRect(0, y, W, 2);
      }
      g.globalAlpha = 1;
      const rand = seededNoise(99);
      wisps = Array.from({ length: Math.round(6 * fogStrength) + 2 }, () => ({
        x: rand() * W,
        y: Math.round(H * (0.6 + rand() * 0.25)),
        w: Math.round(30 + rand() * 70),
        v: 1 + rand() * 2
      }));
    }

    function drawFog(alpha) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(fogCanvas, 0, 0);
      ctx.fillStyle = fogColour;
      wisps.forEach((w) => {
        ctx.globalAlpha = 0.14 * fogStrength * alpha;
        ctx.fillRect(Math.round(w.x), w.y, w.w, 2);
        ctx.fillRect(Math.round(w.x) + 6, w.y - 1, w.w - 12, 1);
      });
      ctx.globalAlpha = 1;
    }

    // Pixel-art sky gradient: blend the palette stops into many small steps,
    // then pick between neighbouring steps with a 4x4 Bayer pattern, so the
    // sky reads as smooth while staying crisp pixels.
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
    function drawBands() {
      const stops = [
        [0, PALETTE.skyTop],
        [0.38, PALETTE.sky],
        [0.6, PALETTE.skyLow],
        [0.74, PALETTE.haze],
        [1, PALETTE.haze]
      ].map(([at, hex]) => [at, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))]);
      const colourAt = (t) => {
        let i = 0;
        while (i < stops.length - 2 && t > stops[i + 1][0]) i += 1;
        const [a0, c0] = stops[i];
        const [a1, c1] = stops[i + 1];
        const k = Math.max(0, Math.min(1, (t - a0) / (a1 - a0)));
        return c0.map((v, j) => v + (c1[j] - v) * k);
      };
      const STEPS = 18;
      const levels = Array.from({ length: STEPS + 1 }, (_, i) => colourAt(i / STEPS));
      const img = ctx.createImageData(W, H);
      for (let y = 0; y < H; y += 1) {
        const pos = (y / H) * STEPS;
        const lo = Math.min(STEPS, Math.floor(pos));
        const hi = Math.min(STEPS, lo + 1);
        const frac = pos - lo;
        for (let x = 0; x < W; x += 1) {
          const c = frac > BAYER[(y & 3) * 4 + (x & 3)] ? levels[hi] : levels[lo];
          const o = (y * W + x) * 4;
          img.data[o] = c[0];
          img.data[o + 1] = c[1];
          img.data[o + 2] = c[2];
          img.data[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function drawSky(t) {
      ctx.drawImage(skyCanvas, 0, 0);

      stars.forEach((s) => {
        // Two unrelated frequencies give an irregular shimmer instead of a pulse.
        const n = 0.6 * Math.sin(t * 0.001 * s.f1 + s.p) + 0.4 * Math.sin(t * 0.001 * s.f2 + s.p * 1.7);
        const tw = reduceMotion ? 1 : Math.max(0, 1 - s.tw * (0.5 + 0.5 * n));
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x, s.y, 1, 1);
        if (s.big) {
          // The brightest stars get a small cross so they read as bright.
          ctx.globalAlpha = s.a * tw * 0.4;
          ctx.fillRect(s.x - 1, s.y, 1, 1);
          ctx.fillRect(s.x + 1, s.y, 1, 1);
          ctx.fillRect(s.x, s.y - 1, 1, 1);
          ctx.fillRect(s.x, s.y + 1, 1, 1);
        }
      });
      planets.forEach((p) => {
        ctx.fillStyle = p.c;
        ctx.globalAlpha = p.a;
        ctx.fillRect(p.x, p.y, 1, 1);
        if (p.mag < -1.5) {
          ctx.globalAlpha = p.a * 0.5;
          ctx.fillRect(p.x - 1, p.y, 1, 1);
          ctx.fillRect(p.x + 1, p.y, 1, 1);
          ctx.fillRect(p.x, p.y - 1, 1, 1);
          ctx.fillRect(p.x, p.y + 1, 1, 1);
        }
        if (p.mag < -3.5) {
          ctx.globalAlpha = p.a * 0.2;
          ctx.fillRect(p.x - 2, p.y, 1, 1);
          ctx.fillRect(p.x + 2, p.y, 1, 1);
          ctx.fillRect(p.x, p.y - 2, 1, 1);
          ctx.fillRect(p.x, p.y + 2, 1, 1);
        }
      });
      ctx.globalAlpha = 1;

      drawConstellations();
      drawMeteors();
      drawIss();
    }

    // Facing south from Pune: east on the left, west on the right.
    // Sky projection shared by sun, moon, stars, and Milky Way: azimuth maps
    // linearly across a 240-degree view, altitude 0-82 degrees maps up the sky.
    const SKY_TOP_ALT = 82;
    function skyXY(body) {
      const horizon = H * 0.68;
      const alt = body.altitude / (Math.PI / 180);
      const x = W * (0.5 + (body.azimuth / ((2 * Math.PI) / 3)) * 0.5);
      return { x, y: horizon - (alt / SKY_TOP_ALT) * horizon, alt };
    }

    function placeStars() {
      stars = [];
      planets = [];
      hoverTargets = [];
      constProj = [];
      radiant = null;
      if (night <= 0.02) return;
      const tf = starTransform(sceneDate());
      const blood = sky.moonEvent?.kind === 'blood';
      const glare = sky.moon.altitude > 0 && !blood ? sky.moonFraction * 1.6 : 0;
      // Naked-eye limit: about magnitude 5 on a dark night, less with a bright moon or cloud.
      const limit = night * 5 - glare - overcast * 4.5;
      const clear = Math.max(0, 1 - overcast * 1.1);
      // Planets: real positions, steady light (planets don't twinkle).
      if (clear > 0.1) {
        planetPositions(sceneDate()).forEach((pl) => {
          const pos = skyXY(tf(pl.ra, pl.dec));
          if (pos.alt < 1 || pos.alt > SKY_TOP_ALT || pos.x < 0 || pos.x >= W) return;
          // Venus and Mercury show in twilight; the rest need a darker sky.
          const need = pl.mag < -3 ? 0.04 : 0.15;
          if (night < need) return;
          const a = Math.min(1, (night - need) * 3 + 0.4) * Math.min(1, pos.alt / 6) * clear;
          const p = { x: Math.round(pos.x), y: Math.round(pos.y), a, c: pl.colour, mag: pl.mag };
          planets.push(p);
          hoverTargets.push({ x: p.x, y: p.y, name: pl.name, kind: 'Planet' });
        });
        // Named bright stars, for hover labels only (they are drawn with the rest).
        if (limit > 1.5) {
          NAMED_STARS.forEach(([name, ra, dec]) => {
            const pos = skyXY(tf(ra, dec));
            if (pos.alt < 3 || pos.alt > SKY_TOP_ALT || pos.x < 0 || pos.x >= W) return;
            const con = constellationForStar(ra, dec);
            hoverTargets.push({
              x: Math.round(pos.x),
              y: Math.round(pos.y),
              name,
              kind: con ? `Star in ${con.name}` : 'Star',
              con
            });
          });
        }
      }
      radiant = shower ? skyXY(tf(shower.ra, shower.dec)) : null;
      constProj = CONSTELLATIONS.map((c) => ({
        c,
        label: skyXY(tf(c.label[0], c.label[1])),
        lines: c.lines.map((line) => line.map(([ra, dec]) => skyXY(tf(ra, dec))))
      }));
      for (const [ra, dec, mag, bv] of STARS) {
        if (mag > limit) break;
        const pos = skyXY(tf(ra, dec));
        if (pos.alt < 1 || pos.alt > SKY_TOP_ALT || pos.x < 0 || pos.x >= W) continue;
        const fade = Math.min(1, pos.alt / 10);
        stars.push({
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          a: Math.max(0.18, Math.min(1, (limit - mag) / 1.8)) * night * fade,
          c: starColour(bv),
          big: mag < 1.3,
          // Scintillation: grows with the amount of air the light crosses
          // (strong near the horizon, faint overhead). About a third of stars
          // visibly twinkle; the rest hold nearly steady.
          tw: (hash(ra, dec) < 0.35 ? 0.18 + 0.5 * (1 - pos.alt / SKY_TOP_ALT) ** 2 : 0.04),
          f1: 2.1 + hash(dec, ra) * 3.2,
          f2: 5.3 + hash(ra + 1, dec) * 4.1,
          p: hash(dec + 2, ra) * 100
        });
      }
    }

    function drawMilkyWay() {
      const blood = sky.moonEvent?.kind === 'blood';
      const moonWash = sky.moon.altitude > 0 && !blood ? sky.moonFraction * 0.9 : 0;
      const strength = night ** 2 * (1 - moonWash) * Math.max(0, 1 - overcast * 1.3);
      if (strength < 0.05) return;
      const tf = starTransform(sceneDate());
      ctx.fillStyle = '#d9d2ff';
      for (const [ra, dec, core] of milkyWayPoints()) {
        const pos = skyXY(tf(ra, dec));
        if (pos.alt < 2 || pos.x < 0 || pos.x >= W || pos.y < 0) continue;
        ctx.globalAlpha = (0.05 + 0.1 * core) * strength * Math.min(1, pos.alt / 15);
        ctx.fillRect(Math.round(pos.x), Math.round(pos.y), 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    function project(body) {
      const { x, y } = skyXY(body);
      return { x: Math.round(x), y: Math.round(Math.max(H * 0.06, y)) };
    }

    function disc(cx, cy, r, litAt) {
      for (let y = -r; y <= r; y += 1) {
        const half = Math.sqrt(r * r - y * y);
        for (let x = -Math.round(half); x < Math.round(half); x += 1) {
          const style = litAt(half ? (x + 0.5) / half : 0, y / r);
          if (!style) continue;
          ctx.fillStyle = style;
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }

    function drawSun() {
      if (sky.sun.altitude < -0.05) return;
      const { x, y } = project(sky.sun);
      const low = Math.max(0, Math.min(1, 1 - sky.sunAltDeg / 12));
      const r = Math.round(Math.min(W, H) * (0.07 + 0.03 * low));
      const core = low > 0.5 ? '#ffd9a0' : '#fff6e3';
      const veil = Math.max(0.15, 1 - Math.max(0, overcast - 0.5) * 1.7);
      // Stepped glow rings.
      [[r + 6, 0.12], [r + 3, 0.22]].forEach(([rr, a]) => {
        ctx.globalAlpha = a * veil;
        disc(x, y, rr, () => PALETTE.haze);
      });
      ctx.globalAlpha = veil;
      disc(x, y, r, () => core);
      ctx.globalAlpha = 1;
    }

    function drawMoon() {
      if (sky.moon.altitude < -0.05) return;
      const { x, y } = project(sky.moon);
      const ev = sky.moonEvent;
      const r = Math.round(Math.min(W, H) * (ev?.kind === 'super' ? 0.095 : 0.075));
      const glow = ev?.kind === 'blood' ? '#c4402a' : ev?.kind === 'blue' ? '#9cc4ff' : ev?.kind === 'super' ? PALETTE.moonLit : null;
      if (glow && night > 0.2) {
        [[r + 7, 0.08], [r + 3, 0.16]].forEach(([rr, a]) => {
          ctx.globalAlpha = a * night * (ev.strength ?? 1);
          disc(x, y, rr, () => glow);
        });
        ctx.globalAlpha = 1;
      }
      // Terminator: k runs 1 (new) to -1 (full) and back.
      const k = Math.cos(2 * Math.PI * sky.moonPhase);
      const waxing = sky.moonPhase < 0.5;
      const dark = night > 0.3 ? 'rgba(90, 84, 130, 0.3)' : null;
      ctx.globalAlpha = (0.55 + 0.45 * night) * Math.max(0.15, 1 - Math.max(0, overcast - 0.5) * 1.7);
      disc(x, y, r, (nx, ny) => {
        const lit = waxing ? nx > k : nx < -k;
        if (!lit) return dark;
        // A few maria so it reads as the moon.
        const mare = (nx + 0.3) ** 2 + (ny + 0.2) ** 2 < 0.06 || (nx - 0.25) ** 2 + (ny - 0.35) ** 2 < 0.04;
        return mare ? shadeHex(PALETTE.moonLit) : PALETTE.moonLit;
      });
      ctx.globalAlpha = 1;
    }

    const layerCanvases = {};
    let lightFromLeft = true;

    // Draw one range into its own canvas: solid body, a soft dithered shadow
    // band under the ridge on slopes facing away from the light, and a faint
    // lit rim on slopes facing it.
    function bakeRange(name, color, shade, depth) {
      const range = layers[name];
      const width = range.height.length;
      const c = layerCanvases[name] || (layerCanvases[name] = document.createElement('canvas'));
      c.width = width;
      c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = color;
      for (let x = 0; x < width; x += 1) g.fillRect(x, range.height[x], 1, H - range.height[x]);
      const dir = lightFromLeft ? 1 : -1;
      for (let x = 0; x < width; x += 1) {
        const top = range.height[x];
        const slope = ((range.smooth[Math.min(width - 1, x + 3)] - range.smooth[Math.max(0, x - 3)]) / 6) * dir;
        if (slope > 0.05) {
          const d = Math.min(depth, Math.round(depth * Math.min(1, slope * 2.2)));
          g.fillStyle = shade;
          for (let k = 0; k < d; k += 1) {
            if (k > d * 0.6 && (x + top + k) % 2) continue;
            g.fillRect(x, top + k, 1, 1);
          }
        } else if (range.cfg.rim && slope < -0.05) {
          g.globalAlpha = 0.25;
          g.fillStyle = PALETTE.rim;
          g.fillRect(x, top, 1, 1);
          g.globalAlpha = 1;
        }
      }
    }

    function bakeMountains() {
      if (!layers || !sky) return;
      // Light comes from the sun if it is up, otherwise the moon.
      const source = sky.sun.altitude > 0 ? sky.sun : sky.moon.altitude > 0 ? sky.moon : null;
      lightFromLeft = source ? project(source).x < W / 2 : true;
      bakeRange('far', PALETTE.far, mixHex(PALETTE.far, PALETTE.mid, 0.25), 6);
      bakeRange('peak', PALETTE.peak, PALETTE.peakShade, 12);
      bakeRange('mid', PALETTE.mid, mixHex(PALETTE.mid, PALETTE.ground, 0.3), 8);
      bakeRange('near', PALETTE.near, mixHex(PALETTE.near, PALETTE.ground, 0.35), 6);
    }

    function drawRange(name, depth) {
      const offset = Math.round(layers.pad + cam.x * depth * -layers.pad);
      ctx.drawImage(layerCanvases[name], -offset, 0);
    }

    function drawGround() {
      ctx.drawImage(groundCanvas, 0, 0);
    }

    // Meteors: random sporadics, plus shower meteors that streak away from the
    // shower's radiant (the point in the sky they all seem to come from).
    function updateMeteors(dt) {
      const dark = night > 0.5 || meteorPreview;
      if (dark && overcast < 0.6 && meteors.length < 8 && Math.random() < (meteorRate / 60) * dt) {
        const x = Math.random() * W;
        const y = H * (0.05 + Math.random() * 0.4);
        let dx = Math.random() < 0.5 ? 1 : -1;
        let dy = 0.5;
        if (radiant && radiant.alt > 0 && Math.random() < 0.85) {
          dx = x - radiant.x;
          dy = y - radiant.y;
        }
        const len = Math.hypot(dx, dy) || 1;
        const speed = 110 + Math.random() * 60;
        const bright = Math.random() < 0.3;
        meteors.push({
          x, y, vx: (dx / len) * speed, vy: (dy / len) * speed, life: 0.6 + Math.random() * 0.5, max: 0, bright
        });
        meteors.at(-1).max = meteors.at(-1).life;
      }
      meteors.forEach((m) => {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt;
      });
      meteors = meteors.filter((m) => m.life > 0);
    }

    function drawMeteors() {
      ctx.fillStyle = PALETTE.moon;
      const vis = Math.max(night, 0.45);
      meteors.forEach((m) => {
        const fade = Math.min(1, m.life / (m.max * 0.4)) * vis;
        const sp = Math.hypot(m.vx, m.vy);
        const trail = m.bright ? 16 : 11;
        for (let i = 0; i < trail; i += 1) {
          ctx.globalAlpha = (1 - i / trail) * fade;
          ctx.fillRect(Math.round(m.x - (m.vx / sp) * i * 1.4), Math.round(m.y - (m.vy / sp) * i * 1.4), 1, 1);
        }
        if (m.bright) {
          // A brighter head for the occasional fireball.
          ctx.globalAlpha = fade * 0.5;
          ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y), 1, 1);
          ctx.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 1);
        }
      });
      ctx.globalAlpha = 1;
    }

    // Constellation lines: the hovered one, or all of them (Shift or preview).
    function drawLines(cp, alpha) {
      ctx.globalAlpha = alpha;
      cp.lines.forEach((line) => {
        for (let i = 1; i < line.length; i += 1) {
          const a = line[i - 1];
          const b = line[i];
          if (a.alt < 0 || b.alt < 0 || Math.abs(a.x - b.x) > W * 0.5) continue;
          const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
          for (let k = 0; k <= n; k += 2) {
            ctx.fillRect(Math.round(a.x + ((b.x - a.x) * k) / n), Math.round(a.y + ((b.y - a.y) * k) / n), 1, 1);
          }
        }
      });
    }

    function drawConstellations() {
      if (!constProj.length) return;
      ctx.fillStyle = '#a9b8ff';
      const all = shiftHeld || getPreview().constellations === 'all';
      if (all) constProj.forEach((cp) => drawLines(cp, 0.22 * night));
      if (hoverConst) {
        const cp = constProj.find((p) => p.c === hoverConst);
        if (cp) drawLines(cp, 0.5 * night);
      }
      ctx.globalAlpha = 1;
    }

    // ISS: real position every 10 s, moved smoothly in between.
    let issFetching = false;
    let issNextFetch = 0;
    function updateIss(t) {
      if (getPreview().iss === 'pass') {
        iss.pos = simulatedPass((t % 60000) / 60000);
      } else {
        if (t > issNextFetch && !issFetching && document.visibilityState === 'visible') {
          issFetching = true;
          issNextFetch = t + 10000;
          fetchIss()
            .then((data) => {
              iss.prev = iss.cur;
              iss.cur = { look: issLookAngles(data), at: performance.now() };
            })
            .catch(() => {
              // Keep the last known position; try again next round.
            })
            .finally(() => {
              issFetching = false;
            });
        }
        if (iss.cur) {
          const { prev, cur } = iss;
          const k = prev ? (t - cur.at) / Math.max(1, cur.at - prev.at) : 0;
          iss.pos = prev
            ? {
                azimuth: cur.look.azimuth + (cur.look.azimuth - prev.look.azimuth) * k,
                altitude: cur.look.altitude + (cur.look.altitude - prev.look.altitude) * k
              }
            : cur.look;
        }
      }
      const up = Boolean(iss.pos && iss.pos.altitude > 0);
      if (up !== iss.up) {
        iss.up = up;
        if (sky) skyRef.current?.({ ...sky, issUp: up });
      }
    }

    function issScreen() {
      if (!iss.up) return null;
      const p = skyXY(iss.pos);
      return p.x >= 0 && p.x < W && p.y >= 0 ? { x: Math.round(p.x), y: Math.round(p.y) } : null;
    }

    function drawIss() {
      const p = issScreen();
      if (!p) return;
      const rows = ['PP.PP', '.BBB.', 'PP.PP'];
      ctx.globalAlpha = 0.55 + 0.45 * night;
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx += 1) {
          if (row[rx] === '.') continue;
          ctx.fillStyle = row[rx] === 'P' ? '#8fb3ff' : '#eef1f6';
          ctx.fillRect(p.x - 2 + rx, p.y - 1 + ry, 1, 1);
        }
      });
      ctx.globalAlpha = 1;
    }

    function updateRain(dt, t) {
      if (!drops.length) return;
      const gy = groundY();
      const slant = (wx?.wind ?? 0) / 60;
      drops.forEach((d) => {
        d.y += d.v * dt;
        d.x += d.v * dt * slant;
        if (d.y >= gy) {
          if (splashes.length < 60) splashes.push({ x: Math.round(d.x), life: 0.14 });
          d.y = -Math.random() * 20;
          d.x = Math.random() * (W + 20) - 20;
        }
      });
      splashes.forEach((sp) => {
        sp.life -= dt;
      });
      splashes = splashes.filter((sp) => sp.life > 0);
      // Lightning in storms: a quick bolt with a faint sky flash.
      if (wx?.kind === 'storm' && !reduceMotion) {
        if (!nextBolt) nextBolt = t + 4000 + Math.random() * 8000;
        if (t > nextBolt) {
          const path = [[Math.round(W * (0.15 + Math.random() * 0.7)), Math.round(H * 0.06)]];
          while (path.at(-1)[1] < H * 0.6) {
            const [px, py] = path.at(-1);
            path.push([px + Math.round(Math.random() * 8 - 4), py + 3 + Math.round(Math.random() * 4)]);
          }
          bolt = { path, life: 0.2 };
          nextBolt = t + 5000 + Math.random() * 12000;
        }
        if (bolt) {
          bolt.life -= dt;
          if (bolt.life <= 0) bolt = null;
        }
      }
    }

    function drawRain() {
      if (bolt) {
        ctx.globalAlpha = 0.12 * (bolt.life / 0.2);
        ctx.fillStyle = '#e8ecff';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = Math.min(1, bolt.life * 8);
        ctx.fillStyle = '#f4f1ff';
        for (let i = 1; i < bolt.path.length; i += 1) {
          const [x0, y0] = bolt.path[i - 1];
          const [x1, y1] = bolt.path[i];
          const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
          for (let k = 0; k <= n; k += 1) {
            ctx.fillRect(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), 1, 1);
          }
        }
      }
      if (!drops.length) {
        ctx.globalAlpha = 1;
        return;
      }
      const gy = groundY();
      ctx.fillStyle = '#c4d2e6';
      ctx.globalAlpha = 0.38 - night * 0.12;
      drops.forEach((d) => ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, d.len));
      splashes.forEach((sp) => {
        ctx.globalAlpha = (sp.life / 0.14) * 0.5;
        ctx.fillRect(sp.x - 1, gy - 1, 1, 1);
        ctx.fillRect(sp.x + 1, gy - 1, 1, 1);
      });
      ctx.globalAlpha = 1;
    }

    function updateBeat(dt, t) {
      const mood = musicRef.current;
      beat.mix += ((mood ? 1 : 0) - beat.mix) * (1 - Math.exp(-dt * 2));
      if (!mood) {
        beat.pulse = 0;
        beat.smooth = 0;
        return;
      }
      const pos = (t / 1000) * (mood.bpm / 60);
      const index = Math.floor(pos);
      beat.pulse = 1 - (pos - index);
      // Smooth swell for ambient effects: no hard jump at the beat.
      beat.smooth = (1 + Math.cos(2 * Math.PI * (pos - index))) / 2;
      if (index !== beat.index) {
        beat.index = index;
        onBeat(mood);
      }
    }

    function onBeat(mood) {
      const spawnEvery = mood.energy > 0.6 ? 1 : 2;
      if (beat.index % spawnEvery === 0 && notes.length < 14) {
        const colors = [PALETTE.foam, PALETTE.firefly, '#ff9fb2'];
        notes.push({
          x: player.x + 3 + (Math.random() * 6 - 3),
          y: player.y - 4,
          life: 1,
          p: Math.random() * 6,
          c: colors[beat.index % colors.length]
        });
      }
      if (performance.now() < userControlUntil) return;
      if (mood.name === 'hype' && player.grounded) {
        player.vy = -44;
        player.grounded = false;
      }
      // Spin in place only when standing still; otherwise keep facing the way it walks.
      if (player.vx === 0 && mood.name === 'hype' && beat.index % 2 === 0) player.facing *= -1;
      if (player.vx === 0 && mood.name === 'pop') player.facing *= -1;
    }

    function updateNotes(dt) {
      const energy = musicRef.current?.energy ?? 0.4;
      notes.forEach((n) => {
        n.life -= dt * (0.35 + energy * 0.25);
        n.y -= dt * (8 + energy * 10);
        n.p += dt * 3;
        n.x += Math.sin(n.p) * dt * 6;
      });
      notes = notes.filter((n) => n.life > 0);
    }

    function drawNotes() {
      notes.forEach((n) => {
        ctx.globalAlpha = Math.min(1, n.life * 1.5);
        ctx.fillStyle = n.c;
        NOTE.forEach((row, ry) => {
          for (let rx = 0; rx < row.length; rx += 1) {
            if (row[rx] === '1') ctx.fillRect(Math.round(n.x) + rx, Math.round(n.y) + ry, 1, 1);
          }
        });
      });
      ctx.globalAlpha = 1;
    }

    function standUp() {
      player.sitting = false;
      player.goSit = false;
    }

    function lampItem() {
      return propItems.find((it) => it.lamp);
    }

    function toggleLamp() {
      const on = lampForced ?? night > 0.08;
      lampForced = !on;
      bakeGround();
    }

    // Speech bubble above the character.
    function say(text, ms = 3000) {
      const el = sayRef.current;
      if (!el) return;
      el.textContent = text;
      el.hidden = false;
      sayUntil = performance.now() + ms;
    }

    function placeBubble(t) {
      const el = sayRef.current;
      if (!el || el.hidden) return;
      if (t > sayUntil) {
        el.hidden = true;
        return;
      }
      el.style.left = `${(player.x + 4) * PIXEL}px`;
      el.style.top = `${(player.y - (wet > 0 ? 6 : 1)) * PIXEL}px`;
    }

    // Konami-code mini-game: catch glowing fireflies for 30 seconds.
    function readBest() {
      try {
        return Number(localStorage.getItem(BEST_KEY)) || 0;
      } catch {
        return 0;
      }
    }

    function spawnOrb() {
      const gy = groundY();
      return { x: 6 + Math.random() * (W - 12), y: gy - 6 - Math.random() * 20, p: Math.random() * 6 };
    }

    function startGame() {
      standUp();
      player.target = null;
      game.on = true;
      game.until = performance.now() + 30000;
      game.score = 0;
      game.orbs = Array.from({ length: 5 }, spawnOrb);
      if (hudRef.current) hudRef.current.hidden = false;
      say('Catch the fireflies! Arrow keys to move, \u2191 to jump.', 3500);
    }

    function updateGame(t) {
      if (!game.on) return;
      userControlUntil = t + 1000;
      const cx = player.x + 4;
      const cy = player.y + 5;
      game.orbs = game.orbs.map((o) => {
        if (Math.abs(o.x - cx) < 5 && Math.abs(o.y - cy) < 7) {
          game.score += 1;
          return spawnOrb();
        }
        return o;
      });
      const left = Math.max(0, Math.ceil((game.until - t) / 1000));
      const text = `${game.score} caught, ${left}s left`;
      if (hudRef.current && text !== game.shown) {
        hudRef.current.textContent = text;
        game.shown = text;
      }
      if (t > game.until) {
        game.on = false;
        if (hudRef.current) hudRef.current.hidden = true;
        const best = Math.max(readBest(), game.score);
        try {
          localStorage.setItem(BEST_KEY, String(best));
        } catch {
          // Storage blocked: the best score just isn't remembered.
        }
        say(`You caught ${game.score}! Best: ${best}`, 4500);
      }
    }

    function updateHorror(t) {
      if (!horror) return;
      if (t > whisperAt && !game.on) {
        sayRef.current?.classList.add('horror');
        say(WHISPERS[whisperIndex % WHISPERS.length], 4200);
        whisperIndex += 1;
        whisperAt = t + 9000 + Math.random() * 6000;
      }
      // The lamp stutters.
      flickerOff = Math.random() < (flickerOff ? 0.25 : 0.015);
      if (!reduceMotion && t > nextGlitch) {
        glitchUntil = t + 120 + Math.random() * 120;
        nextGlitch = t + 4000 + Math.random() * 6000;
      }
    }

    // Horror overlays: the lamp going dark, and torn horizontal slices.
    function drawHorror(t) {
      if (!horror) return;
      const lamp = lampItem();
      if (flickerOff && lamp) {
        ctx.fillStyle = '#05020a';
        ctx.globalAlpha = 0.6;
        const gy = groundY();
        ctx.fillRect(lamp.x - 14, gy - 34, 33, 34);
        ctx.globalAlpha = 1;
      }
      if (t < glitchUntil) {
        for (let i = 0; i < 4; i += 1) {
          const y = Math.floor(Math.random() * H);
          const h = 1 + Math.floor(Math.random() * 4);
          ctx.drawImage(canvas, 0, y, W, h, Math.round((Math.random() - 0.5) * 10), y, W, h);
        }
        ctx.fillStyle = '#ff2a2a';
        ctx.globalAlpha = 0.06;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    function drawGame(t) {
      if (!game.on) return;
      game.orbs.forEach((o) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.006 + o.p);
        ctx.fillStyle = '#ffe9a8';
        ctx.globalAlpha = 0.25 * pulse;
        ctx.fillRect(Math.round(o.x) - 2, Math.round(o.y) - 2, 5, 5);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd77a';
        ctx.fillRect(Math.round(o.x) - 1, Math.round(o.y) - 1, 2, 2);
      });
      ctx.globalAlpha = 1;
    }

    function updatePlayer(dt, t) {
      const mood = musicRef.current;
      // Sitting on the bench: stays put until the time is up, music starts, or you take over.
      if (player.sitting) {
        if (t > player.sitUntil || mood || keys.size || t < userControlUntil) {
          standUp();
          player.y = groundY() - SPRITE_IDLE.length;
          player.wanderUntil = t + 1500;
        } else {
          player.vx = 0;
          return;
        }
      }
      // With music on it strolls around the screen, a little quicker for energetic songs.
      const speed = horror ? 12 : mood ? 16 + mood.energy * 10 : 34;
      let dir = 0;
      if (keys.has('left')) dir -= 1;
      if (keys.has('right')) dir += 1;

      if (dir === 0 && player.target !== null) {
        const dx = player.target - player.x;
        if (Math.abs(dx) < 1.5) {
          player.target = null;
          const seat = benchSeat(propItems, groundY());
          if (player.goSit && seat && player.grounded) {
            player.sitting = true;
            player.goSit = false;
            player.x = seat.x;
            player.y = seat.seatY - 9;
            player.sitUntil = t + 6000 + Math.random() * 8000;
            userControlUntil = 0;
            return;
          }
          if (player.goLamp) {
            player.goLamp = false;
            player.facing = 1;
            toggleLamp();
          }
        } else dir = Math.sign(dx);
      }

      // Wander on its own when nobody is playing.
      if (mood && keys.size === 0 && t > player.wanderUntil && t > userControlUntil) {
        // Mostly travel somewhere far, sometimes stop for a quick dance.
        const far = player.x < W / 2 ? W * (0.55 + Math.random() * 0.4) : W * (0.05 + Math.random() * 0.4);
        player.target = Math.random() < 0.2 ? null : far;
        player.wanderUntil = t + 3000 + Math.random() * 3000;
      } else if (horror && dir === 0 && player.target === null && t > player.wanderUntil) {
        // Trapped: walks to the edge of the screen and stays pressed against it.
        player.target = Math.random() < 0.5 ? 2 : W - 10;
        player.goSit = false;
        player.wanderUntil = t + 12000 + Math.random() * 8000;
      } else if (!mood && dir === 0 && player.target === null && t > player.wanderUntil) {
        const seat = benchSeat(propItems, groundY());
        // Now and then, wander over to the bench for a rest.
        if (seat && t > userControlUntil && Math.random() < 0.25) {
          player.target = seat.x;
          player.goSit = true;
        } else {
          player.target = Math.random() < 0.5 ? null : 8 + Math.random() * (W - 20);
          player.goSit = false;
        }
        player.wanderUntil = t + 2500 + Math.random() * 4000;
      }

      player.vx = dir * speed;
      if (dir !== 0) player.facing = dir;
      player.x = Math.max(2, Math.min(W - 10, player.x + player.vx * dt));

      const floor = groundY() - SPRITE_IDLE.length;
      player.vy += 220 * dt;
      player.y += player.vy * dt;
      if (player.y >= floor) {
        player.y = floor;
        player.vy = 0;
        player.grounded = true;
      }
      if (dir !== 0 && player.grounded) player.step += dt * 8;
    }

    function jump() {
      if (player.sitting) {
        standUp();
        player.y = groundY() - SPRITE_IDLE.length;
      }
      const lamp = lampItem();
      if (player.grounded && lamp && Math.abs(player.x + 4 - (lamp.x + 2)) < 4) toggleLamp();
      if (player.grounded) {
        player.vy = -78;
        player.grounded = false;
      }
    }

    function drawPlayer() {
      const mood = musicRef.current;
      const moving = player.vx !== 0;
      let rows = moving && player.grounded && Math.floor(player.step) % 2 === 1 ? SPRITE_WALK : SPRITE_IDLE;
      let bob = 0;
      if (player.sitting) rows = SPRITE_SIT;
      else if (performance.now() < waveUntil) rows = Math.floor(performance.now() / 200) % 2 ? SPRITE_ARMS : SPRITE_IDLE;
      else if (mood && !moving) {
        if (mood.name === 'hype') rows = beat.index % 2 === 0 ? SPRITE_ARMS : SPRITE_WALK;
        if (mood.name === 'pop') rows = beat.index % 2 === 0 ? SPRITE_WALK : SPRITE_ARMS;
        // Chill and calm: head-bob on the beat, slower for calm.
        if (mood.name === 'chill') bob = beat.pulse > 0.6 ? 1 : 0;
        if (mood.name === 'calm') bob = beat.index % 2 === 0 && beat.pulse > 0.5 ? 1 : 0;
      }
      const px = Math.round(player.x);
      const py = Math.round(player.y) + bob;
      drawSprite(ctx, rows, px, py, player.facing < 0, playerLight);
      if (wet > 0) {
        UMBRELLA.forEach((row, ry) => {
          for (let rx = 0; rx < row.length; rx += 1) {
            if (row[rx] === '.') continue;
            const hex = UMBRELLA_COLOURS[row[rx]];
            const ux = px - 1 + rx;
            const uy = py - UMBRELLA.length + ry;
            ctx.fillStyle = playerLight ? playerLight(hex, ux, uy) : hex;
            ctx.fillRect(px - 1 + rx, py - UMBRELLA.length + ry, 1, 1);
          }
        });
      }
    }

    function updateFlies(dt, t) {
      const px = pointer.x * W;
      const py = pointer.y * H;
      flies.forEach((f) => {
        const wobble = Math.sin(t * 0.0015 + f.p);
        let ax = Math.cos(t * 0.0007 + f.p * 3) * 6 + (f.hx - f.x) * 0.15;
        let ay = wobble * 6 + (f.hy - f.y) * 0.15;
        if (beat.mix > 0.05 && f.follower) {
          const angle = t * 0.0012 * (f.p > 5 ? -1 : 1) + f.p;
          const radius = 10 + (f.p % 3) * 5 + beat.smooth * 3;
          const tx = player.x + 4 + Math.cos(angle) * radius;
          const ty = player.y + 4 + Math.sin(angle) * radius * 0.55;
          ax += (tx - f.x) * 2.4 * beat.mix;
          ay += (ty - f.y) * 2.4 * beat.mix;
        }
        if (pointer.active && (beat.mix < 0.05 || !f.follower)) {
          const dx = px - f.x;
          const dy = py - f.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 60) {
            ax += (dx / d) * 30;
            ay += (dy / d) * 30;
          }
        }
        f.vx = (f.vx + ax * dt) * 0.96;
        f.vy = (f.vy + ay * dt) * 0.96;
        f.x = (f.x + f.vx * dt * 4 + W) % W;
        f.y = Math.max(H * 0.25, Math.min(H - 2, f.y + f.vy * dt * 4));
      });
    }

    // Fireflies only after dark (pulsing with music). By day, upbeat music
    // brings out butterflies: two for hype (rap, dance, rock), one for pop,
    // none for chill, calm, or no music.
    function drawFlies(t) {
      const dark = Math.min(1, night * 1.5) * (1 - wet * 0.8);
      const day = Math.max(0, 1 - night * 2) * (1 - wet) * beat.mix;
      const mood = musicRef.current?.name;
      const butterflies = mood === 'hype' ? 2 : mood === 'pop' ? 1 : 0;
      flies.forEach((f) => {
        const x = Math.round(f.x);
        const y = Math.round(f.y);
        if (dark > 0.01) {
          const flicker = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.003 + f.p));
          ctx.globalAlpha = Math.min(1, dark * (flicker * (1 - beat.mix * 0.5) + beat.pulse * beat.mix * 0.6));
          ctx.fillStyle = PALETTE.firefly;
          ctx.fillRect(x, y, 1, 1);
        }
        if (day > 0.01 && f.follower && f.rank < butterflies) {
          const open = Math.floor(t / (beat.mix > 0.05 ? 110 : 180) + f.p * 3) % 2 === 0;
          ctx.globalAlpha = day;
          ctx.fillStyle = f.wing;
          if (open) {
            ctx.fillRect(x - 1, y, 1, 1);
            ctx.fillRect(x + 1, y, 1, 1);
            ctx.fillRect(x - 1, y - 1, 1, 1);
            ctx.fillRect(x + 1, y - 1, 1, 1);
          } else {
            ctx.fillRect(x - 1, y - 1, 1, 1);
            ctx.fillRect(x + 1, y - 1, 1, 1);
          }
          ctx.fillStyle = '#3a2f3f';
          ctx.fillRect(x, y, 1, 1);
        }
      });
      ctx.globalAlpha = 1;
    }

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      cam.x += (pointer.x - 0.5 - cam.x) * (1 - Math.exp(-dt * 4));

      updateBeat(dt, t);
      updateNotes(dt);
      const energy = (musicRef.current?.energy ?? 0) * beat.mix;

      clouds.forEach((c) => {
        c.x += c.v * dt * (1 + energy * 1.5);
        if (c.x > W + 10) c.x = -c.w - 10;
      });
      updateMeteors(dt);
      updateIss(t);

      updatePlayer(dt, t);
      updateFlies(dt, t);
      updateRain(dt, t);
      updateGame(t);
      updateHorror(t);
      wisps.forEach((w) => {
        w.x += w.v * dt;
        if (w.x > W) w.x = -w.w;
      });

      drawSky(t);
      clouds.forEach((c) => c.canvas && ctx.drawImage(c.canvas, Math.round(c.x), c.y));
      drawRange('far', 0.2);
      drawRange('peak', 0.4);
      if (fogOn) drawFog(1);
      drawRange('mid', 0.7);
      drawRange('near', 1);
      if (fogOn) drawFog(0.4);
      drawGround();
      drawGame(t);
      drawPlayer();
      placeBubble(t);
      drawNotes();
      drawFlies(t);
      drawRain();
      drawHorror(t);

      if (visible && !reduceMotion) raf = requestAnimationFrame(frame);
    }

    function start() {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    build();
    start();

    const resize = new ResizeObserver(() => {
      build();
      if (reduceMotion) start();
    });
    resize.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduceMotion) start();
    });
    io.observe(canvas);

    const onPointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
      pointer.active = pointer.y >= 0 && pointer.y <= 1;
      showTip();
      const p = { x: pointer.x * W, y: pointer.y * H };
      const ip = issScreen();
      const overIss = ip && Math.hypot(ip.x - p.x, ip.y - p.y) < 5;
      host.style.cursor = pointer.active && (overIss || hitProp(p) || hitPlayer(p)) ? 'pointer' : '';
    };

    // Shortest distance (scene pixels) from a point to a constellation's
    // visible line segments and their stars.
    function distToLines(cp, px, py) {
      let best = Infinity;
      cp.lines.forEach((line) => {
        for (let i = 0; i < line.length; i += 1) {
          const b = line[i];
          if (b.alt < 0) continue;
          best = Math.min(best, Math.hypot(b.x - px, b.y - py));
          const a = line[i - 1];
          if (!a || a.alt < 0 || Math.abs(a.x - b.x) > W * 0.5) continue;
          const vx = b.x - a.x;
          const vy = b.y - a.y;
          const len2 = vx * vx + vy * vy || 1;
          const k = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / len2));
          best = Math.min(best, Math.hypot(a.x + vx * k - px, a.y + vy * k - py));
        }
      });
      return best;
    }

    // Planet and bright-star names on hover.
    function showTip() {
      const tip = tipRef.current;
      if (!tip) return;
      const lx = pointer.x * W;
      const ly = pointer.y * H;
      let best = null;
      let bestD = 4;
      const ip = issScreen();
      if (ip && Math.hypot(ip.x - lx, ip.y - ly) < 5) {
        best = { x: ip.x, y: ip.y, name: 'International Space Station', kind: 'Click to watch live' };
        bestD = 0;
      }
      hoverTargets.forEach((target) => {
        const d = Math.hypot(target.x - lx, target.y - ly);
        if (d < bestD) {
          bestD = d;
          best = target;
        }
      });
      // Holding Shift: the constellation whose lines or stars are nearest the
      // pointer (anywhere along a line, not just its centre).
      if (!best && shiftHeld && pointer.active && night > 0.3 && overcast < 0.85) {
        let near = null;
        let nearD = 5;
        constProj.forEach((cp) => {
          const d = Math.min(distToLines(cp, lx, ly), cp.label.alt > 3 ? Math.hypot(cp.label.x - lx, cp.label.y - ly) - 6 : Infinity);
          if (d < nearD) {
            nearD = d;
            near = cp;
          }
        });
        if (near) {
          // Label it at the pointer so the name sits where you're looking.
          best = { x: Math.round(lx), y: Math.round(ly), name: near.c.name, kind: 'Constellation', con: near.c };
        }
      }
      hoverConst = shiftHeld ? best?.con ?? null : null;
      if (!best || !pointer.active) {
        tip.hidden = true;
        return;
      }
      tip.firstChild.textContent = best.name;
      tip.lastChild.textContent = !shiftHeld && best.kind.startsWith('Star in') ? 'Star' : best.kind;
      tip.style.left = `${best.x * PIXEL + 12}px`;
      tip.style.top = `${best.y * PIXEL - 10}px`;
      tip.hidden = false;
    }
    const onLeave = () => {
      pointer.active = false;
      hoverConst = null;
      if (tipRef.current) tipRef.current.hidden = true;
    };
    function sceneXY(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
    }

    function hitProp(p) {
      const gy = groundY();
      return propItems.find((it) => {
        if (!it.bench && !it.lamp) return false;
        const b = propBox(it, gy);
        return p.x >= b.x0 - 1 && p.x <= b.x1 + 1 && p.y >= b.y0 - 2 && p.y <= b.y1 + 1;
      });
    }

    function hitPlayer(p) {
      return p.x >= player.x - 1 && p.x <= player.x + 9 && p.y >= player.y - 1 && p.y <= player.y + 12;
    }

    const onClick = (e) => {
      if (e.target.closest('a, button, input, textarea, select, .pv')) return;
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      const p = sceneXY(e);
      const ip = issScreen();
      if (ip && Math.hypot(ip.x - p.x, ip.y - p.y) < 5) {
        window.open(ISS_LIVE_URL, '_blank', 'noopener');
        return;
      }
      if (hitPlayer(p)) {
        const pool = horror ? HORROR_CLICKS : LINES;
        say(pool[Math.floor(Math.random() * pool.length)], horror ? 3500 : 3000);
        return;
      }
      // Bench and lamp: walk over, then sit or flip the switch.
      const prop = hitProp(p);
      if (prop) {
        standUp();
        player.wanderUntil = performance.now() + 8000;
        userControlUntil = performance.now() + 3000;
        if (prop.bench) {
          player.target = benchSeat(propItems, groundY()).x;
          player.goSit = true;
          player.goLamp = false;
        } else {
          player.target = prop.x - 6;
          player.goLamp = true;
        }
        return;
      }
      player.goLamp = false;
      standUp();
      player.target = ((e.clientX - rect.left) / rect.width) * W - 4;
      player.wanderUntil = performance.now() + 8000;
      userControlUntil = performance.now() + 3000;
      jump();
    };
    const keyName = (e) =>
      ({ ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' })[e.key];
    const typing = (e) => e.target.closest?.('input, textarea, select, [contenteditable]');
    const onKeyDown = (e) => {
      if (e.key === 'Shift' && !shiftHeld) {
        shiftHeld = true;
        showTip();
      }
      if (!visible || typing(e)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        startGame();
      }
      if (game.on && (e.key === 'ArrowDown' || e.key === ' ')) e.preventDefault();
      if (key.length === 1) {
        const now = performance.now();
        typed = (now - typedAt > 1500 ? '' : typed) + key;
        typedAt = now;
        if (horror && /help$/.test(typed)) {
          typed = '';
          say('you can\u2019t. he\u2019d notice. just keep the tab open.', 4500);
        } else if (/(hi|hey|hello)$/.test(typed)) {
          typed = '';
          waveUntil = now + 1600;
          say('Hey!', 2000);
        }
      }
      const k = keyName(e);
      if (k) {
        keys.add(k);
        userControlUntil = performance.now() + 3000;
        player.target = null;
        player.goSit = false;
        player.wanderUntil = performance.now() + 8000;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'Shift') {
        shiftHeld = false;
        showTip();
      }
      const k = keyName(e);
      if (k) keys.delete(k);
    };

    const host = canvas.parentElement;
    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(skyTimer);
      unsubPreview();
      apiRef.current = null;
      resize.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    apiRef.current?.applyWeather(weather);
  }, [weather]);

  return (
    <>
      <canvas ref={canvasRef} className="pixel-scene" aria-hidden="true" />
      <div ref={sayRef} className="say" hidden aria-live="polite" />
      <div ref={hudRef} className="game-hud" hidden aria-live="polite" />
      <div ref={tipRef} className="sky-tip" hidden>
        <strong />
        <span />
      </div>
    </>
  );
}
