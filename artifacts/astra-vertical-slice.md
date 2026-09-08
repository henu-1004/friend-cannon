# Friend Cannon — Astra vertical slice

Completed 2026-09-08 in `/workspace/friend-cannon`. Friend Cannon only. All design, implementation, browser playtesting, and review were performed directly, without delegated agents.

## Result

The default flight now reaches a readable headbutt in **0.77 seconds**. The final complete regression run produced **25 events in 31.16 seconds**, with a **2.71-second longest gap between events**, **20,590 chaos**, and a **144 km/h head-first car impact**. The report preserves that impact as an approximately eight-second replay, a downloadable PNG card, and a WebM clip with sound.

These are observations from an automated Chrome playtest, not a retention study or a physical-laptop certification. The source, production build, repeatable browser harness, screenshots, telemetry, card, and video are present in the workspace.

## What changed

### A — Collision comedy and camera

- Read actual collision-normal speed for ground contacts; swept prop sensors use the incoming part velocity along the detected contact axis.
- Resolve prop kicks after physics. Thin glass/signs cannot be skipped between rendered frames. Ground contacts no longer double-score a simultaneous prop impact.
- One reaction onset per contact package, with a 240 ms reaction cooldown. Tiny blink, medium panic/droplets, hard squash/stars/55 ms hit-stop, catastrophic dizzy eyes/85 ms hit-stop/tremble.
- Soft balloons and spring surfaces attenuate the reaction tier, preserving contrast against car/sign impacts. Worst-hit selection uses effective severity and reports the actual normal speed.
- Directional squash recovers with an overshoot. Five-point stars replace spherical “stars.” The physical head keeps its roll while its face stays toward the audience, including photo overlays.
- Camera follows through hit-stop instead of freezing while the friend leaves the shot. Flight distance is capped at a close view; impacts push closer. Impact words stay above the face and within the horizontal viewport.

### B — Encounter rhythm

- Ground course reduced to a purposeful mix of landing and launch props.
- Nine reusable air props place a target ahead of the predicted flight, then remain fixed. The first target is immediately reachable. Subsequent targets vary between attempts.
- A target card shows the next prop, distance, and lift/dive cue. Forgiving sensors keep the shallow play lane usable.
- Individual prop responses preserve forward motion or relaunch with a bounded lift instead of repeatedly adding upward speed. Stronger gravity above the useful altitude band brings overboosted flights back toward the course.

### C — Actual midair agency

- Q applies lift and braking; E applies downward and forward force. Both apply ragdoll torque and orient the next boost.
- A playtest caught weaker flail at low rendering rates. Forces now run in every Cannon **fixed physics substep**, rather than only once per rendered frame.
- Measured Q/E difference after roughly 0.6 seconds: **3.50 m altitude** and **6.66 m/s forward speed**.
- F reverses a low descent into a rescue launch, gives a FART SAVE bonus, and extends the chain. The regression rescue changed vertical velocity by **34.18 m/s**.
- Normal boosts give a small score bonus without farming the streak. A 650 ms cooldown prevents key spam. Every three prop hits refund one puff, capped at five.
- Pointer/touch flail buttons support actual holds and release/cancel events. Keyboard, pointer re-aim, touch boost, and touch retry were exercised.

### D — Retry and shareability

- Visible 3.4-second streak countdown, recent beat sequence, ×8 score multiplier, fuel refunds, headbutt bonuses, and a bounded 40-second flight clock.
- Compact report prioritizes chaos, streak, distance, worst hit, and a concrete next-run challenge. Chaos and streak records persist locally.
- R and the retry button immediately relaunch with the same aim. Escape or Change aim returns to setup; face choice survives retry.
- A short rolling history retains the three seconds before the strongest hit and up to five seconds after it. Replay restores poses, prop state, facial reactions, particles, camera, captions, and sound without changing score or fuel.
- Save card downloads a PNG. Save clip records the replay into a 960×540 WebM with branding, score, captions, and sound. It can be cancelled; unsupported browsers retain replay and PNG export.

### E — Visual direction and first-use clarity

- Warm cream, orange, yellow, and teal UI matches the character and neighborhood. Tone mapping reduces the original fluorescent lighting.
- Numbered aim/launch/flail instructions, readable control buttons, useful target cues, and optional face controls in a collapsed disclosure.
- Fixed initial instruction/panel overlap. Added a compact landscape flight panel after a screenshot revealed it obscuring the friend’s feet.
- Bundled the fonts locally with OFL licenses. Public face samples load only when selected, with immediate illustrated fallbacks. Uploaded images remain local.

### F — Performance and stability

