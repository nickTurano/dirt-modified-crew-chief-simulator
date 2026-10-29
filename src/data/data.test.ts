import { CATALOG, catalogFor } from './catalog';
import { BASELINES } from './baselines';
import { SHOCKS, TIRES, BUSHINGS } from './parts';

describe('car data', () => {
  it.each(BASELINES.map((b) => [b.name, b] as const))('%s uses only legal catalog values', (_, setup) => {
    for (const adj of catalogFor(setup.rearConfig, setup.panhardSide)) {
      const v = setup[adj.key];
      if (adj.kind === 'turns') {
        expect(typeof v).toBe('number');
        expect(v as number).toBeGreaterThanOrEqual(adj.min);
        expect(v as number).toBeLessThanOrEqual(adj.max);
      } else {
        expect(adj.options.map((o) => o.value)).toContain(v);
      }
    }
  });

  it('references real parts', () => {
    for (const s of BASELINES) {
      for (const id of [s.shockLF, s.shockRF, s.shockLR, s.shockRR]) expect(SHOCKS.some((x) => x.id === id)).toBe(true);
      for (const id of [s.tireLF, s.tireRF, s.tireLR, s.tireRR]) expect(TIRES.some((x) => x.id === id)).toBe(true);
      expect(BUSHINGS.some((b) => b.id === s.torqueArmBushing)).toBe(true);
    }
  });

  it('has one entry per key for each car configuration', () => {
    for (const rc of ['long-rod', 'short-rod'] as const)
      for (const ps of ['left', 'right'] as const) {
        const keys = catalogFor(rc, ps).map((a) => a.key);
        expect(new Set(keys).size).toBe(keys.length);
      }
    expect(CATALOG.length).toBeGreaterThan(50);
  });
});
