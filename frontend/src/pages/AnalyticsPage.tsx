import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import PageShell from '../components/PageShell';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_COLORS = ['#6366f1', '#3b82f6', '#22c55e'];
const PRIORITY_COLORS = ['#22c55e', '#eab308', '#ef4444'];

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const priorityLabels: Record<string, string> = {
  low: 'Low',
  med: 'Medium',
  high: 'High',
};

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.analytics.dashboard,
  });

  const statusData =
    data?.byStatus.map((s) => ({
      name: statusLabels[s.status] || s.status,
      count: Number(s.count),
    })) || [];

  const priorityData =
    data?.byPriority.map((p) => ({
      name: priorityLabels[p.priority] || p.priority,
      count: Number(p.count),
    })) || [];

  const completionRate =
    data && data.totalTasks > 0
      ? Math.round((Number(data.completedTasks) / Number(data.totalTasks)) * 100)
      : 0;

  return (
    <PageShell>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="page-heading">Analytics Dashboard</h1>
          <p className="page-subheading mt-1">Overview of your tasks and productivity</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            Failed to load analytics.
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="stat-card">
                <p className="text-sm text-ink-muted dark:text-gray-400">Total Tasks</p>
                <p className="mt-1 text-3xl font-bold text-ink-deep dark:text-white">
                  {data?.totalTasks ?? 0}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-ink-muted dark:text-gray-400">Completed</p>
                <p className="mt-1 text-3xl font-bold text-sage-600 dark:text-green-600">{data?.completedTasks ?? 0}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-ink-muted dark:text-gray-400">Overdue</p>
                <p className="mt-1 text-3xl font-bold text-red-500 dark:text-red-600">{data?.overdueCount ?? 0}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-ink-muted dark:text-gray-400">Completion Rate</p>
                <p className="mt-1 text-3xl font-bold text-sage-600 dark:text-primary-600">{completionRate}%</p>
              </div>
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Tasks by Status
                </h3>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-gray-500">No data yet</p>
                )}
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Tasks by Priority
                </h3>
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {priorityData.map((_, i) => (
                          <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-gray-500">No data yet</p>
                )}
              </div>
            </div>

            {data?.boardStats && data.boardStats.length > 0 && (
              <div className="card mb-8">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Board Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 text-left font-medium text-gray-600 dark:text-gray-400">Board</th>
                        <th className="py-2 text-center font-medium text-gray-600 dark:text-gray-400">To Do</th>
                        <th className="py-2 text-center font-medium text-gray-600 dark:text-gray-400">In Progress</th>
                        <th className="py-2 text-center font-medium text-gray-600 dark:text-gray-400">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.boardStats.map((board) => (
                        <tr key={board.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 text-gray-900 dark:text-white">{board.title}</td>
                          <td className="py-2 text-center text-gray-600 dark:text-gray-400">{board.todo}</td>
                          <td className="py-2 text-center text-gray-600 dark:text-gray-400">{board.in_progress}</td>
                          <td className="py-2 text-center text-gray-600 dark:text-gray-400">{board.done}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data?.recentActivity && data.recentActivity.length > 0 && (
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {data.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800"
                    >
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {log.action.replace(/_/g, ' ')}
                          {log.task_title && `: ${log.task_title}`}
                          {log.board_title && !log.task_title && `: ${log.board_title}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
