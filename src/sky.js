// Sun and moon positions for the hero sky. Formulas follow SunCalc
// (Vladimir Agafonkin, BSD-2), which is accurate to well under a degree.

export const PUNE = { lat: 18.5204, lng: 73.8567 };

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

const toDays = (date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
const rightAscension = (l, b) =>
  Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
const declination = (l, b) =>
  Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
const azimuth = (H, phi, dec) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
const altitude = (H, phi, dec) =>
  Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const siderealTime = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;

function sunCoords(d) {
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

function moonCoords(d) {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.22935 * d);
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: 385001 - 20905 * Math.cos(M) };
}

function position(coords, d, lat, lng) {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const H = siderealTime(d, lw) - coords.ra;
  // Azimuth is measured from south, positive towards west.
  return { azimuth: azimuth(H, phi, coords.dec), altitude: altitude(H, phi, coords.dec) };
}

function moonIllumination(d) {
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sunDist = 149598000;
  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)
  );
  const inc = Math.atan2(sunDist * Math.sin(phi), m.dist - sunDist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  );
  return {
    fraction: (1 + Math.cos(inc)) / 2,
    // 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter.
    phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI
  };
}

function phaseName(phase, fraction) {
  const waxing = phase < 0.5;
  if (fraction < 0.03) return 'New moon';
  if (fraction > 0.97) return 'Full moon';
  if (Math.abs(fraction - 0.5) < 0.04) return waxing ? 'First quarter' : 'Last quarter';
  if (fraction < 0.5) return waxing ? 'Waxing crescent' : 'Waning crescent';
  return waxing ? 'Waxing gibbous' : 'Waning gibbous';
}

function skyName(sunAltDeg, rising) {
  if (sunAltDeg < -12) return 'Night';
  if (sunAltDeg < -0.8) return rising ? 'Dawn' : 'Dusk';
  if (sunAltDeg < 8) return rising ? 'Sunrise' : 'Sunset';
  if (sunAltDeg < 20) return rising ? 'Morning' : 'Evening';
  return 'Day';
}

// Total lunar eclipses (greatest eclipse, UTC). The moon turns red only while
// it is actually up over Pune, so not every entry shows on the site.
const TOTAL_ECLIPSES = [
  '2026-03-03T11:33Z', '2028-12-31T16:52Z', '2029-06-26T03:22Z', '2029-12-20T22:42Z',
  '2032-04-25T15:13Z', '2032-10-18T19:02Z', '2033-04-14T19:13Z', '2033-10-08T10:55Z'
].map((iso) => new Date(iso).getTime());
const ECLIPSE_WINDOW_MS = 110 * 60000;

// How red the eclipse makes the moon right now: 0 outside, 1 at greatest eclipse.
function eclipseStrength(date) {
  const gap = Math.min(...TOTAL_ECLIPSES.map((t) => Math.abs(date.getTime() - t)));
  return gap > ECLIPSE_WINDOW_MS ? 0 : (1 + Math.cos((Math.PI * gap) / ECLIPSE_WINDOW_MS)) / 2;
}

// Blue moon: the second full moon in the same calendar month (IST).
function isBlueMoon(date) {
  const ist = new Date(date.getTime() + 5.5 * 3600000);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const fraction = (day) => moonIllumination(toDays(new Date(Date.UTC(y, m, day, 18, 30)))).fraction;
  const fullDays = [];
  for (let day = 1; day <= 31; day += 1) {
    if (new Date(Date.UTC(y, m, day)).getUTCMonth() !== m) break;
    const f = fraction(day);
    if (f > 0.97 && f >= fraction(day - 1) && f >= fraction(day + 1)) fullDays.push(day);
  }
  return fullDays.length >= 2 && ist.getUTCDate() >= fullDays[1] - 1 && ist.getUTCDate() <= fullDays[1] + 1;
}

// Special moons, previewable with ?moon=blood|super|blue|low.
function moonEvent(date, moonAltDeg, fraction, distKm) {
  const forced = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('moon');
  if (forced === 'blood') return { kind: 'blood', strength: 1, label: 'Blood moon (total lunar eclipse)' };
  if (forced === 'super') return { kind: 'super', strength: 1, label: 'Supermoon' };
  if (forced === 'blue') return { kind: 'blue', strength: 1, label: 'Blue moon' };
  if (forced === 'low') return { kind: 'low', strength: 1, label: 'Moon low on the horizon' };
  const eclipse = eclipseStrength(date);
  if (eclipse > 0 && moonAltDeg > 0) return { kind: 'blood', strength: eclipse, label: 'Blood moon (total lunar eclipse)' };
  if (fraction > 0.97 && distKm < 367500) return { kind: 'super', strength: 1, label: 'Supermoon' };
  if (fraction > 0.97 && isBlueMoon(date)) return { kind: 'blue', strength: 1, label: 'Blue moon' };
  return null;
}

