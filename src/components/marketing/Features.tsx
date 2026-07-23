import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface Feature {
  colorClass: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    colorClass: 'purple',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <circle cx="9" cy="10" r="1.1" fill="currentColor" />
        <circle cx="12" cy="10" r="1.1" fill="currentColor" />
        <circle cx="15" cy="10" r="1.1" fill="currentColor" />
      </svg>
    ),
    title: 'NESH AI Chat',
    description: 'Ask anything, NESH searches real past papers and explains concepts clearly in your language.',
  },
  {
    colorClass: 'orange',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.5 3.5h8l3 3v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M14 3.5v3h3" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
    ),
    title: 'Past Papers',
    description: 'Access years of O/L and A/L past papers, track your scores, and identify weak areas over time.',
  },
  {
    colorClass: 'red',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={1.8} />
        <path d="M12 9v4l2.6 2.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 2.5h5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      </svg>
    ),
    title: 'Pomodoro Timer',
    description: 'Study in focused sprints with short breaks, a proven technique to stay sharp without burning out.',
  },
  {
    colorClass: 'green',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5.5" y="7.5" width="12" height="14" rx="2" transform="rotate(-8 11.5 14.5)" stroke="currentColor" strokeWidth={1.7} />
        <rect x="7" y="4" width="12" height="14" rx="2" fill="#F9F7FF" stroke="currentColor" strokeWidth={1.7} />
        <path d="M10 9h6M10 12h6M10 15h3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    ),
    title: 'Smart Flashcards',
    description: 'Create and review flashcard decks for any subject, track progress, and master key concepts fast.',
  },
  {
    colorClass: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth={1.8} />
        <path d="M4 9.5h16" stroke="currentColor" strokeWidth={1.8} />
        <path d="M8 3v3.2M16 3v3.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="8.3" cy="13" r="1" fill="currentColor" />
        <circle cx="12" cy="13" r="1" fill="currentColor" />
        <circle cx="15.7" cy="13" r="1" fill="currentColor" />
        <circle cx="8.3" cy="16.5" r="1" fill="currentColor" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
    ),
    title: 'Study Planner',
    description: 'Plan your week around your syllabus and exam dates, stay organised, and never miss a deadline.',
  },
  {
    colorClass: 'teal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth={1.8} />
        <path d="M15.3 15.3 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        <path d="M8 10.5h5M10.5 8v5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      </svg>
    ),
    title: 'Quick Search',
    description: 'Search semantically across every past paper, find exactly what you need even without exact keywords.',
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const card = useReveal<HTMLDivElement>();
  return (
    <div ref={card.ref} className={`${card.className} feature-card`}>
      <div className={`feature-icon-box ${feature.colorClass}`}>{feature.icon}</div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  );
}

export function Features() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();

  return (
    <section className="features" id="features">
      <div ref={label.ref} className={label.className}>Features</div>
      <h2 ref={title.ref} className={title.className}>Everything you need to ace your exams</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>6+ powerful tools, one app, built around how students actually study.</p>
      <div className="features-grid">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
