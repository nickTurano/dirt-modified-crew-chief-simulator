import type { Adjustment, PanhardSide, RearConfig, Setup, SetupKey } from './types';
import { CATALOG, catalogFor } from '../data/catalog';
import { LONG_ROD_BASELINE, PANHARD_START, SHORT_ROD_BASELINE } from '../data/baselines';

// Helpers for changing a setup legally and costing the work.

export const baselineFor = (rc: RearConfig) => (rc === 'short-rod' ? SHORT_ROD_BASELINE : LONG_ROD_BASELINE);

function legal(adj: Adjustment, v: unknown) {
  if (adj.kind === 'turns') return typeof v === 'number' && v >= adj.min - 1e-9 && v <= adj.max + 1e-9;
  return adj.options.some((o) => o.value === v);
}

/**
 * Apply a change. Switching the rod package or panhard side moves the brackets, so the hole
 * settings that don't exist on the new hardware go back to the BRP starting holes.
 */
export function applyChange<K extends SetupKey>(s: Setup, key: K, value: Setup[K]): Setup {
  let next: Setup = { ...s, [key]: value };
  if (key === 'rearConfig') {
    const b = baselineFor(next.rearConfig);
    // the rods bolt into different brackets, so start from the BRP holes for that package
    next = { ...next, lrRadiusRodHole: b.lrRadiusRodHole, rrRadiusRodHole: b.rrRadiusRodHole, wheelLead: b.wheelLead };
  }
  if (key === 'panhardSide' || (key === 'rearConfig' && s.panhardSide !== next.panhardSide)) {
    next = { ...next, ...PANHARD_START[next.panhardSide], rearPanhardTurns: 0 };
  }
  return normalize(next, baselineFor(next.rearConfig));
}

/** Any value that doesn't exist on the current hardware goes back to the BRP start */
function normalize(s: Setup, b: Setup): Setup {
  const out: Setup = { ...s };
  for (const adj of catalogFor(out.rearConfig, out.panhardSide)) {
    if (!legal(adj, out[adj.key])) (out as unknown as Record<string, unknown>)[adj.key] = b[adj.key];
  }
  return out;
}

export interface Change {
  key: SetupKey;
  label: string;
  from: string;
  to: string;
  minutes: number;
}

export function formatValue(adj: Adjustment | undefined, v: unknown): string {
  if (!adj) return String(v);
  if (adj.kind === 'turns') {
    const n = v as number;
    const sign = adj.unit === 'turns' && n > 0 ? '+' : '';
    return `${sign}${Number.isInteger(n) ? n : n.toFixed(adj.step < 0.1 ? 3 : 2)} ${adj.unit}`;
  }
  return adj.options.find((o) => o.value === v)?.label ?? String(v);
}

export function findAdjustment(s: Setup, key: SetupKey): Adjustment | undefined {
  return catalogFor(s.rearConfig, s.panhardSide).find((a) => a.key === key) ?? CATALOG.find((a) => a.key === key);
}

/** Every difference between two setups, with crew minutes to make it */
export function diffSetups(from: Setup, to: Setup): Change[] {
  const out: Change[] = [];
  const seen = new Set<SetupKey>();
  for (const adj of [...catalogFor(to.rearConfig, to.panhardSide), ...CATALOG]) {
    if (seen.has(adj.key)) continue;
    seen.add(adj.key);
    if (from[adj.key] === to[adj.key]) continue;
    out.push({ key: adj.key, label: adj.label, from: formatValue(findAdjustment(from, adj.key), from[adj.key]), to: formatValue(adj, to[adj.key]), minutes: adj.minutes });
  }
  return out;
}

/** Crew minutes for a set of changes. Nut turns at several corners share one trip under the car. */
export function workMinutes(changes: Change[]): number {
  let mins = 0;
  let nuts = 0;
  for (const c of changes) {
    if (c.key.startsWith('nut')) nuts++;
    else mins += c.minutes;
  }
  return mins + (nuts ? 3 + nuts * 1.5 : 0);
}

export type { PanhardSide };
