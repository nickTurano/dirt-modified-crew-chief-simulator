import type { TrackDef } from '../sim/types';

// Lap times and surface behaviour are approximate starting values. Tune them to match real
// big block times at each track.
export const TRACKS: TrackDef[] = [
  {
    id: 'delaware',
    name: 'Delaware International Speedway',
    location: 'Delmar, DE',
    lengthMiles: 0.5,
    banking: 0.55,
    lapTimeTacky: 17.4,
    lapTimeSlick: 19.6,
    dryingRate: 0.55,
    cushionTendency: 0.6,
    notes: 'Half mile clay. Approximate times; adjust in src/data/tracks.ts.',
  },
  {
    id: 'georgetown',
    name: 'Georgetown Speedway',
    location: 'Georgetown, DE',
    lengthMiles: 0.5,
    banking: 0.45,
    lapTimeTacky: 17.9,
    lapTimeSlick: 20.3,
    dryingRate: 0.65,
    cushionTendency: 0.5,
    notes: 'Half mile clay. Approximate times; adjust in src/data/tracks.ts.',
  },
  {
    id: 'generic-38',
    name: 'Generic 3/8 mile',
    location: 'Anywhere, Northeast',
    lengthMiles: 0.375,
    banking: 0.5,
    lapTimeTacky: 18.0,
    lapTimeSlick: 21.0,
    dryingRate: 0.6,
    cushionTendency: 0.5,
    notes: 'The example from the Bicknell manual (p. 52): 18 sec tacky heats, 21 sec slick feature.',
  },
];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0];
