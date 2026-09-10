import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { href: '/#hero', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#features', label: 'Features' },
  { href: '/#nesh', label: 'NESH AI' },
  { href: '/#robot', label: 'Robot' },
  { href: '/#contact', label: 'Contact' },
];

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openSignupModal } = useAuth();

  useEffect(() => {
    let lastY = window.scrollY;
    function onScroll() {
      const nav = navRef.current;
      if (!nav) return;
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 50);

      if (y <= 50) {
        nav.classList.remove('nav-hidden');
      } else if (y - lastY > 5) {
        nav.classList.add('nav-hidden');
      } else if (y - lastY < -5) {
        nav.classList.remove('nav-hidden');
      }
      lastY = y;
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
  }

  function handleSignupClick(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <nav ref={navRef}>
      <Link to="/#hero" className="logo">
        <img src="/assets/logo.png" alt="Obscura logo" />
        OBSCURA
      </Link>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link to={link.href}>{link.label}</Link>
          </li>
        ))}
        <li><Link to="/download">Download</Link></li>
        <li><a href="#download" className="nav-cta" onClick={handleSignupClick}>Sign Up</a></li>
      </ul>
      <div className={`hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen((o) => !o)}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} to={link.href} onClick={closeMobile}>{link.label}</Link>
        ))}
        <Link to="/download" onClick={closeMobile}>Download</Link>
        <a href="#download" onClick={(e) => { handleSignupClick(e); closeMobile(); }}>Sign Up</a>
      </div>
    </nav>
  );
}
