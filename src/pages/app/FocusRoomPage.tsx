import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { ThemeName } from '../../types/profile';
import { PomodoroTimer } from '../../components/focus-room/PomodoroTimer';
import { QuoteRotator } from '../../components/focus-room/QuoteRotator';
import { SpotifyPanel } from '../../components/focus-room/SpotifyPanel';
import { TasksPanel } from '../../components/focus-room/TasksPanel';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'owl', label: 'Owl' },
  { value: 'green', label: 'Green' },
];

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function greetingName(name: string | null | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return email ? email.split('@')[0] : 'there';
}

export function FocusRoomPage() {
  const { session, profile, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<ThemeName>(profile?.theme ?? 'purple');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  async function handleThemeClick(value: ThemeName) {
    setTheme(value);
    if (!session) return;
    const { error } = await supabase
      .from('student_profiles')
      .update({ theme: value })
      .eq('id', session.user.id);
    if (!error) {
      await refreshProfile();
    }
  }

  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const name = greetingName(profile?.name, session?.user.email);

  return (
    <div className={`focus-room${theme !== 'purple' ? ` theme-${theme}` : ''}`}>
      <div className="focus-blob b1" />
      <div className="focus-blob b2" />
      <div className="focus-blob b3" />

      <Link to="/app/dashboard" className="focus-exit">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Exit Focus Room
      </Link>

      <div className="theme-picker">
        {THEMES.map((t) => (
          <div
            key={t.value}
            className={`theme-dot ${t.value}${theme === t.value ? ' active' : ''}`}
            title={t.label}
            onClick={() => handleThemeClick(t.value)}
          />
        ))}
      </div>

      <div className="focus-body">
        <div className="focus-content">
          <div className="focus-clock">{formatClock(now)}</div>
          <div className="focus-greeting">{`Good ${timeOfDay}, ${name}.`}</div>

          <PomodoroTimer />
          <QuoteRotator />
        </div>

        <div className="focus-side">
          <SpotifyPanel />
          <TasksPanel />
        </div>
      </div>
    </div>
  );
}
