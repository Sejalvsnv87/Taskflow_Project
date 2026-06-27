import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Boards' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/search', label: 'Search' },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const linkClass = (path: string) =>
    location.pathname.startsWith(path) ? 'nav-link-active' : 'nav-link-inactive';

  return (
    <nav className="sticky top-0 z-50 border-b border-sage-100/80 bg-white/75 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-500 text-sm font-bold text-white shadow-sm dark:rounded-lg dark:bg-primary-600">
              TF
            </div>
            <span className="font-display text-lg font-semibold italic text-ink-deep dark:font-sans dark:not-italic dark:text-white">
              TaskFlow
            </span>
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition dark:rounded-lg ${linkClass(link.to)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-ink-muted transition hover:bg-sage-50 dark:rounded-lg dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user && (
            <>
              <span className="hidden text-sm text-ink-muted dark:text-gray-400 md:inline">{user.name}</span>
              <button onClick={logout} className="btn-secondary hidden text-xs sm:inline-flex">
                Logout
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl p-2 text-ink-muted transition hover:bg-sage-50 sm:hidden dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/20 sm:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute left-0 right-0 top-14 z-50 border-b border-sage-100 bg-white/95 px-4 py-4 shadow-soft backdrop-blur-md sm:hidden dark:border-gray-800 dark:bg-gray-900/95">
            {user && (
              <p className="mb-3 text-sm font-medium text-ink-deep dark:text-white">{user.name}</p>
            )}
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${linkClass(link.to)}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {user && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="btn-secondary mt-4 w-full text-sm"
              >
                Logout
              </button>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
