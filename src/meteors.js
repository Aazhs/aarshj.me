// Annual meteor shower data and timing for the night-sky hero.
// Sources: IMO Working List of Visual Meteor Showers and IMO Meteor Shower
// Calendar (https://www.imo.net/resources/calendar/), with activity periods,
// maxima, radiants and ZHRs as tabulated at https://www.popastro.com/meteor/?p=1404
// (which reproduces the IMO working list). The IMO site was mid-restoration when
// this was written, so the Taurid radiants (at their maxima), the Eta/Delta
// Aquariid, Orionid and Geminid ZHRs and the wider activity windows follow the
// IMO calendar values from memory. Radiant RA/Dec are in degrees (J2000-ish);
// sky.js turns them into sky positions.

export const SHOWERS = [
  { key: 'quadrantids', name: 'Quadrantids', start: '12-28', peak: '01-03', end: '01-12', zhr: 110, ra: 230, dec: 49 },
  { key: 'lyrids', name: 'Lyrids', start: '04-14', peak: '04-22', end: '04-30', zhr: 18, ra: 271, dec: 34 },
  { key: 'eta-aquariids', name: 'Eta Aquariids', start: '04-19', peak: '05-06', end: '05-28', zhr: 50, ra: 338, dec: -1 },
  { key: 'southern-delta-aquariids', name: 'Southern Delta Aquariids', start: '07-12', peak: '07-30', end: '08-23', zhr: 25, ra: 339, dec: -16 },
  { key: 'perseids', name: 'Perseids', start: '07-17', peak: '08-12', end: '08-24', zhr: 100, ra: 49, dec: 58 },
  { key: 'draconids', name: 'Draconids', start: '10-06', peak: '10-08', end: '10-10', zhr: 10, ra: 262, dec: 54 },
  { key: 'orionids', name: 'Orionids', start: '10-02', peak: '10-21', end: '11-07', zhr: 20, ra: 95, dec: 16 },
  { key: 'southern-taurids', name: 'Southern Taurids', start: '09-10', peak: '11-05', end: '11-20', zhr: 5, ra: 52, dec: 14 },
  { key: 'northern-taurids', name: 'Northern Taurids', start: '10-20', peak: '11-12', end: '12-10', zhr: 5, ra: 58, dec: 22 },
  { key: 'leonids', name: 'Leonids', start: '11-06', peak: '11-17', end: '11-30', zhr: 15, ra: 152, dec: 22 },
  { key: 'geminids', name: 'Geminids', start: '12-04', peak: '12-14', end: '12-20', zhr: 150, ra: 112, dec: 33 },
  { key: 'ursids', name: 'Ursids', start: '12-17', peak: '12-22', end: '12-26', zhr: 10, ra: 217, dec: 76 },
];

// Falloff exponent per shower: strength = (1 - |days from peak| / halfWidth) ^ power.
// Higher = sharper peak. Quadrantids last only hours at full rate, so they are
// the sharpest; the long, gentle showers (Taurids, Orionids) use a low value.
const DEFAULT_POWER = 2;
const POWER = {
  quadrantids: 4,
  perseids: 3,
  geminids: 3,
  draconids: 3,
  'southern-taurids': 1.5,
  'northern-taurids': 1.5,
  orionids: 1.5,
};

const YEAR_DAYS = 365;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
// Fixed non-leap year so every 'MM-DD' maps to one day-of-year; showers wrap
// around new year by working modulo YEAR_DAYS.
const REF_YEAR = 2001;

function dayOfYear(month, day) {
  return Math.round((Date.UTC(REF_YEAR, month - 1, day) - Date.UTC(REF_YEAR, 0, 1)) / 86400000);
}

function parseMD(md) {
  const [m, d] = md.split('-').map(Number);
  return dayOfYear(m, d);
}

// Signed shortest distance a - b on the year circle, in days (-182.5..182.5).
function circDiff(a, b) {
  const half = YEAR_DAYS / 2;
  return ((((a - b + half) % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS) - half;
}

// Calendar day-of-year in IST (the audience is in Pune), as a fractional-free
// integer. Feb 29 is folded onto Feb 28 to match the non-leap reference year.
function istDayOfYear(date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const month = ist.getUTCMonth() + 1;
  let day = ist.getUTCDate();
  if (month === 2 && day === 29) day = 28;
  return dayOfYear(month, day);
}

function strengthFor(shower, doy) {
  const peak = parseMD(shower.peak);
  const before = circDiff(peak, parseMD(shower.start)); // days start -> peak
  const after = circDiff(parseMD(shower.end), peak); // days peak -> end
  const d = circDiff(doy, peak);
  const width = d < 0 ? before : after;
  const t = Math.abs(d) / Math.max(width, 1);
  if (t > 1) return 0;
  return Math.pow(1 - t, POWER[shower.key] || DEFAULT_POWER);
}

// The shower that should dominate the sky on `date`, or null if none is active.
export function activeShower(date = new Date()) {
  const doy = istDayOfYear(date);
  let best = null;
  let bestScore = 0;
  for (const s of SHOWERS) {
    const strength = strengthFor(s, doy);
    const score = s.zhr * strength;
    // Zero strength at the very edge of the window counts as inactive.
    if (strength > 0 && score > bestScore) {
      bestScore = score;
      best = { key: s.key, name: s.name, zhr: s.zhr, ra: s.ra, dec: s.dec, strength };
    }
  }
  return best;
}

// Full-strength copy of a shower, for previewing it regardless of the date.
export function showerByKey(key) {
  const s = SHOWERS.find((x) => x.key === key);
  return s ? { ...s, strength: 1 } : null;
}

// Expected visible meteors per minute in the scene.
// - Sporadic background is about 0.3/min (a few per hour in reality, bumped up
//   so a quiet night still feels alive).
// - ZHR is hourly rate for a perfect sky with the radiant overhead, so real
//   observers see well under it; dividing by 12 (instead of 60) is a deliberate
//   speed-up so a ZHR 100 peak gives roughly 8/min, busy but readable.
// - Capped at 8/min so the scene never turns into a firework display.
const SPORADIC_PER_MIN = 0.3;
const ZHR_DIVISOR = 12;
const MAX_PER_MIN = 8;

export function meteorsPerMinute(shower) {
  const strength = shower && typeof shower.strength === 'number' ? shower.strength : 0;
  const zhr = shower && shower.zhr ? shower.zhr : 0;
  return Math.min(MAX_PER_MIN, SPORADIC_PER_MIN + (zhr * strength) / ZHR_DIVISOR);
}
