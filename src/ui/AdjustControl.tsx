import type { Adjustment, Setup } from '../sim/types';
import { formatValue } from '../sim/setupOps';

interface Props {
  adj: Adjustment;
  setup: Setup;
  reference: Setup;
  onChange: (value: Setup[keyof Setup]) => void;
  disabled?: boolean;
}

const round = (x: number, step: number) => Math.round(x / step) * step;

/** One adjustment, drawn the way it is made on the car: turns, holes, or a part off the trailer */
export function AdjustControl({ adj, setup, reference, onChange, disabled }: Props) {
  const value = setup[adj.key];
  const changed = value !== reference[adj.key];

  let control;
  if (adj.kind === 'turns') {
    const v = value as number;
    const bump = (d: number) => onChange(Math.max(adj.min, Math.min(adj.max, round(v + d * adj.step, adj.step))) as never);
    control = (
      <div className="stepper">
        <button disabled={disabled || v <= adj.min} onClick={() => bump(-1)} aria-label="less">−</button>
        <span className="stepper-value">{formatValue(adj, v)}</span>
        <button disabled={disabled || v >= adj.max} onClick={() => bump(1)} aria-label="more">+</button>
      </div>
    );
  } else if (adj.kind === 'holes') {
    control = (
      <div className="holes" role="radiogroup" aria-label={adj.label}>
        {adj.options.map((o) => (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={o.value === value}
            title={o.label}
            className={o.value === value ? 'hole on' : 'hole'}
            disabled={disabled}
            onClick={() => onChange(o.value as never)}
          >
            {typeof o.value === 'number' ? o.value : o.label}
          </button>
        ))}
        <span className="hole-label">{formatValue(adj, value)}</span>
      </div>
    );
  } else {
    control = (
      <select
        value={String(value)}
        disabled={disabled}
        onChange={(e) => {
          const opt = adj.options.find((o) => String(o.value) === e.target.value)!;
          onChange(opt.value as never);
        }}
      >
        {adj.options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={changed ? 'adj changed' : 'adj'}>
      <div className="adj-head">
        <span className="adj-label">{adj.label}</span>
        <span className="adj-meta">
          {adj.kind === 'turns' ? 'turns' : adj.kind === 'holes' ? 'holes' : 'part'} · {adj.minutes} min{adj.ref ? ` · ${adj.ref}` : ''}
        </span>
      </div>
      {control}
      {(adj.kind === 'turns' && adj.perStep) || adj.hint ? (
        <div className="adj-hint">{[adj.kind === 'turns' ? adj.perStep && `1 step: ${adj.perStep}` : '', adj.hint].filter(Boolean).join(' · ')}</div>
      ) : null}
    </div>
  );
}
