import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PixelScene, { SpriteIcon } from './PixelScene';
import { moodForGenre } from './music';
import { previewTime } from './sky';

const CONTACT_EMAIL = 'aarshjozhi@gmail.com';
const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/xjglvljd';
// Abacus: free, keyless counter (counterapi.dev v1 was shut down).
const VISIT_COUNTER_BASE_URL = 'https://abacus.jasoncameron.dev';
const VISIT_COUNTER_KEY = 'aarshj-me/visits';
const VISIT_COUNTER_PROXY_BASE_URL = 'https://api.codetabs.com/v1/proxy/?quest=';
const VISIT_COUNTER_STORAGE_KEY = 'aarsh_abacus_visit_recorded_v1';
const VISIT_COUNTER_CACHE_KEY = 'aarsh_unique_visit_count_cache_v1';
const VISIT_COUNTER_TIMEOUT_MS = 6500;
// Now playing: Apple Music scrobbles to Last.fm via a scrobbler app. Leave empty to hide the widget.
const LASTFM_USER = 'aashzz';
const LASTFM_API_KEY = 'f764f91387023846a564a9170a02ae8c';

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/Aazhs' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aarsh-joshi-3b40373aa/' },
  { label: 'Email', href: `mailto:${CONTACT_EMAIL}` },
  { label: 'LeetCode', href: 'https://leetcode.com/u/Aashz/' },
  { label: 'CodeChef', href: 'https://www.codechef.com/users/aashz' },
  { label: 'Codeforces', href: 'https://codeforces.com/profile/Aashj' }
];

const cpLinks = [
  {
    key: 'codechef',
    label: 'CodeChef',
    href: 'https://www.codechef.com/users/aashz',
    icon: '/icons/codechef.svg'
  },
  {
    key: 'codeforces',
    label: 'Codeforces',
    href: 'https://codeforces.com/profile/Aashj',
    icon: '/icons/codeforces.svg'
  },
  {
    key: 'leetcode',
    label: 'LeetCode',
    href: 'https://leetcode.com/u/Aashz/',
    icon: '/icons/leetcode.svg'
  }
];

const techStackGroups = [
  {
    title: 'Languages',
    note: 'Core syntax, DSA, scripting, and product code.',
    items: [
      { name: 'C++', icon: '/icons/cplusplus.svg' },
      { name: 'C', icon: '/icons/c.svg' },
      { name: 'Python', icon: '/icons/python.svg' },
      { name: 'JavaScript', icon: '/icons/javascript.svg' },
      { name: 'TypeScript', icon: '/icons/typescript.svg' },
      { name: 'SQL', icon: '/icons/mysql.svg' },
      { name: 'SQLite', icon: '/icons/sqlite.svg' },
      { name: 'Bash', icon: '/icons/gnubash.svg' }
    ]
  },
  {
    title: 'Frontend',
    note: 'Interfaces, responsive systems, and polished web apps.',
    items: [
      { name: 'React', icon: '/icons/react.svg' },
      { name: 'Vite', icon: '/icons/vite.svg' },
      { name: 'HTML5', icon: '/icons/html5.svg' },
      { name: 'CSS3', icon: '/icons/css3.svg' },
      { name: 'Framer Motion', icon: '/icons/framer.svg' }
    ]
  },
  {
    title: 'AI / ML',
    note: 'Training, exporting, and running models on-device.',
    items: [
      { name: 'PyTorch', icon: '/icons/pytorch.svg' },
      { name: 'ONNX Runtime', icon: '/icons/onnx.svg' },
      { name: 'OpenCV', icon: '/icons/opencv.svg' },
      { name: 'NumPy', icon: '/icons/numpy.svg' },
      { name: 'Hugging Face', icon: '/icons/huggingface.svg' },
      { name: 'Gemini', icon: '/icons/googlegemini.svg' }
    ]
  },
  {
    title: 'Tools',
    note: 'Daily workflow, automation, source control, and deploys.',
    items: [
      { name: 'Linux', icon: '/icons/linux.svg' },
      { name: 'Git', icon: '/icons/git.svg' },
      { name: 'GitHub', icon: '/icons/github.svg' },
      { name: 'VS Code', icon: '/icons/vscode.svg' },
      { name: 'GitHub Actions', icon: '/icons/githubactions.svg' }
    ]
  }
];

