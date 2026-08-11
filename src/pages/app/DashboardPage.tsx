import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import type { StudyTask } from '../../types/task';
import { TodaysFocusCard } from '../../components/dashboard/TodaysFocusCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { ScheduleList } from '../../components/dashboard/ScheduleList';

function greetingName(name: string | null | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return email ? email.split('@')[0] : 'there';
}

export function DashboardPage() {
  const { session, profile } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoadError(false);
      const { data, error } = await supabase
        .from('study_tasks')
        .select('id,title,subtitle,completed,task_date,scheduled_time')
        .eq('user_id', session.user.id)
        .eq('task_date', toLocalISODate(new Date()))
        .order('scheduled_time', { ascending: true });
      if (error) {
        setLoadError(true);
        setTasks(null);
        return;
      }
      setTasks(data as StudyTask[]);
    })();
  }, [session]);

  const name = greetingName(profile?.name, session?.user.email);

  return (
    <>
      <div className="app-top-row">
        <div>
          <div className="app-greeting">Welcome back, {name}!</div>
          <p className="app-greeting-sub">Let&apos;s make today productive.</p>
        </div>
      </div>

      <TodaysFocusCard tasks={tasks} />
      <QuickActions />
      <ScheduleList tasks={tasks} loadError={loadError} />
    </>
  );
}
