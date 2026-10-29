import { readScales } from './scales';
import { LONG_ROD_BASELINE as base, SHORT_ROD_BASELINE } from '../data/baselines';
import type { Setup } from './types';

const with_ = (p: Partial<Setup>, s: Setup = base): Setup => ({ ...s, ...p });

describe('scales', () => {
  it('BRP baseline reads in the manual target windows', () => {
    const r = readScales(base);
    expect(r.total).toBeCloseTo(2220, 0);
    expect(r.leftPct).toBeGreaterThanOrEqual(54.2);
    expect(r.leftPct).toBeLessThanOrEqual(54.4);
    expect(r.rearPct).toBeGreaterThanOrEqual(63.5);
    expect(r.rearPct).toBeLessThanOrEqual(64.5);
    expect(r.crossPct).toBeGreaterThanOrEqual(46.5);
    expect(r.crossPct).toBeLessThanOrEqual(47.5);
    expect(r.leftRearWeight).toBeCloseTo(30, 0);
    expect(r.heights.LF).toBeCloseTo(5.5, 3);
    expect(r.heights.RR).toBeCloseTo(6.5, 3);
    // 85 and 92 in tires grow with LR 8 psi / RR 12 psi
    expect(r.rearStagger).toBeCloseTo(7.3, 1);
  });

  it('one turn on a coil nut moves roughly 5-6 lb and it is diagonal (p. 12-14)', () => {
    const a = readScales(base);
    const b = readScales(with_({ nutLR: 1 }));
    const d = (c: 'LF' | 'RF' | 'LR' | 'RR') => b.weights[c] - a.weights[c];
    expect(d('LR')).toBeGreaterThan(4);
    expect(d('LR')).toBeLessThan(7);
    expect(d('RF')).toBeCloseTo(d('LR'), 6);
    expect(d('LF')).toBeCloseTo(-d('LR'), 6);
    expect(d('RR')).toBeCloseTo(-d('LR'), 6);
    expect(b.total).toBeCloseTo(a.total, 6);
  });

  it('the four-corner method removes left rear weight and keeps frame heights (p. 13-14)', () => {
    const a = readScales(base);
    const b = readScales(with_({ nutLR: -2, nutRR: 2, nutRF: -2, nutLF: 2 }));
    expect(b.leftRearWeight).toBeLessThan(a.leftRearWeight - 30);
    for (const c of ['LF', 'RF', 'LR', 'RR'] as const) expect(Math.abs(b.heights[c] - a.heights[c])).toBeLessThan(0.3);
  });

  it('winding all four nuts down 8 turns raises the car 1 in and leaves weights alone', () => {
    const a = readScales(base);
    const b = readScales(with_({ nutLF: 8, nutRF: 8, nutLR: 8, nutRR: 8 }));
    for (const c of ['LF', 'RF', 'LR', 'RR'] as const) {
      expect(b.heights[c] - a.heights[c]).toBeCloseTo(1, 6);
      expect(b.weights[c]).toBeCloseTo(a.weights[c], 6);
    }
  });

  it('shorter front panhard and shorter right side rear panhard add left side % (p. 13)', () => {
    const a = readScales(base).leftPct;
    expect(readScales(with_({ frontPanhardTurns: -6 })).leftPct).toBeGreaterThan(a);
    expect(readScales(with_({ rearPanhardTurns: -6 })).leftPct).toBeGreaterThan(a);
  });

  it('left side panhard works the opposite way: longer adds left side % (p. 28)', () => {
    const a = readScales(SHORT_ROD_BASELINE).leftPct;
    expect(readScales(with_({ rearPanhardTurns: 6 }, SHORT_ROD_BASELINE)).leftPct).toBeGreaterThan(a);
  });

  it('ballast high on the nose adds front weight; over the rear end adds rear %', () => {
    const a = readScales(base);
    expect(readScales(with_({ ballastNoseLeft: 25 })).rearPct).toBeLessThan(a.rearPct);
    expect(readScales(with_({ ballastOverRearEnd: 75 })).rearPct).toBeGreaterThan(a.rearPct);
  });

  it('moving the RR wheel out (less backspace) adds left side %', () => {
    expect(readScales(with_({ offsetRR: 2 })).leftPct).toBeGreaterThan(readScales(base).leftPct);
  });

  it('a softer spring at the same nut sits lower', () => {
    expect(readScales(with_({ springRR: 150 })).heights.RR).toBeLessThan(readScales(base).heights.RR);
  });

  it('more air grows the tire: more RR pressure = more stagger', () => {
    expect(readScales(with_({ pressureRR: 16 })).rearStagger).toBeGreaterThan(readScales(base).rearStagger);
  });
});