// `href` is the public repo (omitted for private ones); `live` is a deployed site.
const fallbackProjects = [
  {
    name: 'labsync',
    title: 'LabSync 🧪',
    description: 'Browser IDE for college programming labs that sorts every student\u2019s errors into syntax, logic, or conceptual in real time, gives hints instead of answers, and hands the professor a prioritised help queue.',
    stack: ['Next.js', 'TypeScript', 'Socket.IO', 'Supabase'],
    role: 'Solo',
    stars: 0,
    forks: 0,
    href: 'https://github.com/Aazhs/labsync',
    live: 'https://labsync-six.vercel.app'
  },
  {
    name: 'Medi-Kiosk',
    title: 'MediKiosk 🏥',
    description: 'SIH 2026 patient case-taking kiosk for the Ministry of Ayush. Patients give their health history by voice or touch in their own language, and scanned reports are read with OCR before they reach the doctor.',
    stack: ['FastAPI', 'Postgres', 'React', 'Speech + OCR'],
    role: 'Team of 3, top committer',
    stars: 0,
    forks: 0,
    live: 'https://medickiosk.in/'
  },
  {
    name: 'winion',
    title: 'Winion 🧅',
    description: 'Offline Android app for SIH 2026 that grades onion lots from a single tray photo. Two on-device models find every bulb and check it for defects (96.6% accurate on unseen onions), then a rule engine applies the government quality spec.',
    stack: ['PyTorch', 'ONNX', 'Computer Vision', 'React'],
    role: 'Team project',
    stars: 0,
    forks: 0
  },
  {
    name: 'RoofToGrid',
    title: 'RoofToGrid ☀️',
    description: 'Rooftop solar planner for Indian homes: sizes a system in three scenarios, compares installer quotes across 17+ metrics with red-flag checks, works out the PM Surya Ghar subsidy, and tracks the install to net metering.',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'Vitest'],
    role: 'Lead developer',
    stars: 0,
    forks: 0,
    href: 'https://github.com/Aazhs/RoofToGrid',
    live: 'https://roof-to-grid.vercel.app'
  },
  {
    name: 'TheCitadel',
    title: 'The Citadel ⚔️',
    description: 'Discord bot for a competitive programming community, with contest alerts, member onboarding, and a built-in productivity enforcer. Async Python on Postgres with migrations and a pytest suite.',
    stack: ['Python', 'discord.py', 'SQLAlchemy', 'Postgres'],
    role: 'Solo',
    stars: 0,
    forks: 0,
    href: 'https://github.com/Aazhs/TheCitadel'
  },
  {
    name: 'GLIDE',
    title: 'GLIDE 📐',
    description: 'OpenGL app that plots functions like a tiny Desmos and steps through classic rasterisation algorithms (DDA and Bresenham lines and circles), showing every decision variable and pixel choice as it draws.',
    stack: ['C++', 'OpenGL', 'CMake'],
    role: 'Solo',
    stars: 0,
    forks: 0
  },
  {
    name: 'datathon-2026',
    title: 'Datathon 2026 🚀',
    description: 'Registration platform for a hackathon at MITAOE with an embedded canvas space shooter. Built on FastAPI and Supabase, it handled 500+ team registrations.',
    stack: ['FastAPI', 'Python', 'Supabase'],
    role: 'Lead developer',
    stars: 0,
    forks: 0,
    href: 'https://github.com/Aazhs/datathon-2026'
  },
  {
    name: 'LockInApp',
    title: 'LockInApp 🔒',
    description: 'Local-first tracker for website usage and digital habits, with live dashboards, AI-scored focus quality, and a daily accountability report by email.',
    stack: ['TypeScript', 'SQLite', 'Swift', 'Gemini'],
    role: 'Solo',
    stars: 0,
    forks: 0,
    href: 'https://github.com/Aazhs/LockInApp'
  },
  {
    name: 'SpotiMirror',
    title: 'SpotiMirror 🎵',
    description: 'Privacy-first world map of live Spotify listening. Location fuzzing and pseudonyms keep listeners anonymous while you discover music on an interactive Leaflet map.',
    stack: ['Python', 'Flask', 'React', 'Leaflet'],
    role: 'Solo',
    stars: 1,
    forks: 0,
    href: 'https://github.com/Aazhs/SpotiMirror'
  }
];


