'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // 2. Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode: read session from localStorage
      const savedUser = localStorage.getItem('taskflow_demo_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }
  }, []);

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Supabase signups might require email verification depending on project settings
        return data;
      } else {
        // Demo Mode Signup
        const users = JSON.parse(localStorage.getItem('taskflow_demo_users') || '[]');
        if (users.find(u => u.email === email)) {
          throw new Error('User already exists in Demo Database.');
        }

        const newUser = {
          id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
          email,
          password, // stored for demo verification only
          created_at: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem('taskflow_demo_users', JSON.stringify(users));
        
        // Log in immediately on sign up
        const sessionUser = { id: newUser.id, email: newUser.email };
        localStorage.setItem('taskflow_demo_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { user: sessionUser };
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      } else {
        // Demo Mode Login
        const users = JSON.parse(localStorage.getItem('taskflow_demo_users') || '[]');
        const existingUser = users.find(u => u.email === email);
        
        if (!existingUser) {
          throw new Error('User not found in Demo Database. Please sign up.');
        }
        
        if (existingUser.password !== password) {
          throw new Error('Invalid credentials.');
        }

        const sessionUser = { id: existingUser.id, email: existingUser.email };
        localStorage.setItem('taskflow_demo_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { user: sessionUser };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        localStorage.removeItem('taskflow_demo_user');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isDemoMode,
    signUp,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
