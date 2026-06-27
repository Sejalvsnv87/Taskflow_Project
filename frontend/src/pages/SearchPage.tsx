import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import PageShell from '../components/PageShell';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { TaskPriority, TaskStatus } from '../types';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: ['search', searchTerm, priority, status],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (searchTerm) params.q = searchTerm;
      if (priority) params.priority = priority;
      if (status) params.status = status;
      return api.tasks.search(params);
    },
    enabled: searchTerm.length > 0 || priority !== '' || status !== '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <PageShell>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="page-heading">Search Tasks</h1>
          <p className="page-subheading mt-1">Find tasks across all your boards</p>
        </div>

        <form onSubmit={handleSearch} className="card mb-6 space-y-4">
          <div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field"
              placeholder="Search by title or description..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input-field w-auto text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field w-auto text-sm"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </div>
        </form>

        {isLoading || isFetching ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : results && results.length > 0 ? (
          <div className="space-y-3">
            {results.map((task) => (
              <Link
                key={task.id}
                to={`/board/${task.board_id}`}
                className="card block transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                    {task.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Board: {task.board_title}</span>
                      <span>·</span>
                      <span>{statusLabels[task.status]}</span>
                      {task.due_date && (
                        <>
                          <span>·</span>
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority as TaskPriority} />
                </div>
              </Link>
            ))}
          </div>
        ) : searchTerm || priority || status ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No tasks found matching your criteria.
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Enter a search term or select filters to find tasks.
          </div>
        )}
      </main>
    </PageShell>
  );
}
