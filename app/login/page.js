'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, LogIn, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isDemoMode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      setSuccess('Logged in successfully! Redirecting...');
      
      // Clear forms
      setEmail('');
      setPassword('');
      
      // Delay redirect to show success state
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
    }}>
      <div className="glass-panel modal-content animate-slide-up" style={{
        padding: '2.5rem 2rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: 'var(--shadow-glow)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '12px',
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            marginBottom: '1rem',
          }}>
            <LogIn size={28} />
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Log in to access your TaskFlow dashboard</p>
        </div>

        {/* Demo Mode / Supabase Mode Alert Banner */}
        <div style={{ marginBottom: '1.5rem' }}>
          {isDemoMode ? (
            <div className="alert-banner" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
              <AlertTriangle className="alert-banner-icon" size={18} />
              <div>
                <strong>Demo Mode Active:</strong> You can log in with any credentials you signed up with locally. (Try <em>demo@taskflow.io / 123456</em> after signing up!)
              </div>
            </div>
          ) : (
            <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.15)', color: '#d1fae5' }}>
              <CheckCircle2 style={{ color: 'var(--success)' }} size={18} />
              <div>
                <strong>Supabase Connected:</strong> Syncing tasks to your remote cloud database.
              </div>
            </div>
          )}
        </div>

        {/* Form Error / Success Banners */}
        {error && (
          <div className="alert-banner" style={{
            background: 'rgba(244, 63, 94, 0.1)',
            borderColor: 'rgba(244, 63, 94, 0.2)',
            color: '#fecdd3',
            marginBottom: '1.5rem',
          }}>
            <AlertTriangle style={{ color: 'var(--danger)' }} size={18} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="alert-banner" style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.2)',
            color: '#d1fae5',
            marginBottom: '1.5rem',
          }}>
            <CheckCircle2 style={{ color: 'var(--success)' }} size={18} />
            <div>{success}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                disabled={submitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', height: '3rem' }}
            disabled={submitting}
          >
            {submitting ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        {/* Redirection link */}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
