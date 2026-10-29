import type { TrackDef, TrackState } from './types';
import { clamp01, conditionLabel, gripLevel } from './track';
import type { Rng } from './rng';

// How the surface changes through a night: every lap the whole field runs packs and dries it,
// the clock and the weather dry it, and the track crew can water, pack or grade between sessions.

export interface Weather {
  id: string;
  label: string;
  airTempF: number;
  /** 0..1 */
  humidity: number;
  /** 0..1, sun or heat on the surface early in the night */
  sun: number;
  /** 0..1 */
  wind: number;
}

export const WEATHER: Weather[] = [
  { id: 'cool-humid', label: 'Cool and humid (stays tacky)', airTempF: 66, humidity: 0.85, sun: 0.2, wind: 0.15 },
  { id: 'warm', label: 'Warm summer night', airTempF: 80, humidity: 0.6, sun: 0.5, wind: 0.3 },
  { id: 'hot-sunny', label: 'Hot and sunny (slicks off by the feature)', airTempF: 92, humidity: 0.45, sun: 0.9, wind: 0.35 },
  { id: 'windy', label: 'Dry and windy (top dries first)', airTempF: 78, humidity: 0.35, sun: 0.6, wind: 0.9 },
];

export const weatherById = (id: string) => WEATHER.find((w) => w.id === id) ?? WEATHER[1];

export type CrewAction = 'none' | 'water-light' | 'water-heavy' | 'pack' | 'grade';
export const CREW_ACTIONS: Record<CrewAction, string> = {
  none: 'Crew leaves it alone',
  'water-light': 'Light water',
  'water-heavy': 'Heavy water',
  pack: 'Pack it in with the support classes',
  grade: 'Grade the ruts out',
};

/** Surface at the start of hot laps: heavy, with a little random variation per night */
export function initialTrack(weather: Weather, rng: Rng): TrackState {
  return {
    moisture: clamp01(0.88 + (weather.humidity - 0.6) * 0.15 + (rng() - 0.5) * 0.1),
    rubber: 0,
    cushion: 0.1,
    roughness: 0.15 + rng() * 0.1,
    surfaceTempF: weather.airTempF - 2,
  };
}

export interface AdvanceInput {
  /** laps run by the whole field, e.g. 8 cars x 10 laps = 80 */
  carLaps: number;
  /** clock time passing with no cars on track (intermissions, other classes running too) */
  minutes: number;
  weather: Weather;
  track: TrackDef;
}

export function advanceTrack(t: TrackState, input: AdvanceInput): TrackState {
  const { carLaps, minutes, weather, track } = input;
  const evaporation = (0.3 + weather.sun * 0.5 + weather.wind * 0.35 + (weather.airTempF - 65) / 60) * (1 - weather.humidity * 0.55);
  // a wet track gives up moisture fastest; a dry one changes more slowly
  const dry = track.dryingRate * (0.35 + t.moisture) * (carLaps * 0.0011 + minutes * 0.0035 * evaporation);
  const moisture = clamp01(t.moisture - dry);
  const dryness = 1 - moisture;
  return {
    moisture,
    rubber: clamp01(t.rubber + (moisture < 0.4 ? carLaps * 0.0012 * (0.4 - moisture) * 3 : 0)),
    cushion: clamp01(t.cushion + carLaps * 0.0006 * track.cushionTendency * dryness),
    roughness: clamp01(t.roughness + carLaps * (moisture > 0.55 ? 0.0009 : 0.0003)),
    surfaceTempF: Math.min(weather.airTempF + 15 * weather.sun * dryness, t.surfaceTempF + carLaps * 0.02),
  };
}

export function crewPrep(t: TrackState, action: CrewAction): TrackState {
  switch (action) {
    case 'water-light':
      return { ...t, moisture: clamp01(t.moisture + 0.1), rubber: t.rubber * 0.7 };
    case 'water-heavy':
      return { ...t, moisture: clamp01(t.moisture + 0.22), rubber: t.rubber * 0.4, roughness: clamp01(t.roughness + 0.05) };
    case 'pack':
      return { ...t, roughness: t.roughness * 0.7, moisture: clamp01(t.moisture - 0.04) };
    case 'grade':
      return { ...t, roughness: t.roughness * 0.35, cushion: clamp01(t.cushion + 0.1) };
    default:
      return t;
  }
}

/** What a crew member walking the track would tell you */
export function trackReport(t: TrackState): string {
  const cond = conditionLabel(t);
  const parts: string[] = [];
  parts.push(
    {
      heavy: 'Track is heavy and wet, it will be fast and the cars will throw mud.',
      tacky: 'Track is tacky, lots of grip all the way around.',
      medium: 'Track is drying out, still some bite but it is starting to go away.',
      'dry slick': 'Track is dry slick. Grip is down, throttle control matters now.',
      'black slick': 'Track is black slick on the bottom. Hardly any bite, it is glazed over.',
    }[cond],
  );
  if (t.cushion > 0.45) parts.push('A cushion is building up top, there could be speed up there.');
  if (t.roughness > 0.45) parts.push('Getting rough, there are holes on entry and exit.');
  if (t.rubber > 0.4 && cond !== 'black slick') parts.push('Rubber is starting to show on the bottom.');
  return parts.join(' ');
}

/** Short trend for the crew chief: where is it headed by the next session? */
export function trendWord(before: TrackState, after: TrackState): string {
  const d = gripLevel(after) - gripLevel(before);
  return d < -0.06 ? 'drying fast' : d < -0.015 ? 'drying' : d > 0.03 ? 'coming back' : 'holding';
}
