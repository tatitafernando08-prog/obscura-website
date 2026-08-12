interface WeeklyChartProps {
  days: { label: string; count: number }[];
}

export function WeeklyChart({ days }: WeeklyChartProps) {
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="chart-card">
      <div className="chart-bars">
        {days.map((d, i) => {
          const heightPct = Math.max(6, (d.count / maxCount) * 100);
          return (
            <div className="chart-bar-wrap" key={i}>
              {d.count > 0 && <div className="chart-bar-count">{d.count}</div>}
              <div
                className={`chart-bar${d.count > 0 ? ' has-completed' : ''}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="chart-labels">
        {days.map((d, i) => (
          <div className="chart-label" key={i}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}
