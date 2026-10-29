import { canRun, pendingChanges, runNext, startNight, type NightState } from './raceNight';
import { LONG_ROD_BASELINE as LONG } from '../data/baselines';
import { gripLevel } from './track';

const config = { trackId: 'delaware', weatherId: 'hot-sunny', driverIdx: 1, seed: 42 };

function runAll(st: NightState) {
  let s = st;
  for (let i = 0; i < 6 && s.next !== 'done'; i++) s = runNext(s);
  return s;
}

describe('race night', () => {
  it('runs hot laps, heat, maybe a consi, and ends', () => {
    const end = runAll(startNight(config, LONG));
    expect(end.next).toBe('done');
    expect(end.results[0].kind).toBe('hot');
    expect(end.results[1].kind).toBe('heat');
    const feature = end.results.find((r) => r.kind === 'feature');
    if (feature) expect(feature.laps.length).toBe(30);
  });

  it('the track slicks off from hot laps to the end of the feature on a hot night', () => {
    const end = runAll(startNight(config, LONG));
    expect(gripLevel(end.results.at(-1)!.trackAfter)).toBeLessThan(gripLevel(end.results[0].trackBefore) - 0.3);
  });

  it('is repeatable with the same seed', () => {
    const a = runAll(startNight(config, LONG)).results.map((r) => r.finish);
    const b = runAll(startNight(config, LONG)).results.map((r) => r.finish);
    expect(a).toEqual(b);
  });

  it('blocks a session when the changes need more time than the window', () => {
    let s = runNext(startNight(config, LONG));
    s = { ...s, setup: { ...s.setup, springLF: 250, springRF: 200, springLR: 175, springRR: 175, shockLF: 'f-65-190d', shockRF: 'f-75-165d' } };
    expect(pendingChanges(s).minutes).toBeGreaterThan(s.windowMinutes);
    expect(canRun(s)).toBe(false);
  });

  it('a car that is badly off finishes behind the same car set up well, on average', () => {
    const bad = { ...LONG, tireLR: 'lr-87-hard', tireRR: 'rr-91-soft', springLR: 100, brakeBiasFront: 62 };
    let good = 0;
    let worse = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const g = runAll(startNight({ ...config, seed }, LONG));
      const b = runAll(startNight({ ...config, seed }, bad));
      good += g.results[1].finish!;
      worse += b.results[1].finish!;
    }
    expect(worse).toBeGreaterThan(good);
  });
});
