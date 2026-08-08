import { useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type View = 'form' | 'success';

export function SignupLoginModal() {
  const { authModalMode, closeAuthModal, openSignupModal, openLoginModal, signUp, signIn, session } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState('');

  if (!authModalMode) return null;

  const isSignup = authModalMode === 'signup';

  function resetAndClose() {
    setView('form');
    setEmail('');
    setPassword('');
    setError('');
    closeAuthModal();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        const { hasSession } = await signUp(email, password);
        setSuccessText(hasSession
          ? 'Your account is ready. Welcome to Obscura!'
          : 'Almost there — check your inbox to confirm your email.');
      } else {
        await signIn(email, password);
        setSuccessText("Welcome back! You're logged in.");
      }
      setView('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDone() {
    if (!session) {
      resetAndClose();
      return;
    }
    const { data } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
    resetAndClose();
    navigate(data ? '/app/dashboard' : '/onboarding');
  }

  function switchMode(e: MouseEvent) {
    e.preventDefault();
    setError('');
    setEmail('');
    setPassword('');
    if (isSignup) openLoginModal(); else openSignupModal();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}>
      <div className="modal-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={resetAndClose}>&times;</button>

        {view === 'form' && (
          <form className="modal-form" onSubmit={handleSubmit}>
            <img src="/assets/logo.png" alt="Obscura logo" className="modal-logo" />
            <h3>{isSignup ? 'Create your account' : 'Welcome back'}</h3>
            <p className="modal-sub">
              {isSignup
                ? 'Get instant access to Obscura on the web, no app download needed.'
                : 'Log in to continue with Obscura.'}
            </p>

            <label htmlFor="authEmail">Email</label>
            <input
              type="email"
              id="authEmail"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="authPassword">Password</label>
            <input
              type="password"
              id="authPassword"
              required
              minLength={isSignup ? 8 : undefined}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="modal-error visible">{error}</div>}

            <button type="submit" className="btn-primary modal-submit" disabled={submitting}>
              {submitting ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Create Account' : 'Log In')}
            </button>
            <p className="modal-switch">
              {isSignup ? (
                <>Already have an account? <a href="#" onClick={switchMode}>Log in</a></>
              ) : (
                <>Don&apos;t have an account? <a href="#" onClick={switchMode}>Sign up</a></>
              )}
            </p>
          </form>
        )}

        {view === 'success' && (
          <div className="modal-success" style={{ display: 'block' }}>
            <h3>{isSignup ? "You're in!" : 'Welcome back!'}</h3>
            <p>{successText}</p>
            <button className="btn-primary" type="button" onClick={handleDone}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
