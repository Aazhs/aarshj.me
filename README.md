# Aarshj.me

Personal portfolio website built with Vite, React, and Framer Motion.

## Features

- Animated pixel-inspired hero and responsive portfolio layout
- Live GitHub project highlights with static fallback data
- Competitive programming stats for Codeforces, LeetCode, and CodeChef
- Contact form powered by Formspree
- Unique visit counter with CountAPI and local fallback behavior
- GitHub Pages deployment through GitHub Actions

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111111" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=ffffff" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Framer%20Motion-Animations-0055FF?style=for-the-badge&logo=framer&logoColor=ffffff" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/GitHub%20Pages-Deploy-222222?style=for-the-badge&logo=githubpages&logoColor=ffffff" alt="GitHub Pages" />
</p>

| Area | Tools |
| --- | --- |
| Frontend | React 18, JSX, CSS |
| Build tooling | Vite 5, npm |
| Motion | Framer Motion |
| Hosting | GitHub Pages via GitHub Actions |

## Project Structure

```text
src/
  App.jsx        Main portfolio UI and data fetching logic
  main.jsx       React app entry point
  styles.css     Global styles and responsive layout
public/
  images/        Static images copied into the production build
  CNAME          Custom domain config for deployment
dist/            Generated production build
docs/            Legacy/static Pages build snapshot
```

## Local Development

Use Node 20 to match the deployment workflow.

```bash
npm install
npm run dev
```

The dev server prints a local URL, usually `http://localhost:5173`.

## Build and Preview

```bash
npm run build
npm run preview
```

`npm run build` writes production output to `dist/`. `npm run preview` serves that output locally so you can check the production build before pushing.

## Deployment

Deployments run automatically from `.github/workflows/deploy.yml`.

1. Push changes to the `main` branch.
2. GitHub Actions installs dependencies with `npm ci`.
3. The workflow runs `npm run build`.
4. The generated `dist/` folder is uploaded and deployed to GitHub Pages.

The `build.sh` script still rebuilds and copies `dist/` into `docs/`, but the current GitHub Actions deployment uses the `dist/` artifact directly.

## Configuration

- Contact form endpoint: update `CONTACT_FORM_ENDPOINT` in `src/App.jsx`.
- Visit counter namespace/key: update the CountAPI values in the visit-count effect in `src/App.jsx`.
- Profile image: replace `public/images/profile-theme.png`.
- Custom domain: update `public/CNAME` if the domain changes.

## Validation

There is no automated test suite yet. Before opening a pull request or pushing to `main`, run:

```bash
npm run build
```

Also check the site locally with `npm run dev` or `npm run preview`, especially the hero layout, project cards, contact form, and external stat fallbacks.
