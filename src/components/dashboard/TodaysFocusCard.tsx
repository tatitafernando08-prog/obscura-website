import { Link } from 'react-router-dom';
import type { StudyTask } from '../../types/task';

interface TodaysFocusCardProps {
  tasks: StudyTask[] | null;
}

export function TodaysFocusCard({ tasks }: TodaysFocusCardProps) {
  const total = tasks?.length ?? 0;
  const completed = tasks?.filter((t) => t.completed).length ?? 0;
  const hasTasks = total > 0;

  const title = hasTasks ? `Complete ${total} topic${total > 1 ? 's' : ''}` : 'No tasks planned yet';
  const label = hasTasks ? `${completed} / ${total} done` : 'Add tasks in Planner to get started';
  const progress = hasTasks ? (completed / total) * 100 : 0;

  return (
    <Link to="/app/planner" className="focus-card">
      <div className="focus-card-text">
        <div className="focus-card-label">Today&apos;s Focus</div>
        <div className="focus-card-title">{title}</div>
        <div className="focus-progress-bar">
          <div className="focus-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="focus-progress-label">{label}</div>
      </div>
      <div className="focus-card-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white">
          <path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
