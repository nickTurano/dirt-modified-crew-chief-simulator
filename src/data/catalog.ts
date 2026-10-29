import type { Adjustment, RearConfig, PanhardSide } from '../sim/types';
import { BUSHINGS, FRONT_SPRINGS_LF, FRONT_SPRINGS_RF, REAR_SPRINGS, SHOCKS, TIRES } from './parts';

// Every adjustment the crew chief can make, how it is made (turns, holes or a part swap), its legal
// range, and the crew time it costs. Ranges marked "assumed" are not in the Bicknell manual.

const holes = (n: number, from: 'top' | 'bottom') =>
  Array.from({ length: n }, (_, i) => ({
    value: i + 1,
    label: `${ordinal(i + 1)} from ${from}`,
  }));

function ordinal(n: number) {
  return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
}

const springOpts = (rates: number[]) => rates.map((r) => ({ value: r, label: `${r} lb/in` }));
const shockOpts = (pos: 'front' | 'rear') =>
  SHOCKS.filter((s) => s.position === pos).map((s) => ({ value: s.id, label: s.label }));
const tireOpts = (pos: 'front' | 'rear') =>
  TIRES.filter((t) => t.position === pos).map((t) => ({ value: t.id, label: t.label }));
const prepOpts = [
  { value: 'none', label: 'None' },
  { value: 'sipe-light', label: 'Siped 1/8 in' },
  { value: 'sipe-heavy', label: 'Siped deep' },
  { value: 'sipe-grind', label: 'Siped and ground' },
];

const nut = (key: 'nutLF' | 'nutRF' | 'nutLR' | 'nutRR', corner: string): Adjustment => ({
  key,
  label: `${corner} coil nut`,
  group: 'Springs and heights',
  kind: 'turns',
  min: -16,
  max: 16,
  step: 1,
  unit: 'turns',
  perStep: '1/8 in height, about 6 lb (8 TPI)',
  minutes: 3,
  ref: 'p. 12-14',
  hint: 'Weight is diagonal: adding here also adds to the opposite corner.',
});

const pressure = (key: 'pressureLF' | 'pressureRF' | 'pressureLR' | 'pressureRR', corner: string): Adjustment => ({
  key,
  label: `${corner} tire pressure`,
  group: 'Tires and wheels',
  kind: 'turns',
  min: 4,
  max: 18,
  step: 0.5,
  unit: 'psi',
  minutes: 1,
  ref: 'p. 7',
});

const gas = (key: 'gasLF' | 'gasRF' | 'gasLR' | 'gasRR', corner: string, max: number): Adjustment => ({
  key,
  label: `${corner} shock nitrogen`,
  group: 'Shocks',
  kind: 'turns',
  min: 50,
  max,
  step: 5,
  unit: 'psi',
  perStep: '25 psi is about 10 lb of spring',
  minutes: 3,
  ref: 'p. 51',
});

const offset = (key: 'offsetLF' | 'offsetRF' | 'offsetLR' | 'offsetRR', corner: string, opts: number[]): Adjustment => ({
  key,
  label: `${corner} wheel offset`,
  group: 'Tires and wheels',
  kind: 'part',
  options: opts.map((o) => ({ value: o, label: `${o} in backspace` })),
  minutes: 8,
  ref: 'p. 4',
});

