// Planet positions from the JPL approximate Keplerian elements (Standish,
// valid 1800-2050, error well under a degree for the naked-eye planets).
// Each element: [value at J2000, change per Julian century].

const RAD = Math.PI / 180;
const OBLIQUITY = 23.43928 * RAD;

const ELEMENTS = {
  Mercury: { a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.2503235, 149472.67411175], w: [77.45779628, 0.16047689], O: [48.33076593, -0.12534081] },
  Venus: { a: [0.72333566, 0.0000039], e: [0.00677672, -0.00004107], I: [3.39467605, -0.0007889], L: [181.9790995, 58517.81538729], w: [131.60246718, 0.00268329], O: [76.67984255, -0.27769418] },
  Earth: { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], w: [102.93768193, 0.32327364], O: [0, 0] },
  Mars: { a: [1.52371034, 0.00001847], e: [0.0933941, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], w: [-23.94362959, 0.44441088], O: [49.55953891, -0.29257343] },
  Jupiter: { a: [5.202887, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], w: [14.72847983, 0.21252668], O: [100.47390909, 0.20469106] },
  Saturn: { a: [9.53667594, -0.0012506], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], w: [92.59887831, -0.41897216], O: [113.66242448, -0.28867794] }
};

// Absolute magnitude for a rough brightness (phase and rings ignored) and a colour.
// `brightest` caps the estimate, since ignoring phase overstates Mercury and Venus.
const LOOK = {
  Mercury: { H: -0.6, brightest: -1.2, colour: '#e9dccb' },
  Venus: { H: -4.4, brightest: -4.7, colour: '#fffbe8' },
  Mars: { H: -1.5, brightest: -2.9, colour: '#ff9a6a' },
  Jupiter: { H: -9.4, brightest: -2.9, colour: '#ffefd6' },
  Saturn: { H: -8.9, brightest: -0.5, colour: '#f2dca4' }
};

function heliocentric(el, T) {
  const v = (k) => el[k][0] + el[k][1] * T;
  const a = v('a');
  const e = v('e');
  const I = v('I') * RAD;
  const O = v('O') * RAD;
  const w = (v('w') - v('O')) * RAD;
  let M = (((v('L') - v('w')) % 360) + 540) % 360 - 180;
  M *= RAD;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i += 1) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const [cw, sw, cO, sO, cI, sI] = [Math.cos(w), Math.sin(w), Math.cos(O), Math.sin(O), Math.cos(I), Math.sin(I)];
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    sw * sI * xp + cw * sI * yp
  ];
}

// Right ascension and declination (degrees) plus a rough magnitude for each planet.
export function planetPositions(date) {
  const T = (date.valueOf() / 86400000 + 2440587.5 - 2451545) / 36525;
  const earth = heliocentric(ELEMENTS.Earth, T);
  return Object.keys(LOOK).map((name) => {
    const p = heliocentric(ELEMENTS[name], T);
    const [x, y, z] = [p[0] - earth[0], p[1] - earth[1], p[2] - earth[2]];
    const ye = y * Math.cos(OBLIQUITY) - z * Math.sin(OBLIQUITY);
    const ze = y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY);
    const r = Math.hypot(...p);
    const delta = Math.hypot(x, y, z);
    return {
      name,
      ra: ((Math.atan2(ye, x) / RAD) + 360) % 360,
      dec: Math.atan2(ze, Math.hypot(x, ye)) / RAD,
      mag: Math.max(LOOK[name].brightest, LOOK[name].H + 5 * Math.log10(r * delta)),
      colour: LOOK[name].colour
    };
  });
}

// The brightest named stars, for hover labels (RA, Dec in degrees).
export const NAMED_STARS = [
  ['Sirius', 101.29, -16.72], ['Canopus', 95.99, -52.7], ['Arcturus', 213.92, 19.18],
  ['Vega', 279.23, 38.78], ['Capella', 79.17, 46.0], ['Rigel', 78.63, -8.2],
  ['Procyon', 114.83, 5.22], ['Betelgeuse', 88.79, 7.41], ['Achernar', 24.43, -57.24],
  ['Altair', 297.7, 8.87], ['Aldebaran', 68.98, 16.51], ['Antares', 247.35, -26.43],
  ['Spica', 201.3, -11.16], ['Pollux', 116.33, 28.03], ['Fomalhaut', 344.41, -29.62],
  ['Deneb', 310.36, 45.28], ['Regulus', 152.09, 11.97]
];