const getLinkProps = (href) =>
  href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' };
const cpLinkIconByLabel = Object.fromEntries(cpLinks.map((item) => [item.label, item.icon]));

function getCounterValue(data) {
  const count = Number(data?.count ?? data?.value ?? data?.data);
  return Number.isFinite(count) ? count : null;
}

async function fetchJsonWithTimeout(url, ms = VISIT_COUNTER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCounterData(endpoint) {
  try {
    return await fetchJsonWithTimeout(endpoint);
  } catch {
    const proxyEndpoint = `${VISIT_COUNTER_PROXY_BASE_URL}${encodeURIComponent(endpoint)}`;
    return fetchJsonWithTimeout(proxyEndpoint);
  }
}

const CF_TIERS = [
  [0, 'Newbie'], [1200, 'Pupil'], [1400, 'Specialist'], [1600, 'Expert'],
  [1900, 'Candidate Master'], [2100, 'Master'], [2400, 'Grandmaster']
];
const CC_TIERS = [
  [0, '1★'], [1400, '2★'], [1600, '3★'], [1800, '4★'], [2000, '5★'], [2200, '6★'], [2500, '7★']
];

// Where a rating sits between its tier floor and the next tier.
function tierProgress(rating, tiers) {
  let index = 0;
  tiers.forEach(([floor], i) => {
    if (rating >= floor) index = i;
  });
  const [floor, name] = tiers[index];
  const next = tiers[index + 1];
  if (!next) return { name, nextName: null, pct: 100, toGo: 0 };
  return {
    name,
    nextName: next[1],
    pct: Math.round(((rating - floor) / (next[0] - floor)) * 100),
    toGo: next[0] - rating
  };
}

function formatUpdated(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Sparkline({ points }) {
  if (!points?.length) return null;
  const w = 120;
  const h = 32;
  const values = points.map((p) => p.r);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / Math.max(1, points.length - 1);
  // Stepped path so it reads as pixels, not a smooth curve.
  let d = '';
  points.forEach((p, i) => {
    const x = Math.round(i * step);
    const y = Math.round(h - 2 - ((p.r - min) / span) * (h - 4));
    d += i === 0 ? `M${x} ${y}` : `H${x} V${y}`;
  });
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Rating moved from ${values[0]} to ${values.at(-1)} over the last ${points.length} contests`}>
      <path d={d} />
    </svg>
  );
}

function XpBar({ pct, label }) {
  const cells = 20;
  const filled = Math.round((pct / 100) * cells);
  return (
    <div className="xp" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className={i < filled ? 'on' : ''} style={{ '--i': i }} />
      ))}
    </div>
  );
}

function PlayerCard({ platform, stats }) {
  const icon = cpLinkIconByLabel[platform.label];
  let body = <p className="player-empty">Stats load on the next site build.</p>;

  if (platform.key === 'codechef' && stats?.rating) {
    const tier = tierProgress(stats.rating, CC_TIERS);
    body = (
      <>
        <p className="player-rating">{stats.rating}<small>{tier.name}</small></p>
        <XpBar pct={tier.pct} label={`Progress to ${tier.nextName}`} />
        <p className="player-meta">
          {tier.nextName ? `${tier.toGo} to ${tier.nextName}` : 'Top tier'}. Peak {stats.highest}, {stats.contests} contests.
        </p>
        <Sparkline points={stats.history} />
      </>
    );
  }

  if (platform.key === 'codeforces' && stats?.rating) {
    const tier = tierProgress(stats.rating, CF_TIERS);
    body = (
      <>
        <p className="player-rating">{stats.rating}<small>{tier.name}</small></p>
        <XpBar pct={tier.pct} label={`Progress to ${tier.nextName}`} />
        <p className="player-meta">
          {tier.nextName ? `${tier.toGo} to ${tier.nextName}` : 'Top tier'}. Peak {stats.maxRating}.
        </p>
      </>
    );
  }

  if (platform.key === 'leetcode' && stats?.solved !== undefined) {
    const nextMilestone = Math.ceil((stats.solved + 1) / 50) * 50;
    const pct = Math.round(((stats.solved % 50) / 50) * 100);
    body = (
      <>
        <p className="player-rating">{stats.solved}<small>solved</small></p>
        <XpBar pct={pct} label={`Progress to ${nextMilestone} solved`} />
        <p className="player-meta">
          {nextMilestone - stats.solved} to {nextMilestone}.
          {stats.ranking ? ` Global rank ${stats.ranking.toLocaleString('en-US')}.` : ''}
        </p>
        <ul className="lc-split">
          <li className="easy"><span>Easy</span>{stats.easy}</li>
          <li className="medium"><span>Medium</span>{stats.medium}</li>
          <li className="hard"><span>Hard</span>{stats.hard}</li>
        </ul>
      </>
    );
  }

  return (
    <a className={`player-card player-${platform.key}`} href={platform.href} target="_blank" rel="noreferrer">
      <h3>
        <img src={icon} alt="" aria-hidden="true" />
        {platform.label}
      </h3>
      {body}
    </a>
  );
}

const DIALOGUE = [
  'Hey, I’m Aarsh. I study Computer Science at MIT Academy of Engineering, Pune.',
  'Most days I’m on React architecture, UI systems, and keeping my DSA streak alive.',
  'I like shipping real products: a live lab IDE for professors, a solar planner, and kiosks and apps for SIH 2026.',
  'Lately I’ve been deep in AI and ML: training models and exporting them to ONNX so they run anywhere.',
  'Right now I’m learning Go and Node.js for backend work.',
  'I live in Linux, write shell scripts for everything, and automate what I can.',
  'I also like going low-level: ARM64 assembly, C that drives the Mac trackpad’s haptics, and OpenGL graphics algorithms.'
];

function Dialogue() {
  const reduce = useReducedMotion();
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const text = DIALOGUE[line];
  const done = reduce || shown >= text.length;

  useEffect(() => {
    if (done) return undefined;
    const id = setTimeout(() => setShown((n) => n + 1), 22);
    return () => clearTimeout(id);
  }, [shown, done]);

  const advance = () => {
    if (!done) {
      setShown(text.length);
      return;
    }
    setLine((l) => (l + 1) % DIALOGUE.length);
    setShown(0);
  };

  return (
    <div className="dialogue">
      <div className="dialogue-portrait" aria-hidden="true">
        <SpriteIcon />
      </div>
      <div className="dialogue-body">
        <p className="dialogue-name">Aarsh</p>
        <p className="dialogue-text" aria-live="polite">
          {done ? text : text.slice(0, shown)}
        </p>
        <button type="button" className="dialogue-next" onClick={advance}>
          {done ? (line === DIALOGUE.length - 1 ? 'Start over' : 'Next') : 'Skip'}
          <span className="caret" aria-hidden="true">▾</span>
        </button>
        <p className="dialogue-count">{line + 1} of {DIALOGUE.length}</p>
      </div>
    </div>
  );
}

// Last.fm's grey star placeholder, used when it has no cover for a track.
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';
const artCache = new Map();

// Apple's iTunes Search API has covers and genres for nearly everything on Apple Music.
async function lookupTrack(artist, name, fallback) {
  const key = `${artist} - ${name}`;
  if (artCache.has(key)) return artCache.get(key);
  let art = fallback && !fallback.includes(LASTFM_PLACEHOLDER) ? fallback : null;
  let genre = null;
  let durationMs = null;
  try {
    const term = encodeURIComponent(`${artist} ${name.replace(/\s*[([].*?[)\]]/g, '')}`);
    const data = await fetchJsonWithTimeout(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`, 8000);
    const hit = data?.results?.[0];
    if (hit?.artworkUrl100) art = hit.artworkUrl100.replace('100x100bb', '300x300bb');
    genre = hit?.primaryGenreName ?? null;
    durationMs = hit?.trackTimeMillis ?? null;
  } catch {
    // Keep the Last.fm image, if any.
  }
  const info = { art, genre, durationMs };
  artCache.set(key, info);
  return info;
}

