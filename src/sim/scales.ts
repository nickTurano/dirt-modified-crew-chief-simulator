import type { Corner, Setup } from './types';
import { CORNERS } from './types';
import { tireById } from '../data/parts';
import { LONG_ROD_BASELINE } from '../data/baselines';

// What the scales and the tape measure show for a setup: corner weights, percentages, frame
// heights and stagger. Weights are WITHOUT the driver unless noted, matching the manual (p. 3, 11).

export type CornerValues = Record<Corner, number>;

export interface ScaleReading {
  weights: CornerValues; // lb, no driver
  total: number;
  leftPct: number;
  rearPct: number;
  crossPct: number; // (LR + RF) / total, the manual's "diagonal"
  leftRearWeight: number; // LR - RR, the manual's "wedge"
  heights: CornerValues; // frame height in inches
  wheelRates: CornerValues; // lb/in at the wheel
  rearStagger: number; // in, RR - LR circumference
  frontStagger: number; // in, RF - LF
  totalWithDriver: number;
}

export const DRIVER_WEIGHT = 180;
const TURN_IN = 1 / 8; // 8 TPI coil nut
const PANHARD_IN_PER_TURN = 0.111; // assumed 5/8-18 LH/RH rod ends
const MOTION_RATIO: CornerValues = { LF: 0.9, RF: 0.9, LR: 0.95, RR: 0.95 };
const TRACK_WIDTH_FRONT = 76;
const TRACK_WIDTH_REAR = 78;
const PRESSURE_GROWTH = 0.08; // inches of circumference per psi from the 10 psi reference

// Bare car (no ballast, no driver) chosen so the BRP baseline with its 50 lb of ballast reads
// in spec: 54.3% left, 64.0% rear, 47.0% cross, about 30 lb left rear weight (p. 3, 13).
const BARE_CAR: CornerValues = { LF: 471.25, RF: 317.75, LR: 699.25, RR: 681.75 };

// How 1 lb of ballast at each mounting spot splits onto the four tires (sums to 1).
// The nose is ahead of the front axle, so it lifts weight off the rear.
const BALLAST_SPLIT: Record<'ballastNoseLeft' | 'ballastLeftRail' | 'ballastOverRearEnd' | 'ballastHighRear', CornerValues> = {
  ballastNoseLeft: { LF: 0.95, RF: 0.25, LR: -0.15, RR: -0.05 },
  ballastLeftRail: { LF: 0.35, RF: 0.05, LR: 0.55, RR: 0.05 },
  ballastOverRearEnd: { LF: 0, RF: 0, LR: 0.5, RR: 0.5 },
  ballastHighRear: { LF: 0, RF: 0, LR: 0.5, RR: 0.5 },
};

// Ride height of the BRP baseline on American Racer tires (p. 4, 7)
const BASE_HEIGHT: CornerValues = { LF: 5.5, RF: 5.5, LR: 6.5, RR: 6.5 };

const springRate = (s: Setup, c: Corner) =>
  c === 'LF' ? s.springLF : c === 'RF' ? s.springRF : c === 'LR' ? s.springLR : s.springRR;
const nutTurns = (s: Setup, c: Corner) =>
  c === 'LF' ? s.nutLF : c === 'RF' ? s.nutRF : c === 'LR' ? s.nutLR : s.nutRR;

export function wheelRates(s: Setup): CornerValues {
  const out = {} as CornerValues;
  for (const c of CORNERS) out[c] = springRate(s, c) * MOTION_RATIO[c] ** 2;
  return out;
}

