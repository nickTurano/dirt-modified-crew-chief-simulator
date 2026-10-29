import { DRILLS } from './drills';
import { drillScore, drillSetup } from '../sim/drills';

describe('drills agree with the simulator', () => {
  const cases = DRILLS.flatMap((d) => (d.target ? d.options.filter((o) => o.change).map((o) => [`${d.id} / ${o.id} (${o.grade})`, d, o] as const) : []));
  it.each(cases)('%s', (_, d, o) => {
    const start = drillSetup(d);
    const before = drillScore(d, start);
    const after = drillScore(d, { ...start, ...o.change });
    if (o.grade === 'best' || o.grade === 'acceptable') expect(after).toBeGreaterThan(before);
    if (o.grade === 'wrong') expect(after).toBeLessThanOrEqual(before);
  });

  it('every drill has exactly one best answer and unique ids', () => {
    const ids = new Set<string>();
    for (const d of DRILLS) {
      expect(d.options.filter((o) => o.grade === 'best')).toHaveLength(1);
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
    }
    expect(DRILLS.length).toBeGreaterThanOrEqual(18);
  });
});
