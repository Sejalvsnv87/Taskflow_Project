import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Task, TaskStatus } from '../types';
import Navbar from '../components/Navbar';
import PageShell from '../components/PageShell';
import KanbanBoard from '../components/KanbanBoard';
import TaskFormModal from '../components/TaskFormModal';
import Modal from '../components/Modal';
import { SkeletonColumn } from '../components/Skeleton';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = parseInt(id || '0', 10);
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('');

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.boards.get(boardId),
    enabled: !!boardId,
  });

  const taskParams: Record<string, string> = {};
  if (filterPriority) taskParams.priority = filterPriority;
  if (sortBy) taskParams.sort = sortBy;

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', boardId, filterPriority, sortBy],
    queryFn: () => api.tasks.list(boardId, taskParams),
    enabled: !!boardId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.tasks.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setEditingTask(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }: { id: number; status: TaskStatus; position: number }) =>
      api.tasks.move(id, { status, position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.tasks.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setDeletingTask(null);
    },
  });

  const handleMove = (taskId: number, status: TaskStatus, position: number) => {
    moveMutation.mutate({ id: taskId, status, position });
  };

  if (boardLoading) {
    return (
      <PageShell>
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-4">
            <SkeletonColumn />
            <SkeletonColumn />
            <SkeletonColumn />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-sage-600 dark:text-gray-400 dark:hover:text-primary-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Boards
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="page-heading">{board?.title}</h1>
              {board?.description && (
                <p className="page-subheading mt-1">{board.description}</p>
              )}
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              + Add Task
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">Sort by Position</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>

        {tasksLoading ? (
          <div className="flex gap-4">
            <SkeletonColumn />
            <SkeletonColumn />
            <SkeletonColumn />
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks || []}
            onMove={handleMove}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
          />
        )}
      </main>

      <TaskFormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <TaskFormModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSubmit={(data) => editingTask && updateMutation.mutate({ id: editingTask.id, data })}
        isLoading={updateMutation.isPending}
      />

      <Modal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} title="Delete Task">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete "{deletingTask?.title}"?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeletingTask(null)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => deletingTask && deleteMutation.mutate(deletingTask.id)}
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
