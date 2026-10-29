import { useState } from 'react';
import { useRace } from './raceStore';
import { useSandbox } from './store';
import { Garage } from './Garage';
import { ScalesPanel } from './ScalesPanel';
import { LapChart } from './LapChart';
import { canRun, nightSummary, OUR_NUMBER, pendingChanges, SESSION_LABEL, type NightState, type SessionKind, type SessionResult } from '../sim/raceNight';
import { conditionLabel, gripLevel } from '../sim/track';
import { WEATHER } from '../sim/evolution';
import { TRACKS, trackById } from '../data/tracks';
import { DRIVERS } from '../sim/driver';
import { BASELINES } from '../data/baselines';
import type { Setup } from '../sim/types';

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function StartScreen() {
  const start = useRace((s) => s.start);
  const sandboxSetup = useSandbox((s) => s.setup);
  const [trackId, setTrackId] = useState('delaware');
  const [weatherId, setWeatherId] = useState('warm');
  const [driverIdx, setDriverIdx] = useState(1);
  const [setupChoice, setSetupChoice] = useState('sandbox');
  const options: { id: string; label: string; setup: Setup }[] = [
    { id: 'sandbox', label: 'My sandbox setup', setup: sandboxSetup },
    ...BASELINES.map((b) => ({ id: b.name, label: b.name, setup: b })),
  ];
  return (
    <section className="panel narrow">
      <h2>Start a race night</h2>
      <p className="note">
        Hot laps, a {8}-car heat, a consi if you miss the transfer, then a 30 lap feature. You get a timed work window before each session, and every change costs crew time. The track dries out as the night goes on.
      </p>
      <label className="field">Track
        <select value={trackId} onChange={(e) => setTrackId(e.target.value)}>
          {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <label className="field">Weather
        <select value={weatherId} onChange={(e) => setWeatherId(e.target.value)}>
          {WEATHER.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
        </select>
      </label>
      <label className="field">Driver
        <select value={driverIdx} onChange={(e) => setDriverIdx(Number(e.target.value))}>
          {DRIVERS.map((d, i) => <option key={d.name} value={i}>{d.name}</option>)}
        </select>
      </label>
      <label className="field">Unload with
        <select value={setupChoice} onChange={(e) => setSetupChoice(e.target.value)}>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>
      <button
        className="primary"
        onClick={() => start({ trackId, weatherId, driverIdx, seed: Math.floor(Math.random() * 1e6) }, options.find((o) => o.id === setupChoice)!.setup)}
      >
        Unload the car
      </button>
    </section>
  );
}

function ResultCard({ r }: { r: SessionResult }) {
  return (
    <div className="result">
      <div className="result-head">
        <b>{SESSION_LABEL[r.kind]}</b>
        {r.finish != null && (
          <span>
            Started {r.start}, finished <b>{r.finish}</b> of {r.cars}
            {r.transferred != null && (r.transferred ? ' · transferred' : ' · did not transfer')}
            {r.cautions ? ` · ${r.cautions} caution${r.cautions > 1 ? 's' : ''}` : ''}
          </span>
        )}
      </div>
      <div className="note">
        Best {Math.min(...r.laps).toFixed(3)} · avg {avg(r.laps).toFixed(3)} · track {conditionLabel(r.trackBefore)} → {conditionLabel(r.trackAfter)}
      </div>
      {r.midFeedback && r.midFeedback.length > 0 && (
        <blockquote className="driver">
          <p className="note">On the radio, halfway:</p>
          {r.midFeedback.map((l, i) => <p key={i}>“{l}”</p>)}
        </blockquote>
      )}
      <blockquote className="driver">
        {r.feedback.map((l, i) => <p key={i}>“{l}”</p>)}
      </blockquote>
    </div>
  );
}

function Timeline({ night }: { night: NightState }) {
  const done = night.results.map((r) => r.kind);
  const steps: SessionKind[] = ['hot', 'heat', ...(done.includes('consi') || night.next === 'consi' ? (['consi'] as SessionKind[]) : []), 'feature'];
  return (
    <ol className="timeline">
      {steps.map((k) => (
        <li key={k} className={done.includes(k) ? 'done' : night.next === k ? 'now' : ''}>{SESSION_LABEL[k]}</li>
      ))}
    </ol>
  );
}

function Debrief({ night }: { night: NightState }) {
  const sum = nightSummary(night);
  const feature = night.results.find((r) => r.kind === 'feature');
  return (
    <section className="panel">
      <h2>Debrief</h2>
      <p className="headline">{sum.headline}</p>
      <p className="note">Best lap of the night {sum.best.toFixed(3)}. {sum.changes} change{sum.changes === 1 ? "" : "s"} made.</p>
      {feature?.order && (
        <p className="note">Top 5: {feature.order.slice(0, 5).map((n) => (n === OUR_NUMBER ? '#00 (us)' : `#${n}`)).join(', ')}</p>
      )}
      <LapChart series={night.results.map((r) => ({ name: SESSION_LABEL[r.kind], laps: r.laps }))} />
      <h3>What changed when</h3>
      {night.results.map((r) => (
        <div key={r.kind} className="note">
          <b>Before {SESSION_LABEL[r.kind].toLowerCase()}</b> (track {conditionLabel(r.trackBefore)}):{' '}
          {r.changes.length ? r.changes.map((c) => `${c.label} ${c.from} → ${c.to}`).join('; ') : 'no changes'}
        </div>
      ))}
    </section>
  );
}

export function RaceNight() {
  const { night, change, go, quit, undoAll } = useRace();
  if (!night) return <StartScreen />;

  const track = trackById(night.config.trackId);
  const { changes, minutes } = pendingChanges(night);
  const over = minutes > night.windowMinutes;
  const last = night.results.at(-1);

  return (
    <div className="layout">
      <div className="col">
        {night.next !== 'done' ? (
          <Garage setup={night.setup} reference={night.windowStart} onChange={change} />
        ) : (
          <Debrief night={night} />
        )}
      </div>
      <div className="col">
        <section className="panel">
          <div className="panel-head">
            <h2>{track.name}</h2>
            <button className="small" onClick={() => confirm('Leave this race night?') && quit()}>End night</button>
          </div>
          <Timeline night={night} />
          <p className="note">
            {DRIVERS[night.config.driverIdx].name} · {WEATHER.find((w) => w.id === night.config.weatherId)?.label} · grip {Math.round(gripLevel(night.track) * 100)}
          </p>
          {night.crewNote && <p className="crew">{night.crewNote}</p>}
          {night.next !== 'done' && (
            <>
              <div className={over ? 'window over' : 'window'}>
                Work window before the {SESSION_LABEL[night.next].toLowerCase()}: <b>{Math.round(minutes)} of {night.windowMinutes} min</b> used
                {over && ' · too much work, the car will miss the session. Undo something.'}
              </div>
              {changes.length > 0 && (
                <ul className="note">
                  {changes.map((c) => <li key={c.key}>{c.label}: {c.from} → {c.to} ({c.minutes} min)</li>)}
                </ul>
              )}
              <div className="row">
                <button className="primary" disabled={!canRun(night)} onClick={go}>Send it: {SESSION_LABEL[night.next]}</button>
                {changes.length > 0 && <button className="small" onClick={undoAll}>Undo changes</button>}
              </div>
            </>
          )}
        </section>
        <ScalesPanel setup={night.setup} />
      </div>
      <div className="col">
        {last && (
          <section className="panel">
            <h2>Last session</h2>
            <ResultCard r={last} />
            <LapChart series={night.results.slice(-3).map((r) => ({ name: SESSION_LABEL[r.kind], laps: r.laps }))} />
          </section>
        )}
        {night.results.length > 1 && (
          <section className="panel">
            <h2>Earlier tonight</h2>
            {night.results.slice(0, -1).reverse().map((r) => <ResultCard key={r.kind} r={r} />)}
          </section>
        )}
      </div>
    </div>
  );
}
