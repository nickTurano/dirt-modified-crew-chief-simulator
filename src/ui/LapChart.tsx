import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ChartSeries {
  name: string;
  laps: number[];
}

/** Lap times for a few runs, overlaid so the effect of a change is easy to see */
export function LapChart({ series }: { series: ChartSeries[] }) {
  const maxLaps = Math.max(0, ...series.map((s) => s.laps.length));
  const data = Array.from({ length: maxLaps }, (_, i) => {
    const row: Record<string, number> = { lap: i + 1 };
    for (const s of series) if (s.laps[i] != null) row[s.name] = Number(s.laps[i].toFixed(3));
    return row;
  });
  const all = series.flatMap((s) => s.laps);
  if (!all.length) return null;
  const lo = Math.floor(Math.min(...all) * 10) / 10 - 0.1;
  const hi = Math.ceil(Math.max(...all) * 10) / 10 + 0.1;
  const colors = ['#9aa0a6', '#7b8794', '#5f6b7a', '#c2410c'];
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="lap" tick={{ fontSize: 12 }} stroke="var(--muted)" />
          <YAxis domain={[lo, hi]} tick={{ fontSize: 12 }} stroke="var(--muted)" width={48} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(3)} s`} labelFormatter={(l) => `Lap ${l}`} />
          {series.map((s, i) => (
            <Line key={s.name} type="monotone" dataKey={s.name} stroke={colors[Math.max(0, colors.length - series.length + i)]} strokeWidth={i === series.length - 1 ? 2.5 : 1.5} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="legend">
        {series.map((s, i) => (
          <span key={s.name}><i style={{ background: colors[Math.max(0, colors.length - series.length + i)] }} />{s.name}</span>
        ))}
      </div>
    </div>
  );
}
