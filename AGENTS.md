# Repository Guidelines

## Project Structure & Module Organization
This repository is a small Vite + React portfolio site. App code lives in `src/`: `main.jsx` boots React, `App.jsx` contains the main page logic, and `styles.css` holds the global styling. Static assets that should be copied as-is belong in `public/` such as `public/images/` and `public/CNAME`. Build output is generated in `dist/`. The `docs/` folder contains a publishable build snapshot for GitHub Pages and should be treated as generated output, not hand-edited source.

## Build, Test, and Development Commands
Use Node 20 to match the GitHub Actions workflow.

- `npm install`: install dependencies locally.
- `npm run dev`: start the Vite dev server for local work.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the built app locally for a production-style check.
- `./build.sh`: rebuild and copy `dist/` into `docs/` for Pages deployments.

## Coding Style & Naming Conventions
Follow the existing style in `src/`: ES modules, React function components, semicolons, and single quotes. Use 2-space indentation in JSX and CSS blocks. Name React components in `PascalCase`, helper functions in `camelCase`, and constants in `UPPER_SNAKE_CASE` when they are configuration-like values such as `CONTACT_FORM_ENDPOINT`. Keep new assets under clear paths like `public/images/feature-name.png`.

## Testing Guidelines
There is currently no automated test suite or lint config in `package.json`. Until one is added, treat `npm run build` as the minimum validation step and manually verify key flows in `npm run dev` or `npm run preview`, especially animations, external API fallbacks, responsive layout, and the contact form. If you add tests later, colocate them with the feature or under a dedicated `tests/` directory and use `*.test.jsx` naming.

## Commit & Pull Request Guidelines
Recent commits use short, imperative summaries such as `Create build.sh` and `ui fix`. Prefer concise subject lines that describe the user-visible change, for example `Improve hero spacing` or `Fix visit counter fallback`. Pull requests should include a brief description, screenshots or a preview link for UI changes, notes on config changes, and confirmation that `npm run build` passed.
