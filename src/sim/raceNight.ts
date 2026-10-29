import type { Fault, Setup, TrackState } from './types';
import { simulateLap, referenceLap } from './laptime';
import { analyzeHandling } from './handling';
import { driverFeedback, DRIVERS } from './driver';
import { advanceTrack, crewPrep, initialTrack, trackReport, weatherById, type CrewAction, CREW_ACTIONS } from './evolution';
import { gripLevel } from './track';
import { gauss, makeRng, pick, type Rng } from './rng';
import { diffSetups, workMinutes, type Change } from './setupOps';
import { trackById } from '../data/tracks';
import { RULES } from '../data/rules';

// A race night: hot laps, a heat, a consi if you miss the transfer, then the feature. Between
// sessions there is a timed work window and the track crew works the surface. Our car's laps come
// from the handling model; the rest of the field is a simple pace model that also slows as the
// track slicks off.

export type SessionKind = 'hot' | 'heat' | 'consi' | 'feature';
export const SESSION_LABEL: Record<SessionKind, string> = { hot: 'Hot laps', heat: 'Heat race', consi: 'Consi', feature: 'Feature' };

export interface NightConfig {
  trackId: string;
  weatherId: string;
  driverIdx: number;
  seed: number;
  faults?: Fault[];
}

export interface Rival {
  num: string;
  /** seconds per lap off the reference on a tacky track */
  pace: number;
  /** extra seconds per lap they lose (or gain, if negative) once it goes slick */
  slickShift: number;
}

export interface SessionResult {
  kind: SessionKind;
  laps: number[];
  start?: number;
  finish?: number;
  cars: number;
  transferred?: boolean;
  feedback: string[];
  midFeedback?: string[];
  trackBefore: TrackState;
  trackAfter: TrackState;
  setup: Setup;
  changes: Change[];
  cautions?: number;
  /** finishing order of numbers, ours is '00' */
  order?: string[];
}

export interface NightState {
  config: NightConfig;
  rivals: Rival[];
  track: TrackState;
  setup: Setup;
  windowStart: Setup;
  windowMinutes: number;
  next: SessionKind | 'done';
  results: SessionResult[];
  crewNote: string;
  draw: number;
  tick: number;
}

export const OUR_NUMBER = '00';
const WINDOW_MINUTES: Record<SessionKind, number> = { hot: 30, heat: 35, consi: 20, feature: 45 };
const OTHER_CLASSES_CAR_LAPS = 140; // support classes run between our sessions

function rngFor(state: NightState, salt: number): Rng {
  return makeRng(state.config.seed * 1000 + state.tick * 17 + salt);
}

export function startNight(config: NightConfig, setup: Setup): NightState {
  const rng = makeRng(config.seed);
  const weather = weatherById(config.weatherId);
  const rivals: Rival[] = Array.from({ length: RULES.featureCars + 6 }, (_, i) => ({
    num: String(i + 1),
    pace: Math.max(-0.05, Math.min(1.1, 0.4 + gauss(rng) * 0.28)),
    slickShift: gauss(rng) * 0.18,
  })).filter((r) => r.num !== OUR_NUMBER);
  return {
    config,
    rivals,
    track: initialTrack(weather, rng),
    setup,
    windowStart: setup,
    windowMinutes: WINDOW_MINUTES.hot,
    next: 'hot',
    results: [],
    crewNote: 'Track crew has it heavy and wet for hot laps.',
    draw: 1 + Math.floor(rng() * RULES.heatCars),
    tick: 0,
  };
}

export function pendingChanges(st: NightState) {
  const changes = diffSetups(st.windowStart, st.setup);
  return { changes, minutes: workMinutes(changes) };
}

export function canRun(st: NightState) {
  return st.next !== 'done' && pendingChanges(st).minutes <= st.windowMinutes;
}

