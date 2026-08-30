import { useEffect, useRef, type MouseEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Hero() {
  const { openSignupModal } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // React sets `.muted` as a live property but never writes the `muted`
    // HTML attribute (facebook/react#10389) — force it explicitly so iOS
    // Safari's autoplay check never has reason to doubt it.
    videoRef.current?.setAttribute('muted', '');
  }, []);

  function handleGetStarted(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <section className="hero" id="hero">
      <video ref={videoRef} className="hero-video" autoPlay muted loop playsInline poster="/assets/hero-poster.jpg">
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
