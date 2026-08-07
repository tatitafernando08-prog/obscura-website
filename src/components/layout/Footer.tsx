import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-col footer-brand">
          <Link to="/#hero" className="logo footer-logo">
            <img src="/assets/logo.png" alt="Obscura logo" />
            OBSCURA
          </Link>
          <p className="footer-tagline">Your all-in-one study companion, built for O/L and A/L students, everywhere.</p>
          <div className="footer-socials">
            <a href="https://www.instagram.com/obscura.edux/" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.8} />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth={1.8} />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
              </svg>
            </a>
            <a href="https://x.com/Obscuraedux" target="_blank" rel="noreferrer" className="social-icon" aria-label="X">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </a>
            <a href="mailto:obscurabytechlume@gmail.com" className="social-icon" aria-label="Email">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
                <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/#hero">Home</Link>
          <Link to="/#about">About</Link>
          <Link to="/#features">Features</Link>
          <Link to="/#contact">Contact</Link>
        </div>

        <div className="footer-col">
          <h4>Features</h4>
          <Link to="/#features">NESH AI Chat</Link>
          <Link to="/#features">Past Papers</Link>
          <Link to="/#features">Pomodoro Timer</Link>
          <Link to="/#features">Flashcards</Link>
        </div>

        <div className="footer-col">
          <h4>Get in Touch</h4>
          <a href="mailto:obscurabytechlume@gmail.com" className="footer-contact-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
              <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            obscurabytechlume@gmail.com
          </a>
          <a href="https://www.instagram.com/obscura.edux/" target="_blank" rel="noreferrer" className="footer-contact-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.8} />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth={1.8} />
              <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
            </svg>
            Instagram
          </a>
          <a href="https://x.com/Obscuraedux" target="_blank" rel="noreferrer" className="footer-contact-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
            Twitter
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Obscura. All rights reserved. Built for VisioNEX Inter-School Hackathon Competition.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
