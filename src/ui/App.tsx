import { useSandbox, type Tab } from './store';
import { Sandbox } from './Sandbox';
import { RaceNight } from './RaceNight';

const TABS: { id: Tab; label: string }[] = [
  { id: 'garage', label: 'Sandbox' },
  { id: 'race', label: 'Race night' },
  { id: 'drills', label: 'Drills' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'help', label: 'Help' },
];

export function App() {
  const tab = useSandbox((s) => s.tab);
  const setTab = useSandbox((s) => s.setTab);
  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <b>Crew Chief Simulator</b>
          <span>Bicknell big block modified · coil-over · American Racer</span>
        </div>
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'tab on' : 'tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'garage' && <Sandbox />}
        {tab === 'race' && <RaceNight />}
        {tab !== 'garage' && tab !== 'race' && <p className="panel">Coming in a later build stage.</p>}
      </main>
    </div>
  );
}
