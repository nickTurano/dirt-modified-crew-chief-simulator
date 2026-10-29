import { analyzeHandling } from './handling';
import { PRESET_TRACKS } from './track';
import { LONG_ROD_BASELINE as LONG, SHORT_ROD_BASELINE as SHORT } from '../data/baselines';
import type { Phase, Setup, TrackState } from './types';

// Every fix in the Bicknell troubleshooting tables (pp. 41-52) must move the car the way the manual
// says. A "tight on entry" fix must make entry looser, and so on.

type Dir = 'looser' | 'tighter';
type Rule = { fix: string; ref: string; change: Partial<Setup>; from?: Partial<Setup>; base?: Setup; track?: TrackState };

const medium = PRESET_TRACKS.medium;

/** Four-corner method: + adds left rear weight without changing heights much (p. 13-14) */
const lrWeight = (turns: number): Partial<Setup> => ({ nutLR: turns, nutRF: turns, nutLF: -turns, nutRR: -turns });

function balance(rule: Rule, phase: Phase, which: 'before' | 'after') {
  const start = { ...(rule.base ?? LONG), ...rule.from };
  const s = which === 'before' ? start : { ...start, ...rule.change };
  return analyzeHandling(s, rule.track ?? medium).phases[phase].balance;
}

function checkPhase(title: string, phase: Phase, dir: Dir, rules: Rule[]) {
  describe(title, () => {
    it.each(rules.map((r) => [`${r.fix} (${r.ref})`, r] as const))('%s', (_, rule) => {
      const before = balance(rule, phase, 'before');
      const after = balance(rule, phase, 'after');
      if (dir === 'looser') expect(after).toBeLessThan(before);
      else expect(after).toBeGreaterThan(before);
    });
  });
}

checkPhase('Car tight on entry: fixes free up entry', 'entry', 'looser', [
  { fix: 'more rear stagger', ref: 'p. 41', change: { tireLR: 'lr-84-soft' } },
  { fix: 'less RR wheel offset (wheel out)', ref: 'p. 41', change: { offsetRR: 2 } },
  { fix: 'more right rear weight', ref: 'p. 41', change: lrWeight(-2) },
  { fix: 'more rear brake', ref: 'p. 41', change: { brakeBiasFront: 40 } },
  { fix: 'caster split back to 4 deg', ref: 'p. 41', from: { casterRF: 10.5 }, change: { casterRF: 11.5 } },
  { fix: 'more RF camber', ref: 'p. 41', change: { camberRF: -9 } },
  { fix: 'stiffer LF spring', ref: 'p. 41', change: { springLF: 250 } },
  { fix: 'lead LR ahead 3/8', ref: 'p. 41', change: { wheelLead: 0.625 } },
  { fix: 'more LR shock nitrogen', ref: 'p. 41', change: { gasLR: 175 } },
  { fix: 'more LF shock rebound', ref: 'p. 41', change: { shockLF: 'f-60-230' } },
  { fix: 'less RF shock compression', ref: 'p. 53', change: { shockRF: 'f-60-200' } },
  { fix: 'front panhard lower on outboard side', ref: 'p. 41', change: { frontPanhardAxleHole: 3 } },
  { fix: 'front panhard lower on the chassis', ref: 'p. 7', change: { frontPanhardSliderHole: 1 } },
  { fix: 'right side panhard raise outboard', ref: 'p. 41', change: { rearPanhardOuterHole: 5 } },
  { fix: 'right side panhard lower inboard', ref: 'p. 41', change: { rearPanhardInnerHole: 3 } },
  { fix: 'left side panhard lower outboard', ref: 'p. 41', base: SHORT, change: { rearPanhardOuterHole: 3 } },
  { fix: 'left side panhard raise inboard', ref: 'p. 41', base: SHORT, from: { rearPanhardInnerHole: 2 }, change: { rearPanhardInnerHole: 1 } },
  { fix: 'stiffer LR spring', ref: 'p. 41', change: { springLR: 225 } },
  { fix: 'raise rear frame heights', ref: 'p. 41', change: { nutLR: 4, nutRR: 4 } },
  { fix: 'lower front frame heights', ref: 'p. 41', change: { nutLF: -4, nutRF: -4 } },
  { fix: 'raise RR radius rod', ref: 'p. 41', change: { rrRadiusRodHole: 3 } },
  { fix: 'smaller spoiler', ref: 'p. 41', change: { spoiler: 'flat' } },
]);

