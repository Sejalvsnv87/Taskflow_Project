import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function AuthDecor() {
  return (
    <>
      <div className="light-deco-blob -left-20 top-20 h-72 w-72 bg-sage-200/40 blur-3xl" />
      <div className="light-deco-blob -right-10 bottom-20 h-56 w-56 bg-honey-200/50 blur-2xl" />
      <div className="absolute right-20 top-1/4 hidden h-20 w-10 rounded-t-full rounded-b-full bg-sand-200/60 dark:hidden md:block" />
    </>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          const fields: Record<string, string> = {};
          err.errors.forEach((e) => {
            fields[e.field] = e.message;
          });
          setFieldErrors(fields);
        }
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthDecor />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500 text-lg font-bold text-white shadow-soft dark:h-12 dark:w-12 dark:rounded-xl dark:bg-primary-600">
            TF
          </div>
          <h1 className="page-heading text-3xl">Create your account</h1>
          <p className="page-subheading mt-2">Start managing tasks smarter</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-deep dark:text-gray-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="John Doe"
              required
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

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
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-deep dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </button>

          <p className="text-center text-sm text-ink-muted dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-sage-600 hover:text-sage-700 dark:text-primary-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
