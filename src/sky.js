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

export function skyState(date = new Date(), { lat, lng } = PUNE) {
  const d = toDays(date);
  const sun = position(sunCoords(d), d, lat, lng);
  const moon = position(moonCoords(d), d, lat, lng);
  const illum = moonIllumination(d);
  const sunAltDeg = sun.altitude / RAD;
  return {
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
