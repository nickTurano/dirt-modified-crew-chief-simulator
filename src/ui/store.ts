import { create } from 'zustand';
import type { Setup, SetupKey, TrackState } from '../sim/types';
import { LONG_ROD_BASELINE } from '../data/baselines';
import { applyChange } from '../sim/setupOps';
import { PRESET_TRACKS } from '../sim/track';
import { runSession } from '../sim/laptime';
import { driverFeedback, DRIVERS } from '../sim/driver';
import { analyzeHandling } from '../sim/handling';
import { makeRng } from '../sim/rng';
import { trackById } from '../data/tracks';

export interface Run {
  id: number;
  label: string;
  setup: Setup;
  track: TrackState;
  trackId: string;
  laps: number[];
  feedback: string[];
}

export interface SavedSetup {
  name: string;
  savedAt: string;
  trackId: string;
  note: string;
  setup: Setup;
}

export type Tab = 'garage' | 'race' | 'drills' | 'notebook' | 'help';

interface SandboxState {
  tab: Tab;
  setup: Setup;
  /** setup at the last run, to show what changed */
  lastRunSetup: Setup;
  trackId: string;
  track: TrackState;
  driverIdx: number;
  engineerView: boolean;
  runs: Run[];
  notebook: SavedSetup[];
  setTab: (t: Tab) => void;
  change: <K extends SetupKey>(key: K, value: Setup[K]) => void;
  loadSetup: (s: Setup) => void;
  setTrackId: (id: string) => void;
  setTrack: (t: TrackState) => void;
  setPreset: (p: keyof typeof PRESET_TRACKS) => void;
  setDriver: (i: number) => void;
  toggleEngineer: () => void;
  runLaps: (n: number) => void;
  clearRuns: () => void;
  saveToNotebook: (name: string, note: string) => void;
  deleteFromNotebook: (i: number) => void;
}

const STORAGE_KEY = 'crew-chief-sim-v1';

function loadPersisted(): Partial<SandboxState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    // older saves may be missing new setup fields: fill from the baseline
    if (p.setup) p.setup = { ...LONG_ROD_BASELINE, ...p.setup };
    if (p.lastRunSetup) p.lastRunSetup = { ...LONG_ROD_BASELINE, ...p.lastRunSetup };
    return p;
  } catch {
    return {};
  }
}

let seed = Date.now() % 100000;

export const useSandbox = create<SandboxState>((set, get) => ({
  tab: 'garage',
  setup: LONG_ROD_BASELINE,
  lastRunSetup: LONG_ROD_BASELINE,
  trackId: 'delaware',
  track: PRESET_TRACKS.tacky,
  driverIdx: 1,
  engineerView: true,
  runs: [],
  notebook: [],
  ...loadPersisted(),

  setTab: (tab) => set({ tab }),
  change: (key, value) => set({ setup: applyChange(get().setup, key, value) }),
  loadSetup: (s) => set({ setup: { ...LONG_ROD_BASELINE, ...s } }),
  setTrackId: (trackId) => set({ trackId }),
  setTrack: (track) => set({ track }),
  setPreset: (p) => set({ track: PRESET_TRACKS[p] }),
  setDriver: (driverIdx) => set({ driverIdx }),
  toggleEngineer: () => set({ engineerView: !get().engineerView }),
  runLaps: (n) => {
    const { setup, track, trackId, runs, driverIdx } = get();
    const driver = DRIVERS[driverIdx];
    const rng = makeRng(seed++);
    const laps = runSession(setup, trackById(trackId), track, n, { rng, driverSkill: driver.skill }).map((l) => l.time);
    const fb = driverFeedback(analyzeHandling(setup, track), driver, rng, laps);
    const run: Run = { id: (runs.at(-1)?.id ?? 0) + 1, label: `Run ${(runs.at(-1)?.id ?? 0) + 1}`, setup, track, trackId, laps, feedback: fb.lines };
    set({ runs: [...runs, run].slice(-30), lastRunSetup: setup });
  },
  clearRuns: () => set({ runs: [], lastRunSetup: get().setup }),
  saveToNotebook: (name, note) =>
    set({ notebook: [...get().notebook, { name, note, savedAt: new Date().toISOString(), trackId: get().trackId, setup: get().setup }] }),
  deleteFromNotebook: (i) => set({ notebook: get().notebook.filter((_, j) => j !== i) }),
}));

useSandbox.subscribe((s) => {
  try {
    const { setup, lastRunSetup, trackId, track, driverIdx, engineerView, runs, notebook } = s;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ setup, lastRunSetup, trackId, track, driverIdx, engineerView, runs, notebook }));
  } catch {
    /* private window or storage full: the app still works, it just won't remember */
  }
});
