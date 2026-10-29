import { advanceTrack, crewPrep, initialTrack, weatherById } from './evolution';
import { conditionLabel, gripLevel } from './track';
import { makeRng } from './rng';
import { trackById } from '../data/tracks';

const delaware = trackById('delaware');

/** A typical night: hot laps, three heats, a consi, intermissions, then the feature */
function night(weatherId: string) {
  const weather = weatherById(weatherId);
  let t = initialTrack(weather, makeRng(1));
  const at: Record<string, ReturnType<typeof initialTrack>> = { hotLaps: t };
  t = advanceTrack(t, { carLaps: 24 * 5, minutes: 20, weather, track: delaware });
  t = advanceTrack(t, { carLaps: 3 * 8 * 10, minutes: 40, weather, track: delaware });
  at.heats = t;
  t = advanceTrack(t, { carLaps: 12 * 12, minutes: 45, weather, track: delaware });
  at.feature = t;
  t = advanceTrack(t, { carLaps: 24 * 30, minutes: 0, weather, track: delaware });
  at.end = t;
  return at;
}

describe('track evolution', () => {
  it('starts heavy and ends slick on a hot night', () => {
    const n = night('hot-sunny');
    expect(['heavy', 'tacky']).toContain(conditionLabel(n.hotLaps));
    expect(['dry slick', 'black slick']).toContain(conditionLabel(n.end));
  });

  it('a cool humid night holds grip longer than a hot one', () => {
    expect(gripLevel(night('cool-humid').feature)).toBeGreaterThan(gripLevel(night('hot-sunny').feature) + 0.05);
  });

  it('watering brings grip back and washes rubber off', () => {
    const slick = night('hot-sunny').end;
    const watered = crewPrep(slick, 'water-heavy');
    expect(gripLevel(watered)).toBeGreaterThan(gripLevel(slick));
    expect(watered.rubber).toBeLessThan(slick.rubber);
  });

  it('a heavy track gets rough with laps; grading smooths it', () => {
    const w = weatherById('cool-humid');
    const t0 = initialTrack(w, makeRng(2));
    const rough = advanceTrack(t0, { carLaps: 200, minutes: 0, weather: w, track: delaware });
    expect(rough.roughness).toBeGreaterThan(t0.roughness);
    expect(crewPrep(rough, 'grade').roughness).toBeLessThan(rough.roughness);
  });
});
