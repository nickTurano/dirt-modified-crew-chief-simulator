import { runSession, simulateLap, referenceLap } from './laptime';
import { driverFeedback, DRIVERS } from './driver';
import { analyzeHandling } from './handling';
import { makeRng } from './rng';
import { PRESET_TRACKS } from './track';
import { trackById } from '../data/tracks';
import { LONG_ROD_BASELINE as LONG } from '../data/baselines';

const delaware = trackById('delaware');
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const avgLap = (s = LONG, t = PRESET_TRACKS.medium, seed = 1) =>
  avg(runSession(s, delaware, t, 20, { rng: makeRng(seed), driverSkill: 0.8 }).map((l) => l.time));

describe('lap times', () => {
  it('slow down as the track goes slick', () => {
    expect(referenceLap(delaware, PRESET_TRACKS.drySlick)).toBeGreaterThan(referenceLap(delaware, PRESET_TRACKS.heavy) + 1.5);
  });

  it('the baseline runs within a few tenths of the reference lap', () => {
    const ref = referenceLap(delaware, PRESET_TRACKS.medium);
    expect(avgLap()).toBeGreaterThan(ref - 0.2);
    expect(avgLap()).toBeLessThan(ref + 0.6);
  });

  it('a badly wrong setup is clearly slower', () => {
    const bad = { ...LONG, tireLR: 'lr-87-hard', tireRR: 'rr-91-soft', springLR: 100, brakeBiasFront: 62 };
    expect(avgLap(bad)).toBeGreaterThan(avgLap() + 0.4);
  });

  it('matching stagger to a slick track gains time', () => {
    const slick = PRESET_TRACKS.drySlick;
    const less = { ...LONG, tireLR: 'lr-86-soft', tireRR: 'rr-91-soft' };
    expect(avgLap(less, slick)).toBeLessThan(avgLap(LONG, slick));
  });

  it('is repeatable with the same seed', () => {
    const a = simulateLap(LONG, delaware, PRESET_TRACKS.medium, { rng: makeRng(7) }).time;
    const b = simulateLap(LONG, delaware, PRESET_TRACKS.medium, { rng: makeRng(7) }).time;
    expect(a).toBe(b);
  });
});

describe('driver feedback', () => {
  it('a clear driver names the problem phase', () => {
    const h = analyzeHandling({ ...LONG, rrRadiusRodHole: 3, tireLR: 'lr-84-soft' }, PRESET_TRACKS.medium);
    const fb = driverFeedback(h, DRIVERS[0], makeRng(3));
    expect(fb.worst[0].balance).toBeLessThan(0);
    expect(fb.lines.join(' ').toLowerCase()).toMatch(/loose|free|around|steps/);
  });
});
