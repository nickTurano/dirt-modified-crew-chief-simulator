import type { TrackState } from '../sim/types';
import { PRESET_TRACKS, conditionLabel } from '../sim/track';
import { trackReport } from '../sim/evolution';
import { TRACKS } from '../data/tracks';

interface Props {
  trackId: string;
  track: TrackState;
  onTrackId: (id: string) => void;
  onTrack: (t: TrackState) => void;
}

const PRESET_NAMES: Record<keyof typeof PRESET_TRACKS, string> = {
  heavy: 'Heavy',
  tacky: 'Tacky',
  medium: 'Medium',
  drySlick: 'Dry slick',
  blackSlick: 'Black slick',
};

export function TrackPanel({ trackId, track, onTrackId, onTrack }: Props) {
  const slider = (key: keyof TrackState, label: string) => (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={track[key]} onChange={(e) => onTrack({ ...track, [key]: Number(e.target.value) })} />
    </label>
  );
  return (
    <section className="panel">
      <h2>Track</h2>
      <select value={trackId} onChange={(e) => onTrackId(e.target.value)}>
        {TRACKS.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <div className="row wrap">
        {(Object.keys(PRESET_TRACKS) as (keyof typeof PRESET_TRACKS)[]).map((p) => (
          <button key={p} className="small" onClick={() => onTrack(PRESET_TRACKS[p])}>{PRESET_NAMES[p]}</button>
        ))}
      </div>
      {slider('moisture', 'Moisture')}
      {slider('rubber', 'Rubber')}
      {slider('cushion', 'Cushion')}
      {slider('roughness', 'Ruts and holes')}
      <p className="note"><b>{conditionLabel(track)}.</b> {trackReport(track)}</p>
    </section>
  );
}
