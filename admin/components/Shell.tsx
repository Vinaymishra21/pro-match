'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getToken } from '../lib/api';
import { Spinner } from '../lib/ui';

const NAV = [
  { href: '/', label: 'Overview', ic: '◈' },
  { href: '/users', label: 'Users', ic: '👥' },
  { href: '/reports', label: 'Reports', ic: '🚩', badgeKey: 'reportsOpen' },
  { href: '/matches', label: 'Matches', ic: '💞' }
];

// Wraps every authenticated page: guards the token, renders sidebar + main.
export function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(0);
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
    // Load the open-reports badge + cached admin identity.
    api
      .stats()
      .then((s) => setReportsOpen(s.stats.reportsOpen))
      .catch(() => {});
    try {
      const raw = localStorage.getItem('promatch_admin_who');
      if (raw) setAdmin(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [router]);

  function logout() {
    clearToken();
    localStorage.removeItem('promatch_admin_who');
    router.replace('/login');
  }

  if (!ready) return <Spinner />;

  const badges: Record<string, number> = { reportsOpen };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">P</div>
          <div>
            <div className="brand-name">Pro Match</div>
            <div className="brand-sub">Admin</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            const badge = n.badgeKey ? badges[n.badgeKey] : 0;
            return (
              <Link key={n.href} href={n.href} className={`nav-item ${active ? 'active' : ''}`}>
                <span className="ic">{n.ic}</span>
                {n.label}
                {badge ? <span className="nav-badge">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="admin-chip">
            <div className="admin-avatar">{(admin?.name || 'A').charAt(0).toUpperCase()}</div>
            <div>
              <div className="admin-name">{admin?.name || 'Admin'}</div>
              <div className="admin-role">Administrator</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="page-head fade-in">
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-sub">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
