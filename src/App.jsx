import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const CONTACT_EMAIL = 'aarshjozhi@gmail.com';
const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/xjglvljd';

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
    icon: 'https://cdn.simpleicons.org/codechef/FFFFFF'
  },
  {
    key: 'codeforces',
    label: 'Codeforces',
    href: 'https://codeforces.com/profile/Aashj',
    icon: 'https://cdn.simpleicons.org/codeforces/1F8ACB'
  },
  {
    key: 'leetcode',
    label: 'LeetCode',
    href: 'https://leetcode.com/u/Aashz/',
    icon: 'https://cdn.simpleicons.org/leetcode/FFA116'
  }
];

const fallbackProjects = [
  {
    name: 'SpotiMirror',
    title: 'SpotiMirror',
    description: 'Global Spotify map to visualize music trends around the world.',
    stack: ['JavaScript', 'Maps', 'Data Viz'],
    stars: 1,
    forks: 0,
    language: 'JavaScript',
    href: 'https://github.com/Aazhs/SpotiMirror',
    updated: '2026-03-05T12:47:35Z'
  },
  {
    name: 'LockInApp',
    title: 'LockInApp',
    description: 'Productivity-focused app for structured focus sessions and task flow.',
    stack: ['TypeScript', 'Productivity', 'Web'],
    stars: 0,
    forks: 0,
    language: 'TypeScript',
    href: 'https://github.com/Aazhs/LockInApp',
    updated: '2026-04-02T12:16:02Z'
  },
  {
    name: 'ToS-Analyser',
    title: 'ToS-Analyser',
    description: 'Tooling around Terms-of-Service analysis with practical web UX.',
    stack: ['JavaScript', 'Analysis', 'UX'],
    stars: 0,
    forks: 0,
    language: 'JavaScript',
    href: 'https://github.com/Aazhs/ToS-Analyser',
    updated: '2026-04-17T05:59:39Z'
  },
  {
    name: 'password_policy_enforcer',
    title: 'Password Policy Enforcer',
    description: 'Shell-based system policy tool for stronger password security.',
    stack: ['Shell', 'Linux', 'Security'],
    stars: 0,
    forks: 0,
    language: 'Shell',
    href: 'https://github.com/Aazhs/password_policy_enforcer',
    updated: '2025-12-29T18:11:13Z'
  },
  {
    name: 'aarshj.me',
    title: 'aarshj.me',
    description: 'Personal domain site and portfolio landing experience.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    stars: 1,
    forks: 0,
    language: 'HTML',
    href: 'https://github.com/Aazhs/aarshj.me',
    updated: '2026-03-06T17:39:00Z'
  },
  {
    name: 'technodium-2026',
    title: 'technodium-2026',
    description: 'Hackathon build exploring TypeScript-driven product ideas.',
    stack: ['TypeScript', 'Hackathon', 'Frontend'],
    stars: 0,
    forks: 0,
    language: 'TypeScript',
    href: 'https://github.com/Aazhs/technodium-2026',
    updated: '2026-03-19T10:23:14Z'
  }
];


const getLinkProps = (href) =>
  href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' };
const cpLinkIconByLabel = Object.fromEntries(cpLinks.map((item) => [item.label, item.icon]));
const CODECHEF_RATING = '1178';
const CODECHEF_META = 'Current rating';

const hiddenRepoNames = new Set(['aazhs', 'skills-introduction-to-github', 'random', 'mincraft']);

