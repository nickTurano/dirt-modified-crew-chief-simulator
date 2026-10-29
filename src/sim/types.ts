// Core data types for the simulator. Everything the crew chief can change lives on Setup as a flat
// field so the adjustment catalog can address it by key.

export type Corner = 'LF' | 'RF' | 'LR' | 'RR';
export const CORNERS: Corner[] = ['LF', 'RF', 'LR', 'RR'];

export type RearConfig = 'long-rod' | 'short-rod';
export type PanhardSide = 'right' | 'left';
export type RadiusRodHole = number; // 1 = bottom hole on the chassis mount
export type TirePrep = 'none' | 'sipe-light' | 'sipe-heavy' | 'sipe-grind';
export type PullBar = 'solid' | 'spring';
export type TorqueArm = 'zero' | 'minus3';
export type Biscuit = 'standard' | 'triple';
export type Spoiler = 'flat' | 'standard' | 'gurney-forward';

export interface Setup {
  name: string;
  rearConfig: RearConfig;
  panhardSide: PanhardSide;

  // Springs: rate in lb/in, picked from the trailer inventory
  springLF: number;
  springRF: number;
  springLR: number;
  springRR: number;
  lrTender: boolean;

  // Coil-over nut turns from the shop baseline. + = wind down (raises corner, adds weight + diagonal)
  nutLF: number;
  nutRF: number;
  nutLR: number;
  nutRR: number;

  // Front end
  casterLF: number; // degrees at ride height
  casterRF: number;
  camberLF: number; // degrees, set by spindle choice
  camberRF: number;
  toeOut: number; // inches at the tires
  frontPanhardTurns: number; // + = longer bar, pushes chassis left of the axle
  frontPanhardSliderHole: number; // chassis side, 1 = bottom
  frontPanhardAxleHole: number; // drop bracket on axle, 1 = top

  // Rear end
  lrRadiusRodHole: RadiusRodHole;
  rrRadiusRodHole: RadiusRodHole;
  lrRodBracket: 'stock' | 'short2' | 'short4'; // long-rod only: LR shortening adaptor
  wheelLead: number; // inches the LR is ahead of the RR (+ = LR ahead)
  rearPanhardTurns: number; // + = longer bar
  rearPanhardInnerHole: number; // on the rear end, 1 = top
  rearPanhardOuterHole: number; // on the chassis plate, 1 = top
  torqueArm: TorqueArm;
  torqueArmHole: 2 | 3; // pickup hole counted back from the transmission
  torqueArmBushing: string; // part id from inventory
  biscuit: Biscuit;
  pullBar: PullBar;
  springRodLength: number; // inches the pull-bar spring is compressed to

  // Ballast in lb at fixed mounting spots
  ballastNoseLeft: number;
  ballastLeftRail: number;
  ballastOverRearEnd: number;
  ballastHighRear: number;

  // Tires and wheels
  tireLF: string; // tire id from the trailer
  tireRF: string;
  tireLR: string;
  tireRR: string;
  pressureLF: number; // psi cold
  pressureRF: number;
  pressureLR: number;
  pressureRR: number;
  prepFront: TirePrep;
  prepRear: TirePrep;
  offsetLF: number; // wheel backspace inches
  offsetRF: number;
  offsetLR: number;
  offsetRR: number;

  // Shocks (no adjusters: swap a shock, change gas)
  shockLF: string;
  shockRF: string;
  shockLR: string;
  shockRR: string;
  gasLF: number; // psi nitrogen
  gasRF: number;
  gasLR: number;
  gasRR: number;

  // Brakes, throttle, body
  brakeBiasFront: number; // % front pressure
  throttleHole: number; // carb-side cross-rod hole, 1 = closest to pivot (slowest pedal)
  spoiler: Spoiler;
}

export type SetupKey = keyof Setup;

export type AdjustmentGroup =
  | 'Front end'
  | 'Rear end'
  | 'Springs and heights'
  | 'Weight'
  | 'Tires and wheels'
  | 'Shocks'
  | 'Driveline, brakes, body';

interface AdjustmentBase {
  key: SetupKey;
  label: string;
  group: AdjustmentGroup;
  /** Minutes of crew time this change costs between sessions */
  minutes: number;
  /** Bicknell manual page(s) this comes from */
  ref?: string;
  /** Short note shown in the garage */
  hint?: string;
  /** Only shown for this rear configuration */
  onlyFor?: RearConfig;
  /** Only shown for this panhard side */
  onlyPanhard?: PanhardSide;
}

/** Continuous adjustment made in steps (turns on a nut, half degrees of caster, 1 psi of air) */
export interface StepAdjustment extends AdjustmentBase {
  kind: 'turns';
  min: number;
  max: number;
  step: number;
  unit: string;
  /** What one step does, e.g. '1/8 in, ~6 lb' */
  perStep?: string;
}

/** Fixed positions: holes in a bracket or a few discrete settings */
export interface HoleAdjustment extends AdjustmentBase {
  kind: 'holes';
  options: { value: number | string; label: string }[];
}

/** Swap a part from the trailer inventory */
export interface PartAdjustment extends AdjustmentBase {
  kind: 'part';
  options: { value: number | string | boolean; label: string }[];
}

export type Adjustment = StepAdjustment | HoleAdjustment | PartAdjustment;

export interface ShockPart {
  id: string;
  label: string;
  position: 'front' | 'rear';
  /** Fox-style low-speed numbers from the BRP baseline packages (lb at ~3 in/s) */
  comp: number;
  reb: number;
  digressive: boolean;
  /** factory nitrogen psi */
  baseGas: number;
}

export interface TirePart {
  id: string;
  label: string;
  position: 'front' | 'rear';
  /** circumference in inches at the reference pressure */
  circumference: number;
  /** relative rubber hardness: higher = harder, lasts, less grip when cool */
  hardness: number;
}

export interface BushingPart {
  id: string;
  label: string;
  heightIn: number;
  durometer: number;
}

export interface TrackDef {
  id: string;
  name: string;
  location: string;
  lengthMiles: number;
  /** relative banking 0..1 (approximate, tune as needed) */
  banking: number;
  /** lap time for a well set-up big block on a heavy/tacky surface vs dry slick (seconds, approximate) */
  lapTimeTacky: number;
  lapTimeSlick: number;
  /** how quickly the surface dries and slicks off, 0..1 */
  dryingRate: number;
  /** how much a cushion builds up top as it dries, 0..1 */
  cushionTendency: number;
  notes: string;
}

export interface RulesDef {
  name: string;
  /** All values are placeholders: verify against the current rulebook */
  verified: boolean;
  minWeightWithDriver: number;
  maxRearOffset: number;
  maxRightRearOffset: number;
  maxSpoilerHeightIn: number;
  tireBrand: string;
  heatLaps: number;
  heatCars: number;
  heatTransfers: number;
  consiLaps: number;
  consiTransfers: number;
  featureLaps: number;
  featureCars: number;
  cockpitAdjustersAllowed: boolean;
}
