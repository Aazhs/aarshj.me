// Live International Space Station position and look angles for the hero sky.
// Angles follow src/sky.js (SunCalc style): azimuth in radians measured from
// south, positive towards west; altitude in radians above the horizon.

export const PUNE_OBSERVER = { lat: 18.5204, lng: 73.8567, heightKm: 0.56 };

// NASA's official "NASA Live" page lists "Space Station Views" (live video from
// the ISS) and always links the current stream, unlike a YouTube video ID that
// expires. Source: https://www.nasa.gov/live/ (checked with curl -sIL, HTTP 200).
export const ISS_LIVE_URL = 'https://www.nasa.gov/live/';

// wheretheiss.at is keyless, HTTPS and sends access-control-allow-origin: *
// (open-notify is HTTP-only, so an HTTPS page cannot call it).
const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

const RAD = Math.PI / 180;
const WGS84_A = 6378.137; // km, equatorial radius
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = WGS84_F * (2 - WGS84_F);
const EARTH_R = 6371; // km, mean radius, only for the simulated pass
const ISS_ALT_KM = 420;

export async function fetchIss() {
  const res = await fetch(ISS_API_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`ISS API ${res.status}`);
  const d = await res.json();
  const lat = Number(d.latitude);
  const lng = Number(d.longitude);
  const altKm = Number(d.altitude);
  if (![lat, lng, altKm].every(Number.isFinite)) throw new Error('ISS API: bad payload');
  // "eclipsed" means in Earth's shadow; "daylight" and "visible" mean sunlit.
  const sunlit = d.visibility === 'eclipsed' ? false : d.visibility ? true : null;
  return {
    lat,
    lng,
    altKm,
    velocityKmh: Number(d.velocity),
    sunlit,
    time: new Date(Number(d.timestamp) * 1000)
  };
}

// WGS84 geodetic to Earth-centred Earth-fixed coordinates, in km.
function toEcef(latDeg, lngDeg, heightKm) {
  const lat = latDeg * RAD;
  const lng = lngDeg * RAD;
  const sinLat = Math.sin(lat);
  const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  return {
    x: (n + heightKm) * Math.cos(lat) * Math.cos(lng),
    y: (n + heightKm) * Math.cos(lat) * Math.sin(lng),
    z: (n * (1 - WGS84_E2) + heightKm) * sinLat
  };
}

const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function issLookAngles(iss, observer = PUNE_OBSERVER) {
  const o = toEcef(observer.lat, observer.lng, observer.heightKm ?? 0);
  const s = toEcef(iss.lat, iss.lng, iss.altKm);
  const dx = s.x - o.x;
  const dy = s.y - o.y;
  const dz = s.z - o.z;
  // Rotate the difference vector into the observer's local East-North-Up frame.
  const lat = observer.lat * RAD;
  const lng = observer.lng * RAD;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLng = Math.sin(lng);
  const cosLng = Math.cos(lng);
  const east = -sinLng * dx + cosLng * dy;
  const north = -sinLat * cosLng * dx - sinLat * sinLng * dy + cosLat * dz;
  const up = cosLat * cosLng * dx + cosLat * sinLng * dy + sinLat * dz;
  const horizontal = Math.hypot(east, north);
  const fromNorth = Math.atan2(east, north);
  return {
    // From north (clockwise) to from south (positive west): subtract PI.
    azimuth: wrapPi(fromNorth - Math.PI),
    altitude: Math.atan2(up, horizontal),
    rangeKm: Math.hypot(east, north, up)
  };
}

// A made-up overhead pass for previews: rises in the west, peaks about 60
// degrees up due south, sets in the east. progress runs 0..1.
export function simulatedPass(progress) {
  const p = Math.min(1, Math.max(0, progress));
  const altitude = 60 * RAD * Math.sin(Math.PI * p);
  const azimuth = (Math.PI / 2) * Math.cos(Math.PI * p);
  // Slant range from a spherical Earth at the given elevation.
  const rOrbit = EARTH_R + ISS_ALT_KM;
  const rangeKm = Math.sqrt(rOrbit * rOrbit - (EARTH_R * Math.cos(altitude)) ** 2) - EARTH_R * Math.sin(altitude);
  return { azimuth, altitude, rangeKm };
}
