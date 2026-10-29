import type { Setup } from '../sim/types';

// Shop baselines from the Bicknell setup book (pp. 7-10, 26-29, 54) for a coil-over big block
// on American Racer tires. Nut turns are measured from these settings.

export const LONG_ROD_BASELINE: Setup = {
  name: 'BRP baseline, long rod',
  rearConfig: 'long-rod',
  panhardSide: 'right',

  springLF: 225,
  springRF: 175,
  springLR: 200,
  springRR: 200,
  lrTender: false,

  nutLF: 0,
  nutRF: 0,
  nutLR: 0,
  nutRR: 0,

  casterLF: 7.5,
  casterRF: 11.5,
  camberLF: 1.75,
  camberRF: -8,
  toeOut: 0.156,
  frontPanhardTurns: 0,
  frontPanhardSliderHole: 2,
  frontPanhardAxleHole: 2,

  lrRadiusRodHole: 2, // middle of 3
  rrRadiusRodHole: 2,
  lrRodBracket: 'stock',
  wheelLead: 0.25, // RR squared at 9 in, LR at 8 3/4 in (p. 26)
  rearPanhardTurns: 0,
  rearPanhardInnerHole: 2, // 2nd from top on the rear end
  rearPanhardOuterHole: 6, // 6th from top on the non-adjustable plate
  torqueArm: 'minus3',
  torqueArmHole: 2,
  torqueArmBushing: '427-5',
  biscuit: 'triple',
  pullBar: 'spring',
  springRodLength: 4,

  ballastNoseLeft: 0,
  ballastLeftRail: 25,
  ballastOverRearEnd: 25,
  ballastHighRear: 0,

  tireLF: 'lf-79.5',
  tireRF: 'rf-80.5',
  tireLR: 'lr-85-soft',
  tireRR: 'rr-92-soft',
  pressureLF: 10,
  pressureRF: 10,
  pressureLR: 8,
  pressureRR: 12,
  prepFront: 'none',
  prepRear: 'sipe-light',
  offsetLF: 4,
  offsetRF: 5,
  offsetLR: 3,
  offsetRR: 3,

  shockLF: 'f-60-200',
  shockRF: 'f-75-165',
  shockLR: 'r-115-230',
  shockRR: 'r-120-270',
  gasLF: 100,
  gasRF: 100,
  gasLR: 125,
  gasRR: 150,

  brakeBiasFront: 45,
  throttleHole: 2,
  spoiler: 'standard',
};

export const SHORT_ROD_BASELINE: Setup = {
  ...LONG_ROD_BASELINE,
  name: 'BRP baseline, short rod',
  rearConfig: 'short-rod',
  panhardSide: 'left', // short link cars generally use the left side panhard (p. 28)
  lrTender: true,
  lrRadiusRodHole: 4, // 4th from bottom on the bolt-on mount (p. 28)
  rrRadiusRodHole: 1, // bottom hole
  wheelLead: 0, // squared at 9 in both sides
  rearPanhardInnerHole: 1, // top hole on the rear end
  rearPanhardOuterHole: 2, // 3rd from bottom of the 4 panhard holes = 2nd from top
  shockLF: 'f-60-230',
  shockRF: 'f-75-300',
  shockLR: 'r-150-175',
  shockRR: 'r-125-200',
};

// Slick-track spring package from p. 27 / 29 (BB): LR 14x150 with 5x75 flatwire tender, RR 12x175.
export const SLICK_SPRING_PACKAGE: Partial<Setup> = {
  springLR: 150,
  lrTender: true,
  springRR: 175,
};

export const BASELINES: Setup[] = [LONG_ROD_BASELINE, SHORT_ROD_BASELINE];

// BRP starting holes for each panhard side (pp. 10, 18, 28, 30)
export const PANHARD_START = {
  right: { rearPanhardInnerHole: 2, rearPanhardOuterHole: 6 },
  left: { rearPanhardInnerHole: 1, rearPanhardOuterHole: 2 },
} as const;

/** The BRP baseline for this rod package and panhard side: what the handling model measures against */
export function referenceSetup(rearConfig: Setup['rearConfig'], panhardSide: Setup['panhardSide']): Setup {
  const b = rearConfig === 'short-rod' ? SHORT_ROD_BASELINE : LONG_ROD_BASELINE;
  return b.panhardSide === panhardSide ? b : { ...b, panhardSide, ...PANHARD_START[panhardSide] };
}
