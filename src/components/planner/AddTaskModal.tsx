import { useState } from 'react';

interface AddTaskModalProps {
  onSave: (title: string, subtitle: string | null, scheduledTime: string | null) => Promise<void>;
  onClose: () => void;
}

export function AddTaskModal({ onSave, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setSaving(true);
    setError('');
    try {
      await onSave(trimmedTitle, subtitle.trim() || null, time || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save task, please try again.');
      setSaving(false);
    }
  }

  return (
    <div
      className="add-task-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="add-task-card">
        <h3>Add a task</h3>
        {error && <p className="add-task-error">{error}</p>}
        <label htmlFor="newTaskTitle">Title</label>
        <input
          id="newTaskTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Physics — Chapter 2"
        />
        <label htmlFor="newTaskSubtitle">Subject / notes (optional)</label>
        <input
          id="newTaskSubtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Mechanics"
        />
        <label htmlFor="newTaskTime">Time (optional)</label>
        <input
          id="newTaskTime"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <div className="add-task-actions">
          <button type="button" className="add-task-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="add-task-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
