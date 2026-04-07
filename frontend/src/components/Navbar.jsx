import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Blocks, FileCheck2, LogOut, MoonStar, SunMedium } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = useMemo(() => {
    if (!user) {
      return [{ to: '/verify', label: 'Verify' }];
    }
    if (user.role === 'admin') {
      return [{ to: '/dashboard/admin', label: 'Admin Hub' }, { to: '/issue', label: 'Issue' }];
    }
    if (user.role === 'issuer') {
      return [{ to: '/dashboard/issuer', label: 'Issuer Hub' }, { to: '/issue', label: 'Issue' }];
    }
    return [{ to: '/dashboard/verifier', label: 'Verifier Hub' }, { to: '/verify', label: 'Verify' }];
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-[0_18px_50px_-18px_rgba(15,118,110,0.55)]">
            <Blocks size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">CertiBlock</p>
            <p className="text-sm font-semibold text-[color:var(--text)]">Certificate Trust Layer</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-full px-4 py-2 text-sm transition ${location.pathname === link.to ? 'bg-[color:var(--card-strong)] text-[color:var(--text)]' : 'text-[color:var(--muted)] hover:bg-[color:var(--card)] hover:text-[color:var(--text)]'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleTheme} className="rounded-full border border-[color:var(--border)] bg-[color:var(--card)] p-2.5 text-[color:var(--muted)] transition hover:text-[color:var(--text)]">
            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
          {user ? (
            <>
              <div className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 md:block">
                <p className="text-sm font-medium text-[color:var(--text)]">{user.name}</p>
                <p className="text-xs capitalize text-[color:var(--muted)]">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--card)] p-2.5 text-[color:var(--muted)] transition hover:text-[color:var(--danger)]"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]">Login</Link>
              <Link to="/verify" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--accent-foreground)]">
                <FileCheck2 size={16} /> Verify
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
