# Tasks

Ideas for aarshj.me, roughly in the order I'd build them.

## Sky and world

- [x] **Live weather.** Pull Pune's current weather from Open-Meteo (free, no key, works from the browser) and show it in the scene: pixel rain, drifting fog, heavier clouds, lightning flashes in storms. Monsoon months get the most rain.
- [x] **Meteor showers on real dates.** Raise the shooting-star rate on peak nights (Quadrantids early Jan, Perseids ~12 Aug, Geminids ~14 Dec) and name the shower in the sky clock.
- [x] **Planets.** Plot Venus, Mars, Jupiter and Saturn at their real positions; they don't twinkle, which is how people tell them from stars.
- [x] **Star names on hover.** Hovering a bright star or planet shows its name.
- [x] **Constellation lines.** Hovering shows a constellation's lines and name; Shift shows them all.
- [x] **ISS passes.** The station crosses the sky on its real path; clicking it opens NASA's live video.
- [ ] **Festivals.** Diwali lanterns and fireworks, Holi colour bursts, New Year fireworks at midnight IST, a few extra lit windows during Ganesh Chaturthi.
- [ ] **Seasons.** Longer shadows and warmer light in winter, greener ground in the monsoon.

## Character

- [ ] **Follows you down the page.** Walks into each section as you scroll and sits on the section heading.
- [ ] **More reactions.** Waves when you hover the contact form, celebrates when a message is sent, falls asleep after a minute of no input.
- [ ] **Outfits.** Small seasonal changes: a scarf in winter, an umbrella when it rains.
- [ ] **Phone tilt.** On phones, tilting the device shifts the parallax and nudges the character.

## Easter eggs

- [x] **Konami code** (↑↑↓↓←→←→BA) turns the scene into a 30-second mini-game: catch fireflies for points, high score saved in the browser.
- [x] **Lamp and bench.** Click (or jump by) the lamp to switch it; click the bench to sit.
- [x] **2–4 am horror mode.** The trapped copy of Aarsh whispers for help; red sky, flickering lamp, glitches.

## Content

- [ ] **Codeforces rating chart** next to the CodeChef one, from the same build-time stats.
- [ ] **"Currently building" line** from the most recently pushed public GitHub repo.
- [ ] **Résumé download** as a PDF, generated from the same project data so it never goes stale.
- [ ] **Notes / blog** for build write-ups (e.g. how the real-time sky works).
- [ ] **Guestbook** where visitors leave a one-line pixel sign, stored in Supabase with basic spam protection.

## Polish

- [ ] **Social preview image.** Generate an Open Graph image of the pixel scene at build time so links on WhatsApp, LinkedIn and X show the site properly.
- [ ] **Pixel 404 page** with the character lost in the dark.
- [ ] **Ambient sound toggle** (off by default): crickets at night, birds at dawn, rain when it's raining.
- [ ] **Smoke tests.** A Playwright test that loads the page, checks the canvas renders, and checks the stats and visitor count appear, run in CI before deploy.
- [ ] **Performance pass.** Measure CPU on a low-end phone; drop frame rate and firefly count when the device is slow or the battery is low.
- [ ] **Remove `docs/` and `build.sh`.** Pages now deploys from GitHub Actions, so both are unused.

## More ideas

### Sky
- [ ] **Sunrise, sunset and moonrise times** in the sky clock, with a countdown to the next one.
- [ ] **Next ISS pass** countdown when it isn't overhead.
- [ ] **Solar and lunar eclipses** on their real dates (the sun dims and a crescent sun appears).
- [ ] **Satellite trains** (Starlink) crossing the sky a few nights after a launch.
- [ ] **Album-colour sky:** tint the sky slightly with the dominant colour of the album art that's playing.

### World
- [ ] **Birds at dawn and dusk** flying across in a V; **bats** at dusk; an **owl** that blinks in the tree at night.
- [ ] **City lights** twinkling on the far hills after dark, and a **plane** with blinking lights crossing now and then.
- [ ] **A cat** that wanders in sometimes; click it to pet it.
- [ ] **Campfire** next to the bench at night that you can light with a click.

### Character
- [ ] **Eyes follow the cursor** when it's nearby.
- [ ] **Falls asleep on the bench at night** with floating Zzz, waking if you click.
- [ ] **Weather outfits:** raincoat in heavy rain, sunglasses at midday.

### Horror (2–4 am)
- [ ] **Console messages** for developers who open DevTools at night ("you found the logs").
- [ ] **A hidden page** (e.g. `/help`) unlocked by typing "help" three times, continuing the story.
- [ ] **Escalation:** whispers get more desperate the longer the tab stays open.

### Content and tech
- [ ] **Coding time** from WakaTime next to the competitive programming stats.
- [ ] **Screenshot tests per preview state:** use the preview panel's settings to render every time, weather and moon in Playwright and catch visual regressions.
- [ ] **Offline support (PWA)** so the scene still loads without a connection.

