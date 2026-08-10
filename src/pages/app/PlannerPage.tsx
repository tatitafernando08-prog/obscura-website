import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { NewStudyTask, StudyTask } from '../../types/task';
import { DaySelector } from '../../components/planner/DaySelector';
import { AddTaskModal } from '../../components/planner/AddTaskModal';

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function PlannerPage() {
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [tasks, setTasks] = useState<StudyTask[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('study_tasks')
      .select('id,title,subtitle,completed,task_date,scheduled_time')
      .eq('user_id', session.user.id)
      .eq('task_date', toISODate(selectedDate))
      .order('scheduled_time', { ascending: true });
    if (error) {
      setLoadError(true);
      setTasks(null);
      return;
    }
    setTasks(data as StudyTask[]);
  }, [session, selectedDate]);

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

  async function deleteTask(task: StudyTask) {
    try {
      const { error } = await supabase.from('study_tasks').delete().eq('id', task.id);
      if (error) throw error;
      await loadTasks();
    } catch (err) {
      console.error('Could not delete task', err);
    }
  }

  async function handleAddTask(title: string, subtitle: string | null, scheduledTime: string | null) {
    if (!session) return;
    const payload: NewStudyTask = {
      user_id: session.user.id,
      title,
      subtitle,
      scheduled_time: scheduledTime,
      task_date: toISODate(selectedDate),
    };
    const { error } = await supabase.from('study_tasks').insert(payload);
    if (error) throw new Error('Could not save task, please try again.');
    setShowAddModal(false);
    await loadTasks();
  }

  const isToday = toISODate(selectedDate) === toISODate(startOfDay(new Date()));
  const planTitle = isToday
    ? "Today's Plan"
    : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const completedCount = tasks?.filter((t) => t.completed).length ?? 0;

  return (
    <div className="planner-page">
      <div className="planner-top">
        <div>
          <div className="planner-title">Study Planner</div>
          <div className="planner-sub">Plan. Focus. Achieve.</div>
        </div>
        <button type="button" className="add-task-btn" onClick={() => setShowAddModal(true)}>+</button>
      </div>

      <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

      <div className="planner-section-head">
        <div className="planner-section-title">{planTitle}</div>
        <div className="task-counter">{completedCount} / {tasks?.length ?? 0} tasks</div>
      </div>

      {loadError && <div className="task-empty">Couldn&apos;t load tasks right now.</div>}
      {!loadError && tasks === null && <div className="task-empty">Loading...</div>}
      {!loadError && tasks !== null && tasks.length === 0 && (
        <div className="task-empty">No tasks for this day yet — tap + to add one.</div>
      )}
      {!loadError && tasks !== null && tasks.map((task) => (
        <div className={`task-row${task.completed ? ' completed' : ''}`} key={task.id}>
          <div
            className={`task-check${task.completed ? ' done' : ''}`}
            onClick={() => toggleTask(task)}
          >
            {task.completed && (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="task-info">
            <div className={`task-title${task.completed ? ' done' : ''}`}>{task.title}</div>
            {task.subtitle && <div className="task-subtitle">{task.subtitle}</div>}
          </div>
          <button type="button" className="task-delete" aria-label="Delete" onClick={() => deleteTask(task)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

      <Link to="/app/focus-room" className="focus-cta">
        <div className="focus-cta-left">
          <div className="focus-cta-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white">
              <circle cx="12" cy="12" r="8" strokeWidth={1.8} />
              <path d="M12 8v4l3 2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="focus-cta-title">Focus Timer</div>
            <div className="focus-cta-sub">Start a focused Pomodoro session</div>
          </div>
        </div>
        <div className="focus-cta-arrow">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>

      {showAddModal && (
        <AddTaskModal onSave={handleAddTask} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
