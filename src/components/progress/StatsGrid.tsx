interface StatsGridProps {
  completed: number;
  rate: number;
  streak: number;
}

export function StatsGrid({ completed, rate, streak }: StatsGridProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
            <path d="M5 13l4 4L19 7" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="stat-number">{completed}</div>
        <div className="stat-label">Tasks completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
            <path d="M4 12h15M13 6l6 6-6 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="stat-number">{rate}%</div>
        <div className="stat-label">Completion rate</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
            <path d="M12 3c1 3-2 4-2 7a4 4 0 1 0 8 0c0-1-1-2-1-2 .5 3-1.5 4-1.5 4S16 9 12 3Z" strokeWidth={1.8} strokeLinejoin="round" />
          </svg>
        </div>
        <div className="stat-number">{streak}</div>
        <div className="stat-label">Day streak</div>
      </div>
    </div>
  );
}
