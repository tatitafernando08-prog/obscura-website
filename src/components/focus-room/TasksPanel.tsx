import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { StudyTask } from '../../types/task';

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

export function TasksPanel() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('study_tasks')
      .select('id,title,completed,task_date,scheduled_time')
      .eq('user_id', session.user.id)
      .eq('task_date', todayISODate())
      .order('scheduled_time', { ascending: true });
    if (error) {
      setLoadError(true);
      setTasks(null);
      return;
    }
    setTasks(data as StudyTask[]);
  }, [session]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function toggleTask(task: StudyTask) {
    try {
      const { error } = await supabase
        .from('study_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);
      if (error) throw error;
      await loadTasks();
    } catch (err) {
      console.error('Could not update task', err);
    }
  }

  return (
    <div className="glass-panel">
      <div className="panel-title">Today&apos;s Tasks</div>
      {loadError && <div className="focus-tasks-empty">Couldn&apos;t load tasks right now.</div>}
      {!loadError && tasks === null && <div className="focus-tasks-empty">Loading...</div>}
      {!loadError && tasks !== null && tasks.length === 0 && (
        <div className="focus-tasks-empty">No tasks planned for today yet.</div>
      )}
      {!loadError && tasks !== null && tasks.map((task) => (
        <div className="focus-task-row" key={task.id}>
          <div
            className={`focus-task-check${task.completed ? ' done' : ''}`}
            onClick={() => toggleTask(task)}
          >
            {task.completed && (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className={`focus-task-title${task.completed ? ' done' : ''}`}>{task.title}</div>
        </div>
      ))}
    </div>
  );
}
