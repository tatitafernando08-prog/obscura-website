// src/components/flashcards/AiGenerateModal.tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { subjectsForProfile } from '../../lib/subjects';
import type { NewFlashcard } from '../../types/flashcard';

const BACKEND_URL = 'https://obscura-backend-production-d7de.up.railway.app';

interface StagedCard {
  front: string;
  back: string;
}

interface AiGenerateModalProps {
  deckId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AiGenerateModal({ deckId, onClose, onSaved }: AiGenerateModalProps) {
  const { session, profile } = useAuth();
  const subjects = profile ? subjectsForProfile(profile) : [];
  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'staging' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [staged, setStaged] = useState<StagedCard[]>([]);

  async function generate() {
    if (!session || !profile || !subject) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session.user.id,
          subject,
          level: profile.exam_type,
          syllabus: profile.syllabus,
          medium: profile.medium,
          count: 10,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setErrorMessage(data.message || 'AI flashcards are at today’s limit — try again tomorrow.');
        setStatus('error');
        return;
      }
      if (!res.ok) {
        setErrorMessage('Something went wrong generating flashcards. Please try again.');
        setStatus('error');
        return;
      }
      if (data.reason === 'no_content' || !data.cards || data.cards.length === 0) {
        setErrorMessage('Not enough past-paper material for this subject yet.');
        setStatus('error');
        return;
      }
      setStaged(data.cards);
      setStatus('staging');
    } catch {
      setErrorMessage('Something went wrong generating flashcards. Please try again.');
      setStatus('error');
    }
  }

  function updateStaged(index: number, field: 'front' | 'back', value: string) {
    setStaged((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function discardStaged(index: number) {
    setStaged((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveAccepted() {
    if (staged.length === 0) return;
    const rows: NewFlashcard[] = staged.map((c) => ({ deck_id: deckId, front: c.front, back: c.back, source: 'ai' }));
    const { error } = await supabase.from('flashcards').insert(rows);
    if (error) {
      setErrorMessage('Could not save cards, please try again.');
      setStatus('error');
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="ai-generate-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ai-generate-card">
        <div className="ai-generate-title">Generate flashcards with AI</div>

        {errorMessage && <div className="ai-generate-error">{errorMessage}</div>}

        {status !== 'staging' && (
          <>
            <select className="ai-subject-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="ai-generate-footer">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="button" onClick={generate} disabled={status === 'loading' || !subject}>
                {status === 'loading' ? 'Generating...' : 'Generate 10 cards'}
              </button>
            </div>
          </>
        )}

        {status === 'staging' && (
          <>
            {staged.map((card, i) => (
              <div className="ai-stage-row" key={i}>
                <textarea value={card.front} onChange={(e) => updateStaged(i, 'front', e.target.value)} rows={2} />
                <textarea value={card.back} onChange={(e) => updateStaged(i, 'back', e.target.value)} rows={2} />
                <div className="ai-stage-actions">
                  <button type="button" className="ai-stage-discard" onClick={() => discardStaged(i)}>Discard</button>
                </div>
              </div>
            ))}
            <div className="ai-generate-footer">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="button" onClick={saveAccepted} disabled={staged.length === 0}>
                Save {staged.length} card{staged.length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
