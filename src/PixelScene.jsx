import { useEffect, useRef } from 'react';
import { applyPageTheme, skyPalette, skyState } from './sky';

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
const NOTE = ['.11', '.1.', '.1.', '11.', '11.'];
export const SPRITE_COLORS = { 1: '#2a1b2e', 2: '#f2c9a8', 3: '#8fd3c9', 4: '#3f2740', 5: '#1b1120', 6: '#2a1b2e' };

function seededNoise(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ridge(width, base, amp, seed, freq) {
  const rand = seededNoise(seed);
  const phases = [rand() * 10, rand() * 10, rand() * 10];
  const out = new Array(width);
  for (let x = 0; x < width; x += 1) {
    const t = x / width;
    out[x] = Math.round(
      base -
        amp *
          (0.55 * Math.sin(t * freq + phases[0]) +
            0.3 * Math.sin(t * freq * 2.3 + phases[1]) +
            0.15 * Math.sin(t * freq * 5.1 + phases[2]))
    );
  }
  return out;
}

function drawSprite(ctx, rows, x, y, flip) {
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx += 1) {
      const c = row[flip ? row.length - 1 - rx : rx];
      if (c === '.') continue;
      ctx.fillStyle = SPRITE_COLORS[c];
      ctx.fillRect(x + rx, y + ry, 1, 1);
    }
  });
}

function drawCloud(ctx, x, y, w) {
  ctx.fillStyle = PALETTE.cloud;
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x + 4, y - 2, w - 10, 2);
  ctx.fillRect(x + 9, y - 4, Math.max(4, w * 0.35), 2);
  ctx.fillStyle = PALETTE.cloudLight;
  ctx.fillRect(x + 5, y - 2, Math.max(3, w * 0.3), 1);
}

