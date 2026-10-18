// Live weather for Pune from Open-Meteo (free, no key, allows browser requests).
// Preview any condition with ?weather=clear|cloudy|fog|drizzle|rain|storm.

const URL_PUNE =
  'https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86' +
  '&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m&timezone=Asia%2FKolkata';

// WMO weather codes grouped into what the scene can draw.
function describe(code) {
  if (code === 0) return { kind: 'clear', label: 'Clear' };
  if (code <= 2) return { kind: 'clear', label: 'Partly cloudy' };
  if (code === 3) return { kind: 'cloudy', label: 'Overcast' };
  if (code === 45 || code === 48) return { kind: 'fog', label: 'Fog' };
  if (code >= 51 && code <= 57) return { kind: 'drizzle', label: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { kind: 'rain', label: code === 61 || code === 80 ? 'Light rain' : code === 65 || code === 82 ? 'Heavy rain' : 'Rain' };
  }
  if (code >= 71 && code <= 77) return { kind: 'cloudy', label: 'Snow' };
  if (code >= 95) return { kind: 'storm', label: 'Thunderstorm' };
  return { kind: 'cloudy', label: 'Cloudy' };
}

const PREVIEWS = {
  clear: { code: 0, cloud: 5, temp: 27, wind: 6 },
  cloudy: { code: 3, cloud: 95, temp: 25, wind: 12 },
  fog: { code: 45, cloud: 80, temp: 19, wind: 3 },
  drizzle: { code: 53, cloud: 90, temp: 23, wind: 10 },
  rain: { code: 63, cloud: 100, temp: 22, wind: 18 },
  storm: { code: 95, cloud: 100, temp: 21, wind: 32 }
};

function shape({ code, cloud, temp, wind }) {
  return { ...describe(code), cloud: cloud / 100, temp: Math.round(temp), wind };
}

export function previewWeather() {
  if (typeof window === 'undefined') return null;
  const key = new URLSearchParams(window.location.search).get('weather');
  return key && PREVIEWS[key] ? shape(PREVIEWS[key]) : null;
}

export async function fetchWeather() {
  const preview = previewWeather();
  if (preview) return preview;
  const res = await fetch(URL_PUNE, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const c = (await res.json()).current;
  return shape({ code: c.weather_code, cloud: c.cloud_cover, temp: c.temperature_2m, wind: c.wind_speed_10m });
}
