export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source: 'manual' | 'ai';
  interval: number;
  repetitions: number;
  ease_factor: number;
  due_date: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface NewFlashcard {
  deck_id: string;
  front: string;
  back: string;
  source: 'manual' | 'ai';
}
