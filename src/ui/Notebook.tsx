import { useRef, useState } from 'react';
import { useSandbox } from './store';
import { diffSetups } from '../sim/setupOps';
import { trackById } from '../data/tracks';
import { BASELINES } from '../data/baselines';
import type { Setup } from '../sim/types';

// The setup notebook: "when the car is working well, make your own setup specs that you will be
// able to refer back to" (manual p. 7).

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Notebook() {
  const st = useSandbox();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [compareA, setCompareA] = useState('current');
  const [compareB, setCompareB] = useState(BASELINES[0].name);
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const sources: { id: string; label: string; setup: Setup }[] = [
    { id: 'current', label: 'Current sandbox setup', setup: st.setup },
    ...BASELINES.map((b) => ({ id: b.name, label: b.name, setup: b })),
    ...st.notebook.map((n, i) => ({ id: `nb-${i}`, label: `${n.name} (${trackById(n.trackId).name})`, setup: n.setup })),
  ];
  const a = sources.find((s) => s.id === compareA)?.setup ?? st.setup;
  const b = sources.find((s) => s.id === compareB)?.setup ?? BASELINES[0];
  const diff = diffSetups(b, a);

  const importFile = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : [data];
      for (const item of list) {
        const setup = item.setup ?? item;
        if (typeof setup !== 'object' || !('springLF' in setup)) throw new Error('not a setup file');
        st.loadSetup(setup);
        st.saveToNotebook(item.name ?? f.name.replace(/\.json$/, ''), item.note ?? 'Imported');
      }
      setError('');
    } catch {
      setError("That file isn't a setup sheet from this app.");
    }
  };

  return (
    <div className="layout two">
      <div className="col">
        <section className="panel">
          <h2>Save the current setup</h2>
          <label className="field">Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Georgetown feature, dry slick" />
          </label>
          <label className="field">Notes
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What the track was doing, how the driver liked it" />
          </label>
          <div className="row">
            <button className="primary" disabled={!name.trim()} onClick={() => { st.saveToNotebook(name.trim(), note.trim()); setName(''); setNote(''); }}>Save to notebook</button>
            <button onClick={() => download('setup.json', { name: name || st.setup.name, note, setup: st.setup })}>Export current as file</button>
            <button onClick={() => file.current?.click()}>Import a file</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </div>
          {error && <p className="note warn-text">{error}</p>}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Notebook</h2>
            {st.notebook.length > 0 && <button className="small" onClick={() => download('setup-notebook.json', st.notebook)}>Export all</button>}
          </div>
          {st.notebook.length === 0 && <p className="note">No saved setups yet. When the car is working, save it here.</p>}
          {st.notebook.map((n, i) => (
            <div key={i} className="result">
              <div className="result-head">
                <b>{n.name}</b>
                <span className="note">{trackById(n.trackId).name} · {new Date(n.savedAt).toLocaleDateString()}</span>
              </div>
              {n.note && <p className="note">{n.note}</p>}
              <div className="row">
                <button className="small" onClick={() => { st.loadSetup(n.setup); st.setTab('garage'); }}>Load in sandbox</button>
                <button className="small" onClick={() => setCompareB(`nb-${i}`)}>Compare</button>
                <button className="small" onClick={() => confirm(`Delete ${n.name}?`) && st.deleteFromNotebook(i)}>Delete</button>
              </div>
            </div>
          ))}
        </section>
      </div>
      <div className="col">
        <section className="panel">
          <h2>Compare two setups</h2>
          <div className="row">
            <select value={compareB} onChange={(e) => setCompareB(e.target.value)} aria-label="From">
              {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <span>→</span>
            <select value={compareA} onChange={(e) => setCompareA(e.target.value)} aria-label="To">
              {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {diff.length === 0 ? (
            <p className="note">Same setup.</p>
          ) : (
            <table className="runs">
              <thead><tr><th>Adjustment</th><th>From</th><th>To</th></tr></thead>
              <tbody>
                {diff.map((c) => <tr key={c.key}><td>{c.label}</td><td>{c.from}</td><td>{c.to}</td></tr>)}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
