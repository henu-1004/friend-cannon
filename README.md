# Friend Cannon

Shove a friend into a cannon. Aim for trouble. Save them just to do it again.
A single-player slapstick physics game built with Vite, TypeScript, Three.js, and cannon-es. No account or backend.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` type-checks and produces `dist/`; `npm run preview` serves that build.

| Control | Action |
| --- | --- |
| A / D | Raise / lower launch angle |
| W / S | Increase / decrease power |
| Space | Launch; launch again from the report |
| Hold Q | Flail up: lift and brake; aim the next boost upward |
| Hold E | Dive: down and forward; aim the next boost forward |
| F / Shift | Fart boost. On a low descent, reverses the fall for a FART SAVE |
| R | Immediately launch another run with the same aim |
| Escape | Return to aiming; exit replay / cancel video export |

Sliders and buttons support pointer/touch play. **Hold** the two flail buttons to steer. **Change aim** returns to setup; Retry immediately launches again. The music-note button mutes sound.

Hit props within 3.4 seconds to build a **CHAOS STREAK**, up to ×8. Headbutts pay extra. Three prop hits replenish one puff, up to five. Ordinary boosts give a small score bonus; only actual rescue boosts extend the streak. Ground impacts, props, and soft balloons have different reaction strengths.

The course combines ground props with a small pool of air targets. The next air target is positioned ahead using a flight prediction, then remains fixed so steering can hit or miss it. Targets and callouts vary between attempts. The target card shows its direction and distance. A run ends after settling, reaching the end of the course, or 40 seconds of active simulation.

The report remembers your best chaos score and streak locally. It saves the strongest impact as a **5–8 second replay** when enough footage exists (short flights can be shorter). Replay includes poses, expressions, props, effects, and sound. **Save card** downloads a PNG; **Save clip** replays and downloads a WebM video with sound. Video export requires MediaRecorder/WebM support and can be cancelled. No media is posted anywhere.

The optional face picker starts with the cartoon. Each public sample loads from Pravatar **only when selected**, with a built-in illustrated fallback. Uploaded images stay in your browser. Selecting None restores the cartoon. Game fonts are bundled locally with their OFL licenses, so the default game needs no external requests.

Rendering adapts to slow frames by lowering resolution and then disabling detailed shadows. A simple contact shadow remains. Static scenery is batched and culled; bubbles/puffs share an 80-particle instanced pool. Physics and flail forces run at a fixed 60 Hz. Hidden tabs pause; losing focus clears held keys. WebGL is required.

## Browser validation

```sh
npm run build
npm run test:browser
```

The Playwright check starts its own production preview on a free local port and saves evidence under `artifacts/astra/`. It uses an installed Chrome/Chromium if available, or Playwright's bundled browser (`npx playwright install chromium`). Set `CHROME_PATH` to override the executable.

It covers a complete flight, first impact, streaks, low-altitude save, boost cooldown, Q/E steering, low/high launch extremes, instant retry, re-aim, record persistence, worst-hit replay, PNG/WebM export, offline startup, local photo loading, and mobile controls. `?qa` exposes read-only snapshots for the harness; it adds no physics shortcuts.

See `artifacts/astra-vertical-slice.md` for the pass report, measurements, and remaining risks.