checkPhase('Car loose on entry: fixes tighten entry', 'entry', 'tighter', [
  { fix: 'less rear stagger', ref: 'p. 42', change: { tireLR: 'lr-86-soft' } },
  { fix: 'stiffer RF spring', ref: 'p. 42', change: { springRF: 200 } },
  { fix: 'softer LF spring', ref: 'p. 42', change: { springLF: 200 } },
  { fix: 'more front brake', ref: 'p. 42', change: { brakeBiasFront: 50 } },
  { fix: 'more left rear weight', ref: 'p. 42', change: lrWeight(2) },
  { fix: 'softer LR rebound', ref: 'p. 42', change: { shockLR: 'r-150-175' } },
  { fix: 'less LR nitrogen', ref: 'p. 42', change: { gasLR: 100 } },
  { fix: 'right side panhard lower outboard', ref: 'p. 42', change: { rearPanhardOuterHole: 7 } },
  { fix: 'right side panhard raise inboard', ref: 'p. 42', change: { rearPanhardInnerHole: 1 } },
  { fix: 'left side panhard raise outboard', ref: 'p. 42', base: SHORT, change: { rearPanhardOuterHole: 1 } },
  { fix: 'left side panhard lower inboard', ref: 'p. 42', base: SHORT, change: { rearPanhardInnerHole: 2 } },
  { fix: 'softer LR spring', ref: 'p. 42', change: { springLR: 175 } },
  { fix: 'more toe out, up to 1/4', ref: 'p. 42', change: { toeOut: 0.25 } },
  { fix: 'raise front frame height', ref: 'p. 42', change: { nutLF: 4, nutRF: 4 } },
  { fix: 'lower rear frame height', ref: 'p. 42', change: { nutLR: -4, nutRR: -4 } },
  { fix: 'more rear spoiler', ref: 'p. 42', change: { spoiler: 'gurney-forward' } },
  { fix: 'both rear radius rods in bottom holes', ref: 'p. 42', change: { lrRadiusRodHole: 1, rrRadiusRodHole: 1 } },
  { fix: 'sipe the rear tires on a slick track', ref: 'p. 42', track: PRESET_TRACKS.drySlick, change: { prepRear: 'sipe-heavy' } },
]);

checkPhase('Car tight in apex off throttle: fixes free up the apex', 'apexOff', 'looser', [
  { fix: 'right side panhard up 1 in at both ends', ref: 'p. 43', change: { rearPanhardInnerHole: 1, rearPanhardOuterHole: 5 } },
  { fix: 'left side panhard lower outboard', ref: 'p. 43', base: SHORT, change: { rearPanhardOuterHole: 3 } },
  { fix: 'RR radius rod to the top hole', ref: 'p. 43', change: { rrRadiusRodHole: 3 } },
  { fix: '25 lb ballast high on the nose', ref: 'p. 43', change: { ballastNoseLeft: 25 } },
  { fix: 'more RF rebound', ref: 'p. 43', change: { shockRF: 'f-75-300' } },
  { fix: 'stiffer RR compression / less rebound', ref: 'p. 43', change: { shockRR: 'r-150-175' } },
  { fix: 'stiffer RR spring', ref: 'p. 43', change: { springRR: 225 } },
  { fix: 'max rear track', ref: 'p. 43', change: { offsetRR: 2 } },
  { fix: 'raise RR 1/2 in, lower LF 1/2 in', ref: 'p. 43', change: { nutRR: 4, nutLF: -4 } },
]);

checkPhase('Car loose in apex off throttle: fixes tighten the apex', 'apexOff', 'tighter', [
  { fix: 'right side panhard lower outboard', ref: 'p. 44', change: { rearPanhardOuterHole: 7 } },
  { fix: 'left side panhard raise outboard', ref: 'p. 44', base: SHORT, change: { rearPanhardOuterHole: 1 } },
  { fix: 'softer LR spring', ref: 'p. 44', change: { springLR: 175 } },
  { fix: 'less left rear weight on a slick track', ref: 'p. 44', track: PRESET_TRACKS.drySlick, change: lrWeight(-2) },
  { fix: 'raise ride heights 1/4 to 1/2', ref: 'p. 44', change: { nutLF: 3, nutRF: 3, nutLR: 3, nutRR: 3 } },
  { fix: 'less LF rebound', ref: 'p. 44', change: { shockLF: 'f-65-190d' } },
  { fix: 'ballast raised over the rear end', ref: 'p. 44', change: { ballastHighRear: 25 } },
]);