/** Static weights before nut-turn weight jacking */
function distributedWeights(s: Setup): CornerValues {
  const w = { ...BARE_CAR };
  for (const key of Object.keys(BALLAST_SPLIT) as (keyof typeof BALLAST_SPLIT)[]) {
    const lb = s[key];
    for (const c of CORNERS) w[c] += lb * BALLAST_SPLIT[key][c];
  }

  // Lateral shifts move weight between the left and right tire of one axle.
  // Front panhard: shorter bar = more left side % (p. 13).
  const front = w.LF + w.RF;
  let frontShift = (-s.frontPanhardTurns * PANHARD_IN_PER_TURN * front) / TRACK_WIDTH_FRONT;
  // Wheel backspace: a bigger LF backspace tucks the LF in toward the weight; a smaller RF backspace
  // pushes the RF out. Both raise left side %.
  frontShift += ((s.offsetLF - 4) * front) / TRACK_WIDTH_FRONT / 2;
  frontShift -= ((s.offsetRF - 5) * front) / TRACK_WIDTH_FRONT / 2;
  w.LF += frontShift;
  w.RF -= frontShift;

  // Rear panhard: right side bar shorter = more left %, left side bar is the opposite (p. 13, 28).
  const rear = w.LR + w.RR;
  const panhardSign = s.panhardSide === 'right' ? -1 : 1;
  let rearShift = (panhardSign * s.rearPanhardTurns * PANHARD_IN_PER_TURN * rear) / TRACK_WIDTH_REAR;
  rearShift += ((s.offsetLR - 3) * rear) / TRACK_WIDTH_REAR / 2;
  rearShift -= ((s.offsetRR - 3) * rear) / TRACK_WIDTH_REAR / 2;
  w.LR += rearShift;
  w.RR -= rearShift;
  return w;
}

/**
 * Cross-weight change from coil nut turns. Jacking one corner adds the same weight to it and its
 * diagonal and takes it off the other two. The size is the four wheel rates in series, which comes
 * out near the manual's "1 turn = about 6 lb" (p. 12).
 */
export function jackingWeight(s: Setup): number {
  const k = wheelRates(s);
  const warpStiffness = 1 / CORNERS.reduce((sum, c) => sum + 1 / k[c], 0);
  const warp = (s.nutLF + s.nutRR - s.nutRF - s.nutLR) * TURN_IN;
  return warpStiffness * warp;
}

const tirePressure = (s: Setup, c: Corner) =>
  c === 'LF' ? s.pressureLF : c === 'RF' ? s.pressureRF : c === 'LR' ? s.pressureLR : s.pressureRR;
export function circumference(s: Setup, c: Corner): number {
  const id = c === 'LF' ? s.tireLF : c === 'RF' ? s.tireRF : c === 'LR' ? s.tireLR : s.tireRR;
  return tireById(id).circumference + PRESSURE_GROWTH * (tirePressure(s, c) - 10);
}

// Calibrate each corner's free height so the baseline sits at BASE_HEIGHT.
const BASE_RATES = wheelRates(LONG_ROD_BASELINE);
const BASE_WEIGHTS = distributedWeights(LONG_ROD_BASELINE);

export function readScales(s: Setup): ScaleReading {
  const w = distributedWeights(s);
  const x = jackingWeight(s);
  w.LF += x;
  w.RR += x;
  w.RF -= x;
  w.LR -= x;

  const k = wheelRates(s);
  const heights = {} as CornerValues;
  for (const c of CORNERS) {
    const free = BASE_HEIGHT[c] + BASE_WEIGHTS[c] / BASE_RATES[c];
    heights[c] = free + nutTurns(s, c) * TURN_IN - w[c] / k[c];
  }

  const total = w.LF + w.RF + w.LR + w.RR;
  return {
    weights: w,
    total,
    leftPct: ((w.LF + w.LR) / total) * 100,
    rearPct: ((w.LR + w.RR) / total) * 100,
    crossPct: ((w.LR + w.RF) / total) * 100,
    leftRearWeight: w.LR - w.RR,
    heights,
    wheelRates: k,
    rearStagger: circumference(s, 'RR') - circumference(s, 'LR'),
    frontStagger: circumference(s, 'RF') - circumference(s, 'LF'),
    totalWithDriver: total + DRIVER_WEIGHT,
  };
}

/** BRP target windows for a big block (p. 3, 13) */
export const TARGETS = {
  leftPct: [54.2, 54.4],
  rearPct: [63.5, 64.5],
  crossPct: [46.5, 47.5],
} as const;
