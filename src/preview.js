// Preview mode: lets you see the scene at any time, weather, moon, or music
// mood without changing what visitors normally get. Nothing is saved; a reload
// goes back to live. URL parameters (?time=, ?weather=, ?moon=, ?mood=) seed it.
//
// Adding a feature to the scene? Add its control to PREVIEW_CONTROLS below and
// read its value with getPreview() where the feature decides what to show.
// The settings panel builds itself from this list.

import { SHOWERS } from './meteors';

const listeners = new Set();
let state = seedFromUrl();

function seedFromUrl() {
  const empty = { time: null, weather: null, cloud: null, moon: null, mood: null, meteors: null, constellations: null, iss: null, horror: null };
  if (typeof window === 'undefined') return empty;
  const q = new URLSearchParams(window.location.search);
  const raw = q.get('time');
  // A literal "+" in a query string arrives as a space, so put it back.
  const time = raw ? new Date(raw.trim().replace(' ', '+')) : null;
  return {
    ...empty,
    time: time && !Number.isNaN(time.getTime()) ? time : null,
    weather: q.get('weather'),
    moon: q.get('moon'),
    mood: q.get('mood'),
    meteors: q.get('meteors'),
    constellations: q.get('constellations'),
    iss: q.get('iss'),
    horror: q.get('horror')
  };
}

export function getPreview() {
  return state;
}

export function setPreview(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

export function resetPreview() {
  setPreview({ time: null, weather: null, cloud: null, moon: null, mood: null, meteors: null, constellations: null, iss: null, horror: null });
}

export function subscribePreview(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isPreviewing() {
  return Object.values(state).some((v) => v !== null);
}

// Controls shown in the settings panel, in order.
// type 'time'   -> slider for the time of day + a date picker (IST)
// type 'choice' -> dropdown; null value means "live"
// type 'range'  -> slider; `when` hides it unless that returns true
export const PREVIEW_CONTROLS = [
  { key: 'time', label: 'Time of day', type: 'time' },
  {
    key: 'weather',
    label: 'Weather',
    type: 'choice',
    options: [['clear', 'Clear'], ['cloudy', 'Overcast'], ['fog', 'Fog'], ['drizzle', 'Drizzle'], ['rain', 'Rain'], ['storm', 'Storm']]
  },
  { key: 'cloud', label: 'Cloud cover', type: 'range', min: 0, max: 100, unit: '%', when: (s) => s.weather !== null },
  {
    key: 'moon',
    label: 'Moon',
    type: 'choice',
    options: [['blood', 'Blood moon'], ['super', 'Supermoon'], ['blue', 'Blue moon'], ['low', 'Low on the horizon']]
  },
  {
    key: 'mood',
    label: 'Music',
    type: 'choice',
    options: [['hype', 'Hype (rap, rock, EDM)'], ['pop', 'Pop'], ['chill', 'Chill (R&B, lo-fi)'], ['calm', 'Calm (classical)']]
  },
  { key: 'meteors', label: 'Meteor shower', type: 'choice', options: SHOWERS.map((sh) => [sh.key, sh.name]) },
  { key: 'constellations', label: 'Constellation lines', type: 'choice', options: [['all', 'Show all']] },
  { key: 'iss', label: 'Space station', type: 'choice', options: [['pass', 'Passing overhead']] },
  { key: 'horror', label: 'Late night (2\u20134 am)', type: 'choice', options: [['on', 'Horror mode']] }
];