checkPhase('Car tight in apex on throttle: fixes free it up', 'apexOn', 'looser', [
  { fix: 'solid rod instead of spring rod', ref: 'p. 45', change: { pullBar: 'solid' } },
  { fix: 'less left rear weight', ref: 'p. 45', change: lrWeight(-2) },
  { fix: 'stiffer LR spring', ref: 'p. 45', change: { springLR: 225 } },
  { fix: 'raise the rear 1/4 to 1/2', ref: 'p. 45', change: { nutLR: 3, nutRR: 3 } },
  { fix: 'more LR nitrogen', ref: 'p. 45', change: { gasLR: 200 } },
  { fix: 'more LF rebound', ref: 'p. 45', change: { shockLF: 'f-60-230' } },
  { fix: 'more RF rebound', ref: 'p. 45', change: { shockRF: 'f-75-300' } },
  { fix: 'less RR rebound', ref: 'p. 45', change: { shockRR: 'r-125-200' } },
]);

checkPhase('Car loose in apex on throttle: fixes tighten it', 'apexOn', 'tighter', [
  { fix: 'softer LR spring', ref: 'p. 46', change: { springLR: 175 } },
  { fix: 'stiffer RF spring', ref: 'p. 46', from: { springRF: 150 }, change: { springRF: 175 } },
  { fix: 'softer LF spring', ref: 'p. 46', change: { springLF: 200 } },
  { fix: 'more RR rebound', ref: 'p. 46', from: { shockRR: 'r-125-200' }, change: { shockRR: 'r-120-270' } },
  { fix: 'less LF rebound', ref: 'p. 46', change: { shockLF: 'f-65-190d' } },
  { fix: 'less LR nitrogen', ref: 'p. 46', change: { gasLR: 100 } },
  { fix: 'more left rear weight', ref: 'p. 46', change: lrWeight(2) },
  { fix: 'spring rod at 4 1/4', ref: 'p. 46', change: { springRodLength: 4.25 } },
  { fix: '-3 deg torque arm', ref: 'p. 46', from: { torqueArm: 'zero' }, change: { torqueArm: 'minus3' } },
]);

checkPhase('Car tight on exit: fixes free up the exit', 'exit', 'looser', [
  { fix: 'more rear stagger', ref: 'p. 47', change: { tireLR: 'lr-84-soft' } },
  { fix: 'less left rear weight', ref: 'p. 47', change: lrWeight(-2) },
  { fix: 'lead LR ahead 3/8', ref: 'p. 47', change: { wheelLead: 0.625 } },
  { fix: 'stiffer LR spring', ref: 'p. 47', change: { springLR: 225 } },
  { fix: 'stiffer front rebound', ref: 'p. 47', change: { shockLF: 'f-60-230', shockRF: 'f-75-300' } },
  { fix: 'raise rear 1/4', ref: 'p. 47', change: { nutLR: 2, nutRR: 2 } },
  { fix: 'drop front 1/4', ref: 'p. 47', change: { nutLF: -2, nutRF: -2 } },
  { fix: 'less rear weight %', ref: 'p. 47', change: { ballastOverRearEnd: 0 } },
  { fix: 'solid rod', ref: 'p. 47', change: { pullBar: 'solid' } },
  { fix: 'RR rod top hole, LR rod bottom hole', ref: 'p. 47', change: { rrRadiusRodHole: 3, lrRadiusRodHole: 1 } },
]);

