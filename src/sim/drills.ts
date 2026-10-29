import type { Setup } from './types';
import type { Drill } from '../data/drills';
import { LONG_ROD_BASELINE, SHORT_ROD_BASELINE } from '../data/baselines';
import { PRESET_TRACKS } from './track';
import { analyzeHandling } from './handling';

export const drillSetup = (d: Drill): Setup => ({ ...(d.base === 'short' ? SHORT_ROD_BASELINE : LONG_ROD_BASELINE), ...d.start });
export const drillTrack = (d: Drill) => PRESET_TRACKS[d.track];

/** The model's measure for a drill's target: + always means "better" for the drill */
export function drillScore(d: Drill, s: Setup): number {
  if (!d.target) return 0;
  const h = analyzeHandling(s, drillTrack(d));
  const m = d.target.measure;
  const v = m === 'forwardBite' ? h.forwardBite : m === 'sideBite' ? h.sideBite : h.phases[m].balance;
  return d.target.dir === 'looser' ? -v : v;
}
