import type { TaskPriority } from '../types';

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  med: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  med: 'Medium',
  high: 'High',
};

export default function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  );
}
