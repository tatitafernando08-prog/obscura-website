import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export function NewsletterModal() {
  const { authModalMode } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed && authModalMode === null) {
        setOpen(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
    // Intentionally runs once on mount, matching the original 4s-delay popup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setOpen(false);
    setDismissed(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('newsletter_subscribers').insert({ email });
      if (insertError) {
        const message = insertError.code === '23505' ? "You're already on the list!" : insertError.message;
        throw new Error(message);
      }
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="newsletter-overlay open" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="newsletter-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={close}>&times;</button>
        <img src="/assets/mascot_wave.png" alt="NESH waving" className="newsletter-mascot" />
        {!subscribed ? (
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <h3>Get study tips from NESH</h3>
            <p className="modal-sub">NESH will send you helpful tips and updates straight to your inbox, no spam, unsubscribe anytime.</p>
            <input
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div className="modal-error visible">{error}</div>}
            <button type="submit" className="btn-primary modal-submit" disabled={submitting}>
              {submitting ? 'Subscribing...' : 'Subscribe'}
            </button>
            <a href="#" className="modal-switch-plain" onClick={(e) => { e.preventDefault(); close(); }}>No thanks</a>
          </form>
        ) : (
          <div className="newsletter-success" style={{ display: 'block' }}>
            <h3>You&apos;re subscribed!</h3>
            <p>Thanks for joining, we&apos;ll keep you posted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
