import type { BushingPart, ShockPart, TirePart } from '../sim/types';

// Shock valvings are the Fox numbers from the BRP baseline shock packages (manual p. 54).
// No remote-reservoir adjusters: the crew swaps shocks and changes nitrogen.
export const SHOCKS: ShockPart[] = [
  { id: 'f-60-200', label: 'Front 60C/200R (heavy LF)', position: 'front', comp: 60, reb: 200, digressive: false, baseGas: 100 },
  { id: 'f-60-230', label: 'Front 60C/230R (short link LF)', position: 'front', comp: 60, reb: 230, digressive: false, baseGas: 100 },
  { id: 'f-65-190d', label: 'Front 65C/190R digressive (slick LF)', position: 'front', comp: 65, reb: 190, digressive: true, baseGas: 100 },
  { id: 'f-75-165', label: 'Front 75C/165R (heavy RF)', position: 'front', comp: 75, reb: 165, digressive: false, baseGas: 100 },
  { id: 'f-75-165d', label: 'Front 75C/165R digressive (slick RF)', position: 'front', comp: 75, reb: 165, digressive: true, baseGas: 100 },
  { id: 'f-75-300', label: 'Front 75C/300R (short link RF)', position: 'front', comp: 75, reb: 300, digressive: false, baseGas: 100 },
  { id: 'r-100-200d', label: 'Rear 100C/200R digressive (slick RR)', position: 'rear', comp: 100, reb: 200, digressive: true, baseGas: 125 },
  { id: 'r-115-230', label: 'Rear 115C/230R (heavy LR)', position: 'rear', comp: 115, reb: 230, digressive: false, baseGas: 125 },
  { id: 'r-120-270', label: 'Rear 120C/270R (heavy RR)', position: 'rear', comp: 120, reb: 270, digressive: false, baseGas: 150 },
  { id: 'r-125-200', label: 'Rear 125C/200R (short link RR)', position: 'rear', comp: 125, reb: 200, digressive: false, baseGas: 150 },
  { id: 'r-145-145d', label: 'Rear 145C/145R digressive (slick LR)', position: 'rear', comp: 145, reb: 145, digressive: true, baseGas: 125 },
  { id: 'r-150-175', label: 'Rear 150C/175R (short link LR)', position: 'rear', comp: 150, reb: 175, digressive: false, baseGas: 150 },
];

// American Racer tires on the trailer. Circumferences are typical sizes for building stagger;
// compounds are generic (softer grips more and wears faster).
export const TIRES: TirePart[] = [
  { id: 'lf-79', label: 'LF 79.0 in', position: 'front', circumference: 79, hardness: 0.5 },
  { id: 'lf-79.5', label: 'LF 79.5 in', position: 'front', circumference: 79.5, hardness: 0.5 },
  { id: 'lf-80', label: 'LF 80.0 in', position: 'front', circumference: 80, hardness: 0.5 },
  { id: 'rf-80.5', label: 'RF 80.5 in', position: 'front', circumference: 80.5, hardness: 0.5 },
  { id: 'rf-81', label: 'RF 81.0 in', position: 'front', circumference: 81, hardness: 0.5 },
  { id: 'lr-84-soft', label: 'Rear 84 in, softer', position: 'rear', circumference: 84, hardness: 0.35 },
  { id: 'lr-85-soft', label: 'Rear 85 in, softer', position: 'rear', circumference: 85, hardness: 0.35 },
  { id: 'lr-86-soft', label: 'Rear 86 in, softer', position: 'rear', circumference: 86, hardness: 0.35 },
  { id: 'lr-87-hard', label: 'Rear 87 in, harder', position: 'rear', circumference: 87, hardness: 0.65 },
  { id: 'rr-91-soft', label: 'Rear 91 in, softer', position: 'rear', circumference: 91, hardness: 0.35 },
  { id: 'rr-92-soft', label: 'Rear 92 in, softer', position: 'rear', circumference: 92, hardness: 0.35 },
  { id: 'rr-92-hard', label: 'Rear 92 in, harder', position: 'rear', circumference: 92, hardness: 0.65 },
  { id: 'rr-93-hard', label: 'Rear 93 in, harder', position: 'rear', circumference: 93, hardness: 0.65 },
];

// Torque arm rubbers, manual p. 25.
export const BUSHINGS: BushingPart[] = [
  { id: '427-1', label: 'BRP 427-1 black urethane 1 3/8 in, 70', heightIn: 1.375, durometer: 70 },
  { id: '427-5', label: 'BRP 427-5 blue urethane 1 3/8 in, 60', heightIn: 1.375, durometer: 60 },
  { id: '427-2', label: 'BRP 427-2 red urethane 1 3/8 in, 50', heightIn: 1.375, durometer: 50 },
  { id: '9596', label: 'BRP 9596 red natural rubber 1 3/8 in, 50', heightIn: 1.375, durometer: 50 },
  { id: '427-6', label: 'BRP 427-6 blue urethane 1 1/8 in, 60 (cut for slick)', heightIn: 1.125, durometer: 60 },
];

export const FRONT_SPRINGS_LF = [200, 225, 250];
export const FRONT_SPRINGS_RF = [150, 165, 175, 200];
export const REAR_SPRINGS = [100, 150, 175, 200, 225];

export const shockById = (id: string) => SHOCKS.find((s) => s.id === id)!;
export const tireById = (id: string) => TIRES.find((t) => t.id === id)!;
export const bushingById = (id: string) => BUSHINGS.find((b) => b.id === id)!;
