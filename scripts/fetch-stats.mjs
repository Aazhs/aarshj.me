// Fetches competitive programming stats at build time and writes public/stats.json.
// CodeChef and LeetCode block browser requests (CORS), so the site reads this file instead.
// If a source fails, the previous value in stats.json is kept.
import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../public/stats.json', import.meta.url);
const HANDLES = { codeforces: 'Aashj', codechef: 'aashz', leetcode: 'Aashz' };
const UA = 'Mozilla/5.0 (compatible; aarshj.me stats bot)';

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function codeforces() {
  const data = await getJson(`https://codeforces.com/api/user.info?handles=${HANDLES.codeforces}`);
  const user = data?.result?.[0];
  if (data?.status !== 'OK' || !user) throw new Error('Codeforces: bad response');
  return { rating: user.rating ?? null, maxRating: user.maxRating ?? null, rank: user.rank ?? 'unrated' };
}

async function codechef() {
  const res = await fetch(`https://www.codechef.com/users/${HANDLES.codechef}`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`CodeChef: HTTP ${res.status}`);
  const html = await res.text();
  const start = html.indexOf('"date_versus_rating":{"all":');
  if (start === -1) throw new Error('CodeChef: rating history not found');
  const arrStart = html.indexOf('[', start);
  let depth = 0;
  let end = arrStart;
  for (; end < html.length; end += 1) {
    if (html[end] === '[') depth += 1;
    if (html[end] === ']' && --depth === 0) break;
  }
  const contests = JSON.parse(html.slice(arrStart, end + 1));
  if (!contests.length) throw new Error('CodeChef: empty history');
  const history = contests.map((c) => ({ d: c.end_date.slice(0, 10), r: Number(c.rating) }));
  const rating = history.at(-1).r;
  const highest = Math.max(...history.map((h) => h.r));
  return { rating, highest, stars: codechefStars(rating), contests: history.length, history: history.slice(-24) };
}

function codechefStars(r) {
  const thresholds = [1400, 1600, 1800, 2000, 2200, 2500];
  return 1 + thresholds.filter((t) => r >= t).length;
}

async function leetcode() {
  const query = `query($u:String!){
    matchedUser(username:$u){ submitStatsGlobal{ acSubmissionNum{ difficulty count } } profile{ ranking } }
    userContestRanking(username:$u){ rating }
  }`;
  const data = await getJson('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com', 'User-Agent': UA },
    body: JSON.stringify({ query, variables: { u: HANDLES.leetcode } })
  });
  const nums = data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  if (!nums) throw new Error('LeetCode: bad response');
  const by = Object.fromEntries(nums.map((n) => [n.difficulty.toLowerCase(), n.count]));
  const contestRating = data.data.userContestRanking?.rating;
  return {
    solved: by.all,
    easy: by.easy,
    medium: by.medium,
    hard: by.hard,
    contestRating: contestRating ? Math.round(contestRating) : null,
    ranking: data.data.matchedUser.profile?.ranking ?? null
  };
}

let previous = {};
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch {
  // First run: no previous file.
}

const sources = { codeforces, codechef, leetcode };
const next = { ...previous };
let anyFresh = false;

await Promise.all(
  Object.entries(sources).map(async ([key, fn]) => {
    try {
      next[key] = await fn();
      anyFresh = true;
      console.log(`stats: ${key} ok`);
    } catch (error) {
      console.warn(`stats: ${key} failed, keeping previous value (${error.message})`);
    }
  })
);

if (anyFresh) next.updatedAt = new Date().toISOString();
await writeFile(OUT, `${JSON.stringify(next, null, 2)}\n`);
