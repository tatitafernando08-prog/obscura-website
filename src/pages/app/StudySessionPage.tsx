// src/pages/app/StudySessionPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import { computeNextReview, type ReviewQuality } from '../../lib/spacedRepetition';
import type { Flashcard } from '../../types/flashcard';

interface GradeCounts { again: number; hard: number; good: number; easy: number; }

const GRADES: { label: string; quality: ReviewQuality; className: string; key: keyof GradeCounts }[] = [
  { label: 'Again', quality: 0, className: 'grade-again', key: 'again' },
  { label: 'Hard', quality: 3, className: 'grade-hard', key: 'hard' },
  { label: 'Good', quality: 4, className: 'grade-good', key: 'good' },
  { label: 'Easy', quality: 5, className: 'grade-easy', key: 'easy' },
];

export function StudySessionPage() {
  const { session } = useAuth();
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<GradeCounts>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');

  const loadQueue = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('flashcards')
      .select('id,deck_id,front,back,source,interval,repetitions,ease_factor,due_date,last_reviewed_at,created_at,flashcard_decks!inner(user_id)')
      .eq('flashcard_decks.user_id', session.user.id)
      .lte('due_date', toLocalISODate(new Date()))
      .order('due_date', { ascending: true });
    if (error) {
      setLoadError(true);
      return;
    }
    setQueue(data as Flashcard[]);
  }, [session]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function grade(quality: ReviewQuality, gradeKey: keyof GradeCounts) {
    if (!queue || queue.length === 0 || grading) return;
    const current = queue[0];
    const result = computeNextReview(quality, current);
    setGrading(true);
    setGradeError('');
    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          interval: result.interval,
          repetitions: result.repetitions,
          ease_factor: result.ease_factor,
          due_date: result.due_date,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', current.id);
      if (error) {
        console.error('Could not save grade', error);
        setGradeError("Couldn't save that grade — please try again.");
        return;
      }
      setCounts((prev) => ({ ...prev, [gradeKey]: prev[gradeKey] + 1 }));
      setFlipped(false);
      setQueue((prev) => (prev ? prev.slice(1) : prev));
    } finally {
      setGrading(false);
    }
  }

  if (loadError) return <div className="task-empty">Couldn&apos;t load your review queue right now.</div>;
  if (queue === null) return <div className="task-empty">Loading...</div>;

  const totalReviewed = counts.again + counts.hard + counts.good + counts.easy;

  if (queue.length === 0) {
    return (
      <div className="study-session">
        <div className="study-summary">
          <div className="deck-page-title">
            {totalReviewed > 0 ? 'Session complete!' : 'Nothing due right now'}
          </div>
          {totalReviewed > 0 && (
            <div className="flashcards-sub">
              Reviewed {totalReviewed} card{totalReviewed === 1 ? '' : 's'} —{' '}
              {counts.again} again, {counts.hard} hard, {counts.good} good, {counts.easy} easy.
            </div>
          )}
          <Link to="/app/flashcards" className="new-deck-btn" style={{ display: 'inline-block', marginTop: 20 }}>
            Back to decks
          </Link>
        </div>
      </div>
    );
  }

  const current = queue[0];

  return (
    <div className="study-session">
      <div className="study-progress">{queue.length} card{queue.length === 1 ? '' : 's'} left</div>
      <div className="study-flip-card" onClick={() => setFlipped((f) => !f)}>
        {flipped ? current.back : current.front}
      </div>
      {!flipped && <div className="flashcards-sub" style={{ marginBottom: 16 }}>Tap the card to reveal the answer</div>}
      {gradeError && <div className="task-empty">{gradeError}</div>}
      {flipped && (
        <div className="study-grade-buttons">
          {GRADES.map((g) => (
            <button key={g.key} type="button" className={g.className} disabled={grading} onClick={() => grade(g.quality, g.key)}>
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
