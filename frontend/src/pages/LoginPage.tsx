import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function AuthDecor() {
  return (
    <>
      <div className="light-deco-blob -left-20 top-20 h-72 w-72 bg-sage-200/40 blur-3xl" />
      <div className="light-deco-blob -right-10 bottom-20 h-56 w-56 bg-sand-200/50 blur-2xl" />
      <div className="absolute left-10 top-1/3 hidden h-24 w-12 rounded-t-full rounded-b-full bg-sage-200/50 dark:hidden md:block" />
      <div className="absolute right-16 top-20 hidden text-honey-200 dark:hidden md:block">☀</div>
      <div className="absolute bottom-1/4 left-1/4 hidden text-sage-300 dark:hidden md:block">✦</div>
    </>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthDecor />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500 text-lg font-bold text-white shadow-soft dark:h-12 dark:w-12 dark:rounded-xl dark:bg-primary-600 dark:shadow-none">
            TF
          </div>
          <h1 className="page-heading text-3xl">Welcome back</h1>
          <p className="page-subheading mt-2">Sign in to your TaskFlow account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-deep dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-deep dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </button>

          <p className="text-center text-sm text-ink-muted dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-sage-600 hover:text-sage-700 dark:text-primary-400">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