// Last.fm has no "paused" signal: a track stays "now playing" until Last.fm
// expires it, roughly when the song would have ended. As a safeguard against a
// stuck flag, stop showing it as live once it has been playing longer than the
// song itself (measured from when this page first saw it).
const LIVE_GRACE_MS = 30000;
const DEFAULT_TRACK_MS = 5 * 60000;

function useNowPlaying() {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    if (!LASTFM_USER || !LASTFM_API_KEY) return undefined;
    let active = true;
    let seen = { key: null, since: 0 };
    const load = async () => {
      try {
        const data = await fetchJsonWithTimeout(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`,
          8000
        );
        const t = data?.recenttracks?.track?.[0];
        if (!active || !t) return;
        const artist = t.artist?.['#text'];
        const { art, genre, durationMs } = await lookupTrack(
          artist,
          t.name,
          t.image?.find((img) => img.size === 'extralarge')?.['#text']
        );
        if (!active) return;
        const key = `${artist} - ${t.name}`;
        const flagged = t['@attr']?.nowplaying === 'true';
        if (!flagged) seen = { key: null, since: 0 };
        else if (seen.key !== key) seen = { key, since: Date.now() };
        const overdue = flagged && Date.now() - seen.since > (durationMs ?? DEFAULT_TRACK_MS) + LIVE_GRACE_MS;
        setTrack({
          name: t.name,
          artist,
          art,
          genre,
          mood: moodForGenre(genre),
          url: t.url,
          live: flagged && !overdue
        });
      } catch {
        // Keep the last known track.
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return track;
}

function NowPlaying({ track }) {
  if (!track) return null;
  return (
    <a className="now-playing" href={track.url} target="_blank" rel="noreferrer">
      {track.art ? <img src={track.art} alt="" /> : null}
      <span className="np-text">
        <span className="np-label">
          {track.live ? (
            <span className="np-bars" aria-hidden="true"><i /><i /><i /></span>
          ) : null}
          {track.live ? 'Listening now' : 'Last played'}
          {track.genre ? <span className="np-genre">{track.genre}</span> : null}
        </span>
        <strong>{track.name}</strong>
        <span>{track.artist}</span>
      </span>
    </a>
  );
}

function SkyClock({ sky, track }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const override = previewTime();
  const shown = override ?? now;
  const time = shown.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    second: override ? undefined : '2-digit'
  });
  if (!sky) return null;
  const moonUp = sky.moon.altitude > 0;
  return (
    <div className="sky-clock" aria-label={`Live sky over Pune: ${sky.skyName}, ${time} IST`}>
      <p className="sky-time">{time}<small>IST</small></p>
      <p className="sky-line">{sky.skyName} in Pune</p>
      {sky.moonEvent ? <p className="sky-line sky-event">{sky.moonEvent.label}</p> : null}
      <p className="sky-line">
        {sky.phaseName}, {Math.round(sky.moonFraction * 100)}% lit{moonUp ? '' : ' (below the horizon)'}
      </p>
      <NowPlaying track={track} />
    </div>
  );
}

const reveal = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }
};

function App() {
  const [repos, setRepos] = useState([]);
  const [visitCount, setVisitCount] = useState('...');
  const [stats, setStats] = useState(null);
  const [openSlot, setOpenSlot] = useState(null);
  const [sky, setSky] = useState(null);
  const track = useNowPlaying();

  useEffect(() => {
    let active = true;
    fetch('https://api.github.com/users/Aazhs/repos?per_page=100&sort=updated')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) setRepos(data);
      })
      .catch(() => {
        // Keep static fallback content if GitHub API is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  // stats.json is regenerated by the deploy workflow every 6 hours.
  // Codeforces allows browser requests, so its rating is also refreshed live.
  useEffect(() => {
    let active = true;
    const load = async () => {
      let next = null;
      try {
        next = await fetchJsonWithTimeout(`${import.meta.env.BASE_URL}stats.json`, 8000);
      } catch {
        next = {};
      }
      try {
        const cf = await fetchJsonWithTimeout('https://codeforces.com/api/user.info?handles=Aashj', 8000);
        const user = cf?.result?.[0];
        if (cf?.status === 'OK' && user) {
          next = { ...next, codeforces: { rating: user.rating, maxRating: user.maxRating, rank: user.rank } };
        }
      } catch {
        // Fall back to the build-time value.
      }
      if (active) setStats(next);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const readFlag = (keyName) => {
      try {
        return localStorage.getItem(keyName) === '1';
      } catch {
        return false;
      }
    };

    const writeFlag = (keyName) => {
      try {
        localStorage.setItem(keyName, '1');
      } catch {
        // Ignore storage errors (private mode, blocked storage).
      }
    };

    const readCachedCount = () => {
      try {
        const cached = Number(localStorage.getItem(VISIT_COUNTER_CACHE_KEY));
        return Number.isFinite(cached) && cached > 0 ? cached : null;
      } catch {
        return null;
      }
    };

    const writeCachedCount = (count) => {
      try {
        localStorage.setItem(VISIT_COUNTER_CACHE_KEY, String(count));
      } catch {
        // Ignore storage errors (private mode, blocked storage).
      }
    };

    const readVisits = async () => {
      try {
        const hasRecordedVisit = readFlag(VISIT_COUNTER_STORAGE_KEY);
        const endpoint = hasRecordedVisit
          ? `${VISIT_COUNTER_BASE_URL}/get/${VISIT_COUNTER_KEY}`
          : `${VISIT_COUNTER_BASE_URL}/hit/${VISIT_COUNTER_KEY}`;
        const data = await fetchCounterData(endpoint);
        if (!active) {
          return;
        }
        if (!hasRecordedVisit) {
          writeFlag(VISIT_COUNTER_STORAGE_KEY);
        }
        const count = getCounterValue(data);
        if (count === null) {
          throw new Error('Invalid count response');
        }
        writeCachedCount(count);
        setVisitCount(count.toLocaleString('en-US'));
      } catch {
        const cachedCount = readCachedCount();
        if (!active) {
          return;
        }
        if (cachedCount !== null) {
          setVisitCount(cachedCount.toLocaleString('en-US'));
        } else {
          setVisitCount('Unavailable');
        }
      }
    };

    readVisits();
    return () => {
      active = false;
    };
  }, []);

  const featuredProjects = useMemo(() => {
    const repoMap = new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));
    return fallbackProjects.map((fallback) => {
      const liveRepo = repoMap.get(fallback.name.toLowerCase());
      if (!liveRepo) return fallback;
      return {
        ...fallback,
        stars: liveRepo.stargazers_count ?? fallback.stars,
        forks: liveRepo.forks_count ?? fallback.forks,
        href: liveRepo.html_url ?? fallback.href
      };
    });
  }, [repos]);

  const updatedLabel = formatUpdated(stats?.updatedAt);

  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Aarsh Joshi, back to top">
          <span className="brand-mark" aria-hidden="true">AJ</span>
        </a>
        <nav aria-label="Sections">
          <a href="#stats">Stats</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Stack</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <PixelScene onSky={setSky} music={track?.live ? track.mood : null} />
          <SkyClock sky={sky} track={track} />
          <div className="hero-copy">
            <h1 className="hero-title">
              <span>Aarsh</span>
              <span>Joshi</span>
            </h1>
            <p className="lede">
              I build web apps and developer tools, and train ML models.
              Computer science student.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="https://github.com/Aazhs" target="_blank" rel="noreferrer">
                View GitHub
              </a>
              <a className="btn" href="https://www.linkedin.com/in/aarsh-joshi-3b40373aa/" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a className="btn" href={`mailto:${CONTACT_EMAIL}`}>
                Email me
              </a>
            </div>
          </div>
          <p className="hero-hint" aria-hidden="true">
            <span className="hint-keys"><kbd>←</kbd><kbd>→</kbd> walk <kbd>↑</kbd> jump, or click the ground</span>
            <span className="hint-touch">Tap the ground to move</span>
          </p>
        </section>

        <section className="section" id="stats">
          <div className="section-heading">
            <h2>Player stats</h2>
            <p>
              Competitive programming ratings, pulled from each site
              {updatedLabel ? `, last updated ${updatedLabel}` : ''}.
            </p>
          </div>
          <div className="player-grid">
            {cpLinks.map((platform) => (
              <PlayerCard key={platform.key} platform={platform} stats={stats?.[platform.key]} />
            ))}
          </div>
        </section>

        <section className="section" id="about">
          <div className="section-heading">
            <h2>About me</h2>
          </div>
          <Dialogue />
        </section>

        <section className="section" id="projects">
          <div className="section-heading">
            <h2>Quest log</h2>
            <p>Things I&apos;ve shipped, synced with GitHub for stars and forks.</p>
          </div>
          <div className="quest-grid">
            {featuredProjects.map((project) => (
              <motion.article
                className="quest"
                key={project.name}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
              >
                <div className="quest-top">
                  <h3>{project.title}</h3>
                  {project.href ? (
                    <span className="quest-loot" aria-label={`${project.stars} stars, ${project.forks} forks`}>
                      ★ {project.stars} ⑂ {project.forks}
                    </span>
                  ) : null}
                </div>
                {project.role ? <p className="quest-role">{project.role}</p> : null}
                <p>{project.description}</p>
                <ul className="quest-tags" aria-label="Built with">
                  {project.stack.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <div className="quest-links">
                  {project.live ? (
                    <a className="quest-link" href={project.live} target="_blank" rel="noreferrer">
                      Visit live site
                    </a>
                  ) : null}
                  {project.href ? (
                    <a className="quest-link" href={project.href} target="_blank" rel="noreferrer">
                      Open repository
                    </a>
                  ) : null}
                  {!project.live && !project.href ? <span className="quest-private">Private repository</span> : null}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="section" id="skills">
          <div className="section-heading">
            <h2>Inventory</h2>
            <p>Tools I reach for. Currently sharpening Go, Node.js, backend APIs, and system design.</p>
          </div>
          <div className="inventory">
            {techStackGroups.map((group) => (
              <div className="inv-group" key={group.title}>
                <h3>{group.title}</h3>
                <ul className="inv-grid">
                  {group.items.map((tech) => {
                    const id = `${group.title}-${tech.name}`;
                    return (
                      <li key={tech.name}>
                        <button
                          type="button"
                          className={`inv-slot${openSlot === id ? ' active' : ''}`}
                          onClick={() => setOpenSlot(openSlot === id ? null : id)}
                          aria-label={tech.name}
                        >
                          <img src={tech.icon} alt="" loading="lazy" />
                          <span className="inv-name">{tech.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="journey">
          <div className="section-heading">
            <h2>Level map</h2>
          </div>
          <ol className="level-map">
            <li>
              <span className="level-node" aria-hidden="true">1</span>
              <p className="level-when">2022–2025</p>
              <h3>Narayana School</h3>
              <p>Thane, Maharashtra</p>
            </li>
            <li>
              <span className="level-node" aria-hidden="true">2</span>
              <p className="level-when">2025–2029</p>
              <h3>MIT Academy of Engineering</h3>
              <p>B.Tech in Computer Science, Alandi (Pune)</p>
            </li>
            <li className="current">
              <span className="level-node" aria-hidden="true">
                <span className="level-player" />
              </span>
              <p className="level-when">You are here</p>
              <h3>Current focus</h3>
              <p>Scalable React frontends, daily DSA, and learning Go and Node.js.</p>
            </li>
          </ol>
        </section>

        <section className="section contact" id="contact">
          <div className="contact-intro">
            <h2>Save point</h2>
            <p>
              Send an idea, a timeline, or a question. I usually reply within a day.
            </p>
            <ul className="contact-links">
              {socialLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} {...getLinkProps(item.href)}>
                    {cpLinkIconByLabel[item.label] ? (
                      <img src={cpLinkIconByLabel[item.label]} alt="" aria-hidden="true" />
                    ) : null}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <form className="contact-form" action={CONTACT_FORM_ENDPOINT} method="POST">
            <input type="hidden" name="_subject" value="New portfolio message" />
            <div className="contact-row">
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  pattern="^[A-Za-z\s]+$"
                  title="Use letters and spaces only."
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
              </label>
            </div>
            <label className="field">
              <span>Subject</span>
              <input type="text" name="subject" placeholder="Project, question, or hello" />
            </label>
            <label className="field">
              <span>Message</span>
              <textarea name="message" rows="5" placeholder="What are you working on?" required />
            </label>
            <div className="contact-actions">
              <button className="btn btn-primary" type="submit">Send message</button>
              <button className="btn" type="reset">Clear</button>
            </div>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <p>Visitors so far: {visitCount}</p>
      </footer>
    </div>
  );
}

export default App;
