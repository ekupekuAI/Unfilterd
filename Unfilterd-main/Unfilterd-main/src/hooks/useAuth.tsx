/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return data as Profile | null;
  }, []);

  const ensureProfile = useCallback(async (user: User) => {
    const profile = await fetchProfile(user.id);
    if (profile) return profile;

    const username = user.user_metadata?.username;
    const fallbackUsername = typeof username === 'string' && username.trim()
      ? username.trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || `anon_${user.id.slice(0, 8)}`
      : `anon_${user.id.slice(0, 8)}`;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: fallbackUsername,
        display_name: 'Anonymous Soul',
        avatar_seed: fallbackUsername,
      })
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const profile = await ensureProfile(session.user);
          if (!mounted) return;
          setState({ user: session.user, profile, session, loading: false });
        } else {
          setState({ user: null, profile: null, session: null, loading: false });
        }
      } catch {
        if (!mounted) return;
        setState({ user: null, profile: null, session: null, loading: false });
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            const profile = await ensureProfile(session.user);
            setState({ user: session.user, profile, session, loading: false });
          } else {
            setState({ user: null, profile: null, session: null, loading: false });
          }
        } catch {
          setState({ user: null, profile: null, session: null, loading: false });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    return { error: null, needsEmailConfirmation: !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, session: null, loading: false });
  };

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await ensureProfile(state.user);
      setState(prev => ({ ...prev, profile }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
