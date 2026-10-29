import type { Phase, Setup } from '../sim/types';
import type { PRESET_TRACKS } from '../sim/track';

// Drills: a situation, what the driver says, and graded answers with the manual page behind each.
// Options that carry a `change` are checked against the handling model in drills.test.ts, so the
// answer key and the simulator can never disagree.

export type Grade = 'best' | 'acceptable' | 'no-effect' | 'wrong';

export interface DrillOption {
  id: string;
  text: string;
  grade: Grade;
  why: string;
  /** the setup change this option makes, if it is a setup change */
  change?: Partial<Setup>;
}

export interface Drill {
  id: string;
  title: string;
  category: 'Handling' | 'Diagnosis' | 'Scaling' | 'Track changes' | 'Race night';
  base: 'long' | 'short';
  start?: Partial<Setup>;
  track: keyof typeof PRESET_TRACKS;
  situation: string;
  driver?: string;
  laps?: number[];
  question: string;
  options: DrillOption[];
  /** what a good answer should do in the model */
  target?: { measure: Phase | 'forwardBite' | 'sideBite'; dir: 'looser' | 'tighter' | 'up' };
  refs: string[];
}

export const DRILLS: Drill[] = [
  {
    id: 'tight-entry-heat',
    title: "Won't turn in",
    category: 'Handling',
    base: 'long',
    start: { tireLR: 'lr-86-soft' },
    track: 'tacky',
    situation: 'Heat race window, 20 minutes. Track is tacky. You run 6.3 in of rear stagger.',
    driver: "It won't turn in. I'm pushing the front end into the corner. Once I'm on the gas it's fine.",
    laps: [18.21, 18.18, 18.24],
    question: 'Pick the best first change.',
    target: { measure: 'entry', dir: 'looser' },
    options: [
      { id: 'a', text: 'Raise the RR radius rod one hole', grade: 'acceptable', why: 'More roll steer frees up the entry (p. 40-41), but it also loosens the car on throttle and leaves the real cause in place.', change: { rrRadiusRodHole: 3 } },
      { id: 'b', text: 'Go up 1 in of rear stagger', grade: 'best', why: 'Root cause: 6.3 in is slick-track stagger, and a tacky track wants about 7 (p. 8). More stagger frees the entry (p. 41).', change: { tireLR: 'lr-85-soft' } },
      { id: 'c', text: 'Add 25 lb of left rear weight', grade: 'wrong', why: 'More left rear weight is a loose-entry fix; it tightens entry (p. 41-42).', change: { nutLR: 1, nutRF: 1, nutLF: -1, nutRR: -1 } },
      { id: 'd', text: 'Stiffer RF spring (200)', grade: 'wrong', why: 'Stiffening the RF is a loose-entry fix. It makes a tight entry worse (p. 42).', change: { springRF: 200 } },
    ],
    refs: ['p. 40', 'p. 41'],
  },
  {
    id: 'loose-entry-heavy',
    title: 'Rear steps out on entry',
    category: 'Handling',
    base: 'long',
    start: { tireLR: 'lr-84-soft' },
    track: 'heavy',
    situation: 'Hot laps on a heavy track. You unloaded with 8.3 in of rear stagger.',
    driver: 'Loose in. The rear wants to come around as soon as I lift.',
    question: 'Pick the best first change.',
    target: { measure: 'entry', dir: 'tighter' },
    options: [
      { id: 'a', text: 'Take out about 1 in of rear stagger', grade: 'best', why: 'Too much stagger makes entry loose. 7-8 in is the heavy-track range (p. 8, 42).', change: { tireLR: 'lr-85-soft' } },
      { id: 'b', text: 'Add toe out, up to 1/4 in', grade: 'acceptable', why: 'More toe out helps a loose entry (p. 42), but it is a smaller fix than the real cause.', change: { toeOut: 0.25 } },
      { id: 'c', text: 'Raise the RR radius rod', grade: 'wrong', why: 'Raising the RR rod adds roll steer and makes entry looser (p. 40).', change: { rrRadiusRodHole: 3 } },
      { id: 'd', text: 'More rear brake bias', grade: 'wrong', why: 'More rear brake is a tight-entry fix; it makes a loose entry worse (p. 41-42).', change: { brakeBiasFront: 40 } },
    ],
    refs: ['p. 8', 'p. 42'],
  },
  {
    id: 'shear-loose',
    title: 'Loose in the middle, but is it?',
    category: 'Diagnosis',
    base: 'long',
    start: { springLF: 200, brakeBiasFront: 52, tireLR: 'lr-86-soft' },
    track: 'medium',
    situation: 'Feature window, 45 minutes. Track is medium and drying.',
    driver: "It won't turn in, then it snaps loose in the middle when I get back to the gas.",
    laps: [18.92, 18.97, 19.05],
    question: 'Pick the single best first change.',
    target: { measure: 'entry', dir: 'looser' },
    options: [
      { id: 'a', text: 'Lower the front panhard on the outboard side (axle bracket down a hole)', grade: 'best', why: 'Fix the entry first. A tight entry makes him shear the car loose at the apex (p. 41, 48, 50).', change: { frontPanhardAxleHole: 3 } },
      { id: 'b', text: 'Add 40 lb of left rear weight for the loose on throttle', grade: 'wrong', why: 'That treats the symptom. More left rear weight also tightens the entry, which is the real problem (p. 41-42, 50).', change: { nutLR: 2, nutRF: 2, nutLF: -2, nutRR: -2 } },
      { id: 'c', text: 'Raise the RR radius rod one hole', grade: 'acceptable', why: 'Frees up entry with roll steer, but also loosens the car on throttle (p. 40).', change: { rrRadiusRodHole: 3 } },
      { id: 'd', text: 'Take 1 in of stagger out', grade: 'wrong', why: 'Less stagger tightens entry, the opposite of what it needs (p. 5).', change: { tireLR: 'lr-87-hard' } },
    ],
    refs: ['p. 41', 'p. 48', 'p. 50'],
  },
  {
    id: 'bind-hunt',
    title: 'Tight after the wreck',
    category: 'Diagnosis',
    base: 'long',
    track: 'tacky',
    situation: 'Last week the car got into the wall with the RF. This week it is tight on entry. You already freed it up with stagger and a radius rod hole, and nothing changed.',
    driver: "Still tight in. Feels like the right front won't take any weight.",
    question: 'What do you do now?',
    options: [
      { id: 'a', text: 'Check for binds: RF top radius rod free, rod ends straight, shocks not bent', grade: 'best', why: "A bind can make the driver report tight entry and send you chasing adjustments that aren't needed. The RF top radius rod must always be free (p. 17, 39)." },
      { id: 'b', text: 'Keep going: add another inch of stagger', grade: 'wrong', why: 'If normal fixes do nothing, something mechanical is wrong. More stagger only masks it (p. 39).' },
      { id: 'c', text: 'Put a stiffer LF spring in', grade: 'wrong', why: 'Same problem: tuning around a bind (p. 39).' },
      { id: 'd', text: 'Tell the driver to drive in deeper', grade: 'wrong', why: 'A tight car driven harder only gets sheared loose at the apex (p. 48).' },
    ],
    refs: ['p. 17', 'p. 39'],
  },
  {
    id: 'slick-exit',
    title: 'Spinning off the corner, feature track',
    category: 'Track changes',
    base: 'long',
    track: 'drySlick',
    situation: 'The heat was tacky. Now the track is dry slick for the feature. You have the heat setup in it.',
    driver: 'Loose off, spinning the tires down the straight.',
    question: 'Pick the best first change.',
    target: { measure: 'exit', dir: 'tighter' },
    options: [
      { id: 'a', text: 'Add left rear weight (about 2 turns each corner, four-corner method)', grade: 'best', why: 'Dry slick wants 60-110 lb of left rear weight; the heat setup had about 30 (p. 8, 48).', change: { nutLR: 2, nutRF: 2, nutLF: -2, nutRR: -2 } },
      { id: 'b', text: 'Spring rod spring set to 4 1/4 in', grade: 'acceptable', why: 'Slick-track spring rod setting; helps loose on throttle and exit (p. 8, 48).', change: { springRodLength: 4.25 } },
      { id: 'c', text: 'Raise the rear frame heights', grade: 'wrong', why: 'Higher rear = looser exit (p. 4).', change: { nutLR: 3, nutRR: 3 } },
      { id: 'd', text: 'Add rear stagger', grade: 'wrong', why: 'More stagger frees the car up and slick wants less, not more (p. 8, 48).', change: { tireLR: 'lr-84-soft' } },
    ],
    refs: ['p. 8', 'p. 48'],
  },
  {
    id: 'tight-middle-off',
    title: 'Pushes in the middle off the gas',
    category: 'Handling',
    base: 'long',
    start: { rearPanhardOuterHole: 7 },
    track: 'tacky',
    situation: 'Practice. Right side panhard. Entry and exit are fine.',
    driver: 'Tight in the center, it just plows until I get back to the throttle.',
    question: 'Pick the best change.',
    target: { measure: 'apexOff', dir: 'looser' },
    options: [
      { id: 'a', text: 'Raise the right side panhard 1 in at both ends', grade: 'best', why: 'The manual\'s first fix for tight in the apex off throttle (p. 43).', change: { rearPanhardOuterHole: 6, rearPanhardInnerHole: 1 } },
      { id: 'b', text: 'Add 25 lb of ballast high on the nose to the LF', grade: 'acceptable', why: 'Listed fix for tight apex (p. 43). Check the rules on ballast placement.', change: { ballastNoseLeft: 25 } },
      { id: 'c', text: 'Lower the panhard on the outboard side', grade: 'wrong', why: 'Lowering the outboard side adds side bite and tightens the car (p. 42).', change: { rearPanhardOuterHole: 8 } },
      { id: 'd', text: 'Softer RR spring', grade: 'wrong', why: 'Stiffer RR is the fix for a tight apex; softer goes the wrong way (p. 43).', change: { springRR: 175 } },
    ],
    refs: ['p. 43'],
  },
  {
    id: 'loose-on-throttle',
    title: 'Snaps loose on the gas',
    category: 'Handling',
    base: 'long',
    track: 'medium',
    situation: 'Between heats. Entry is good.',
    driver: 'Snaps loose when I get back to the gas in the middle.',
    question: 'Pick the best change.',
    target: { measure: 'apexOn', dir: 'tighter' },
    options: [
      { id: 'a', text: 'Softer LR spring (175)', grade: 'best', why: 'First listed fix for loose in the apex on throttle (p. 46).', change: { springLR: 175 } },
      { id: 'b', text: 'Spring rod at 4 1/4 in', grade: 'acceptable', why: 'Listed fix (p. 46), and it is a quick one.', change: { springRodLength: 4.25 } },
      { id: 'c', text: 'More LR shock nitrogen', grade: 'wrong', why: 'More LR gas acts like a stiffer LR spring: that is the tight-on-throttle fix (p. 45, 51).', change: { gasLR: 175 } },
      { id: 'd', text: 'Switch to a solid rod', grade: 'wrong', why: 'Solid rod frees the car up on throttle (p. 45).', change: { pullBar: 'solid' } },
    ],
    refs: ['p. 45', 'p. 46'],
  },
  {
    id: 'tight-exit',
    title: 'Pushes up off the corner',
    category: 'Handling',
    base: 'long',
    start: { tireLR: 'lr-86-soft', wheelLead: 0 },
    track: 'tacky',
    situation: 'Practice. Entry and middle are OK. Rear end squared, 6.3 in of stagger.',
    driver: 'Tight off, it drifts up to the wall on exit.',
    question: 'Pick the best change.',
    target: { measure: 'exit', dir: 'looser' },
    options: [
      { id: 'a', text: 'More rear stagger', grade: 'best', why: 'First fix for tight on exit; watch that it does not loosen the entry too much (p. 47).', change: { tireLR: 'lr-85-soft' } },
      { id: 'b', text: 'Lead the LR ahead 3/8 in', grade: 'acceptable', why: 'Listed fix for tight on exit (p. 47).', change: { wheelLead: 0.375 } },
      { id: 'c', text: 'Spring rod spring set to 4 1/4 in', grade: 'wrong', why: 'That is a loose-exit fix (p. 48).', change: { springRodLength: 4.25 } },
      { id: 'd', text: 'Raise the front ride heights', grade: 'wrong', why: 'Raising the front tightens exit; the fix is to drop the front or raise the rear (p. 47).', change: { nutLF: 3, nutRF: 3 } },
    ],
    refs: ['p. 47'],
  },
  {
    id: 'side-bite-slick',
    title: 'No side bite on a slick track',
    category: 'Track changes',
    base: 'long',
    track: 'drySlick',
    situation: 'Feature window. Right side panhard. Track is dry slick.',
    driver: 'No side bite, the rear just slides across the track in the middle.',
    question: 'Pick the best change.',
    target: { measure: 'apexOff', dir: 'tighter' },
    options: [
      { id: 'a', text: 'Lower the right side panhard on the outboard side', grade: 'best', why: 'First fix for side bite and loose in the apex off throttle (p. 44, 50).', change: { rearPanhardOuterHole: 7 } },
      { id: 'b', text: 'Softer LR spring', grade: 'acceptable', why: 'Loose apex off throttle fix (p. 44). Takes 15 minutes.', change: { springLR: 175 } },
      { id: 'c', text: 'Add 40 lb of left rear weight', grade: 'wrong', why: 'On a slick track, take left rear weight OUT to gain side bite (p. 44, 50).', change: { nutLR: 2, nutRF: 2, nutLF: -2, nutRR: -2 } },
      { id: 'd', text: 'Raise the RR radius rod', grade: 'wrong', why: 'More roll steer frees the car up (p. 40, 43).', change: { rrRadiusRodHole: 3 } },
    ],
    refs: ['p. 44', 'p. 50'],
  },
  {
    id: 'ls-panhard-opposite',
    title: 'Left side panhard: which way?',
    category: 'Handling',
    base: 'short',
    start: { rearPanhardInnerHole: 2 },
    track: 'medium',
    situation: 'Short rod car with a left side panhard. You want more side bite in the middle.',
    question: 'Which change adds side bite?',
    target: { measure: 'apexOff', dir: 'tighter' },
    options: [
      { id: 'a', text: 'Raise the chassis (outboard) side one hole', grade: 'best', why: 'The left side panhard works opposite to the right side bar: raise the chassis side to gain side bite (p. 30).', change: { rearPanhardOuterHole: 1 } },
      { id: 'b', text: 'Lower the chassis (outboard) side one hole', grade: 'wrong', why: 'That is the right side panhard habit. On the left side bar it takes side bite away (p. 30).', change: { rearPanhardOuterHole: 3 } },
      { id: 'c', text: 'Raise the rear end (inboard) side', grade: 'wrong', why: 'Raising the bar at the rear end reduces side bite (p. 30).', change: { rearPanhardInnerHole: 1 } },
    ],
    refs: ['p. 30'],
  },
  {
    id: 'forward-bite',
    title: "Can't hook it up",
    category: 'Track changes',
    base: 'long',
    track: 'drySlick',
    situation: 'Dry slick feature track. Entry and middle are decent.',
    driver: "No forward bite, the tires just spin off the corner.",
    question: 'Pick the best change.',
    target: { measure: 'forwardBite', dir: 'up' },
    options: [
      { id: 'a', text: 'Torque arm to the 3rd hole (shorter arm)', grade: 'best', why: 'Listed forward bite fix (p. 49).', change: { torqueArmHole: 3 } },
      { id: 'b', text: 'Softer LR spring', grade: 'acceptable', why: 'Listed forward bite fix; it can tighten entry too (p. 49).', change: { springLR: 175 } },
      { id: 'c', text: 'Move the throttle linkage to the fast hole', grade: 'wrong', why: 'On slick tracks the pedal should be as slow as possible (p. 36).', change: { throttleHole: 3 } },
      { id: 'd', text: 'Swap to a solid rod', grade: 'wrong', why: 'A solid rod gives the tires no time to hook up on a slick track (p. 8, 45).', change: { pullBar: 'solid' } },
    ],
    refs: ['p. 36', 'p. 49'],
  },
  {
    id: 'four-corner',
    title: 'Take out left rear weight, keep the heights',
    category: 'Scaling',
    base: 'long',
    track: 'medium',
    situation: 'On the scales you have more left rear weight than you want. Frame heights are right where you want them.',
    question: 'Which method takes left rear weight out without changing frame heights?',
    options: [
      { id: 'a', text: 'Take turns out of the LR and RF, put the same turns into the LF and RR', grade: 'best', why: 'Spread it over all four corners and work diagonally so heights stay put (p. 13-14).' },
      { id: 'b', text: 'Take all the turns out of the LR nut', grade: 'wrong', why: 'It works for weight, but drops the LR frame height (p. 13).' },
      { id: 'c', text: 'Take turns out of both rear nuts', grade: 'wrong', why: 'That lowers the rear and barely changes left rear weight.' },
      { id: 'd', text: 'Put turns into the LR and RF', grade: 'wrong', why: 'That adds left rear weight: weight is always diagonal (p. 13).' },
    ],
    refs: ['p. 13', 'p. 14'],
  },
  {
    id: 'diagonal',
    title: 'Two turns in the LR',
    category: 'Scaling',
    base: 'long',
    track: 'medium',
    situation: 'The car is on the scales. You wind 2 turns into the LR coil nut.',
    question: 'What happens on the scales?',
    options: [
      { id: 'a', text: 'LR and RF go up, LF and RR go down', grade: 'best', why: 'Weight is always diagonal: adding to a corner also adds to the opposite corner (p. 13).' },
      { id: 'b', text: 'Only the LR goes up', grade: 'wrong', why: 'The car rocks on its diagonal; all four pads change.' },
      { id: 'c', text: 'LR and LF go up', grade: 'wrong', why: 'Weight moves diagonally, not side to side (p. 13).' },
      { id: 'd', text: 'Nothing changes on the scales, only the height', grade: 'wrong', why: 'Each turn moves about 6 lb (p. 12).' },
    ],
    refs: ['p. 12', 'p. 13'],
  },
  {
    id: 'stagger-heavy',
    title: 'Stagger for a heavy track',
    category: 'Track changes',
    base: 'long',
    track: 'heavy',
    situation: 'Hot laps on a heavy, wet track.',
    question: 'What rear stagger does BRP suggest?',
    options: [
      { id: 'a', text: '7 to 8 in', grade: 'best', why: 'Heavy track range (p. 8).' },
      { id: 'b', text: '6 to 7 in', grade: 'acceptable', why: 'Medium track range; can work early but it is on the tight side (p. 8).' },
      { id: 'c', text: '5 to 6 in', grade: 'wrong', why: 'Slick track range (p. 8).' },
      { id: 'd', text: '9 in or more', grade: 'wrong', why: 'Too much stagger costs straightaway speed and makes it loose off (p. 8).' },
    ],
    refs: ['p. 8'],
  },
  {
    id: 'ten-minutes',
    title: 'Ten minutes to the feature',
    category: 'Race night',
    base: 'long',
    track: 'drySlick',
    situation: 'The consi ran long. You have 10 minutes before the feature. Track has gone dry slick and the car was loose off in the consi.',
    driver: 'Loose off. I had to feather it every corner.',
    question: 'What fits in the window and helps the most?',
    target: { measure: 'exit', dir: 'tighter' },
    options: [
      { id: 'a', text: 'Add left rear weight with nut turns (about 6 minutes)', grade: 'best', why: 'Quick and the right direction for slick: 60-110 lb LR weight (p. 8, 48).', change: { nutLR: 2, nutRF: 2, nutLF: -2, nutRR: -2 } },
      { id: 'b', text: 'Spring rod to 4 1/4 in (about 4 minutes)', grade: 'acceptable', why: 'Fits the window and helps loose off (p. 48).', change: { springRodLength: 4.25 } },
      { id: 'c', text: 'Swap to a softer LR spring (15 minutes)', grade: 'wrong', why: "Right idea, but it doesn't fit: you miss the start." },
      { id: 'd', text: 'Change to a -3 deg torque arm (25 minutes)', grade: 'wrong', why: "Way too long for the window, and it is already a -3 arm." },
    ],
    refs: ['p. 8', 'p. 48'],
  },
  {
    id: 'shock-slick',
    title: 'Shocks for a dry slick track',
    category: 'Track changes',
    base: 'long',
    track: 'drySlick',
    situation: 'Your shocks have no adjusters. The track is going dry slick for the feature.',
    question: 'Which direction do you go with the shock package?',
    options: [
      { id: 'a', text: 'Less rebound on the left side, less compression on the right side', grade: 'best', why: 'Promotes chassis movement to keep grip through entry and exit transitions on dry slick (p. 53).' },
      { id: 'b', text: 'Stiffer all around to control the car', grade: 'wrong', why: 'As the track slows the car moves slower; it wants softer, slower shocks (p. 52).' },
      { id: 'c', text: 'More nitrogen in every shock', grade: 'wrong', why: 'More gas acts like more spring (25 psi is about 10 lb), the wrong way for slick (p. 51).' },
      { id: 'd', text: 'Shocks do not matter on a slick track', grade: 'wrong', why: 'They control how fast weight moves on entry and exit (p. 51).' },
    ],
    refs: ['p. 51', 'p. 52', 'p. 53'],
  },
  {
    id: 'caster-split',
    title: 'Push on entry, odd caster',
    category: 'Diagnosis',
    base: 'long',
    start: { casterRF: 10, casterLF: 7.5 },
    track: 'tacky',
    situation: 'The car pushes on entry. On the alignment check you find LF 7.5 deg, RF 10 deg.',
    driver: 'Tight getting in, the front just washes up.',
    question: 'What do you fix first?',
    target: { measure: 'entry', dir: 'looser' },
    options: [
      { id: 'a', text: 'Bring the RF caster up so the split is 3 1/2 to 4 deg', grade: 'best', why: 'BRP wants the RF 3-4 deg more than the LF; check the split on a tight entry (p. 8, 41).', change: { casterRF: 11.5 } },
      { id: 'b', text: 'Raise the RR radius rod', grade: 'acceptable', why: 'It frees entry, but you are tuning around an alignment problem.', change: { rrRadiusRodHole: 3 } },
      { id: 'c', text: 'Take caster out of the RF to match the LF', grade: 'wrong', why: 'Less split makes the entry tighter (p. 41).', change: { casterRF: 8.5 } },
    ],
    refs: ['p. 8', 'p. 41'],
  },
  {
    id: 'rods-for-slick',
    title: 'Long rods or short rods tonight?',
    category: 'Race night',
    base: 'long',
    track: 'blackSlick',
    situation: 'Hot, sunny night. Everyone expects the feature to go black slick. You have time to change the rear rod package before the feature.',
    question: 'Which way do you go for forward drive?',
    target: { measure: 'forwardBite', dir: 'up' },
    options: [
      { id: 'a', text: 'Short rods', grade: 'best', why: 'Short rods give more roll steer and lift on throttle, which helps a slick track hook up (p. 26, 28, 40).', change: { rearConfig: 'short-rod', lrRadiusRodHole: 4, rrRadiusRodHole: 1, wheelLead: 0 } },
      { id: 'b', text: 'Keep long rods, but the 2 in shorter LR bracket', grade: 'acceptable', why: 'A shorter LR rod adds roll steer and drive without a full package change (p. 26).', change: { lrRodBracket: 'short2' } },
      { id: 'c', text: 'Keep long rods with both rods in the bottom holes', grade: 'wrong', why: 'Bottom holes take away roll steer and drive (p. 40, 42).', change: { lrRadiusRodHole: 1, rrRadiusRodHole: 1 } },
    ],
    refs: ['p. 26', 'p. 28', 'p. 40'],
  },
  {
    id: 'brake-loose',
    title: 'Only loose on the brakes',
    category: 'Diagnosis',
    base: 'long',
    start: { brakeBiasFront: 38 },
    track: 'tacky',
    situation: 'Entry is loose, but only when the driver is hard on the brakes. In-car video shows the rear stepping out under braking.',
    driver: "It's fine if I roll in, but when I use the brakes it wants to swap ends.",
    question: 'Pick the best change.',
    target: { measure: 'entry', dir: 'tighter' },
    options: [
      { id: 'a', text: 'More front brake bias', grade: 'best', why: 'A brake-loose entry wants more front brake or stickier pads (p. 42).', change: { brakeBiasFront: 46 } },
      { id: 'b', text: 'Take out rear stagger', grade: 'acceptable', why: 'Tightens entry in general, but the problem is only on the brakes (p. 42).', change: { tireLR: 'lr-86-soft' } },
      { id: 'c', text: 'Raise the RR radius rod', grade: 'wrong', why: 'Frees up entry even more (p. 40).', change: { rrRadiusRodHole: 3 } },
    ],
    refs: ['p. 42'],
  },
  {
    id: 'pressure-buildup',
    title: 'Pressures came in 6 psi high',
    category: 'Diagnosis',
    base: 'long',
    track: 'medium',
    situation: 'After the heat the rear tires came in 6 psi above where you set them cold. The car went loose off late in the race.',
    question: 'What does that tell you?',
    options: [
      { id: 'a', text: 'Check the gauge and use an air drier: normal buildup is 4 psi or less', grade: 'best', why: 'Too much buildup points at moisture in the air or a bad gauge (p. 48).' },
      { id: 'b', text: 'Normal, ignore it', grade: 'wrong', why: 'More than 4 psi is not normal (p. 48).' },
      { id: 'c', text: 'Start 6 psi higher next time', grade: 'wrong', why: 'That makes it worse.' },
    ],
    refs: ['p. 48'],
  },
];
