import { applyChange, diffSetups, workMinutes } from './setupOps';
import { LONG_ROD_BASELINE as LONG, SHORT_ROD_BASELINE as SHORT } from '../data/baselines';

describe('setup changes', () => {
  it('swapping to short rods moves the rods to the short link holes and keeps the panhard', () => {
    const s = applyChange(LONG, 'rearConfig', 'short-rod');
    expect(s.lrRadiusRodHole).toBe(SHORT.lrRadiusRodHole);
    expect(s.rrRadiusRodHole).toBe(SHORT.rrRadiusRodHole);
    expect(s.panhardSide).toBe('right');
    expect(s.rearPanhardOuterHole).toBe(LONG.rearPanhardOuterHole);
  });

  it('a right side panhard on a short rod car starts at the right side holes', () => {
    const s = applyChange(SHORT, 'panhardSide', 'right');
    expect(s.rearPanhardOuterHole).toBe(6);
    expect(s.rearPanhardInnerHole).toBe(2);
  });

  it('costs the work, sharing one trip under the car for nut turns', () => {
    const to = { ...LONG, nutLR: 2, nutRF: 2, springRR: 175 };
    const changes = diffSetups(LONG, to);
    expect(changes.map((c) => c.key).sort()).toEqual(['nutLR', 'nutRF', 'springRR']);
    expect(workMinutes(changes)).toBe(15 + 3 + 3);
  });
});
