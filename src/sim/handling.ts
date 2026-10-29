import type { Corner, Fault, Phase, Setup, TrackState } from './types';
import { PHASES } from './types';
import { readScales, type ScaleReading } from './scales';
import { gripLevel } from './track';
import { referenceSetup } from '../data/baselines';
import { bushingById, shockById, tireById } from '../data/parts';

// The handling model. Each effect turns one part of the setup into a signed deviation from a
// reference (usually the BRP baseline, or the ideal for tonight's track), then multiplies it by
// per-phase coefficients. Balance is + for tight (push) and - for loose. The signs come straight
// from the Bicknell troubleshooting tables (pp. 41-53) and are checked by handling.test.ts.
//
// Balance scale: 0.05 is a small change a good driver feels, 0.15 is a clear problem,
// 0.3 is a car that can't be driven hard.

export interface Contribution {
  id: string;
  label: string;
  value: number;
}

export interface PhaseResult {
  balance: number;
  contributions: Contribution[];
}

export interface HandlingResult {
  phases: Record<Phase, PhaseResult>;
  /** grip multipliers, 1 = baseline car on a well matched setup */
  frontGrip: number;
  sideBite: number;
  forwardBite: number;
  /** extra lap-to-lap scatter from an erratic car, seconds */
  erratic: number;
  /** straightaway drag penalty, seconds per lap */
  drag: number;
  gripNotes: Contribution[];
  scales: ScaleReading;
  ideals: Ideals;
}

export interface Ideals {
  rearStagger: number;
  leftRearWeight: number;
  springRodLength: number;
  pressureLR: number;
  pressureRR: number;
}

/** What BRP recommends for tonight's surface (p. 8, 27) */
export function idealsFor(t: TrackState): Ideals {
  const g = gripLevel(t);
  return {
    rearStagger: 5.5 + 2 * g, // 5-6 slick, 6-7 medium, 7-8 heavy
    leftRearWeight: 85 - 70 * g, // 60-110 dry slick, 0-30 tacky
    springRodLength: 4.25 - 0.5 * g, // 4 1/4 slick .. 3 3/4 tacky
    pressureLR: 6.5 + 2 * g,
    pressureRR: 10 + 2.5 * g,
  };
}

type Coeffs = [entry: number, apexOff: number, apexOn: number, exit: number];

interface Ctx {
  s: Setup;
  base: Setup;
  sc: ScaleReading;
  baseSc: ScaleReading;
  g: number; // grip level 0 slick .. 1 heavy
  slick: number; // 1 - g
  t: TrackState;
  ideal: Ideals;
  eff: Record<Corner, number>; // effective spring incl. nitrogen
  baseEff: Record<Corner, number>;
}

interface Effect {
  id: string;
  label: string;
  dev: (c: Ctx) => number;
  phases?: Coeffs;
  frontGrip?: number;
  sideBite?: number;
  forwardBite?: number;
  erratic?: number;
}

const avg = (a: number, b: number) => (a + b) / 2;
const rake = (sc: ScaleReading) => avg(sc.heights.LF, sc.heights.RF) - avg(sc.heights.LR, sc.heights.RR);
const meanHeight = (sc: ScaleReading) => (sc.heights.LF + sc.heights.RF + sc.heights.LR + sc.heights.RR) / 4;
const tilt = (sc: ScaleReading) => avg(sc.heights.LF, sc.heights.LR) - avg(sc.heights.RF, sc.heights.RR);

/** Side bite from the rear panhard angle, in holes (about 1 in each). See p. 30. */
function panhardBite(s: Setup) {
  // Hole numbers count down from the top, so a bigger number is a lower mount.
  return s.panhardSide === 'right'
    ? s.rearPanhardOuterHole - s.rearPanhardInnerHole // lower outboard / raise inboard = more bite
    : s.rearPanhardInnerHole - s.rearPanhardOuterHole; // raise outboard (chassis) / lower inboard
}
/** Average panhard height in holes, + = higher */
const panhardHeight = (s: Setup) => -(s.rearPanhardOuterHole + s.rearPanhardInnerHole) / 2;
/** Short rods have closer holes, so one hole is a smaller angle change */
const rodHoleScale = (s: Setup) => (s.rearConfig === 'short-rod' ? 0.6 : 1);

