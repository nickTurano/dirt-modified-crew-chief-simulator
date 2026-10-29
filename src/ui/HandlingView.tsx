import type { HandlingResult } from '../sim/handling';
import { PHASES, PHASE_LABELS } from '../sim/types';
import { describeBalance } from '../sim/driver';

/** Engineer view: what the model thinks the car is doing, and why. A training aid. */
export function HandlingView({ h }: { h: HandlingResult }) {
  return (
    <div className="handling">
      {PHASES.map((p) => {
        const b = h.phases[p].balance;
        const pct = Math.max(-1, Math.min(1, b / 0.3)) * 50;
        return (
          <div key={p} className="phase">
            <div className="phase-head">
              <span>{PHASE_LABELS[p]}</span>
              <span className={b > 0.04 ? 'tight' : b < -0.04 ? 'loose' : ''}>{describeBalance(b)}</span>
            </div>
            <div className="meter" aria-hidden>
              <span className="meter-mid" />
              <span className={b >= 0 ? 'meter-bar tight' : 'meter-bar loose'} style={b >= 0 ? { left: '50%', width: `${pct}%` } : { left: `${50 + pct}%`, width: `${-pct}%` }} />
            </div>
            <div className="meter-scale"><span>loose</span><span>tight</span></div>
            <ul className="why">
              {h.phases[p].contributions.slice(0, 3).map((c) => (
                <li key={c.id}>
                  {c.label}: <b>{c.value > 0 ? 'tighter' : 'looser'}</b> {Math.abs(c.value).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="grips">
        <span>Front grip {(h.frontGrip * 100).toFixed(0)}</span>
        <span>Side bite {(h.sideBite * 100).toFixed(0)}</span>
        <span>Forward bite {(h.forwardBite * 100).toFixed(0)}</span>
      </div>
      <p className="note">
        Tonight BRP would aim for about {h.ideals.rearStagger.toFixed(1)} in of rear stagger and {Math.round(h.ideals.leftRearWeight)} lb of left rear weight.
      </p>
    </div>
  );
}
