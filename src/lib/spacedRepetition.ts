import { toLocalISODate } from './date';

export type ReviewQuality = 0 | 3 | 4 | 5;

export interface ReviewState {
  interval: number;
  repetitions: number;
  ease_factor: number;
}

export interface ReviewResult extends ReviewState {
  due_date: string;
}

export function computeNextReview(
  quality: ReviewQuality,
  card: ReviewState,
  today: Date = new Date()
): ReviewResult {
  let { interval, repetitions, ease_factor } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
  }

  ease_factor = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    repetitions,
    ease_factor,
    due_date: toLocalISODate(dueDate),
  };
}
