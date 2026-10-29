import type { TrackState } from './types';

/** Overall grip level 0 (black slick) .. 1 (heavy, tacky). Moisture is most of it; rubber takes it away. */
export function gripLevel(t: TrackState): number {
  return clamp01(0.15 + 0.85 * t.moisture - 0.25 * t.rubber);
}

export type TrackCondition = 'heavy' | 'tacky' | 'medium' | 'dry slick' | 'black slick';

export function conditionLabel(t: TrackState): TrackCondition {
  const g = gripLevel(t);
  if (t.rubber > 0.55 && g < 0.35) return 'black slick';
  if (g >= 0.8) return 'heavy';
  if (g >= 0.6) return 'tacky';
  if (g >= 0.38) return 'medium';
  return t.rubber > 0.4 ? 'black slick' : 'dry slick';
}

export const PRESET_TRACKS: Record<'heavy' | 'tacky' | 'medium' | 'drySlick' | 'blackSlick', TrackState> = {
  heavy: { moisture: 0.95, rubber: 0, cushion: 0.1, roughness: 0.2, surfaceTempF: 75 },
  tacky: { moisture: 0.72, rubber: 0, cushion: 0.15, roughness: 0.25, surfaceTempF: 80 },
  medium: { moisture: 0.5, rubber: 0.1, cushion: 0.3, roughness: 0.3, surfaceTempF: 85 },
  drySlick: { moisture: 0.22, rubber: 0.25, cushion: 0.45, roughness: 0.3, surfaceTempF: 90 },
  blackSlick: { moisture: 0.12, rubber: 0.75, cushion: 0.5, roughness: 0.25, surfaceTempF: 92 },
};

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