- Static scenery is merged by material and neighborhood chunk, then culled around the camera.
- All puffs/droplets/confetti use one **80-slot instanced particle pool**. Stars reuse geometry/materials. Word textures are cached. Audio nodes disconnect when finished.
- Camera vectors are reused. Physics remains fixed at 60 Hz with capped catch-up; controls run per substep. Hidden tabs pause and blur clears held controls.
- Adaptive resolution steps down to 0.65 and disables detailed shadows if rendering stays slow. A cheap contact shadow remains.
- Bounded replay history; video encoding starts only on request. Retry clears effects, input, physics forces, camera state, records-in-progress, and reusable prop state.

## Validation and proof

```sh
npm install
npm run dev

# Production validation; starts and stops its own preview on a free port.
npm run build
npm run test:browser
```

`npm run build`: **PASS**. Vite retains its advisory about the combined Three.js/physics bundle size.

`npm run test:browser`: **PASS**, zero page errors. Covers a full run, first gag, streaks, low/high launch extremes (15°/35% and 75°/100%), Q/E divergence, low-descent rescue, cooldown, instant retry, re-aim, local records, replay without score mutation, PNG export, WebM export, offline startup, image upload/fallback, mobile touch holds, and portrait/landscape layouts.

Ten mid-flight retries with boost activity completed. The final four samples each held **127 GPU geometries and 10 textures**. Counts during the first full traversal are higher because new scenery uploads as it enters view; the soak checks stabilization at comparable early-course positions.

Final focused visual check after the last feedback/layout adjustments: **PASS**, zero page errors; landscape panel reduced to **110 px** high. This used the final production build.

The software-rendered Chrome full run at 1280×720 measured a **21.2 ms median** and **34.8 ms 95th-percentile** sampled frame interval after adaptive quality, with **34 draw calls** at the final camera position. The frame sample is capped to the last 600 frames and excludes intervals ≥100 ms; screenshot capture and headless software rendering make this a limited diagnostic, not a hardware FPS promise.

The exported WebM was independently decoded with FFmpeg: **VP8 video, 960×540, Opus audio**, and non-silent audio with a measured peak around −18 dBFS.

Evidence:

- [Ready / first-use screen](astra/final-01-ready.png)
- [Readable first reaction](astra/final-02-first-bonk.png)
- [Chaos chain](astra/final-03-chain.png)
- [Flight report](astra/final-04-report.png)
- [Actual downloaded disaster card](astra/final-05-disaster-card.png)
- [Worst-hit replay](astra/final-06-replay.png)
- [Low-descent FART SAVE](astra/final-07-fart-save.png)
- [Q lift](astra/final-08-lift.png) / [E dive](astra/final-08-dive.png)
- [Low launch](astra/final-09-low.png) / [High launch](astra/final-09-high.png)
- [Portrait ready](astra/final-10-mobile-ready.png) / [Portrait flight](astra/final-11-mobile-flight.png)
- [Actual downloaded worst-hit clip](astra/final-12-worst-clip.webm)
- [Final landscape layout](astra/final-13-mobile-landscape.png)
- [Full QA telemetry](astra/final-qa.json) / [Measurement summary](astra/measurements.json)
- Earlier baseline and pass 1–3 screenshots/telemetry remain under `artifacts/astra/`.

## Final self-review

| Area | Assessment |
| --- | --- |
| Fun | Immediate readable mishap; soft/hard contrast; repeated prop chains and rescue opportunities. Needs fresh human playtests to establish stickiness. |
| Controls | Measurable lift/dive difference; rescue reverses descent; touch holds work; fixed the render-rate-dependent force bug. |
| Replay / retry | One-key relaunch, locally remembered targets, varied opening props, short worst-hit replay, card and clip export. |
| Camera | Face stays visible on impacts; mobile and landscape inspected; removed camera-only freezing and fixed the landscape panel obstruction. |
| Feedback | Single collision onset, severity tiers, synchronized hit-stop/squash/sound, visible countdown and refund cues. |
| Visuals | Consistent palette, local fonts, chunky reusable effects, legible default face and optional photo overlay. |
| Performance | Bounded effects/history, batched scenery, adaptive quality, stable repeated-retry resource counts. |
| Bugs | Build and full browser regression pass; no page errors; extreme launches, offline paths, media exports, and retry cleanup exercised. |
| Shareability | A real exported PNG and playable WebM exist in the proof folder; the clip preserves score, reactions, and sound. |

## Remaining risks

- Chrome/SwiftShader and emulated touch were tested here. Physical low-end laptops, Safari/Firefox, and real phone thermals still need hardware testing. Adaptive quality trades sharpness/shadows for speed.
- The air director is deliberately generous. Hands-off runs can reach ×8; longer-term challenge/retention should be tuned with first-time human players rather than assumed from automated runs.
- A very short run can provide less than five seconds of replay. WebM export depends on browser support; replay and PNG remain available.
- Pravatar availability/CORS is external. Illustrated presets, the cartoon, uploaded photos, and the default game work without it.
- The production JS includes both full 3D rendering and physics engines; Vite’s bundle-size advisory remains. No network gameplay service or external publication was added.
