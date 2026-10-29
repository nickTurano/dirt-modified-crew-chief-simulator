import { useEffect, useState } from 'react';
import { DRILLS, type Drill, type Grade } from '../data/drills';
import { drillSetup, drillTrack } from '../sim/drills';
import { conditionLabel } from '../sim/track';
import { useSandbox } from './store';

const KEY = 'crew-chief-sim-drills-v1';
const GRADE_LABEL: Record<Grade, string> = { best: 'Best', acceptable: 'Works', 'no-effect': 'No effect', wrong: 'Wrong' };
/** Same order every time for a drill, but the best answer isn't always first */
function shuffled<T>(xs: T[], key: string): T[] {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const POINTS: Record<Grade, number> = { best: 2, acceptable: 1, 'no-effect': 0, wrong: 0 };

function loadAnswers(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function Drills() {
  const [answers, setAnswers] = useState<Record<string, string>>(loadAnswers);
  const [current, setCurrent] = useState<string>(() => DRILLS.find((d) => !loadAnswers()[d.id])?.id ?? DRILLS[0].id);
  const { loadSetup, setTrack, setTab } = useSandbox();

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(answers));
    } catch {
      /* progress just won't be remembered */
    }
  }, [answers]);

  const drill = DRILLS.find((d) => d.id === current)!;
  const chosen = answers[drill.id];
  const score = DRILLS.reduce((sum, d) => {
    const o = d.options.find((x) => x.id === answers[d.id]);
    return sum + (o ? POINTS[o.grade] : 0);
  }, 0);
  const answered = Object.keys(answers).filter((k) => DRILLS.some((d) => d.id === k)).length;
  const nextDrill = DRILLS[(DRILLS.indexOf(drill) + 1) % DRILLS.length];

  const tryIt = (d: Drill) => {
    loadSetup(drillSetup(d));
    setTrack(drillTrack(d));
    setTab('garage');
  };

  return (
    <div className="drills">
      <section className="panel drill-list">
        <div className="panel-head">
          <h2>Drills</h2>
          <span className="note">{answered}/{DRILLS.length} done · {score}/{DRILLS.length * 2} pts</span>
        </div>
        {(['Handling', 'Diagnosis', 'Track changes', 'Scaling', 'Race night'] as const).map((cat) => (
          <div key={cat}>
            <h3>{cat}</h3>
            <ul>
              {DRILLS.filter((d) => d.category === cat).map((d) => {
                const o = d.options.find((x) => x.id === answers[d.id]);
                return (
                  <li key={d.id}>
                    <button className={d.id === current ? 'link on' : 'link'} onClick={() => setCurrent(d.id)}>
                      <span className={o ? `dot ${o.grade}` : 'dot'} />
                      {d.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {answered > 0 && (
          <button className="small" onClick={() => confirm('Clear all drill answers?') && setAnswers({})}>Reset progress</button>
        )}
      </section>

      <section className="panel drill">
        <p className="note">{drill.category} · track {conditionLabel(drillTrack(drill))} · {drill.base === 'short' ? 'short rod' : 'long rod'} car</p>
        <h2>{drill.title}</h2>
        <p>{drill.situation}</p>
        {drill.driver && <blockquote className="driver"><p>“{drill.driver}”</p></blockquote>}
        {drill.laps && <p className="note">Last laps: {drill.laps.map((l) => l.toFixed(2)).join(', ')}</p>}
        <p><b>{drill.question}</b></p>
        <div className="options">
          {shuffled(drill.options, drill.id).map((o) => {
            const show = !!chosen;
            const cls = ['option', show ? o.grade : '', chosen === o.id ? 'picked' : ''].join(' ');
            return (
              <button key={o.id} className={cls} disabled={show} onClick={() => setAnswers({ ...answers, [drill.id]: o.id })}>
                <span>{o.text}</span>
                {show && (
                  <span className="verdict">
                    <b>{GRADE_LABEL[o.grade]}{chosen === o.id ? ' (your pick)' : ''}.</b> {o.why}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {chosen && (
          <div className="row">
            <button className="primary" onClick={() => setCurrent(nextDrill.id)}>Next drill</button>
            {drill.target && <button onClick={() => tryIt(drill)}>Try it in the sandbox</button>}
            <button className="small" onClick={() => { const a = { ...answers }; delete a[drill.id]; setAnswers(a); }}>Try again</button>
          </div>
        )}
        <p className="note">Manual: {drill.refs.join(', ')}</p>
      </section>
    </div>
  );
}
