import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import type { StudyTask } from '../../types/task';
import { StatsGrid } from '../../components/progress/StatsGrid';
import { WeeklyChart } from '../../components/progress/WeeklyChart';
import { ActivityList } from '../../components/progress/ActivityList';

function computeStreak(completedDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(toLocalISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeChartDays(completed: StudyTask[]): { label: string; count: number }[] {
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = toLocalISODate(d);
    const count = completed.filter((t) => t.task_date === iso).length;
    const label = d.toLocaleDateString(undefined, { weekday: 'short' })[0];
    days.push({ label, count });
  }
  return days;
}

export function ProgressPage() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoadError(false);
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('study_tasks')
        .select('id,title,subtitle,completed,task_date,scheduled_time')
        .eq('user_id', session.user.id)
        .gte('task_date', toLocalISODate(since))
        .order('task_date', { ascending: false });
      if (error) {
        setLoadError(true);
        setTasks(null);
        return;
      }
      setTasks(data as StudyTask[]);
    })();
  }, [session]);

  const completed = tasks?.filter((t) => t.completed) ?? [];
  const rate = tasks && tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const streak = computeStreak(new Set(completed.map((t) => t.task_date)));
  const chartDays = computeChartDays(completed);
  const recentActivity = tasks === null ? null : completed.slice(0, 8);

  return (
    <div className="progress-page">
      <div className="progress-title">Your Progress</div>
      <p className="progress-sub">A look at how consistently you&apos;ve been studying.</p>

      <StatsGrid completed={completed.length} rate={rate} streak={streak} />

      <div className="section-heading">Last 7 Days</div>
      <WeeklyChart days={chartDays} />

      <div className="section-heading">Recently Completed</div>
      <ActivityList tasks={recentActivity} loadError={loadError} />
    </div>
  );
}