function rivalLap(r: Rival, track: TrackState, trackId: string, rng: Rng) {
  const g = gripLevel(track);
  return referenceLap(trackById(trackId), track) + r.pace + r.slickShift * (1 - g) + gauss(rng) * 0.09;
}

interface RaceOut {
  laps: number[];
  finish: number;
  order: string[];
  trackAfter: TrackState;
  cautions: number;
  midFeedback: string[];
}

/** Lap-by-lap race. Gaps are compressed on cautions; passing in traffic costs time. */
function race(st: NightState, kind: SessionKind, field: Rival[], start: number, lapsN: number, rng: Rng): RaceOut {
  const { trackId, weatherId, driverIdx, faults } = st.config;
  const track = trackById(trackId);
  const weather = weatherById(weatherId);
  const driver = DRIVERS[driverIdx];
  const cars = [OUR_NUMBER, ...field.map((r) => r.num)];
  // starting grid: two wide, 0.25 s per row
  const order0 = [...field.map((r) => r.num)];
  order0.splice(start - 1, 0, OUR_NUMBER);
  const total = new Map<string, number>(order0.map((n, i) => [n, Math.floor(i / 2) * 0.25]));
  const laps: number[] = [];
  let t = st.track;
  let cautions = 0;
  let midFeedback: string[] = [];
  const cautionLaps = new Set<number>();
  const nCautions = kind === 'feature' ? Math.floor(rng() * 4) : rng() < 0.3 ? 1 : 0;
  for (let i = 0; i < nCautions; i++) cautionLaps.add(2 + Math.floor(rng() * (lapsN - 3)));

  for (let lap = 1; lap <= lapsN; lap++) {
    const before = [...total.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
    for (const num of cars) {
      let time: number;
      if (num === OUR_NUMBER) {
        time = simulateLap(st.setup, track, t, { rng, driverSkill: driver.skill, faults, tireLaps: lap }).time;
        laps.push(time);
      } else {
        time = rivalLap(field.find((r) => r.num === num)!, t, trackId, rng);
      }
      // stuck behind slower cars: a little time lost per car ahead within half a second
      const pos = before.indexOf(num);
      const ahead = before.slice(Math.max(0, pos - 2), pos).filter((a) => total.get(num)! - total.get(a)! < 0.5).length;
      total.set(num, total.get(num)! + time + ahead * 0.06);
    }
    if (cautionLaps.has(lap)) {
      cautions++;
      const sorted = [...total.entries()].sort((a, b) => a[1] - b[1]);
      const lead = sorted[0][1];
      sorted.forEach(([n], i) => total.set(n, lead + i * 0.22));
    }
    if (kind === 'feature' && lap === Math.round(lapsN / 2)) {
      midFeedback = driverFeedback(analyzeHandling(st.setup, t, faults), driver, rng, laps.slice(-5)).lines;
    }
    t = advanceTrack(t, { carLaps: cars.length, minutes: 0, weather, track });
  }
  const order = [...total.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
  return { laps, finish: order.indexOf(OUR_NUMBER) + 1, order, trackAfter: t, cautions, midFeedback };
}

export function runNext(st: NightState): NightState {
  if (st.next === 'done') return st;
  const kind = st.next;
  const rng = rngFor(st, 1);
  const { trackId, weatherId, driverIdx, faults } = st.config;
  const track = trackById(trackId);
  const weather = weatherById(weatherId);
  const driver = DRIVERS[driverIdx];
  const changes = pendingChanges(st).changes;
  const trackBefore = st.track;
  let result: SessionResult;

  if (kind === 'hot') {
    const laps: number[] = [];
    let t = st.track;
    for (let i = 0; i < 5; i++) {
      laps.push(simulateLap(st.setup, track, t, { rng, driverSkill: driver.skill, faults, tireLaps: i }).time);
      t = advanceTrack(t, { carLaps: 12, minutes: 0, weather, track });
    }
    result = { kind, laps, cars: 12, feedback: [], trackBefore, trackAfter: t, setup: st.setup, changes };
  } else {
    const heatField = st.rivals.slice(0, RULES.heatCars - 1);
    const consiField = st.rivals.slice(RULES.featureCars, RULES.featureCars + 7);
    const field = kind === 'heat' ? heatField : kind === 'consi' ? consiField : st.rivals.slice(0, RULES.featureCars - 1);
    const lapsN = kind === 'heat' ? RULES.heatLaps : kind === 'consi' ? RULES.consiLaps : RULES.featureLaps;
    let start: number;
    if (kind === 'heat') start = st.draw;
    else if (kind === 'consi') start = 1 + Math.floor(rng() * 4);
    else {
      const heat = st.results.find((r) => r.kind === 'heat');
      const viaConsi = st.results.some((r) => r.kind === 'consi');
      // heat finish sets the feature lineup; consi transfers start at the tail
      start = viaConsi ? RULES.featureCars - 3 + Math.floor(rng() * 3) : Math.min(RULES.featureCars, 2 + (heat?.finish ?? 4) * 2 + Math.floor(rng() * 4));
    }
    const out = race(st, kind, field, start, lapsN, rng);
    const transfers = kind === 'heat' ? RULES.heatTransfers : kind === 'consi' ? RULES.consiTransfers : 0;
    result = {
      kind,
      laps: out.laps,
      start,
      finish: out.finish,
      cars: field.length + 1,
      transferred: kind === 'feature' ? undefined : out.finish <= transfers,
      feedback: [],
      midFeedback: kind === 'feature' ? out.midFeedback : undefined,
      trackBefore,
      trackAfter: out.trackAfter,
      setup: st.setup,
      changes,
      cautions: out.cautions,
      order: out.order,
    };
  }

  // the driver climbs out and tells you about it
  result.feedback = driverFeedback(analyzeHandling(st.setup, result.trackAfter, faults), driver, rng, result.laps.slice(-5)).lines;

  // what comes next
  let next: NightState['next'];
  if (kind === 'hot') next = 'heat';
  else if (kind === 'heat') next = result.transferred ? 'feature' : 'consi';
  else if (kind === 'consi') next = result.transferred ? 'feature' : 'done';
  else next = 'done';

  // other classes run, the clock moves, the crew works the track
  let t = result.trackAfter;
  let crewNote = '';
  if (next !== 'done') {
    const action: CrewAction = pick(rng, gripLevel(t) < 0.35 ? (['water-light', 'none', 'none', 'pack'] as CrewAction[]) : (['none', 'none', 'pack', 'grade'] as CrewAction[]));
    t = advanceTrack(t, { carLaps: OTHER_CLASSES_CAR_LAPS, minutes: WINDOW_MINUTES[next], weather, track });
    t = crewPrep(t, action);
    crewNote = `${CREW_ACTIONS[action]} before the ${SESSION_LABEL[next].toLowerCase()}. ${trackReport(t)}`;
  }

  return {
    ...st,
    track: t,
    windowStart: st.setup,
    windowMinutes: next === 'done' ? 0 : WINDOW_MINUTES[next],
    next,
    results: [...st.results, result],
    crewNote,
    tick: st.tick + 1,
  };
}

/** Simple scoring for the debrief */
export function nightSummary(st: NightState) {
  const feature = st.results.find((r) => r.kind === 'feature');
  const best = Math.min(...st.results.flatMap((r) => r.laps));
  const changes = st.results.reduce((n, r) => n + r.changes.length, 0);
  let headline: string;
  if (!feature) headline = 'Missed the feature. Look at what the car was doing in the heat and consi.';
  else if (feature.finish! <= 3) headline = `Podium: finished ${feature.finish} from ${feature.start}.`;
  else if (feature.finish! < feature.start!) headline = `Gained ${feature.start! - feature.finish!} spots: ${feature.start} to ${feature.finish}.`;
  else headline = `Finished ${feature.finish} from ${feature.start}.`;
  return { headline, best, changes };
}
