import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { StudentProfile } from '../types/profile';

interface AuthContextValue {
  session: Session | null;
  profile: StudentProfile | null;
  profileLoading: boolean;
  authModalMode: 'signup' | 'login' | null;
  openSignupModal: () => void;
  openLoginModal: () => void;
  closeAuthModal: () => void;
  signUp: (email: string, password: string) => Promise<{ hasSession: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SIGNUP_REDIRECT_URL = 'https://d2gtuofwzvtzpk.cloudfront.net/verified.html';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login' | null>(null);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', currentSession.user.id)
      .maybeSingle();
    if (error) {
      console.error('Could not load profile', error);
      setProfile(null);
    } else {
      setProfile(data as StudentProfile | null);
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: SIGNUP_REDIRECT_URL },
    });
    if (error) throw new Error(error.message);
    return { hasSession: Boolean(data.session) };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const value: AuthContextValue = {
    session,
    profile,
    profileLoading,
    authModalMode,
    openSignupModal: () => setAuthModalMode('signup'),
    openLoginModal: () => setAuthModalMode('login'),
    closeAuthModal: () => setAuthModalMode(null),
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
