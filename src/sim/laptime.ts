import type { Fault, Phase, Setup, TrackDef, TrackState } from './types';
import { PHASES } from './types';
import { analyzeHandling, type HandlingResult } from './handling';
import { gripLevel } from './track';
import { gauss, type Rng } from './rng';
import { tireById } from '../data/parts';

// Lap time from the handling result. A lap is roughly 55% corners and 45% straights. Being off
// balance costs time in that phase (tight costs more than loose until the car is truly loose, per
// the manual's "you can drive a loose car, not a tight one", p. 8). Grip sets corner speed, forward
// bite sets how well the car leaves the corner.

const CORNER_SHARE = 0.55;
const PHASE_WEIGHT: Record<Phase, number> = { entry: 0.25, apexOff: 0.2, apexOn: 0.25, exit: 0.3 };

export interface LapOptions {
  rng: Rng;
  /** 0..1, how consistent and fast the driver is */
  driverSkill?: number;
  faults?: Fault[];
  /** laps already on these tires */
  tireLaps?: number;
  /** traffic and racing costs added by the race layer, seconds */
  extra?: number;
}

export interface LapResult {
  time: number;
  /** time lost per phase to balance, seconds */
  phaseLoss: Record<Phase, number>;
  gripLoss: number;
  straightLoss: number;
  /** true if the driver had to lift or gathered it up from loose */
  bobble: boolean;
  handling: HandlingResult;
}

export function balanceCost(b: number): number {
  if (b >= 0) return 0.9 * b * b + 0.35 * b; // push: scrubs speed everywhere
  const l = -b;
  // loose: cheap while it is just free, expensive once he has to lift
  return 0.5 * l * l + 0.12 * l + (l > 0.25 ? 3 * (l - 0.25) ** 2 : 0);
}

/** Reference lap for a well set-up car tonight */
export function referenceLap(track: TrackDef, t: TrackState): number {
  const g = gripLevel(t);
  return track.lapTimeSlick + (track.lapTimeTacky - track.lapTimeSlick) * g + t.roughness * 0.15;
}

export function tireGripFactor(s: Setup, t: TrackState, laps: number): number {
  const hard = (tireById(s.tireLR).hardness + tireById(s.tireRR).hardness) / 2;
  const abrasive = 1 - gripLevel(t); // a dry surface eats tires
  const wearPerLap = 0.0012 * (1.4 - hard) * (0.4 + abrasive);
  return 1 - Math.min(0.08, wearPerLap * laps);
}

export function simulateLap(s: Setup, track: TrackDef, t: TrackState, opts: LapOptions): LapResult {
  const skill = opts.driverSkill ?? 0.7;
  const h = analyzeHandling(s, t, opts.faults ?? []);
  const ref = referenceLap(track, t);
  const corner = ref * CORNER_SHARE;
  const straight = ref - corner;
  const wear = tireGripFactor(s, t, opts.tireLaps ?? 0);

  const phaseLoss = {} as Record<Phase, number>;
  let bobble = false;
  for (const p of PHASES) {
    // the driver's lap-to-lap read of the car wanders a little
    const b = h.phases[p].balance + gauss(opts.rng) * 0.02;
    phaseLoss[p] = corner * PHASE_WEIGHT[p] * balanceCost(b);
    if (b < -0.3 && opts.rng() < 0.35) bobble = true;
  }

  const entryGrip = ((h.frontGrip + h.sideBite) / 2) * wear;
  const driveGrip = ((h.sideBite + h.forwardBite) / 2) * wear;
  const gripLoss =
    corner * (PHASE_WEIGHT.entry + PHASE_WEIGHT.apexOff) * (1 / Math.sqrt(entryGrip) - 1) +
    corner * (PHASE_WEIGHT.apexOn + PHASE_WEIGHT.exit) * (1 / Math.sqrt(driveGrip) - 1);
  const straightLoss = straight * 0.35 * (1 / Math.sqrt(h.forwardBite * wear) - 1) + h.drag;

  const noise = gauss(opts.rng) * (0.025 + h.erratic * 0.6) * (1.3 - skill);
  const driverPace = (1 - skill) * 0.25;
  const time =
    ref +
    PHASES.reduce((sum, p) => sum + phaseLoss[p], 0) +
    gripLoss +
    straightLoss +
    noise +
    driverPace +
    (bobble ? 0.25 + opts.rng() * 0.35 : 0) +
    (opts.extra ?? 0);

  return { time, phaseLoss, gripLoss, straightLoss, bobble, handling: h };
}

/** Run a short session (hot laps, practice) on a fixed track state */
export function runSession(s: Setup, track: TrackDef, t: TrackState, laps: number, opts: LapOptions): LapResult[] {
  const out: LapResult[] = [];
  for (let i = 0; i < laps; i++) out.push(simulateLap(s, track, t, { ...opts, tireLaps: (opts.tireLaps ?? 0) + i }));
  return out;
}