function shock(s: Setup, c: Corner) {
  return shockById(c === 'LF' ? s.shockLF : c === 'RF' ? s.shockRF : c === 'LR' ? s.shockLR : s.shockRR);
}
const comp = (c: Ctx, k: Corner) => (shock(c.s, k).comp - shock(c.base, k).comp) / 20;
const reb = (c: Ctx, k: Corner) => (shock(c.s, k).reb - shock(c.base, k).reb) / 40;

function effectiveSprings(s: Setup): Record<Corner, number> {
  // 25 psi of nitrogen is about 10 lb of spring (p. 51)
  const gas = (k: Corner) => {
    const psi = k === 'LF' ? s.gasLF : k === 'RF' ? s.gasRF : k === 'LR' ? s.gasLR : s.gasRR;
    return (psi - shock(s, k).baseGas) * 0.4;
  };
  return {
    LF: s.springLF + gas('LF'),
    RF: s.springRF + gas('RF'),
    LR: s.springLR + gas('LR'),
    RR: s.springRR + gas('RR'),
  };
}

const prepLevel = (p: Setup['prepRear']) => ({ none: 0, 'sipe-light': 1, 'sipe-heavy': 2, 'sipe-grind': 2.5 })[p];

export const EFFECTS: Effect[] = [
  // ---- Weight and geometry
  { id: 'stagger', label: 'Rear stagger vs tonight', dev: (c) => c.sc.rearStagger - c.ideal.rearStagger, phases: [-0.1, -0.08, -0.05, -0.05] },
  { id: 'lrWeight', label: 'Left rear weight vs tonight', dev: (c) => (c.sc.leftRearWeight - c.ideal.leftRearWeight) / 25, phases: [0.02, -0.03, 0.07, 0.06], forwardBite: 0.01 },
  { id: 'leftPct', label: 'Left side %', dev: (c) => (c.sc.leftPct - 54.3) / 0.5, phases: [-0.03, -0.04, -0.02, -0.01] },
  { id: 'rearPct', label: 'Rear %', dev: (c) => (c.sc.rearPct - c.baseSc.rearPct) / 0.5, phases: [-0.02, 0.01, 0.04, 0.03], forwardBite: 0.02 },
  { id: 'rake', label: 'Rake (front vs rear height)', dev: (c) => rake(c.sc) - rake(c.baseSc), phases: [0.14, 0.06, 0.1, 0.1], forwardBite: 0.04 },
  { id: 'rideHeight', label: 'Overall ride height', dev: (c) => meanHeight(c.sc) - meanHeight(c.baseSc), phases: [0, 0.06, 0.02, 0], sideBite: 0.04 },
  { id: 'tilt', label: 'Left-right chassis tilt', dev: (c) => tilt(c.sc) - tilt(c.baseSc), phases: [0, 0.05, 0, -0.06] },
  { id: 'rrUpLfDown', label: 'RR up / LF down', dev: (c) => (c.sc.heights.RR - c.baseSc.heights.RR - (c.sc.heights.LF - c.baseSc.heights.LF)) / 2, phases: [0, -0.08, 0, 0] },
  { id: 'wheelLead', label: 'LR wheel lead', dev: (c) => (c.s.wheelLead - c.base.wheelLead) / 0.125, phases: [-0.02, -0.02, -0.02, -0.02] },
  { id: 'rearTrack', label: 'RR wheel out (rear track)', dev: (c) => c.base.offsetRR - c.s.offsetRR, phases: [-0.03, -0.03, 0, 0] },
  { id: 'ballastNose', label: 'Ballast high on nose', dev: (c) => c.s.ballastNoseLeft / 25, phases: [-0.01, -0.03, 0, 0], frontGrip: 0.01 },
  { id: 'ballastHigh', label: 'Ballast high in rear', dev: (c) => c.s.ballastHighRear / 25, phases: [0, 0.02, 0, 0], sideBite: 0.01 },
  { id: 'ballastRear', label: 'Ballast over rear end', dev: (c) => (c.s.ballastOverRearEnd - c.base.ballastOverRearEnd) / 25, phases: [0, 0.01, 0, 0] },

  // ---- Front end
  { id: 'caster', label: 'Caster', dev: (c) => avg(c.s.casterLF, c.s.casterRF) - avg(c.base.casterLF, c.base.casterRF), phases: [-0.03, 0, 0, 0.03] },
  { id: 'casterSplit', label: 'Caster split', dev: (c) => c.s.casterRF - c.s.casterLF - 4, phases: [-0.03, 0, 0, 0] },
  { id: 'rfCamber', label: 'RF camber', dev: (c) => -(c.s.camberRF - c.base.camberRF), phases: [-0.03, -0.01, 0, 0] },
  { id: 'toe', label: 'Toe out', dev: (c) => (c.s.toeOut - c.base.toeOut) / 0.0625, phases: [0.02, 0, 0, 0] },
  {
    id: 'frontPanhard',
    label: 'Front panhard height',
    // slider hole 1 = bottom; axle drop bracket hole 1 = top
    dev: (c) => c.s.frontPanhardSliderHole - c.base.frontPanhardSliderHole - (c.s.frontPanhardAxleHole - c.base.frontPanhardAxleHole),
    phases: [0.04, 0.02, 0, 0],
  },

  // ---- Springs (nitrogen included)
  { id: 'lfSpring', label: 'LF spring', dev: (c) => (c.eff.LF - c.baseEff.LF) / 25, phases: [-0.03, -0.02, -0.02, -0.01], forwardBite: -0.01 },
  { id: 'rfSpring', label: 'RF spring', dev: (c) => (c.eff.RF - c.baseEff.RF) / 25, phases: [0.05, 0.02, 0.04, 0.04], forwardBite: 0.02 },
  { id: 'lrSpring', label: 'LR spring', dev: (c) => (c.eff.LR - c.baseEff.LR) / 25, phases: [-0.03, -0.03, -0.05, -0.05], forwardBite: -0.03 },
  { id: 'rrSpring', label: 'RR spring', dev: (c) => (c.eff.RR - c.baseEff.RR) / 25, phases: [-0.01, -0.05, -0.02, -0.01], sideBite: -0.02 },
  { id: 'lrTender', label: 'LR tender spring', dev: (c) => Number(c.s.lrTender) - Number(c.base.lrTender), phases: [0, 0, 0.03, 0.03] },

  // ---- Rear end
  { id: 'rrRod', label: 'RR radius rod angle', dev: (c) => (c.s.rrRadiusRodHole - c.base.rrRadiusRodHole) * rodHoleScale(c.s), phases: [-0.08, -0.05, -0.07, -0.05] },
  { id: 'lrRod', label: 'LR radius rod angle', dev: (c) => (c.s.lrRadiusRodHole - c.base.lrRadiusRodHole) * rodHoleScale(c.s), phases: [-0.05, 0, 0.02, 0.05], forwardBite: 0.03 },
  {
    id: 'bothRodsUp',
    label: 'Both rear rods up (erratic on throttle)',
    dev: (c) => Math.max(0, Math.min(c.s.rrRadiusRodHole - c.base.rrRadiusRodHole, c.s.lrRadiusRodHole - c.base.lrRadiusRodHole)),
    phases: [-0.02, 0, -0.02, 0],
    forwardBite: 0.02,
    erratic: 0.04,
  },
  { id: 'lrRodBracket', label: 'LR rod length (bracket)', dev: (c) => ({ stock: 0, short2: 1, short4: 2 })[c.s.lrRodBracket], phases: [-0.04, 0, 0.01, 0.02], forwardBite: 0.02 },
  { id: 'panhardBite', label: 'Rear panhard angle', dev: (c) => panhardBite(c.s) - panhardBite(c.base), phases: [0.04, 0.05, 0.03, 0.02], sideBite: 0.02 },
  { id: 'panhardHeight', label: 'Rear panhard height', dev: (c) => panhardHeight(c.s) - panhardHeight(c.base), phases: [-0.01, -0.03, 0, 0] },
  { id: 'torqueArm', label: 'Torque arm angle', dev: (c) => (c.s.torqueArm === 'minus3' ? 1 : 0) - (c.base.torqueArm === 'minus3' ? 1 : 0), phases: [0, 0, 0.04, 0.02], forwardBite: 0.03 },
  { id: 'torqueArmHole', label: 'Torque arm length', dev: (c) => c.s.torqueArmHole - c.base.torqueArmHole, phases: [0, 0, 0.02, 0.04], forwardBite: 0.04 },
  {
    id: 'pullBar',
    label: 'Spring rod / solid rod',
    dev: (c) => (c.s.pullBar === 'solid' ? -1.5 : (c.s.springRodLength - 4) / 0.25) - (c.base.pullBar === 'solid' ? -1.5 : (c.base.springRodLength - 4) / 0.25),
    phases: [0, 0, 0.03, 0.03],
  },

  // ---- Shocks (chart p. 53, troubleshooting pp. 41-50). Normalised: 20 lb comp, 40 lb rebound.
  { id: 'rfComp', label: 'RF shock compression', dev: (c) => comp(c, 'RF'), phases: [0.04, 0, 0, 0] },
  { id: 'rfReb', label: 'RF shock rebound', dev: (c) => reb(c, 'RF'), phases: [0, -0.02, -0.03, -0.04], forwardBite: -0.015 },
  { id: 'lfReb', label: 'LF shock rebound', dev: (c) => reb(c, 'LF'), phases: [-0.04, -0.02, -0.03, -0.03], forwardBite: -0.015 },
  { id: 'lrReb', label: 'LR shock rebound', dev: (c) => reb(c, 'LR'), phases: [-0.04, 0, 0, 0] },
  { id: 'lrComp', label: 'LR shock compression', dev: (c) => comp(c, 'LR'), phases: [0, 0, 0, -0.04], forwardBite: -0.02 },
  { id: 'rrComp', label: 'RR shock compression', dev: (c) => comp(c, 'RR'), phases: [0, -0.03, 0, 0], sideBite: -0.015 },
  { id: 'rrReb', label: 'RR shock rebound', dev: (c) => reb(c, 'RR'), phases: [0, 0.03, 0.03, 0], sideBite: 0.01 },

  // ---- Brakes, body, tires
  { id: 'brakeBias', label: 'Brake bias', dev: (c) => (c.s.brakeBiasFront - c.base.brakeBiasFront) / 5, phases: [0.04, 0, 0, 0] },
  { id: 'spoiler', label: 'Rear spoiler', dev: (c) => ({ flat: -1, standard: 0, 'gurney-forward': 1 })[c.s.spoiler], phases: [0.03, 0.01, 0, 0], forwardBite: 0.02 },
  { id: 'rearPrep', label: 'Rear tire siping (slick track)', dev: (c) => (prepLevel(c.s.prepRear) - prepLevel(c.base.prepRear)) * c.slick, phases: [0.02, 0.02, 0.02, 0.02], forwardBite: 0.02 },
  { id: 'rearPressure', label: 'Rear tire pressure', dev: (c) => (c.s.pressureLR + c.s.pressureRR - c.base.pressureLR - c.base.pressureRR) / 2, phases: [0, -0.02, -0.02, -0.01], sideBite: -0.015, forwardBite: -0.015 },
  { id: 'trackRubber', label: 'Rubbered-up track', dev: (c) => c.t.rubber, phases: [-0.03, -0.1, -0.06, -0.05] },
];