export function skyState(date = new Date(), { lat, lng } = PUNE) {
  const d = toDays(date);
  const sun = position(sunCoords(d), d, lat, lng);
  const moon = position(moonCoords(d), d, lat, lng);
  const illum = moonIllumination(d);
  const sunAltDeg = sun.altitude / RAD;
  const moonAltDeg = moon.altitude / RAD;
  return {
    moonAltDeg,
    moonDist: moonCoords(d).dist,
    moonEvent: moonEvent(date, moonAltDeg, illum.fraction, moonCoords(d).dist),
    sun,
    moon,
    sunAltDeg,
    moonFraction: illum.fraction,
    moonPhase: illum.phase,
    phaseName: phaseName(illum.phase, illum.fraction),
    skyName: skyName(sunAltDeg, sun.azimuth < 0)
  };
}

// Colour keyframes keyed by sun altitude in degrees.
const KEYFRAMES = [
  [-18, {
    skyTop: '#0d0b1f', sky: '#161433', skyLow: '#221e45', haze: '#2e2852',
    cloud: '#24213f', cloudLight: '#322e55', far: '#25234a', peak: '#353262',
    peakShade: '#262449', mid: '#1b1936', near: '#131128', ground: '#0c0b19',
    rim: '#8c88c4', pine: '#09080f'
  }],
  [-6, {
    skyTop: '#2b2150', sky: '#4a3666', skyLow: '#7a4f78', haze: '#9a6585',
    cloud: '#4f3b66', cloudLight: '#6a4f78', far: '#5c4470', peak: '#86607e',
    peakShade: '#644a6c', mid: '#3c2a4e', near: '#2a1c38', ground: '#1c1226',
    rim: '#d9b7c8', pine: '#150d1c'
  }],
  [0, {
    skyTop: '#5f4466', sky: '#7b5a7e', skyLow: '#a06e8c', haze: '#b98299',
    cloud: '#7e5f86', cloudLight: '#93708f', far: '#8e5e7e', peak: '#d88a86',
    peakShade: '#b46f78', mid: '#5e3a57', near: '#3f2740', ground: '#2a1b2e',
    rim: '#fff6e3', pine: '#24182a'
  }],
  [7, {
    skyTop: '#6d86bf', sky: '#c9938a', skyLow: '#efae84', haze: '#ffd39b',
    cloud: '#d08a80', cloudLight: '#f6b99c', far: '#b07d8c', peak: '#e09a7c',
    peakShade: '#b2706a', mid: '#6e4a5c', near: '#4a3044', ground: '#2e1f2c',
    rim: '#ffe8b8', pine: '#24182a'
  }],
  [25, {
    skyTop: '#4a86d0', sky: '#68a2dc', skyLow: '#94c2e8', haze: '#c4e0f0',
    cloud: '#e4eef8', cloudLight: '#ffffff', far: '#8ea7c6', peak: '#7391b2',
    peakShade: '#5a7493', mid: '#4b6a6c', near: '#33504a', ground: '#22362e',
    rim: '#f4fbff', pine: '#1a2a24'
  }]
];

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

export function skyPalette(sunAltDeg) {
  const alt = Math.max(KEYFRAMES[0][0], Math.min(KEYFRAMES.at(-1)[0], sunAltDeg));
  let i = 0;
  while (i < KEYFRAMES.length - 2 && alt > KEYFRAMES[i + 1][0]) i += 1;
  const [a0, from] = KEYFRAMES[i];
  const [a1, to] = KEYFRAMES[i + 1];
  const t = (alt - a0) / (a1 - a0);
  const out = {};
  Object.keys(from).forEach((key) => {
    const x = hexToRgb(from[key]);
    const y = hexToRgb(to[key]);
    out[key] = rgbToHex(x.map((v, j) => v + (y[j] - v) * t));
  });
  return out;
}

// Page colours that track the sky, written to CSS variables on :root.
export function pageTheme(p) {
  const mix = (a, b, t) => {
    const x = hexToRgb(a);
    const y = hexToRgb(b);
    return rgbToHex(x.map((v, i) => v + (y[i] - v) * t));
  };
  return {
    '--night': mix(p.ground, p.near, 0.25),
    '--panel': mix(p.near, p.mid, 0.35),
    '--panel-edge': mix(p.ground, '#000000', 0.35),
    '--plum': p.near,
    '--ridge': p.mid,
    '--mauve': p.far,
    '--rose': p.peak,
    '--ink-soft': mix(p.haze, '#ffffff', 0.35)
  };
}

