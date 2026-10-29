import { create } from 'zustand';
import type { Setup, SetupKey } from '../sim/types';
import { canRun, runNext, startNight, type NightConfig, type NightState } from '../sim/raceNight';
import { applyChange } from '../sim/setupOps';

interface RaceStore {
  night: NightState | null;
  start: (config: NightConfig, setup: Setup) => void;
  change: <K extends SetupKey>(key: K, value: Setup[K]) => void;
  undoAll: () => void;
  go: () => void;
  quit: () => void;
}

const KEY = 'crew-chief-sim-night-v1';
function load(): NightState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NightState) : null;
  } catch {
    return null;
  }
}

export const useRace = create<RaceStore>((set, get) => ({
  night: load(),
  start: (config, setup) => set({ night: startNight(config, setup) }),
  change: (key, value) => {
    const n = get().night;
    if (n) set({ night: { ...n, setup: applyChange(n.setup, key, value) } });
  },
  undoAll: () => {
    const n = get().night;
    if (n) set({ night: { ...n, setup: n.windowStart } });
  },
  go: () => {
    const n = get().night;
    if (n && canRun(n)) set({ night: runNext(n) });
  },
  quit: () => set({ night: null }),
}));

useRace.subscribe((s) => {
  try {
    if (s.night) localStorage.setItem(KEY, JSON.stringify(s.night));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the night just won't survive a reload */
  }
});
