import type { Phase } from './types';
import { PHASES, PHASE_LABELS } from './types';
import type { HandlingResult } from './handling';
import { pick, type Rng } from './rng';

// The driver talks about what he feels, in racer language. He reports symptoms, not causes: a
// tight entry that he shears loose at the apex comes back as "loose in the middle".

export interface DriverProfile {
  name: string;
  /** 0..1: how clearly he separates entry, middle and exit */
  feedbackQuality: number;
  /** 0..1 */
  skill: number;
}

export const DRIVERS: DriverProfile[] = [
  { name: 'Veteran (clear feedback)', feedbackQuality: 0.9, skill: 0.85 },
  { name: 'Weekly regular', feedbackQuality: 0.65, skill: 0.7 },
  { name: 'Young gun (vague feedback)', feedbackQuality: 0.35, skill: 0.75 },
];

const LINES: Record<Phase, { tight: string[]; loose: string[] }> = {
  entry: {
    tight: ["It won't turn in. I'm pushing the front end into the corner.", 'Tight getting in, the front just washes up.', "Can't get it to rotate on entry."],
    loose: ['Loose in. The rear wants to come around when I lift.', "It's free getting in, I'm catching it on entry.", 'Rear end steps out as soon as I turn it in.'],
  },
  apexOff: {
    tight: ["Pushes in the middle before I'm back to the gas.", 'Tight in the center, it just plows.', "Middle of the corner it won't finish the turn."],
    loose: ["It's floating in the middle, no side bite.", 'Loose in the center off the gas.', 'Rear slides up the track in the middle.'],
  },
  apexOn: {
    tight: ['When I pick up the throttle it pushes.', "Tight on the gas in the middle, can't get it pointed.", 'It goes straight when I step on it.'],
    loose: ['Snaps loose when I get back to the gas.', 'Loose on throttle in the middle, I have to feather it.', "Gets loose as soon as I touch the gas."],
  },
  exit: {
    tight: ['Pushes up off the corner, I run out of race track.', 'Tight off, it drifts to the wall on exit.', "Won't come off the corner straight, it's tight."],
    loose: ['Loose off, spinning the tires down the straight.', 'Rear is stepping out on exit.', "Can't put the power down off the corner, loose."],
  },
};

const VAGUE = {
  tight: ['It just feels tight.', "It's tight, man.", 'Tight. Free it up.'],
  loose: ["It's loose.", 'Loose. Way loose.', 'Too free, tighten it up.'],
};

const intensity = (b: number) => (Math.abs(b) > 0.22 ? 'Really bad. ' : Math.abs(b) > 0.12 ? '' : 'A little. ');

export interface Feedback {
  lines: string[];
  /** worst phases, for scoring and the debrief (not shown to the trainee unless asked) */
  worst: { phase: Phase; balance: number }[];
}

export function driverFeedback(h: HandlingResult, driver: DriverProfile, rng: Rng, lastLaps: number[] = []): Feedback {
  const ranked = PHASES.map((p) => ({ phase: p, balance: h.phases[p].balance })).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  const worst = ranked.filter((r) => Math.abs(r.balance) > 0.06).slice(0, 2);
  const lines: string[] = [];

  if (worst.length === 0) lines.push(pick(rng, ['Feels pretty good. Balanced.', "I like it. Don't touch it.", 'Good car. Maybe a little more grip.']));

  for (const w of worst) {
    const dir = w.balance > 0 ? 'tight' : 'loose';
    if (rng() > driver.feedbackQuality) {
      lines.push(pick(rng, VAGUE[dir]));
    } else {
      lines.push(intensity(w.balance) + pick(rng, LINES[w.phase][dir]));
    }
  }

  if (h.forwardBite < 0.95) lines.push(pick(rng, ['No forward bite, the tires just spin off the corner.', "I can't hook it up off the turn."]));
  if (h.sideBite < 0.95) lines.push(pick(rng, ['No side bite, the rear just slides across the track.', 'Rear end has no grip sideways.']));
  if (h.frontGrip < 0.95) lines.push(pick(rng, ['The front tires feel dead.', 'No front grip at all.']));
  if (h.erratic > 0.07) lines.push(pick(rng, ["It's doing something different every lap.", "I can't predict it, it's real erratic.", 'Something feels weird in the car.']));

  if (lastLaps.length >= 3) {
    const trend = lastLaps[lastLaps.length - 1] - lastLaps[0];
    if (trend > 0.25) lines.push("It's going away on me as the laps go.");
  }
  return { lines, worst };
}

export const describeBalance = (b: number) =>
  Math.abs(b) < 0.04 ? 'neutral' : `${Math.abs(b) > 0.2 ? 'very ' : Math.abs(b) > 0.1 ? '' : 'slightly '}${b > 0 ? 'tight' : 'loose'}`;

export const phaseLabel = (p: Phase) => PHASE_LABELS[p];
