// src/pages/app/FlashcardsPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import type { FlashcardDeck } from '../../types/flashcard';

interface DeckWithCount extends FlashcardDeck {
  flashcards: { count: number }[];
}

export function FlashcardsPage() {
  const { session } = useAuth();
  const [decks, setDecks] = useState<DeckWithCount[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadDecks = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('id,user_id,title,created_at,flashcards(count)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(true);
      setDecks(null);
      return;
    }
    setDecks(data as DeckWithCount[]);
  }, [session]);

  const loadDueCount = useCallback(async () => {
    if (!session) return;
    const { count, error } = await supabase
      .from('flashcards')
      .select('id, flashcard_decks!inner(user_id)', { count: 'exact', head: true })
      .eq('flashcard_decks.user_id', session.user.id)
      .lte('due_date', toLocalISODate(new Date()));
    if (error) {
      console.error('Could not load due count', error);
      return;
    }
    setDueCount(count ?? 0);
  }, [session]);

  useEffect(() => {
    loadDecks();
    loadDueCount();
  }, [loadDecks, loadDueCount]);

  async function createDeck() {
    if (!session || !newDeckTitle.trim()) return;
    setCreateError('');
    const { error } = await supabase
      .from('flashcard_decks')
      .insert({ user_id: session.user.id, title: newDeckTitle.trim() });
    if (error) {
      console.error('Could not create deck', error);
      setCreateError('Could not create deck, please try again.');
      return;
    }
    setNewDeckTitle('');
    setShowNewDeckForm(false);
    await loadDecks();
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-top">
        <div>
          <div className="flashcards-title">Flashcards</div>
          <div className="flashcards-sub">Study with spaced repetition</div>
        </div>
        <div className="flashcards-actions">
          <button type="button" className="new-deck-btn" onClick={() => { setCreateError(''); setShowNewDeckForm((v) => !v); }}>
            + New deck
          </button>
          {dueCount > 0 ? (
            <Link to="/app/flashcards/study" className="study-now-btn">Study now ({dueCount})</Link>
          ) : (
            <button type="button" className="study-now-btn disabled" disabled>Study now</button>
          )}
        </div>
      </div>

      {showNewDeckForm && (
        <div className="add-card-form">
          <input
            type="text"
            placeholder="Deck name"
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createDeck(); }}
          />
          <button type="button" onClick={createDeck}>Create deck</button>
          {createError && <div className="task-empty">{createError}</div>}
        </div>
      )}

      {loadError && <div className="task-empty">Couldn&apos;t load decks right now.</div>}
      {!loadError && decks === null && <div className="task-empty">Loading...</div>}
      {!loadError && decks !== null && decks.length === 0 && (
        <div className="task-empty">No decks yet — tap + New deck to create one.</div>
      )}
      {!loadError && decks !== null && decks.length > 0 && (
        <div className="deck-grid">
          {decks.map((deck) => (
            <Link key={deck.id} to={`/app/flashcards/${deck.id}`} className="deck-card">
              <div className="deck-card-title">{deck.title}</div>
              <div className="deck-card-count">{deck.flashcards[0]?.count ?? 0} cards</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
