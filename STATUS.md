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
- [ ] 6. Track evolution
- [ ] 7. Sandbox UI
- [ ] 8. Race night
- [ ] 9. Drills
- [ ] 10. Polish

## Notes for the next session
- Work happens on branch `claude/build-simulator` (PR into main).
- Switching rearConfig/panhardSide must re-normalize hole fields (long rod has 3 radius rod holes,
  short rod 5; left panhard plate 4 holes, right 9). Do this in the store (stage 7).
- Handling model: src/sim/handling.ts (EFFECTS table + gripTerms). Rule tests: src/sim/handling.test.ts
  (about 110 manual rules). Manual contradictions resolved: LR weight vs entry follows the tables on
  pp. 41-42 (more LR = tighter entry); "LR rebound in apex off" appears in both tight and loose lists, so it is
  left out of the apex-off phase.
- Lap time: src/sim/laptime.ts, driver talk: src/sim/driver.ts. The BRP baseline goes loose as the track slicks off (by design: the trainee has to react).
