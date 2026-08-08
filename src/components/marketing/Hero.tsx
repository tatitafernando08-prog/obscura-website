import type { MouseEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Hero() {
  const { openSignupModal } = useAuth();

  function handleGetStarted(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <section className="hero" id="hero">
      <video className="hero-video" autoPlay muted loop playsInline>
        <source src="/assets/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1>Study smarter.<br />Score <span className="accent">higher.</span></h1>
        <p>Meet NESH, your AI-powered study companion built for O/L and A/L students. Past papers, smart planning, and real-time help, all in one place.</p>
        <a href="#download" className="btn-primary" onClick={handleGetStarted}>Get Started</a>
      </div>
    </section>
  );
}
