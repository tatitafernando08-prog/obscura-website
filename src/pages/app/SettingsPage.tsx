import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { ThemeName } from '../../types/profile';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'owl', label: 'Owl' },
  { value: 'green', label: 'Green' },
];

export function SettingsPage() {
  const { session, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [theme, setTheme] = useState<ThemeName>(profile?.theme ?? 'purple');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError('');
    setSaved(false);

    const { error: updateError } = await supabase
      .from('student_profiles')
      .update({ name: name.trim() || null, theme })
      .eq('id', session.user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    localStorage.setItem('obscura_focus_theme', theme);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="app-placeholder-card">
      <h2>Settings</h2>
      <form onSubmit={handleSave}>
        {error && <div className="onboarding-error visible">{error}</div>}

        <div className="settings-field">
          <label htmlFor="settings-name">Name</label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Your name"
          />
        </div>

        <div className="settings-field">
          <label>Theme</label>
          <div className="theme-swatch-row">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-label={t.label}
                className={`theme-swatch ${t.value}${theme === t.value ? ' selected' : ''}`}
                onClick={() => {
                  setTheme(t.value);
                  setSaved(false);
                }}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saved && <p className="settings-saved">Saved.</p>}
      </form>
    </div>
  );
}
