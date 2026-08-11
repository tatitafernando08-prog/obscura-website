import { Link } from 'react-router-dom';
import type { StudyTask } from '../../types/task';

interface ScheduleListProps {
  tasks: StudyTask[] | null;
  loadError: boolean;
}

export function ScheduleList({ tasks, loadError }: ScheduleListProps) {
  return (
    <>
      <div className="schedule-header">
        <div className="section-heading" style={{ marginBottom: 0 }}>Today&apos;s Schedule</div>
        <Link to="/app/planner">View all</Link>
      </div>
      <div className="schedule-list">
        {loadError && <div className="schedule-empty">Couldn&apos;t load your schedule right now.</div>}
        {!loadError && tasks === null && <div className="schedule-empty">Loading today&apos;s schedule...</div>}
        {!loadError && tasks !== null && tasks.length === 0 && (
          <div className="schedule-empty">No tasks planned for today yet.</div>
        )}
        {!loadError && tasks !== null && tasks.map((task) => (
          <div className="schedule-row" key={task.id}>
            <div className="schedule-time">{task.scheduled_time ? task.scheduled_time.slice(0, 5) : '--:--'}</div>
            <div className="schedule-info">
              <div className={`schedule-title${task.completed ? ' completed' : ''}`}>{task.title}</div>
              {task.subtitle && <div className="schedule-sub">{task.subtitle}</div>}
            </div>
            <div className="schedule-dot" />
          </div>
        ))}
      </div>
    </>
  );
}
