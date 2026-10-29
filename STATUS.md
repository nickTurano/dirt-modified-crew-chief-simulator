# Build status

Resume point for any session: read this file, then continue with the first unchecked stage.
Plan: https://claude.ai/artifact/PbCmA7Ma7ZeGcSSpN3EF14 · Manual notes: docs/manual-notes.md

## Car decisions (from Nick)
- Bicknell Midrail big block, coil-over front and rear
- Rear: coil-over with long rods OR short rods, swappable by conditions; panhard (not J-bar)
- Tires: American Racer
- Home tracks: Delaware International Speedway, Georgetown Speedway (both 1/2 mile clay)
- Shocks: no adjustable / remote reservoir; tuning = shock swaps + nitrogen

## Stages
- [x] 1. Scaffold (Vite + React + TS, Vitest)
- [x] 2. Car data (adjustment catalog, parts, baselines, rules, tracks)
- [x] 3. Scales math
- [x] 4. Handling model + manual rule tests
- [x] 5. Lap time + driver feedback
- [x] 6. Track evolution
- [x] 7. Sandbox UI
- [x] 8. Race night
- [x] 9. Drills
- [x] 10. Polish

## Notes for the next session
- Work happens on branch `claude/build-simulator` (PR into main).
- Switching rearConfig/panhardSide must re-normalize hole fields (long rod has 3 radius rod holes,
  short rod 5; left panhard plate 4 holes, right 9). Do this in the store (stage 7).
- Handling model: src/sim/handling.ts (EFFECTS table + gripTerms). Rule tests: src/sim/handling.test.ts
  (about 110 manual rules). Manual contradictions resolved: LR weight vs entry follows the tables on
  pp. 41-42 (more LR = tighter entry); "LR rebound in apex off" appears in both tight and loose lists, so it is
  left out of the apex-off phase.
- Lap time: src/sim/laptime.ts, driver talk: src/sim/driver.ts. The BRP baseline goes loose as the track slicks off (by design: the trainee has to react).
- Track evolution: src/sim/evolution.ts (weather presets, advanceTrack by car-laps + minutes, crewPrep, trackReport).
- UI: src/ui (zustand store in store.ts persists to localStorage). Screenshot check with Playwright against `npx vite preview`.
- Race night: src/sim/raceNight.ts (pure engine, seeded), UI src/ui/RaceNight.tsx + raceStore.ts. Untouched BRP baseline tends to win heats and fade in the feature as it slicks off.
- Drills: src/data/drills.ts (20 drills). drills.test.ts checks every option with a setup change against the model. Add drills there; no code needed.
