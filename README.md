# Dirt Modified Crew Chief Simulator

A training simulator for a crew chief on a Bicknell big block dirt modified (Northeast rules,
coil-over car, American Racer tires). Make real adjustments (turns, holes, part swaps), run laps on a
track that changes through the night, read driver feedback, and work through drills with graded answers.

## Run it

Install [Node.js](https://nodejs.org) 20 or newer, then:

```sh
npm install
npm run dev      # opens a local dev server, usually http://localhost:5173
```

Other commands: `npm test` (sim tests), `npm run build` (static build into `dist/`).

## Layout

- `src/sim/` the simulation engine, plain TypeScript, no UI code
- `src/data/` adjustment catalog, parts, baseline setups, tracks, rules, drills
- `src/ui/` React screens
- `docs/manual-notes.md` notes from the Bicknell setup book that the model and tests are built on

Setup values come from the Bicknell Racing Products setup book. Rule limits are placeholders to be
checked against the current track / DIRTcar Northeast rulebook.
