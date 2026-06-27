import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import PriorityBadge from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card group cursor-grab active:cursor-grabbing ${
        overdue ? 'border-red-300 dark:border-red-800' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-ink-deep dark:text-white">{task.title}</h4>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span
            className={`text-xs ${overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {overdue ? 'Overdue: ' : 'Due: '}
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        {task.estimated_effort && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {task.estimated_effort}
          </span>
        )}
      </div>
    </div>
  );
}