export function applyPageTheme(p) {
  const root = document.documentElement.style;
  Object.entries(pageTheme(p)).forEach(([key, value]) => root.setProperty(key, value));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageTheme(p)['--night']);
}

const BLOOD = {
  skyTop: '#1a0608', sky: '#2e0b0e', skyLow: '#4a1414', haze: '#6b1f1c',
  cloud: '#3a1012', cloudLight: '#52181a', far: '#3d1214', peak: '#5a1c1a',
  peakShade: '#401314', mid: '#2a0b0d', near: '#1c0709', ground: '#120405',
  rim: '#ff8a6a', pine: '#0c0304'
};

// Blend a palette towards the blood-moon reds by `amount` (0..1).
export function bloodTint(palette, amount) {
  if (amount <= 0) return palette;
  const out = { ...palette };
  Object.keys(BLOOD).forEach((key) => {
    if (!out[key]) return;
    const x = hexToRgb(out[key]);
    const y = hexToRgb(BLOOD[key]);
    out[key] = rgbToHex(x.map((v, i) => v + (y[i] - v) * amount));
  });
  return out;
}

// Moon colour: cream high up, amber then orange-red near the horizon
// (more atmosphere in the way), copper-red in a total eclipse.
export function moonColour(state) {
  const ev = state.moonEvent;
  if (ev?.kind === 'blood') return mixHex('#fff6e3', '#b83a24', ev.strength);
  if (ev?.kind === 'blue') return '#d6e6ff';
  if (ev?.kind === 'low') return '#ff8a4c';
  const alt = state.moonAltDeg;
  if (alt < 4) return mixHex('#ff8a4c', '#ffc27a', Math.max(0, alt) / 4);
  if (alt < 14) return mixHex('#ffc27a', '#fff6e3', (alt - 4) / 10);
  return '#fff6e3';
}

function mixHex(a, b, t) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x.map((v, i) => v + (y[i] - v) * Math.max(0, Math.min(1, t))));
}

// ---- Stars and Milky Way -------------------------------------------------

// Horizontal position (azimuth from south, altitude) of a fixed point in the
// sky given its right ascension and declination in degrees.
export function starTransform(date, { lat, lng } = PUNE) {
  const d = toDays(date);
  const lst = siderealTime(d, RAD * -lng);
  const phi = RAD * lat;
  return (raDeg, decDeg) => {
    const dec = RAD * decDeg;
    const H = lst - RAD * raDeg;
    return { azimuth: azimuth(H, phi, dec), altitude: altitude(H, phi, dec) };
  };
}

// Milky Way as a cloud of faint points along the real galactic plane:
// densest towards the core in Sagittarius, with the dark Great Rift.
let milkyWayCache = null;
export function milkyWayPoints() {
  if (milkyWayCache) return milkyWayCache;
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  const raG = RAD * 192.85948;
  const decG = RAD * 27.12825;
  const lNcp = RAD * 122.93192;
  const pts = [];
  while (pts.length < 5000) {
    const lDeg = rand() * 360;
    // Brighter and wider towards the galactic centre (l = 0).
    const core = Math.cos((RAD * lDeg) / 2) ** 2;
    if (rand() > 0.35 + 0.65 * core) continue;
    const bDeg = gauss() * (4 + 7 * core);
    // Great Rift: dust lane along the plane between Cygnus and Sagittarius.
    if ((lDeg < 60 || lDeg > 330) && Math.abs(bDeg - 0.8) < 1.6 && rand() < 0.8) continue;
    const l = RAD * lDeg;
    const b = RAD * bDeg;
    const dec = Math.asin(Math.sin(b) * Math.sin(decG) + Math.cos(b) * Math.cos(decG) * Math.cos(lNcp - l));
    const ra = raG + Math.atan2(
      Math.cos(b) * Math.sin(lNcp - l),
      Math.sin(b) * Math.cos(decG) - Math.cos(b) * Math.sin(decG) * Math.cos(lNcp - l)
    );
    pts.push([((ra / RAD) % 360 + 360) % 360, dec / RAD, core]);
  }
  milkyWayCache = pts;
  return pts;
}

// Star colour from its B-V colour index: hot blue-white to cool orange.
export function starColour(bv) {
  if (bv < 0) return '#b8d0ff';
  if (bv < 0.3) return '#e2e9ff';
  if (bv < 0.6) return '#fff6e3';
  if (bv < 1.0) return '#ffe1b0';
  return '#ffc48e';
}
