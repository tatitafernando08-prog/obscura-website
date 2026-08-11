import { Link } from 'react-router-dom';

export function QuickActions() {
  return (
    <>
      <div className="section-heading">Quick Actions</div>
      <div className="quick-actions-grid">
        <Link to="/app/chat" className="quick-action-card">
          <div className="quick-action-icon purple">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
            </svg>
          </div>
          <div className="quick-action-title">AI Assistant</div>
          <div className="quick-action-sub">Chat with NESH</div>
        </Link>

        <Link to="/app/planner" className="quick-action-card">
          <div className="quick-action-icon blue">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x={4} y={5} width={16} height={15} rx={2} stroke="currentColor" strokeWidth={1.8} />
              <path d="M4 9.5h16" stroke="currentColor" strokeWidth={1.8} />
            </svg>
          </div>
          <div className="quick-action-title">Study Planner</div>
          <div className="quick-action-sub">Plan your day</div>
        </Link>

        <div className="quick-action-card">
          <span className="quick-action-badge">Soon</span>
          <div className="quick-action-icon green">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x={5.5} y={7.5} width={12} height={14} rx={2} transform="rotate(-8 11.5 14.5)" stroke="currentColor" strokeWidth={1.7} />
            </svg>
          </div>
          <div className="quick-action-title">Flashcards</div>
          <div className="quick-action-sub">Review cards</div>
        </div>

        <Link to="/app/focus-room" className="quick-action-card">
          <div className="quick-action-icon red">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx={12} cy={13} r={8} stroke="currentColor" strokeWidth={1.8} />
              <path d="M12 9v4l2.6 2.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="quick-action-title">Pomodoro</div>
          <div className="quick-action-sub">Focus timer</div>
        </Link>

        <div className="quick-action-card">
          <span className="quick-action-badge">Soon</span>
          <div className="quick-action-icon orange">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 3.5h8l3 3v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
            </svg>
          </div>
          <div className="quick-action-title">Past Papers</div>
          <div className="quick-action-sub">Practice now</div>
        </div>

        <div className="quick-action-card">
          <span className="quick-action-badge">Soon</span>
          <div className="quick-action-icon teal">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx={10.5} cy={10.5} r={6.5} stroke="currentColor" strokeWidth={1.8} />
              <path d="M15.3 15.3 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </div>
          <div className="quick-action-title">Quick Search</div>
          <div className="quick-action-sub">Smart search</div>
        </div>
      </div>
    </>
  );
}
