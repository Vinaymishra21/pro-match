'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminUser, api, clearToken, getToken } from '../lib/api';
import { Avatar, ProfChip, Spinner } from '../lib/ui';

const NAV = [
  { href: '/', label: 'Overview', ic: '◇' },
  { href: '/users', label: 'Users', ic: '👥' },
  { href: '/reports', label: 'Reports', ic: '🚩', badgeKey: 'reportsOpen' },
  { href: '/verifications', label: 'Verify', ic: '🛡️' },
  { href: '/matches', label: 'Matches', ic: '💞' }
];

export function Shell({
  children,
  title,
  subtitle,
  actions
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(0);
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);

  // Global search
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AdminUser[] | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
    api.stats().then((s) => setReportsOpen(s.stats.reportsOpen)).catch(() => {});
    try {
      const raw = localStorage.getItem('promatch_admin_who');
      if (raw) setAdmin(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [router]);

  // Debounced global user search.
  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      api.users({ search: q, page: 1 }).then((r) => setResults(r.users.slice(0, 6))).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function logout() {
    clearToken();
    localStorage.removeItem('promatch_admin_who');
    router.replace('/login');
  }

  if (!ready) return <Spinner />;

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
            const badge = n.badgeKey === 'reportsOpen' ? reportsOpen : 0;
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
          <button className="logout-btn" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle ? <div className="topbar-sub">{subtitle}</div> : null}
          </div>
          <div className="topbar-spacer" />

          {/* Global search */}
          <div className="global-search" ref={boxRef}>
            <span className="gs-ic">🔍</span>
            <input
              placeholder="Search users…"
              value={q}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
            />
            {open && q.trim() ? (
              <div className="gs-results">
                {results === null ? (
                  <div className="gs-empty">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="gs-empty">No users found</div>
                ) : (
                  results.map((u) => (
                    <Link
                      key={u.id}
                      href={`/users?focus=${u.id}`}
                      className="gs-item"
                      onClick={() => {
                        setOpen(false);
                        setQ('');
                      }}
                    >
                      <Avatar photo={u.photo} name={u.name} />
                      <div style={{ flex: 1 }}>
                        <div className="u-name">{u.name}</div>
                        <div className="u-meta">{u.email || u.phone}</div>
                      </div>
                      <ProfChip profession={u.profession} />
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {actions}
        </div>

        <div className="content fade-in">{children}</div>
      </main>
    </div>
  );
}
