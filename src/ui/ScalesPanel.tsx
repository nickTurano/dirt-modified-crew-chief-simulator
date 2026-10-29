import type { Setup } from '../sim/types';
import { readScales, TARGETS } from '../sim/scales';

const fmtIn = (x: number) => `${x.toFixed(2)} in`;

function Pct({ label, value, target }: { label: string; value: number; target?: readonly [number, number] }) {
  const ok = !target || (value >= target[0] && value <= target[1]);
  return (
    <div className={ok ? 'stat' : 'stat warn'}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value.toFixed(1)}%</span>
      {target && <span className="stat-target">BRP {target[0]}-{target[1]}</span>}
    </div>
  );
}

export function ScalesPanel({ setup }: { setup: Setup }) {
  const r = readScales(setup);
  const corner = (c: 'LF' | 'RF' | 'LR' | 'RR') => (
    <div className="pad">
      <span className="pad-name">{c}</span>
      <span className="pad-weight">{Math.round(r.weights[c])}</span>
      <span className="pad-height">{fmtIn(r.heights[c])}</span>
    </div>
  );
  return (
    <section className="panel scales">
      <h2>Scales</h2>
      <div className="pads">
        {corner('LF')}
        {corner('RF')}
        {corner('LR')}
        {corner('RR')}
      </div>
      <p className="note">
        {Math.round(r.total)} lb without driver, {Math.round(r.totalWithDriver)} lb with. Weight in lb, frame height in inches.
      </p>
      <div className="stats">
        <Pct label="Left side" value={r.leftPct} target={TARGETS.leftPct} />
        <Pct label="Rear" value={r.rearPct} target={TARGETS.rearPct} />
        <Pct label="Cross (LR+RF)" value={r.crossPct} target={TARGETS.crossPct} />
        <div className="stat">
          <span className="stat-label">Left rear weight</span>
          <span className="stat-value">{Math.round(r.leftRearWeight)} lb</span>
          <span className="stat-target">LR minus RR</span>
        </div>
        <div className="stat">
          <span className="stat-label">Rear stagger</span>
          <span className="stat-value">{r.rearStagger.toFixed(2)} in</span>
          <span className="stat-target">5-6 slick, 7-8 heavy</span>
        </div>
        <div className="stat">
          <span className="stat-label">Front stagger</span>
          <span className="stat-value">{r.frontStagger.toFixed(2)} in</span>
          <span className="stat-target">1/2 to 1 1/2</span>
        </div>
      </div>
    </section>
  );
}
