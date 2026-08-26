// src/pages/app/DeckPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Flashcard, FlashcardDeck } from '../../types/flashcard';
import { AiGenerateModal } from '../../components/flashcards/AiGenerateModal';

export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [addCardError, setAddCardError] = useState('');

  const loadDeck = useCallback(async () => {
    if (!session || !deckId) return;
    setLoadError(false);
    const [deckRes, cardsRes] = await Promise.all([
      supabase.from('flashcard_decks').select('id,user_id,title,created_at').eq('id', deckId).single(),
      supabase
        .from('flashcards')
        .select('id,deck_id,front,back,source,interval,repetitions,ease_factor,due_date,last_reviewed_at,created_at')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false }),
    ]);
    if (deckRes.error || cardsRes.error) {
      setLoadError(true);
      return;
    }
    setDeck(deckRes.data as FlashcardDeck);
    setCards(cardsRes.data as Flashcard[]);
  }, [session, deckId]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  async function addCard() {
    if (!deckId || !front.trim() || !back.trim()) return;
    setAddCardError('');
    const { error } = await supabase.from('flashcards').insert({
      deck_id: deckId,
      front: front.trim(),
      back: back.trim(),
      source: 'manual',
    });
    if (error) {
      console.error('Could not save card', error);
      setAddCardError('Could not save card, please try again.');
      return;
    }
    setFront('');
    setBack('');
    setShowAddForm(false);
    await loadDeck();
  }

  async function deleteCard(cardId: string) {
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (error) {
      console.error('Could not delete card', error);
      return;
    }
    await loadDeck();
  }

  async function deleteDeck() {
    if (!deckId) return;
    if (!window.confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', deckId);
    if (error) console.error('Could not delete deck', error);
    navigate('/app/flashcards');
  }

  if (loadError) return <div className="task-empty">Couldn&apos;t load this deck right now.</div>;
  if (!deck || cards === null) return <div className="task-empty">Loading...</div>;

  return (
    <div className="flashcards-page">
      <Link to="/app/flashcards" className="deck-back-link">&larr; All decks</Link>
      <div className="deck-page-top">
        <div className="deck-page-title">{deck.title}</div>
        <div className="deck-page-actions">
          <button type="button" className="new-deck-btn" onClick={() => { setAddCardError(''); setShowAddForm((v) => !v); }}>
            + Add card
          </button>
          <button type="button" className="new-deck-btn" onClick={() => setShowAiModal(true)}>
            Generate with AI
          </button>
          <button type="button" className="deck-delete-btn" onClick={deleteDeck}>Delete deck</button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-card-form">
          <input type="text" placeholder="Front" value={front} onChange={(e) => setFront(e.target.value)} />
          <textarea placeholder="Back" value={back} onChange={(e) => setBack(e.target.value)} rows={2} />
          <button type="button" onClick={addCard}>Save card</button>
          {addCardError && <div className="task-empty">{addCardError}</div>}
        </div>
      )}

      {cards.length === 0 && <div className="task-empty">No cards yet — add one manually.</div>}
      {cards.map((card) => (
        <div className="card-row" key={card.id}>
          <div className="card-row-front">
            {card.front}
            {card.source === 'ai' && <span className="card-row-source">AI</span>}
          </div>
          <div className="card-row-back">{card.back}</div>
          <button type="button" className="ai-stage-discard" onClick={() => deleteCard(card.id)}>Delete</button>
        </div>
      ))}

      {showAiModal && (
        <AiGenerateModal
          deckId={deckId!}
          onClose={() => setShowAiModal(false)}
          onSaved={loadDeck}
        />
      )}
    </div>
  );
}
