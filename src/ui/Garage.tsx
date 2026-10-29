import { useState } from 'react';
import type { AdjustmentGroup, Setup, SetupKey } from '../sim/types';
import { catalogFor } from '../data/catalog';
import { BASELINES, SLICK_SPRING_PACKAGE } from '../data/baselines';
import { AdjustControl } from './AdjustControl';

const GROUPS: AdjustmentGroup[] = ['Springs and heights', 'Weight', 'Tires and wheels', 'Front end', 'Rear end', 'Shocks', 'Driveline, brakes, body'];

interface Props {
  setup: Setup;
  /** what the "changed" markers compare against */
  reference: Setup;
  onChange: <K extends SetupKey>(key: K, value: Setup[K]) => void;
  onLoad?: (s: Setup) => void;
  locked?: boolean;
}

export function Garage({ setup, reference, onChange, onLoad, locked }: Props) {
  const [open, setOpen] = useState<AdjustmentGroup>('Springs and heights');
  const adjs = catalogFor(setup.rearConfig, setup.panhardSide);
  return (
    <section className="panel garage">
      <div className="panel-head">
        <h2>Garage</h2>
        {onLoad && (
          <div className="row">
            {BASELINES.map((b) => (
              <button key={b.name} className="small" onClick={() => onLoad(b)} disabled={locked}>
                Load {b.name}
              </button>
            ))}
            <button className="small" onClick={() => onLoad({ ...setup, ...SLICK_SPRING_PACKAGE })} disabled={locked}>
              BRP slick spring package
            </button>
          </div>
        )}
      </div>
      {locked && <p className="note">The car is on track. Changes wait for the next work window.</p>}
      {GROUPS.map((g) => {
        const items = adjs.filter((a) => a.group === g);
        const changed = items.filter((a) => setup[a.key] !== reference[a.key]).length;
        return (
          <div key={g} className="group">
            <button className="group-head" onClick={() => setOpen(open === g ? ('' as AdjustmentGroup) : g)} aria-expanded={open === g}>
              <span>{g}</span>
              <span className="group-count">{changed ? `${changed} changed` : `${items.length}`}</span>
            </button>
            {open === g && (
              <div className="group-body">
                {items.map((a) => (
                  <AdjustControl key={a.key + a.label} adj={a} setup={setup} reference={reference} disabled={locked} onChange={(v) => onChange(a.key, v as never)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