export const CATALOG: Adjustment[] = [
  // ---- Front end
  { key: 'casterLF', label: 'LF caster', group: 'Front end', kind: 'turns', min: 4, max: 11, step: 0.5, unit: 'deg', minutes: 10, ref: 'p. 16-17', perStep: 'radius rod turns, top or bottom rods', hint: 'Keep RF 3-4 deg more than LF.' },
  { key: 'casterRF', label: 'RF caster', group: 'Front end', kind: 'turns', min: 7, max: 15, step: 0.5, unit: 'deg', minutes: 10, ref: 'p. 16-17', perStep: 'radius rod turns, top or bottom rods' },
  { key: 'camberLF', label: 'LF camber (spindle)', group: 'Front end', kind: 'part', options: [0.5, 1, 1.5, 1.75, 2, 2.5].map((v) => ({ value: v, label: `+${v} deg` })), minutes: 30, ref: 'p. 4', hint: 'Built into the axle; changing it means a camber spindle.' },
  { key: 'camberRF', label: 'RF camber (spindle)', group: 'Front end', kind: 'part', options: [-6, -7, -8, -9, -10].map((v) => ({ value: v, label: `${v} deg` })), minutes: 30, ref: 'p. 4' },
  { key: 'toeOut', label: 'Toe out', group: 'Front end', kind: 'turns', min: 0, max: 0.375, step: 0.0625, unit: 'in', minutes: 6, ref: 'p. 4, 8' },
  { key: 'frontPanhardTurns', label: 'Front panhard length', group: 'Front end', kind: 'turns', min: -8, max: 8, step: 0.5, unit: 'turns', perStep: 'about 0.11 in per turn (assumed 5/8-18 rod ends)', minutes: 4, ref: 'p. 13, 16', hint: 'Shorter pulls the axle left: more left side %.' },
  { key: 'frontPanhardSliderHole', label: 'Front panhard, chassis slider', group: 'Front end', kind: 'holes', options: holes(4, 'bottom'), minutes: 8, ref: 'p. 16', hint: 'Hole count assumed.' },
  { key: 'frontPanhardAxleHole', label: 'Front panhard, axle drop bracket', group: 'Front end', kind: 'holes', options: holes(3, 'top'), minutes: 8, ref: 'p. 16' },

  // ---- Rear end
  { key: 'rearConfig', label: 'Rear rod package', group: 'Rear end', kind: 'part', options: [{ value: 'long-rod', label: 'Long rod (27-28 in)' }, { value: 'short-rod', label: 'Short rod / short link (17.5-18.5 in)' }], minutes: 60, ref: 'p. 26-29' },
  { key: 'panhardSide', label: 'Rear panhard side', group: 'Rear end', kind: 'part', options: [{ value: 'right', label: 'Right side, 15 in' }, { value: 'left', label: 'Left side, 12 in' }], minutes: 45, ref: 'p. 30' },
  { key: 'lrRadiusRodHole', label: 'LR radius rod, chassis hole', group: 'Rear end', kind: 'holes', options: [{ value: 1, label: 'Bottom' }, { value: 2, label: 'Middle' }, { value: 3, label: 'Top' }], minutes: 8, ref: 'p. 40', onlyFor: 'long-rod' },
  { key: 'rrRadiusRodHole', label: 'RR radius rod, chassis hole', group: 'Rear end', kind: 'holes', options: [{ value: 1, label: 'Bottom' }, { value: 2, label: 'Middle' }, { value: 3, label: 'Top' }], minutes: 8, ref: 'p. 40', onlyFor: 'long-rod' },
  { key: 'lrRadiusRodHole', label: 'LR short rod, chassis hole', group: 'Rear end', kind: 'holes', options: holes(5, 'bottom'), minutes: 8, ref: 'p. 28', onlyFor: 'short-rod', hint: 'Hole count assumed.' },
  { key: 'rrRadiusRodHole', label: 'RR short rod, chassis hole', group: 'Rear end', kind: 'holes', options: holes(5, 'bottom'), minutes: 8, ref: 'p. 28', onlyFor: 'short-rod', hint: 'Hole count assumed.' },
  { key: 'lrRodBracket', label: 'LR rod shortening bracket', group: 'Rear end', kind: 'part', options: [{ value: 'stock', label: 'Stock (27 1/2 in rod)' }, { value: 'short2', label: '2 in shorter (25 1/2 in)' }, { value: 'short4', label: '4 in shorter (23 1/2 in)' }], minutes: 25, ref: 'p. 26', onlyFor: 'long-rod', hint: 'Shorter LR rod = more roll steer.' },
  { key: 'wheelLead', label: 'LR wheel lead', group: 'Rear end', kind: 'turns', min: -0.375, max: 0.75, step: 0.125, unit: 'in', minutes: 8, ref: 'p. 8, 26', perStep: 'radius rod turns', hint: 'LR ahead = tighter.' },
  { key: 'rearPanhardTurns', label: 'Rear panhard length', group: 'Rear end', kind: 'turns', min: -8, max: 8, step: 0.5, unit: 'turns', perStep: 'about 0.11 in per turn (assumed)', minutes: 4, ref: 'p. 13, 18' },
  { key: 'rearPanhardInnerHole', label: 'Right side panhard, rear end (inboard)', group: 'Rear end', kind: 'holes', options: holes(4, 'top'), minutes: 8, ref: 'p. 10, 18', onlyPanhard: 'right' },
  { key: 'rearPanhardOuterHole', label: 'Right side panhard, chassis plate (outboard)', group: 'Rear end', kind: 'holes', options: holes(9, 'top'), minutes: 8, ref: 'p. 10, 18', onlyPanhard: 'right', hint: 'Lower outboard = more side bite. Plate hole count assumed.' },
  { key: 'rearPanhardInnerHole', label: 'Left side panhard, rear end (inboard)', group: 'Rear end', kind: 'holes', options: holes(4, 'top'), minutes: 8, ref: 'p. 30', onlyPanhard: 'left', hint: 'Lower on the rear end = more side bite.' },
  { key: 'rearPanhardOuterHole', label: 'Left side panhard, chassis plate (outboard)', group: 'Rear end', kind: 'holes', options: holes(4, 'top'), minutes: 8, ref: 'p. 30', onlyPanhard: 'left', hint: 'Raise the chassis side = more side bite (opposite of right side).' },

  // ---- Springs and heights
  { key: 'springLF', label: 'LF spring', group: 'Springs and heights', kind: 'part', options: springOpts(FRONT_SPRINGS_LF), minutes: 15, ref: 'p. 7' },
  { key: 'springRF', label: 'RF spring', group: 'Springs and heights', kind: 'part', options: springOpts(FRONT_SPRINGS_RF), minutes: 15, ref: 'p. 7', hint: 'Big block start 175. Max 175 when chasing loose exit.' },
  { key: 'springLR', label: 'LR spring', group: 'Springs and heights', kind: 'part', options: springOpts(REAR_SPRINGS), minutes: 15, ref: 'p. 7, 27' },
  { key: 'lrTender', label: 'LR tender spring', group: 'Springs and heights', kind: 'part', options: [{ value: false, label: 'None' }, { value: true, label: '5 in x 75 lb flatwire' }], minutes: 10, ref: 'p. 27' },
  { key: 'springRR', label: 'RR spring', group: 'Springs and heights', kind: 'part', options: springOpts(REAR_SPRINGS), minutes: 15, ref: 'p. 7, 27' },
  nut('nutLF', 'LF'),
  nut('nutRF', 'RF'),
  nut('nutLR', 'LR'),
  nut('nutRR', 'RR'),

  // ---- Weight
  { key: 'ballastNoseLeft', label: 'Ballast high on nose, left', group: 'Weight', kind: 'turns', min: 0, max: 75, step: 25, unit: 'lb', minutes: 8, ref: 'p. 43' },
  { key: 'ballastLeftRail', label: 'Ballast on left frame rail', group: 'Weight', kind: 'turns', min: 0, max: 100, step: 25, unit: 'lb', minutes: 8, ref: 'p. 3' },
  { key: 'ballastOverRearEnd', label: 'Ballast over rear end', group: 'Weight', kind: 'turns', min: 0, max: 100, step: 25, unit: 'lb', minutes: 8, ref: 'p. 44, 50' },
  { key: 'ballastHighRear', label: 'Ballast high in rear', group: 'Weight', kind: 'turns', min: 0, max: 75, step: 25, unit: 'lb', minutes: 8, ref: 'p. 50', hint: 'Higher ballast = more roll and side bite.' },

  // ---- Tires and wheels
  { key: 'tireLF', label: 'LF tire', group: 'Tires and wheels', kind: 'part', options: tireOpts('front'), minutes: 6, ref: 'p. 8' },
  { key: 'tireRF', label: 'RF tire', group: 'Tires and wheels', kind: 'part', options: tireOpts('front'), minutes: 6, ref: 'p. 8' },
  { key: 'tireLR', label: 'LR tire', group: 'Tires and wheels', kind: 'part', options: tireOpts('rear'), minutes: 6, ref: 'p. 8', hint: 'Rear stagger: 7-8 heavy, 6-7 medium, 5-6 slick.' },
  { key: 'tireRR', label: 'RR tire', group: 'Tires and wheels', kind: 'part', options: tireOpts('rear'), minutes: 6, ref: 'p. 8' },
  pressure('pressureLF', 'LF'),
  pressure('pressureRF', 'RF'),
  pressure('pressureLR', 'LR'),
  pressure('pressureRR', 'RR'),
  { key: 'prepFront', label: 'Front tire prep', group: 'Tires and wheels', kind: 'part', options: prepOpts, minutes: 20, ref: 'p. 42' },
  { key: 'prepRear', label: 'Rear tire prep', group: 'Tires and wheels', kind: 'part', options: prepOpts, minutes: 20, ref: 'p. 42', hint: 'Start sipes at 1/8 in, deeper until blocks chunk.' },
  offset('offsetLF', 'LF', [3, 4, 5]),
  offset('offsetRF', 'RF', [4, 5, 6]),
  offset('offsetLR', 'LR', [2, 3, 4]),
  offset('offsetRR', 'RR', [2, 3, 4, 5]),

  // ---- Shocks
  { key: 'shockLF', label: 'LF shock', group: 'Shocks', kind: 'part', options: shockOpts('front'), minutes: 10, ref: 'p. 54' },
  { key: 'shockRF', label: 'RF shock', group: 'Shocks', kind: 'part', options: shockOpts('front'), minutes: 10, ref: 'p. 54' },
  { key: 'shockLR', label: 'LR shock', group: 'Shocks', kind: 'part', options: shockOpts('rear'), minutes: 10, ref: 'p. 54' },
  { key: 'shockRR', label: 'RR shock', group: 'Shocks', kind: 'part', options: shockOpts('rear'), minutes: 10, ref: 'p. 54' },
  gas('gasLF', 'LF', 175),
  gas('gasRF', 'RF', 175),
  gas('gasLR', 'LR', 250),
  gas('gasRR', 'RR', 225),

  // ---- Driveline, brakes, body
  { key: 'torqueArm', label: 'Torque arm', group: 'Driveline, brakes, body', kind: 'part', options: [{ value: 'zero', label: '0 deg (BRP 426)' }, { value: 'minus3', label: '-3 deg (BRP 9743)' }], minutes: 25, ref: 'p. 9, 46' },
  { key: 'torqueArmHole', label: 'Torque arm pickup hole', group: 'Driveline, brakes, body', kind: 'holes', options: [{ value: 2, label: '2nd from transmission' }, { value: 3, label: '3rd from transmission (29 1/2 in)' }], minutes: 10, ref: 'p. 48-49', hint: '3rd hole = shorter arm, more forward bite.' },
  { key: 'torqueArmBushing', label: 'Torque arm rubbers', group: 'Driveline, brakes, body', kind: 'part', options: BUSHINGS.map((b) => ({ value: b.id, label: b.label })), minutes: 10, ref: 'p. 23, 25' },
  { key: 'biscuit', label: 'Biscuit', group: 'Driveline, brakes, body', kind: 'part', options: [{ value: 'standard', label: 'Standard' }, { value: 'triple', label: 'Triple biscuit (BRP 9425)' }], minutes: 15, ref: 'p. 23' },
  { key: 'pullBar', label: 'Spring rod / solid rod', group: 'Driveline, brakes, body', kind: 'part', options: [{ value: 'spring', label: 'Spring rod' }, { value: 'solid', label: 'Solid rod' }], minutes: 10, ref: 'p. 8, 45-48' },
  { key: 'springRodLength', label: 'Spring rod spring length', group: 'Driveline, brakes, body', kind: 'turns', min: 3.5, max: 4.5, step: 0.125, unit: 'in', minutes: 4, ref: 'p. 8', hint: '3 3/4 tacky, 4 normal, 4 1/4 slick.' },
  { key: 'brakeBiasFront', label: 'Brake bias (front %)', group: 'Driveline, brakes, body', kind: 'turns', min: 30, max: 65, step: 1, unit: '% front', minutes: 2, ref: 'p. 32-36', perStep: 'balance bar turns' },
  { key: 'throttleHole', label: 'Throttle cross rod, carb side', group: 'Driveline, brakes, body', kind: 'holes', options: [{ value: 1, label: 'Closest to pivot (slow pedal)' }, { value: 2, label: 'Middle' }, { value: 3, label: 'Farthest (fast pedal)' }], minutes: 6, ref: 'p. 36', hint: 'Slow pedal for slick tracks.' },
  { key: 'spoiler', label: 'Rear spoiler', group: 'Driveline, brakes, body', kind: 'part', options: [{ value: 'flat', label: 'Small / gurney back' }, { value: 'standard', label: 'Standard' }, { value: 'gurney-forward', label: 'Max / gurney forward' }], minutes: 5, ref: 'p. 41-42, 49' },
];

/** Catalog entries that apply to a car with this rear package and panhard side */
export function catalogFor(rearConfig: RearConfig, panhardSide: PanhardSide): Adjustment[] {
  return CATALOG.filter(
    (a) => (!a.onlyFor || a.onlyFor === rearConfig) && (!a.onlyPanhard || a.onlyPanhard === panhardSide),
  );
}
