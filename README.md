# Aarshj.me

Personal portfolio website built with Vite + React.

## Features

- Animated hero, project highlights, and timeline
- Contact form powered by Formspree
- Unique visits counter with CountAPI + local fallback

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Build output is generated in `dist/`.

## GitHub Pages Deploy (docs folder)

This repo is set up to deploy from the `docs/` folder on the `main` branch.

```bash
npm run build
rm -rf docs
cp -R dist docs
```

Then commit and push, and in GitHub settings set Pages to **main /docs**.

## Configuration

- Contact form endpoint: update `CONTACT_FORM_ENDPOINT` in `src/App.jsx` with your Formspree URL.
- Counter namespace/key: update in the visits effect in `src/App.jsx` if you want a new counter.

## Notes

If you see a MIME type error like `text/jsx` on GitHub Pages, it means the source `index.html`
was deployed. Always deploy the built output in `docs/` or a `gh-pages` branch.
