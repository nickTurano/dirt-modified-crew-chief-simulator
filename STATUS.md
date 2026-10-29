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
- [ ] 3. Scales math
- [ ] 4. Handling model + manual rule tests
- [ ] 5. Lap time + driver feedback
- [ ] 6. Track evolution
- [ ] 7. Sandbox UI
- [ ] 8. Race night
- [ ] 9. Drills
- [ ] 10. Polish

## Notes for the next session
- Work happens on branch `claude/build-simulator` (PR into main).
- Switching rearConfig/panhardSide must re-normalize hole fields (long rod has 3 radius rod holes,
  short rod 5; left panhard plate 4 holes, right 9). Do this in the store (stage 7).