interface GripTerm {
  label: string;
  front?: number;
  side?: number;
  forward?: number;
}

/** Things that have a sweet spot: being off it costs grip no matter which way you miss */
function gripTerms(c: Ctx): GripTerm[] {
  const out: GripTerm[] = [];
  const sq = (x: number) => x * x;
  const { s } = c;

  out.push({ label: 'RF camber off its sweet spot', front: -0.02 * sq(s.camberRF + 9) });
  const split = s.casterRF - s.casterLF;
  if (split < 3 || split > 5) out.push({ label: 'Caster split outside 3-4 deg', front: -0.02 * (split < 3 ? 3 - split : split - 5) });
  if (s.toeOut > 0.25) out.push({ label: 'Too much toe out (scrub)', front: -0.04 * ((s.toeOut - 0.25) / 0.0625) });
  if (c.eff.RF > 175) out.push({ label: 'RF spring over 175 lb', front: -0.012 * ((c.eff.RF - 175) / 25) * (0.5 + c.slick) });

  // Rear tire pressures: sweet spot moves with the track
  out.push({ label: 'Rear tire pressure vs tonight', side: -0.004 * (sq(s.pressureLR - c.ideal.pressureLR) + sq(s.pressureRR - c.ideal.pressureRR)) });
  const frontP = (s.pressureLF + s.pressureRF) / 2;
  out.push({ label: 'Front tire pressure', front: -0.003 * sq(frontP - 10) });

  // Rear spring package: softer works on slick, too soft rolls over on heavy
  const rearRate = (c.eff.LR + c.eff.RR) / 2;
  const idealRear = 165 + 40 * c.g;
  out.push({ label: 'Rear spring package vs tonight', side: -0.0006 * Math.abs(rearRate - idealRear) * (rearRate < idealRear ? 0.6 : 1), forward: -0.0008 * Math.abs(rearRate - idealRear) });
  if (c.eff.RR < 160 && c.g > 0.5) out.push({ label: 'RR too soft, car lays over on the RR', side: -0.03 });

  // Spring rod length vs track
  if (s.pullBar === 'spring') out.push({ label: 'Spring rod length vs tonight', forward: -0.03 * (Math.abs(s.springRodLength - c.ideal.springRodLength) / 0.25) });
  else out.push({ label: 'Solid rod (no hook up time)', forward: -0.04 * c.slick });

  // Torque arm rubbers and biscuit: softer/shorter helps a slick track hook up
  const b = bushingById(s.torqueArmBushing);
  const soft = (70 - b.durometer) / 10 + (1.375 - b.heightIn) * 4;
  out.push({ label: 'Torque arm rubbers vs tonight', forward: 0.015 * soft * (c.slick - 0.45) });
  if (s.biscuit === 'triple') out.push({ label: 'Triple biscuit', forward: 0.03 });

  // Throttle linkage: a fast pedal spins the tires on slick
  out.push({ label: 'Throttle linkage', forward: -0.03 * (s.throttleHole - 2) * (c.slick - 0.3) });

  // Short rods: more lift and drive on slick, a handful on a heavy track
  if (s.rearConfig === 'short-rod') out.push({ label: 'Short rods', forward: 0.05 * c.slick - 0.02 * c.g, side: 0.01 * c.slick });

  // Shock valving: a slowing track wants softer, slower shocks (p. 52)
  const total = (['LF', 'RF', 'LR', 'RR'] as Corner[]).reduce((sum, k) => sum + comp(c, k) + reb(c, k), 0);
  out.push({ label: 'Shock package vs tonight', side: -0.01 * total * (c.slick - 0.4), forward: -0.01 * total * (c.slick - 0.4) });
  for (const k of ['LR', 'RR'] as Corner[]) if (shock(s, k).digressive) out.push({ label: `${k} digressive shock`, forward: 0.015 * c.slick });

  // Tire prep: siping helps slick, chunks on heavy
  const pr = prepLevel(s.prepRear);
  out.push({ label: 'Rear tire prep', side: pr * (0.015 * c.slick - 0.012 * c.g), forward: pr * (0.015 * c.slick - 0.012 * c.g) });
  const pf = prepLevel(s.prepFront);
  out.push({ label: 'Front tire prep', front: pf * (0.012 * c.slick - 0.01 * c.g) });

  // Compound: harder rear rubber gives up grip on a tacky track, lasts on a slick abrasive one
  const hard = (tireById(s.tireLR).hardness + tireById(s.tireRR).hardness) / 2 - 0.35;
  out.push({ label: 'Rear tire compound', side: -0.06 * hard * c.g, forward: -0.04 * hard * c.g });

  return out.filter((x) => Math.abs((x.front ?? 0) + (x.side ?? 0) + (x.forward ?? 0)) > 1e-6);
}