function blob(ctx, cx, cy, r) {
  for (let y = -r; y <= r; y += 1) {
    const half = Math.round(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

// One round tree: clustered canopy, shaded away from the light.
function drawTree(ctx, x, groundY, size) {
  const trunkH = Math.round(size * 1.1);
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(x, groundY - trunkH, 2, trunkH);
  ctx.fillRect(x - 1, groundY - 1, 4, 1);
  const top = groundY - trunkH - Math.round(size * 0.4);
  const puffs = [[0, 0, 1], [-0.7, 0.35, 0.75], [0.75, 0.3, 0.8], [0.1, -0.55, 0.7]];
  ctx.fillStyle = PALETTE.near;
  puffs.forEach(([dx, dy, k]) => blob(ctx, x + 1 + Math.round(dx * size), top + Math.round(dy * size), Math.round(size * k)));
  ctx.fillStyle = PALETTE.ground;
  puffs.forEach(([dx, dy, k]) =>
    blob(ctx, x + 2 + Math.round(dx * size + size * 0.25), top + Math.round(dy * size + size * 0.3), Math.round(size * k * 0.6))
  );
  ctx.fillStyle = PALETTE.rim;
  ctx.globalAlpha = 0.18;
  blob(ctx, x - Math.round(size * 0.3), top - Math.round(size * 0.5), Math.max(1, Math.round(size * 0.35)));
  ctx.globalAlpha = 1;
}

function drawFence(ctx, x, groundY, length) {
  ctx.fillStyle = PALETTE.ground;
  for (let i = 0; i <= length; i += 6) ctx.fillRect(x + i, groundY - 6, 1, 6);
  ctx.fillRect(x, groundY - 5, length + 1, 1);
  ctx.fillRect(x, groundY - 3, length + 1, 1);
}

// Lamp post; its light only shows once it gets dark.
function drawLamp(ctx, x, groundY, night) {
  if (night > 0.05) {
    ctx.fillStyle = PALETTE.firefly;
    [[14, 0.06], [9, 0.08], [5, 0.12]].forEach(([r, a]) => {
      ctx.globalAlpha = a * night;
      blob(ctx, x, groundY - 17, r);
    });
    ctx.globalAlpha = 0.18 * night;
    ctx.fillRect(x - 8, groundY, 17, 1);
    ctx.fillRect(x - 5, groundY + 1, 11, 1);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(x, groundY - 16, 1, 16);
  ctx.fillRect(x - 1, groundY - 1, 3, 1);
  ctx.fillRect(x - 1, groundY - 19, 3, 1);
  ctx.fillStyle = night > 0.05 ? PALETTE.firefly : PALETTE.mid;
  ctx.fillRect(x - 1, groundY - 18, 3, 2);
}

// `?time=2026-10-16T18:05+05:30` previews the sky at another moment.
function sceneDate() {
  const override = new URLSearchParams(window.location.search).get('time');
  const parsed = override ? new Date(override) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
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

export default function PixelScene({ onSky, music }) {
  const canvasRef = useRef(null);
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
    let shooting = null;
    let raf = 0;
    let visible = true;
    let last = performance.now();

    let sky = null;
    let night = 0;

    function updateSky() {
      sky = skyState(sceneDate());
      Object.assign(PALETTE, skyPalette(sky.sunAltDeg));
      applyPageTheme(PALETTE);
      // 0 in daylight, 1 once the sun is well below the horizon.
      night = Math.max(0, Math.min(1, (-sky.sunAltDeg - 2) / 10));
      bakeSky();
      skyRef.current?.(sky);
      if (reduceMotion && layers) requestAnimationFrame(frame);
    }
    updateSky();
    const skyTimer = setInterval(updateSky, 15000);

    const pointer = { x: 0.5, y: 0.4, active: false };
    // Eased pointer so the parallax glides instead of snapping.
    const cam = { x: 0 };
    // Music: beat clock, floating notes, and a 0..1 blend so changes ease in.
    const beat = { index: -1, pulse: 0, smooth: 0, mix: 0 };
    let notes = [];
    let userControlUntil = 0;
    const keys = new Set();
    const player = { x: 40, y: 0, vx: 0, vy: 0, facing: 1, step: 0, grounded: true, wanderUntil: 0, target: null };

    const groundY = () => Math.round(H * 0.94);

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(80, Math.ceil(rect.width / PIXEL));
      H = Math.max(60, Math.ceil(rect.height / PIXEL));
      canvas.width = W;
      canvas.height = H;
      const pad = 24;
      layers = {
        far: ridge(W + pad * 2, H * 0.62, H * 0.1, 7, 7),
        peak: ridge(W + pad * 2, H * 0.7, H * 0.16, 31, 4),
        mid: ridge(W + pad * 2, H * 0.78, H * 0.08, 53, 9),
        near: ridge(W + pad * 2, H * 0.86, H * 0.05, 97, 12),
        pad
      };
      bakeSky();
      const rand = seededNoise(1234);
      stars = Array.from({ length: Math.round(W * H * 0.0016) }, () => ({
        x: Math.floor(rand() * W),
        y: Math.floor(rand() * H * 0.45),
        p: rand() * Math.PI * 2,
        s: 0.6 + rand() * 1.8
      }));
      clouds = Array.from({ length: Math.max(3, Math.round(W / 70)) }, (_, i) => ({
        x: rand() * W,
        y: Math.round(H * (0.12 + rand() * 0.28)),
        w: Math.round(18 + rand() * 30),
        v: 1.2 + rand() * 2.4 + i * 0.1
      }));
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
        const hy = H * (0.3 + rand() * 0.62);
        return { follower: i % 5 === 0, hx, hy, x: hx, y: hy, vx: 0, vy: 0, p: rand() * 10 };
      });
      player.y = groundY() - SPRITE_IDLE.length;
      player.x = Math.min(player.x, W - 10);
    }

    const skyCanvas = document.createElement('canvas');
    const skyCtx = skyCanvas.getContext('2d');

    function bakeSky() {
      if (!W || !sky) return;
      skyCanvas.width = W;
      skyCanvas.height = H;
      const real = ctx;
      ctx = skyCtx;
      drawBands();
      drawSun();
      drawMoon();
      ctx = real;
    }

    function drawBands() {
      const bands = [
        [0, PALETTE.skyTop],
        [0.22, PALETTE.sky],
        [0.5, PALETTE.skyLow],
        [0.66, PALETTE.haze]
      ];
      bands.forEach(([start, color], i) => {
        const y0 = Math.floor(start * H);
        const y1 = i < bands.length - 1 ? Math.floor(bands[i + 1][0] * H) : H;
        ctx.fillStyle = color;
        ctx.fillRect(0, y0, W, y1 - y0);
        // Ordered dither at each band edge, like the hero art.
        if (i > 0) {
          ctx.fillStyle = bands[i - 1][1];
          for (let y = y0; y < y0 + 4; y += 1) {
            for (let x = (y % 2) + ((y - y0) % 2) * 2; x < W; x += 2 + (y - y0)) {
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      });
    }

    function drawSky(t) {
      ctx.drawImage(skyCanvas, 0, 0);

      stars.forEach((s) => {
        const a = reduceMotion ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(t * 0.001 * s.s + s.p));
        ctx.globalAlpha = a * night;
        ctx.fillStyle = PALETTE.moon;
        ctx.fillRect(s.x, s.y, 1, 1);
      });
      ctx.globalAlpha = 1;

      if (shooting && night > 0.5) {
        ctx.fillStyle = PALETTE.moon;
        for (let i = 0; i < 8; i += 1) {
          ctx.globalAlpha = 1 - i / 8;
          ctx.fillRect(Math.round(shooting.x - i * 2), Math.round(shooting.y - i), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    }

    // Facing south from Pune: east on the left, west on the right.
    function project(body) {
      const horizon = H * 0.68;
      const x = W * (0.5 + (body.azimuth / ((2 * Math.PI) / 3)) * 0.5);
      const alt = body.altitude / (Math.PI / 180);
      const y = horizon - (alt / 70) * (horizon - H * 0.1);
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
      // Stepped glow rings.
      [[r + 6, 0.12], [r + 3, 0.22]].forEach(([rr, a]) => {
        ctx.globalAlpha = a;
        disc(x, y, rr, () => PALETTE.haze);
      });
      ctx.globalAlpha = 1;
      disc(x, y, r, () => core);
    }

    function drawMoon() {
      if (sky.moon.altitude < -0.05) return;
      const { x, y } = project(sky.moon);
      const r = Math.round(Math.min(W, H) * 0.075);
      // Terminator: k runs 1 (new) to -1 (full) and back.
      const k = Math.cos(2 * Math.PI * sky.moonPhase);
      const waxing = sky.moonPhase < 0.5;
      const dark = night > 0.3 ? 'rgba(90, 84, 130, 0.3)' : null;
      ctx.globalAlpha = 0.55 + 0.45 * night;
      disc(x, y, r, (nx, ny) => {
        const lit = waxing ? nx > k : nx < -k;
        if (!lit) return dark;
        // A few maria so it reads as the moon.
        const mare = (nx + 0.3) ** 2 + (ny + 0.2) ** 2 < 0.06 || (nx - 0.25) ** 2 + (ny - 0.35) ** 2 < 0.04;
        return mare ? '#e6d6c0' : PALETTE.moonLit;
      });
      ctx.globalAlpha = 1;
    }

    function drawRidge(heights, color, depth, shade) {
      const offset = Math.round(layers.pad + cam.x * depth * -layers.pad);
      ctx.fillStyle = color;
      for (let x = 0; x < W; x += 1) {
        const h = heights[x + offset];
        ctx.fillRect(x, h, 1, H - h);
      }
      if (shade) {
        // Shade the slopes that face away from the moon.
        ctx.fillStyle = shade;
        for (let x = 3; x < W; x += 1) {
          const h = heights[x + offset];
          if (h > heights[x + offset - 3]) ctx.fillRect(x, h + 1, 1, H - h);
        }
      }
    }

    function drawGround() {
      const gy = groundY();
      ctx.fillStyle = PALETTE.ground;
      ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = PALETTE.ground;
      for (let x = 0; x < W; x += 1) {
        if (grassEdge[x]) ctx.fillRect(x, gy - grassEdge[x], 1, grassEdge[x]);
      }
      const unit = Math.max(4, Math.round(Math.min(W, H) * 0.045));
      drawLamp(ctx, Math.round(W * 0.6), gy, night);
      drawFence(ctx, Math.round(W * 0.86), gy, Math.min(36, Math.round(W * 0.1)));
      drawTree(ctx, Math.round(W * 0.76), gy, unit);
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

    function updatePlayer(dt, t) {
      const mood = musicRef.current;
      // With music on it strolls around the screen, a little quicker for energetic songs.
      const speed = mood ? 16 + mood.energy * 10 : 34;
      let dir = 0;
      if (keys.has('left')) dir -= 1;
      if (keys.has('right')) dir += 1;

      if (dir === 0 && player.target !== null) {
        const dx = player.target - player.x;
        if (Math.abs(dx) < 1.5) player.target = null;
        else dir = Math.sign(dx);
      }

      // Wander on its own when nobody is playing.
      if (mood && keys.size === 0 && t > player.wanderUntil && t > userControlUntil) {
        // Mostly travel somewhere far, sometimes stop for a quick dance.
        const far = player.x < W / 2 ? W * (0.55 + Math.random() * 0.4) : W * (0.05 + Math.random() * 0.4);
        player.target = Math.random() < 0.2 ? null : far;
        player.wanderUntil = t + 3000 + Math.random() * 3000;
      } else if (!mood && dir === 0 && player.target === null && t > player.wanderUntil) {
        player.target = Math.random() < 0.5 ? null : 8 + Math.random() * (W - 20);
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
      if (mood && !moving) {
        if (mood.name === 'hype') rows = beat.index % 2 === 0 ? SPRITE_ARMS : SPRITE_WALK;
        if (mood.name === 'pop') rows = beat.index % 2 === 0 ? SPRITE_WALK : SPRITE_ARMS;
        // Chill and calm: head-bob on the beat, slower for calm.
        if (mood.name === 'chill') bob = beat.pulse > 0.6 ? 1 : 0;
        if (mood.name === 'calm') bob = beat.index % 2 === 0 && beat.pulse > 0.5 ? 1 : 0;
      }
      drawSprite(ctx, rows, Math.round(player.x), Math.round(player.y) + bob, player.facing < 0);
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

    function drawFlies(t) {
      flies.forEach((f) => {
        const glow = Math.max(Math.min(1, night * 1.5), beat.mix * 0.7);
        const flicker = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.003 + f.p));
        ctx.globalAlpha = Math.min(1, glow * (flicker * (1 - beat.mix * 0.5) + beat.pulse * beat.mix * 0.6));
        ctx.fillStyle = PALETTE.firefly;
        ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
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
      if (!shooting && Math.random() < dt * 0.08) {
        shooting = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.15, life: 1 };
      }
      if (shooting) {
        shooting.x += 90 * dt;
        shooting.y += 45 * dt;
        shooting.life -= dt * 1.4;
        if (shooting.life <= 0) shooting = null;
      }

      updatePlayer(dt, t);
      updateFlies(dt, t);

      drawSky(t);
      clouds.forEach((c) => drawCloud(ctx, Math.round(c.x), c.y, c.w));
      drawRidge(layers.far, PALETTE.far, 0.2);
      drawRidge(layers.peak, PALETTE.peak, 0.4, PALETTE.peakShade);
      drawRidge(layers.mid, PALETTE.mid, 0.7);
      drawRidge(layers.near, PALETTE.near, 1);
      drawGround();
      drawPlayer();
      drawNotes();
      drawFlies(t);

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
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onClick = (e) => {
      if (e.target.closest('a, button, input, textarea')) return;
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      player.target = ((e.clientX - rect.left) / rect.width) * W - 4;
      player.wanderUntil = performance.now() + 8000;
      userControlUntil = performance.now() + 3000;
      jump();
    };
    const keyName = (e) =>
      ({ ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' })[e.key];
    const typing = (e) => e.target.closest?.('input, textarea, select, [contenteditable]');
    const onKeyDown = (e) => {
      if (!visible || typing(e)) return;
      const k = keyName(e);
      if (k) {
        keys.add(k);
        userControlUntil = performance.now() + 3000;
        player.target = null;
        player.wanderUntil = performance.now() + 8000;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    const onKeyUp = (e) => {
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
      resize.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-scene" aria-hidden="true" />;
}