function formatUpdatedDate(isoDate) {
  if (!isoDate) {
    return 'Updated recently';
  }
  const date = new Date(isoDate);
  return `Updated ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

function projectScore(repo) {
  const now = Date.now();
  const pushedAt = new Date(repo.pushed_at).getTime();
  const monthMs = 1000 * 60 * 60 * 24 * 30;
  const monthsOld = Number.isFinite(pushedAt) ? (now - pushedAt) / monthMs : 36;
  const recency = Math.max(0, 36 - monthsOld);
  const stars = (repo.stargazers_count ?? 0) * 14;
  const forks = (repo.forks_count ?? 0) * 10;
  const size = Math.min(repo.size ?? 0, 30000) / 1200;
  const hasDescription = repo.description && repo.description.trim().length > 8 ? 4 : -2;
  const hasHomepage = repo.homepage ? 2 : 0;
  const lowSignalPenalty = /(badapp|test|practice|demo|random)/i.test(repo.name) ? -14 : 0;
  return stars + forks + size + recency + hasDescription + hasHomepage + lowSignalPenalty;
}

const reveal = {
  hidden: { opacity: 0, y: 12 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay }
  })
};

function App() {
  const [repos, setRepos] = useState([]);
  const [visitCount, setVisitCount] = useState('...');
  const [cpStats, setCpStats] = useState({
    leetcode: { rating: 'Loading...', meta: 'Fetching live data' },
    codechef: { rating: CODECHEF_RATING, meta: CODECHEF_META },
    codeforces: { rating: 'Loading...', meta: 'Fetching live data' }
  });

  useEffect(() => {
    let active = true;

    async function loadGitHub() {
      try {
        const repoRes = await fetch('https://api.github.com/users/Aazhs/repos?per_page=100&sort=updated');

        if (!repoRes.ok) {
          return;
        }

        const repoData = await repoRes.json();
        if (!active) {
          return;
        }

        setRepos(Array.isArray(repoData) ? repoData : []);
      } catch {
        // Keep static fallback content if GitHub API is unavailable.
      }
    }

    loadGitHub();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const storageKey = 'aarsh_unique_visit_recorded_v1';
    const fallbackCountKey = 'aarsh_unique_visit_fallback_count_v1';
    const fallbackFlagKey = 'aarsh_unique_visit_fallback_recorded_v1';
    const namespace = 'aazhs-portfolio';
    const key = 'unique-visits';

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

    const bumpFallback = () => {
      try {
        const hasRecorded = readFlag(fallbackFlagKey);
        const currentRaw = localStorage.getItem(fallbackCountKey) || '0';
        const current = Number(currentRaw);
        if (hasRecorded) {
          return Number.isFinite(current) ? current : 0;
        }
        const next = Number.isFinite(current) ? current + 1 : 1;
        localStorage.setItem(fallbackCountKey, String(next));
        writeFlag(fallbackFlagKey);
        return next;
      } catch {
        return null;
      }
    };

    const readVisits = async () => {
      try {
        const hasRecordedVisit = readFlag(storageKey);
        const endpoint = hasRecordedVisit
          ? `https://api.countapi.xyz/get/${namespace}/${key}`
          : `https://api.countapi.xyz/hit/${namespace}/${key}`;
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!active) {
          return;
        }
        if (!hasRecordedVisit) {
          writeFlag(storageKey);
        }
        const count = Number.isFinite(data?.value)
          ? data.value
          : Number.isFinite(data?.count)
            ? data.count
            : null;
        if (count === null) {
          throw new Error('Invalid count response');
        }
        setVisitCount(count.toLocaleString('en-US'));
      } catch {
        const fallbackCount = bumpFallback();
        if (!active) {
          return;
        }
        if (Number.isFinite(fallbackCount)) {
          setVisitCount(fallbackCount.toLocaleString('en-US'));
        } else {
          setVisitCount('0');
        }
      }
    };

    readVisits();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const withTimeout = async (url, ms = 12000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    };

    const loadCompetitiveRatings = async () => {
      try {
        const [cfData, lcSolvedData] = await Promise.allSettled([
          withTimeout('https://codeforces.com/api/user.info?handles=Aashj'),
          withTimeout('https://alfa-leetcode-api.onrender.com/Aashz/solved')
        ]);

        if (!active) {
          return;
        }

        const nextStats = {
          codeforces: { rating: 'N/A', meta: 'Profile unavailable' },
          codechef: { rating: CODECHEF_RATING, meta: CODECHEF_META },
          leetcode: { rating: 'N/A', meta: 'Solved count unavailable' }
        };

        if (cfData.status === 'fulfilled' && cfData.value?.status === 'OK' && cfData.value?.result?.[0]) {
          const user = cfData.value.result[0];
          nextStats.codeforces = {
            rating: `${user.rating ?? 'Unrated'}`,
            meta: `Max ${user.maxRating ?? user.rating ?? '-'} · ${user.rank ?? 'user'}`
          };
        }

        if (lcSolvedData.status === 'fulfilled') {
          const solved = lcSolvedData.value?.solvedProblem;
          if (solved !== undefined) {
            nextStats.leetcode = {
              rating: `${solved}`,
              meta: 'Problems solved'
            };
          }
        }

        setCpStats(nextStats);
      } catch {
        if (!active) {
          return;
        }
        setCpStats({
          leetcode: { rating: 'N/A', meta: 'API unavailable' },
          codechef: { rating: CODECHEF_RATING, meta: CODECHEF_META },
          codeforces: { rating: 'N/A', meta: 'API unavailable' }
        });
      }
    };

    loadCompetitiveRatings();
    const refreshInterval = setInterval(loadCompetitiveRatings, 1000 * 60 * 20);

    return () => {
      active = false;
      clearInterval(refreshInterval);
    };
  }, []);

  const featuredProjects = useMemo(() => {
    if (!repos.length) {
      return fallbackProjects;
    }

    const ranked = repos
      .filter((repo) => !repo.fork && !repo.archived && !hiddenRepoNames.has(repo.name.toLowerCase()))
      .map((repo) => {
        const topicTags = Array.isArray(repo.topics) ? repo.topics.slice(0, 2) : [];
        const derivedTags = [...topicTags];
        if (repo.language) {
          derivedTags.push(repo.language);
        }
        if (derivedTags.length === 0) {
          derivedTags.push('Project');
        }

        return {
          name: repo.name,
          title: repo.name,
          description: repo.description || 'Repository with active development and practical implementation.',
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          language: repo.language,
          href: repo.html_url,
          updated: repo.pushed_at,
          stack: derivedTags,
          _score: projectScore(repo)
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);

    return ranked.length ? ranked : fallbackProjects;
  }, [repos]);

  const quickStats = [
    { label: 'Location', value: 'Pune, India' },
    { label: 'Role', value: 'CS Student | Builder | Tinkerer' }
  ];

  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-mark">AJ</span>
          <span className="brand-copy">
            <strong>Aarsh</strong>
            <small>Portfolio</small>
          </span>
        </a>
        <nav>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <motion.div className="hero-copy" variants={reveal} initial="hidden" animate="show">
            <p className="kicker">B.Tech CS (SY) @ MITAOE, Pune</p>
            <h1>
              Aarsh Joshi
              <span>Builds polished web experiences and practical dev tools.</span>
            </h1>
            <p className="lede">
              Linux-first tinkerer with a strong frontend eye, currently leveling up React,
              Go, backend fundamentals, DSA, and system-level C++ while shipping useful products.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="https://github.com/Aazhs" target="_blank" rel="noreferrer">
                View GitHub
              </a>
              <a
                className="btn btn-ghost"
                href="https://www.linkedin.com/in/aarsh-joshi-3b40373aa/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a className="btn btn-ghost" href="mailto:aarshjozhi@gmail.com">
                Email Me
              </a>
            </div>
           
            <div className="cp-row">
              {cpLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="cp-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={item.icon} alt="" aria-hidden="true" />
                  <span className="cp-content">
                    <strong>{item.label}: {cpStats[item.key]?.rating ?? 'N/A'}</strong>
                    <small>{cpStats[item.key]?.meta ?? 'Loading'}</small>
                  </span>
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div className="hero-art" variants={reveal} initial="hidden" animate="show" custom={0.18}>
            <div className="art-frame floating">
              <img src="/images/profile-theme.png" alt="Pixel-art inspired profile theme" />
            </div>
            <div className="stats-grid">
              {quickStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="about section" id="about">
          <motion.div className="section-heading" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p>About Me</p>
            <h2>Engineer mindset. Designer taste. Builder energy.</h2>
          </motion.div>

          <div className="about-grid">
            <motion.article className="code-card" variants={reveal} initial="hidden" whileInView="show" custom={0.1} viewport={{ once: true }}>
              <div className="terminal-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <pre className="code-block" aria-label="C++ profile snippet">
                <code>
                  <span className="code-keyword">class</span>{' '}
                  <span className="code-type">Aazh</span>{' '}
                  <span className="code-punct">&#123;</span>
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-keyword">public</span>
                  <span className="code-punct">:</span>
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-namespace">std</span>
                  <span className="code-punct">::</span>
                  <span className="code-type">string</span>{' '}
                  <span className="code-field">name</span>{' '}
                  <span className="code-operator">=</span>{' '}
                  <span className="code-string">&quot;Aarsh Joshi&quot;</span>
                  <span className="code-punct">;</span>
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-namespace">std</span>
                  <span className="code-punct">::</span>
                  <span className="code-type">string</span>{' '}
                  <span className="code-field">degree</span>{' '}
                  <span className="code-operator">=</span>{' '}
                  <span className="code-string">&quot;B.Tech CS (SY) @ MITAOE, Pune&quot;</span>
                  <span className="code-punct">;</span>
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-namespace">std</span>
                  <span className="code-punct">::</span>
                  <span className="code-type">string</span>{' '}
                  <span className="code-field">focus</span>
                  <span className="code-punct">[]</span>{' '}
                  <span className="code-operator">=</span>{' '}
                  <span className="code-punct">&#123;</span>
                  <br />
                  <span className="code-indent">{'    '}</span>
                  <span className="code-string">&quot;React &amp; scalable web apps&quot;</span>
                  <span className="code-punct">,</span>
                  <br />
                  <span className="code-indent">{'    '}</span>
                  <span className="code-string">&quot;LeetCode + Codeforces grind&quot;</span>
                  <span className="code-punct">,</span>
                  <br />
                  <span className="code-indent">{'    '}</span>
                  <span className="code-string">&quot;System-level C++ + learning Go/Node backend&quot;</span>
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-punct">&#125;</span>
                  <span className="code-punct">;</span>
                  <br />
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-namespace">std</span>
                  <span className="code-punct">::</span>
                  <span className="code-type">string</span>{' '}
                  <span className="code-function">currentlyBuilding</span>
                  <span className="code-punct">()</span>{' '}
                  <span className="code-punct">&#123;</span>
                  <br />
                  <span className="code-indent">{'    '}</span>
                  <span className="code-keyword">return</span>{' '}
                  <span className="code-string">&quot;Interactive frontends + practical dev tools&quot;</span>
                  <span className="code-punct">;</span>
                  <br />
                  <span className="code-indent">{'  '}</span>
                  <span className="code-punct">&#125;</span>
                  <br />
                  <span className="code-punct">&#125;</span>
                  <span className="code-punct">;</span>
                </code>
              </pre>
            </motion.article>

            <motion.article className="bullet-card" variants={reveal} initial="hidden" whileInView="show" custom={0.2} viewport={{ once: true }}>
              <ul>
                <li>Pursuing Computer Science at MIT Academy of Engineering, Pune.</li>
                <li>Focused on React architecture, scalable UI systems, and DSA consistency.</li>
                <li>Building practical apps, audit tools, and developer-first interfaces.</li>
                <li>Currently learning Go and Node.js backend development.</li>
                <li>Comfortable with Linux, shell scripting, and automation workflows.</li>
                <li>Interested in digital logic and computer systems at the metal layer.</li>
              </ul>
            </motion.article>
          </div>
        </section>

        <section className="skills section" id="skills">
          <motion.div className="section-heading" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p>Stack</p>
            <h2>Technologies I use to ship and learn fast.</h2>
          </motion.div>

          <div className="skill-panels">
            <motion.div className="skill-panel" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <h3>Languages</h3>
              <p>C++ • C • Python • JavaScript • TypeScript • Bash</p>
            </motion.div>
            <motion.div className="skill-panel" variants={reveal} initial="hidden" whileInView="show" custom={0.1} viewport={{ once: true }}>
              <h3>Web</h3>
              <p>React • HTML • CSS • Component architecture • Responsive systems</p>
            </motion.div>
            <motion.div className="skill-panel" variants={reveal} initial="hidden" whileInView="show" custom={0.2} viewport={{ once: true }}>
              <h3>Tools</h3>
              <p>Linux • Git • VS Code • GitHub Actions • Shell automation • CLI workflows</p>
            </motion.div>
          </div>
        </section>

        <section className="projects section" id="projects">
          <motion.div className="section-heading" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p>Featured Projects</p>
            <h2>GitHub projects.</h2>
          </motion.div>

          <div className="project-grid">
            {featuredProjects.map((project, index) => (
              <motion.article
                className="project-card"
                key={project.name}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                custom={(index % 3) * 0.1}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
              >
                <div className="project-top">
                  <h3>{project.title}</h3>
                  <span>★ {project.stars} · ⑂ {project.forks}</span>
                </div>
                <p>{project.description}</p>
                <div className="project-tags">
                  {project.stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <small>{formatUpdatedDate(project.updated)}</small>
                <a href={project.href} target="_blank" rel="noreferrer">
                  Open Repository
                </a>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="journey section">
          <motion.div className="section-heading" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p>Journey</p>
            <h2>From foundations to production-ready builds.</h2>
          </motion.div>

          <div className="timeline">
            <motion.article className="timeline-card" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <span>2022 - 2025</span>
              <h3>Narayana School</h3>
              <p>Thane, Maharashtra</p>
            </motion.article>
            <motion.article className="timeline-card" variants={reveal} initial="hidden" whileInView="show" custom={0.1} viewport={{ once: true }}>
              <span>2025 - 2029</span>
              <h3>MIT Academy of Engineering</h3>
              <p>B.Tech in Computer Science, Alandi (Pune)</p>
            </motion.article>
            <motion.article className="timeline-card" variants={reveal} initial="hidden" whileInView="show" custom={0.2} viewport={{ once: true }}>
              <span>Now</span>
              <h3>Current Focus</h3>
              <p>Scalable React frontends, daily DSA, and learning Go + Node.js backend engineering.</p>
            </motion.article>
          </div>
        </section>

        <section className="contact section" id="contact">
          <div className="contact-stack">
            <motion.div className="contact-card" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <p className="contact-kicker">Let&apos;s collaborate</p>
              <h2>Open to building cool things with serious execution.</h2>
              <p className="contact-note">
                Drop a message with your idea, timeline, or question. I usually reply within a day.
              </p>
              <div className="contact-links">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={cpLinkIconByLabel[item.label] ? 'contact-link-strong' : ''}
                    {...getLinkProps(item.href)}
                  >
                    {cpLinkIconByLabel[item.label] ? (
                      <img
                        src={cpLinkIconByLabel[item.label]}
                        alt=""
                        aria-hidden="true"
                        className="contact-link-icon"
                      />
                    ) : null}
                    {item.label}
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="contact-form-card"
              variants={reveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={0.1}
            >
              <form className="contact-form" action={CONTACT_FORM_ENDPOINT} method="POST">
                <input type="hidden" name="_subject" value="New portfolio message" />
                <label className="contact-field">
                  <span>Name</span>
                  <input type="text" name="name" placeholder="Your name" autoComplete="name" required />
                </label>
                <label className="contact-field">
                  <span>Email</span>
                  <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
                </label>
                <label className="contact-field">
                  <span>Subject</span>
                  <input type="text" name="subject" placeholder="Project, question, or hello" />
                </label>
                <label className="contact-field">
                  <span>Message</span>
                  <textarea name="message" rows="5" placeholder="Enter your message here..." required />
                </label>
                <button className="btn btn-primary" type="submit">
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        <footer className="site-footer">
          <p>Unique visits: {visitCount}</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