const FAULTS: Record<Fault, { phases: Coeffs; front?: number; side?: number; forward?: number; erratic?: number; label: string }> = {
  'rf-top-radius-rod-bind': { label: 'Bind in the front end', phases: [0.22, 0.12, 0.05, 0], front: -0.05 },
  'lr-shock-bent-shaft': { label: 'Bent LR shock shaft', phases: [0.02, 0, -0.06, -0.06], forward: -0.06, erratic: 0.08 },
  'torque-arm-slider-dry': { label: 'Torque arm slider binding', phases: [0, 0, -0.04, -0.08], forward: -0.08, erratic: 0.04 },
  'rr-shock-bottoming': { label: 'RR shock bottoming out', phases: [-0.02, -0.12, -0.05, 0], side: -0.06, erratic: 0.06 },
  'rear-end-hitting-seat': { label: 'Rear end hitting the seat plate', phases: [0, -0.04, -0.08, -0.06], forward: -0.04, erratic: 0.1 },
};


export function analyzeHandling(s: Setup, t: TrackState, faults: Fault[] = []): HandlingResult {
  const base = referenceSetup(s.rearConfig, s.panhardSide);
  const g = gripLevel(t);
  const c: Ctx = {
    s,
    base,
    sc: readScales(s),
    baseSc: readScales(base),
    g,
    slick: 1 - g,
    t,
    ideal: idealsFor(t),
    eff: effectiveSprings(s),
    baseEff: effectiveSprings(base),
  };

  const phases = Object.fromEntries(PHASES.map((p) => [p, { balance: 0, contributions: [] as Contribution[] }])) as Record<Phase, PhaseResult>;
  let frontGrip = 1;
  let sideBite = 1;
  let forwardBite = 1;
  let erratic = 0;
  const gripNotes: Contribution[] = [];

  const add = (id: string, label: string, coeffs: Coeffs, scale: number) => {
    PHASES.forEach((p, i) => {
      const v = coeffs[i] * scale;
      if (Math.abs(v) < 1e-6) return;
      phases[p].balance += v;
      phases[p].contributions.push({ id, label, value: v });
    });
  };

  for (const e of EFFECTS) {
    const d = e.dev(c);
    if (Math.abs(d) < 1e-9) continue;
    if (e.phases) add(e.id, e.label, e.phases, d);
    if (e.frontGrip) frontGrip += e.frontGrip * d;
    if (e.sideBite) sideBite += e.sideBite * d;
    if (e.forwardBite) forwardBite += e.forwardBite * d;
    if (e.erratic) erratic += e.erratic * d;
  }

  for (const term of gripTerms(c)) {
    frontGrip += term.front ?? 0;
    sideBite += term.side ?? 0;
    forwardBite += term.forward ?? 0;
    gripNotes.push({ id: term.label, label: term.label, value: (term.front ?? 0) + (term.side ?? 0) + (term.forward ?? 0) });
  }

  for (const f of faults) {
    const def = FAULTS[f];
    add(f, def.label, def.phases, 1);
    frontGrip += def.front ?? 0;
    sideBite += def.side ?? 0;
    forwardBite += def.forward ?? 0;
    erratic += def.erratic ?? 0;
  }

  // A car that is tight on entry gets driven in too hard and sheared loose at the apex (pp. 48, 50).
  const shear = Math.max(0, phases.entry.balance - 0.12) * 0.7;
  if (shear > 0) {
    for (const p of ['apexOn', 'exit'] as Phase[]) {
      phases[p].balance -= shear;
      phases[p].contributions.push({ id: 'shear', label: 'Driver shearing it loose after a tight entry', value: -shear });
    }
    sideBite -= shear * 0.3;
  }

  // Ruts and holes punish a stiff car
  erratic += c.t.roughness * 0.03;

  const drag =
    Math.max(0, c.sc.rearStagger - 6.5) * 0.04 + // too much stagger slows the straights (p. 8)
    ({ flat: -0.03, standard: 0, 'gurney-forward': 0.04 })[s.spoiler] +
    Math.max(0, s.toeOut - 0.1875) * 0.6;

  const clampGrip = (x: number) => Math.max(0.7, Math.min(1.3, x));
  for (const p of PHASES) phases[p].contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return {
    phases,
    frontGrip: clampGrip(frontGrip),
    sideBite: clampGrip(sideBite),
    forwardBite: clampGrip(forwardBite),
    erratic,
    drag,
    gripNotes,
    scales: c.sc,
    ideals: c.ideal,
  };
}
