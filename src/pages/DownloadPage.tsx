import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext';

interface DownloadFeature {
  colorClass: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const DOWNLOAD_FEATURES: DownloadFeature[] = [
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
    title: 'NESH AI, on the go',
    description: 'Ask questions and get explanations from anywhere, no need to be at your desk.',
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
    title: 'Flashcards offline',
    description: 'Review your decks on the bus, between classes, or wherever you have a spare minute.',
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
    title: 'Planner reminders',
    description: 'Push notifications keep your study schedule and exam dates front of mind.',
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
    title: 'Past papers anywhere',
    description: 'The same past-paper library from the web app, right in your pocket.',
  },
];

function DownloadFeatureCard({ feature }: { feature: DownloadFeature }) {
  const card = useReveal<HTMLDivElement>();
  return (
    <div ref={card.ref} className={`${card.className} feature-card`}>
      <div className={`feature-icon-box ${feature.colorClass}`}>{feature.icon}</div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  );
}

export function DownloadPage() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const card = useReveal<HTMLDivElement>();
  const { openSignupModal } = useAuth();

  return (
    <>
      <section className="download-hero">
        <div ref={label.ref} className={`${label.className} section-label`}>Download</div>
        <h1 ref={title.ref} className={`${title.className} section-title`}>Obscura, now in your pocket</h1>
        <p ref={sub.ref} className={`${sub.className} section-sub`}>The same AI study companion you use on the web, NESH chat, flashcards, past papers, and your planner, built for your phone so you can study anywhere.</p>
      </section>

      <section className="features" id="download-features">
        <div className="features-grid download-features-grid">
          {DOWNLOAD_FEATURES.map((feature) => (
            <DownloadFeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      <section className="download-cta-section">
        <div ref={card.ref} className={`${card.className} download-card`}>
          <img src="/assets/logo.png" alt="Obscura logo" className="download-card-logo" />
          <h2>Obscura for Android</h2>
          <p className="download-card-sub">We're putting the finishing touches on the app. Sign up and we'll email you the moment it's ready to install.</p>
          <button type="button" className="download-btn" onClick={() => openSignupModal()}>
            <span className="download-btn-label">Coming Soon</span>
            <span className="download-btn-sub">Notify me when it's ready</span>
          </button>
          <p className="download-card-note">Android APK &middot; iOS coming later</p>
        </div>
      </section>
    </>
  );
}
