import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);

  useEffect(() => {
    let mounted = true;
    let toastShown = false;

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        const newUser = session?.user ?? null;
        const previousUser = user;
        
        setUser(newUser);
        setLoading(false);
        
        // Only show toasts for actual auth events, not initial loads or refreshes
        if (event === 'SIGNED_IN' && newUser && !previousUser && !toastShown && !hasShownWelcomeToast) {
          toastShown = true;
          setHasShownWelcomeToast(true);
          
          // Small delay to ensure the toast doesn't conflict with page transitions
          setTimeout(() => {
            if (mounted && !toastShown) {
              if (newUser.app_metadata?.provider === 'google') {
                toast.success('Successfully signed in with Google!');
              } else {
                toast.success('Welcome back! You\'re now signed in.');
              }
            }
          }, 500);
        } else if (event === 'SIGNED_OUT' && !newUser && previousUser) {
          setHasShownWelcomeToast(false);
          toastShown = false;
          toast.success('You have been signed out successfully.');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove user dependency to prevent infinite loops

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            schema_mode_enabled: false, // Default to false
          }
        }
      });
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: { message: 'Network error during sign up' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: { message: 'Network error during sign in' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`
        }
      });
      return { data, error };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error: { message: 'Network error during Google sign in' } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'Network error during sign out' } };
    }
  };

  // Helper function to check if schema mode is enabled
  const isSchemaMode = () => {
    return user?.user_metadata?.schema_mode_enabled === true;
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isSchemaMode,
  };
};