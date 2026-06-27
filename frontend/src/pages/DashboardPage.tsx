import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import { SkeletonBoard } from '../components/Skeleton';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: boards, isLoading, error: fetchError } = useQuery({
    queryKey: ['boards'],
    queryFn: api.boards.list,
  });

  const createMutation = useMutation({
    mutationFn: api.boards.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.boards.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setShowDelete(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title, description: description || undefined });
  };

  return (
    <PageShell>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="page-heading">Your Boards</h1>
            <p className="page-subheading mt-1">Manage your projects and tasks</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Board
          </button>
        </div>

        {fetchError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            Failed to load boards. Please try again.
          </div>
        )}

        {isLoading ? (
          <SkeletonBoard />
        ) : boards && boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sage-200 bg-sage-50/30 py-16 dark:rounded-xl dark:border-gray-700 dark:bg-transparent">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 dark:bg-primary-900/30">
              <svg className="h-8 w-8 text-sage-600 dark:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink-deep dark:text-white">No boards yet</h3>
            <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
              Create your first board to start organizing tasks
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
              Create Your First Board
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards?.map((board) => (
              <div key={board.id} className="card group relative transition hover:-translate-y-0.5 hover:shadow-soft dark:hover:shadow-md">
                <Link to={`/board/${board.id}`} className="block">
                  <div className="mb-3 h-1.5 w-12 rounded-full bg-gradient-to-r from-sage-300 to-honey-200 dark:from-primary-500 dark:to-primary-400" />
                  <h3 className="text-lg font-semibold text-ink-deep dark:text-white">{board.title}</h3>
                  {board.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted dark:text-gray-400">
                      {board.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted dark:text-gray-400">
                    <span>{board.task_count ?? 0} tasks</span>
                    <span>·</span>
                    <span>Updated {new Date(board.updated_at).toLocaleDateString()}</span>
                  </div>
                </Link>
                <button
                  onClick={() => setShowDelete(board.id)}
                  className="absolute right-3 top-3 rounded p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Board">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="My Project"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="What's this board about?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? <LoadingSpinner size="sm" /> : 'Create Board'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDelete !== null} onClose={() => setShowDelete(null)} title="Delete Board">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure? This will permanently delete the board and all its tasks.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDelete(null)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => showDelete && deleteMutation.mutate(showDelete)}
            disabled={deleteMutation.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {deleteMutation.isPending ? <LoadingSpinner size="sm" /> : 'Delete'}
          </button>
        </div>
      </Modal>
    </PageShell>
  );
}
