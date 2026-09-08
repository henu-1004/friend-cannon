# Friend Cannon

A playable slapstick physics toy built with Vite, TypeScript, Three.js, and cannon-es. Launch a very brave friend through a miniature neighborhood, downtown, and a surreal sky district. No backend; face photos stay in your browser.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` type-checks and produces `dist/`; `npm run preview` serves the production build.

## Controls

| Key | Action |
| --- | --- |
| A / D | Raise / lower cannon angle |
| W / S | Increase / decrease power |
| Space | Fire |
| F / Shift | Fart booster (five per flight) |
| Q / E | Flail counterclockwise / clockwise and steer boost upward / forward |
| R | Instantly retry, including mid-flight |

Sliders and launch, boost, flail, and retry buttons also support pointer/touch play. The music-note button toggles synthesized sound effects. The optional circular face picker starts on **None**, keeping the default cartoon face. Choose one of five public Pravatar CDN samples to apply an oval crop immediately, or select None to restore the cartoon. If a sample cannot load (including CORS/network failures), its built-in illustrated portrait stays available. Samples are optional and never block play. **Upload your own photo** also accepts a local image; local photos are never uploaded. Public samples are fetched from `https://i.pravatar.cc/256?img=N`.

## Make a mess

Trampolines, springs, cars, fans, explosive barrels, glass, signs, and balloons turn impacts into new launches. Boost on descent to reach another prop. Q/E applies actual torque to the jointed character; boosts add forward and upward thrust, with direction influenced by flailing. The shallow course gently centers lateral drift to keep props within reach.

The six-body ragdoll has cone-twist joints, a large head, chubby torso, and short floppy limbs. The follow camera lags, pulls back at speed, looks down during flight, and shakes on impact. Distance records forward progress; chaos rewards props, bounce chains, and boosts. The flight report tracks height, speed, cars, glass, explosions, special hits, and fuel usage. Personal best distance persists locally.

Flights end after settling, reaching the end of the 1.25 km course, or 65 seconds. R resets immediately. Physics uses a fixed 60 Hz step with capped catch-up to recover from slow frames.

## Validation

`npm run build` passes. Browser smoke checks exercise launch, distance progression, collisions and chaos scoring, boost fuel, flail input, and retry. WebGL is required. The production bundle includes both rendering and physics engines; Vite may print a non-blocking bundle-size advisory.
