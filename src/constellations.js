// Constellation stick figures: line vertices as [ra, dec] in degrees (RA 0-360).
// Data source: d3-celestial (BSD-3, Olaf Frohn), https://github.com/ofrohn/d3-celestial
// Each entry: { id, name, label: [ra, dec], lines: [[[ra, dec], ...], ...] }.
import data from './constellations.json';

export const CONSTELLATIONS = data;
export default data;

const DEG = Math.PI / 180;
const STAR_MATCH_DEG = 0.6;

// Flat vertex list with unit vectors so each query is a few multiplies, not trig.
const VERTICES = [];
// Bucketed by whole degrees of declination so a query only scans nearby bands.
const BANDS = Array.from({ length: 181 }, () => []);

for (const constellation of data) {
  for (const line of constellation.lines) {
    for (const [ra, dec] of line) {
      const cosDec = Math.cos(dec * DEG);
      const vertex = {
        constellation,
        dec,
        x: cosDec * Math.cos(ra * DEG),
        y: cosDec * Math.sin(ra * DEG),
        z: Math.sin(dec * DEG)
      };
      VERTICES.push(vertex);
      BANDS[Math.min(180, Math.max(0, Math.floor(dec) + 90))].push(vertex);
    }
  }
}

// Closest constellation vertex within maxDeg, or null.
function closest(ra, dec, maxDeg) {
  const cosDec = Math.cos(dec * DEG);
  const x = cosDec * Math.cos(ra * DEG);
  const y = cosDec * Math.sin(ra * DEG);
  const z = Math.sin(dec * DEG);
  const lo = Math.max(0, Math.floor(dec - maxDeg) + 90);
  const hi = Math.min(180, Math.floor(dec + maxDeg) + 90);
  // Larger dot product = smaller angle, so compare dots and skip acos.
  let bestDot = Math.cos(maxDeg * DEG);
  let best = null;
  for (let b = lo; b <= hi; b += 1) {
    for (const v of BANDS[b]) {
      const dot = x * v.x + y * v.y + z * v.z;
      if (dot >= bestDot) {
        bestDot = dot;
        best = v.constellation;
      }
    }
  }
  return best;
}

// The constellation whose figure includes this star (vertex within ~0.6 deg), or null.
export function constellationForStar(ra, dec) {
  return closest(ra, dec, STAR_MATCH_DEG);
}

// The constellation with the nearest line vertex within maxDeg, or null.
export function nearestConstellation(ra, dec, maxDeg = 12) {
  return closest(ra, dec, maxDeg);
}
