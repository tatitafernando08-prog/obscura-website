import { useRef } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  { initials: 'SP', name: 'Mrs. S. Perera', role: 'Mathematics Teacher', quote: "My students use NESH to revise past papers on their own time, and I've genuinely seen their exam confidence improve this term." },
  { initials: 'RJ', name: 'Mr. R. Jayasinghe', role: 'Economics Teacher', quote: 'Having answers grounded in real past papers instead of generic explanations makes a real difference for A/L students under pressure.' },
  { initials: 'NF', name: 'Mrs. N. Fernando', role: 'Science Teacher', quote: "I recommend the Pomodoro planner to every student I mentor. It's such a simple idea, but it actually gets them to sit down and study." },
];

export function Testimonials() {
  const rating = useReveal<HTMLDivElement>();
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(amount: number) {
    trackRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-inner">
        <div ref={rating.ref} className={`${rating.className} testimonials-rating`}>
          <div className="rating-number">4.8</div>
          <div className="rating-stars-big">★★★★★</div>
          <div className="rating-label">Excellent</div>
          <div className="rating-count">Based on early feedback</div>
          <div className="rating-source">from teachers &amp; students</div>
        </div>

        <div className="testimonials-scroll-wrap">
          <button className="testimonial-arrow left" aria-label="Previous" onClick={() => scroll(-320)}>‹</button>
          <div className="testimonials-track" ref={trackRef}>
            {TESTIMONIALS.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-card-head">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-quote">"{t.quote}"</p>
              </div>
            ))}
          </div>
          <button className="testimonial-arrow right" aria-label="Next" onClick={() => scroll(320)}>›</button>
        </div>
      </div>
    </section>
  );
}
