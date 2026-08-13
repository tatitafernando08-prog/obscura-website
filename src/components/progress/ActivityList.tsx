import type { StudyTask } from '../../types/task';
import { fromLocalISODate } from '../../lib/date';

interface ActivityListProps {
  tasks: StudyTask[] | null;
  loadError: boolean;
}

export function ActivityList({ tasks, loadError }: ActivityListProps) {
  return (
    <div className="activity-list">
      {loadError && <div className="activity-empty">Couldn&apos;t load your activity right now.</div>}
      {!loadError && tasks === null && <div className="activity-empty">Loading...</div>}
      {!loadError && tasks !== null && tasks.length === 0 && (
        <div className="activity-empty">Nothing completed yet — finish a task in Planner to see it here.</div>
      )}
      {!loadError && tasks !== null && tasks.map((task) => (
        <div className="activity-row" key={task.id}>
          <div className="activity-check">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
              <path d="M5 13l4 4L19 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="activity-title">{task.title}</div>
          <div className="activity-date">
            {fromLocalISODate(task.task_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  );
}
