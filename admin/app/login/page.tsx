'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.login(email.trim(), password);
      setToken(res.token);
      localStorage.setItem('promatch_admin_who', JSON.stringify(res.admin));
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card fade-in" onSubmit={submit}>
        <div className="login-logo">⚡</div>
        <div className="login-title">Pro Match Admin</div>
        <div className="login-sub">Sign in to the moderation dashboard</div>

        <label className="field-label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@promatch.app"
          autoComplete="username"
        />

        <label className="field-label">Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error ? <div className="login-err">{error}</div> : null}

        <button className="btn primary" type="submit" disabled={busy} style={{ width: '100%', marginTop: 22, padding: 13 }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-hint">Admin access only · authorized personnel</div>
      </form>
    </div>
  );
}
