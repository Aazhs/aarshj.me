# GEMINI.md - aarshj.me

Personal portfolio website for Aarsh Joshi, featuring live GitHub projects, competitive programming stats, and a custom visit counter.

## Project Overview

- **Purpose**: Showcasing skills, projects, and achievements in a pixel-inspired, modern UI.
- **Technologies**:
  - **Frontend**: React 18 (Vite 5)
  - **Animations**: Framer Motion
  - **Styling**: Vanilla CSS with custom variables (Rose Pine-inspired theme)
  - **Data Fetching**: GitHub API (projects), Competitive Programming stats (Codeforces, LeetCode, CodeChef), CountAPI (visit counter)
- **Deployment**: GitHub Pages via GitHub Actions.

## Building and Running

### Prerequisites
- **Node.js**: Version 20.x (recommended to match deployment environment).

### Local Development
```bash
npm install
npm run dev
```
The development server typically runs at `http://localhost:5173`.

### Production Build
```bash
# Generate the production build in the dist/ folder
npm run build

# Preview the production build locally
npm run preview
```

## Development Conventions

### Architecture
- **Single Component Entry**: Most of the portfolio logic and UI reside in `src/App.jsx`. This includes state management, data fetching, and the component tree.
- **Styling**: Global styles and layout variables are managed in `src/styles.css`. It uses a comprehensive set of CSS variables for theming.
- **Animations**: Prefer `framer-motion` for all transitions, hover effects, and layout animations.

### Data & External APIs
- **Fallback Support**: External API calls (GitHub, stats) should have static fallback data (defined in `src/App.jsx`) to ensure the site remains functional if APIs are rate-limited or down.
- **Endpoints**:
  - Contact Form: Formspree (configured via `CONTACT_FORM_ENDPOINT`).
  - Visit Counter: CountAPI with a local storage fallback to track unique visits.

### Design System
- **Theme**: Dark theme with a "Rose Pine" palette (`#191724`, `#c4a7e7`, etc.).
- **Typography**: Monospace-first font stack for a "developer" aesthetic.
- **Responsiveness**: Mobile-first design using CSS Grid and Flexbox, with breakpoints defined in `src/styles.css`.

## Deployment Pipeline

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.
- **Workflow**: `.github/workflows/deploy.yml`
- **Build Output**: `dist/`
- **Domain**: Configured via `CNAME` (custom domain: `aarshj.me`).
