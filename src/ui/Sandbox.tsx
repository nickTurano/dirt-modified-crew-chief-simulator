import { useSandbox } from './store';
import { Garage } from './Garage';
import { ScalesPanel } from './ScalesPanel';
import { TrackPanel } from './TrackPanel';
import { HandlingView } from './HandlingView';
import { LapChart } from './LapChart';
import { analyzeHandling } from '../sim/handling';
import { diffSetups, workMinutes } from '../sim/setupOps';
import { DRIVERS } from '../sim/driver';

const best = (xs: number[]) => Math.min(...xs);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function Sandbox() {
  const st = useSandbox();
  const changes = diffSetups(st.lastRunSetup, st.setup);
  const lastRuns = st.runs.slice(-4);
  const last = st.runs.at(-1);
  const h = analyzeHandling(st.setup, st.track);

  return (
    <div className="layout">
      <div className="col">
        <Garage setup={st.setup} reference={st.lastRunSetup} onChange={st.change} onLoad={st.loadSetup} />
      </div>
      <div className="col">
        <ScalesPanel setup={st.setup} />
        <TrackPanel trackId={st.trackId} track={st.track} onTrackId={st.setTrackId} onTrack={st.setTrack} />
      </div>
      <div className="col">
        <section className="panel">
          <div className="panel-head">
            <h2>Practice</h2>
            <select value={st.driverIdx} onChange={(e) => st.setDriver(Number(e.target.value))} aria-label="Driver">
              {DRIVERS.map((d, i) => (
                <option key={d.name} value={i}>{d.name}</option>
              ))}
            </select>
          </div>
          {changes.length > 0 && (
            <div className="changes">
              <b>Changes since the last run ({Math.round(workMinutes(changes))} min of work):</b>
              <ul>
                {changes.map((c) => (
                  <li key={c.key}>{c.label}: {c.from} → {c.to}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="row">
            <button className="primary" onClick={() => st.runLaps(5)}>Run 5 laps</button>
            <button onClick={() => st.runLaps(10)}>Run 10 laps</button>
            {st.runs.length > 0 && <button className="small" onClick={st.clearRuns}>Clear runs</button>}
          </div>
          {last && (
            <>
              <blockquote className="driver">
                {last.feedback.map((l, i) => (
                  <p key={i}>“{l}”</p>
                ))}
              </blockquote>
              <table className="runs">
                <thead>
                  <tr><th>Run</th><th>Best</th><th>Avg</th></tr>
                </thead>
                <tbody>
                  {st.runs.slice(-6).reverse().map((r) => (
                    <tr key={r.id}><td>{r.label}</td><td>{best(r.laps).toFixed(3)}</td><td>{avg(r.laps).toFixed(3)}</td></tr>
                  ))}
                </tbody>
              </table>
              <LapChart series={lastRuns.map((r) => ({ name: r.label, laps: r.laps }))} />
            </>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Engineer view</h2>
            <button className="small" onClick={st.toggleEngineer}>{st.engineerView ? 'Hide' : 'Show'}</button>
          </div>
          {st.engineerView ? <HandlingView h={h} /> : <p className="note">Hidden. Work from the driver and the stopwatch, like on a real night.</p>}
        </section>
      </div>
    </div>
  );
}