checkPhase('Car loose on exit: fixes tighten the exit', 'exit', 'tighter', [
  { fix: 'less rear stagger', ref: 'p. 48', change: { tireLR: 'lr-86-soft' } },
  { fix: 'more left rear weight', ref: 'p. 48', change: lrWeight(2) },
  { fix: 'softer front rebound', ref: 'p. 48', change: { shockLF: 'f-65-190d' } },
  { fix: 'softer LR compression', ref: 'p. 48', change: { shockLR: 'r-100-200d' } },
  { fix: 'softer LR spring', ref: 'p. 48', change: { springLR: 175 } },
  { fix: 'stiffer RF spring (max 175)', ref: 'p. 48', from: { springRF: 150 }, change: { springRF: 175 } },
  { fix: 'raise front, lower rear', ref: 'p. 48', change: { nutLF: 2, nutRF: 2, nutLR: -2, nutRR: -2 } },
  { fix: 'square the rear end', ref: 'p. 48', change: { wheelLead: 0 } },
  { fix: 'spring rod at 4 1/4', ref: 'p. 48', change: { springRodLength: 4.25 } },
  { fix: 'shorter torque arm (3rd hole)', ref: 'p. 48', change: { torqueArmHole: 3 } },
  { fix: 'raise LR radius rod', ref: 'p. 48', change: { lrRadiusRodHole: 3 } },
]);

describe('Increasing forward bite (p. 49)', () => {
  const fb = (s: Setup, t = medium) => analyzeHandling(s, t).forwardBite;
  it.each([
    ['softer LR spring', { springLR: 175 }],
    ['shorter torque arm', { torqueArmHole: 3 }],
    ['raise LR radius rod', { lrRadiusRodHole: 3 }],
    ['more rear spoiler', { spoiler: 'gurney-forward' }],
    ['lower rear, raise front', { nutLF: 2, nutRF: 2, nutLR: -2, nutRR: -2 }],
    ['stiffer RF spring', { springRF: 175 }],
    ['softer front rebound', { shockLF: 'f-65-190d' }],
  ] as [string, Partial<Setup>][])('%s', (_, change) => {
    const from = { ...LONG, springRF: 150 };
    expect(fb({ ...from, ...change })).toBeGreaterThan(fb(from));
  });
  it('-3 deg torque arm beats 0 deg', () => {
    expect(fb({ ...LONG, torqueArm: 'minus3' })).toBeGreaterThan(fb({ ...LONG, torqueArm: 'zero' }));
  });
});

describe('Increasing side bite (p. 50)', () => {
  const sb = (s: Setup) => analyzeHandling(s, medium).sideBite;
  it.each([
    ['right side panhard lower outboard', { rearPanhardOuterHole: 7 }],
    ['lower rear tire pressure', { pressureLR: 7.5, pressureRR: 11.5 }],
    ['raise all four corners', { nutLF: 3, nutRF: 3, nutLR: 3, nutRR: 3 }],
    ['ballast higher in the chassis', { ballastHighRear: 25 }],
    ['softer RR compression, stiffer rebound', { shockRR: 'r-120-270' }],
  ] as [string, Partial<Setup>][])('%s', (_, change) => {
    const from = { ...LONG, shockRR: 'r-125-200' };
    expect(sb({ ...from, ...change })).toBeGreaterThan(sb(from));
  });
});

describe('model behaviour', () => {
  it('a tight entry gets sheared loose at the apex (pp. 48, 50)', () => {
    const tight = analyzeHandling({ ...LONG, tireLR: 'lr-87-hard', springLF: 200, brakeBiasFront: 60 }, medium);
    expect(tight.phases.entry.balance).toBeGreaterThan(0.12);
    expect(tight.phases.apexOn.contributions.some((c) => c.id === 'shear')).toBe(true);
  });

  it('a front end bind makes the car tight on entry (p. 39)', () => {
    const ok = analyzeHandling(LONG, medium).phases.entry.balance;
    const bound = analyzeHandling(LONG, medium, ['rf-top-radius-rod-bind']).phases.entry.balance;
    expect(bound - ok).toBeGreaterThan(0.15);
  });

  it('the stagger sweet spot follows the track: less stagger wanted on slick (p. 8)', () => {
    const heavy = analyzeHandling(LONG, PRESET_TRACKS.heavy).ideals.rearStagger;
    const slick = analyzeHandling(LONG, PRESET_TRACKS.drySlick).ideals.rearStagger;
    expect(heavy).toBeGreaterThan(7);
    expect(slick).toBeLessThan(6.2);
  });

  it('baseline car is drivable on a medium track', () => {
    const h = analyzeHandling(LONG, medium);
    for (const p of ['entry', 'apexOff', 'apexOn', 'exit'] as Phase[]) expect(Math.abs(h.phases[p].balance)).toBeLessThan(0.2);
  });
});
