import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';

const COLUMNS: { id: TaskStatus; title: string; color: string; dropBg: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-sage-400 dark:border-gray-600', dropBg: 'kanban-column-todo' },
  { id: 'in-progress', title: 'In Progress', color: 'border-sand-300 dark:border-blue-600', dropBg: 'kanban-column-progress' },
  { id: 'done', title: 'Done', color: 'border-sage-500 dark:border-green-600', dropBg: 'kanban-column-done' },
];

function Column({
  id,
  title,
  color,
  dropBg,
  tasks,
  onEdit,
  onDelete,
}: {
  id: TaskStatus;
  title: string;
  color: string;
  dropBg: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={`mb-3 flex items-center gap-2 border-b-2 pb-2 ${color}`}>
        <h3 className="text-sm font-semibold text-ink-deep dark:text-gray-300">{title}</h3>
        <span className="badge-count">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] flex-1 space-y-3 rounded-2xl p-2 transition dark:rounded-lg dark:p-1 ${dropBg} ${
          isOver ? 'ring-2 ring-sage-300 dark:bg-primary-900/10 dark:ring-primary-500' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onMove: (taskId: number, status: TaskStatus, position: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function KanbanBoard({ tasks, onMove, onEdit, onDelete }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newStatus: TaskStatus = task.status;
    if (COLUMNS.some((c) => c.id === over.id)) {
      newStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus !== task.status) {
      const columnTasks = getColumnTasks(newStatus);
      onMove(taskId, newStatus, columnTasks.length);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            dropBg={col.dropBg}
            tasks={getColumnTasks(col.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="card w-72 rotate-2 opacity-90 shadow-lg">
            <h4 className="text-sm font-medium">{activeTask.title}</h4>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
