import { useState } from 'react';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { api } from '../services/api';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  task?: Task | null;
  isLoading?: boolean;
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  isLoading,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'med');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [estimatedEffort, setEstimatedEffort] = useState(task?.estimated_effort || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    estimatedEffort: string;
    suggestedDueDate: string;
    reasoning: string;
    isMock?: boolean;
  } | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [nlInput, setNlInput] = useState('');
  const [nlLoading, setNlLoading] = useState(false);

  const resetForm = () => {
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setPriority(task?.priority || 'med');
    setStatus(task?.status || 'todo');
    setDueDate(task?.due_date || '');
    setEstimatedEffort(task?.estimated_effort || '');
    setAiSuggestion(null);
    setSubtasks([]);
    setNlInput('');
  };

  const handleSuggest = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const suggestion = await api.ai.suggestEstimate({ title, description: description || undefined });
      setAiSuggestion(suggestion);
    } catch {
      setAiSuggestion({
        estimatedEffort: 'M (4-8 hours)',
        suggestedDueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        reasoning: 'AI service unavailable. Showing fallback estimate.',
        isMock: true,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      setEstimatedEffort(aiSuggestion.estimatedEffort);
      setDueDate(aiSuggestion.suggestedDueDate);
      setAiSuggestion(null);
    }
  };

  const handleSuggestSubtasks = async () => {
    if (!title.trim()) return;
    setSubtasksLoading(true);
    try {
      const result = await api.ai.suggestSubtasks({ title, description: description || undefined });
      setSubtasks(result.subtasks);
    } catch {
      setSubtasks(['Research and plan', 'Implement', 'Test and review']);
    } finally {
      setSubtasksLoading(false);
    }
  };

  const handleNaturalLanguage = async () => {
    if (!nlInput.trim()) return;
    setNlLoading(true);
    try {
      const parsed = await api.ai.naturalLanguage(nlInput);
      setTitle(parsed.title);
      setDescription(parsed.description);
      setPriority(parsed.priority as TaskPriority);
      setStatus(parsed.status as TaskStatus);
      if (parsed.dueDate) setDueDate(parsed.dueDate);
      if (parsed.estimatedEffort) setEstimatedEffort(parsed.estimatedEffort);
      setNlInput('');
    } catch {
      setTitle(nlInput);
      setDescription(nlInput);
    } finally {
      setNlLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || null,
      priority,
      status,
      dueDate: dueDate || null,
      estimatedEffort: estimatedEffort || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={task ? 'Edit Task' : 'Create Task'}
    >
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto">
        {!task && (
          <div className="rounded-2xl border border-sage-200 bg-sage-50/60 p-3 dark:rounded-lg dark:border-primary-800 dark:bg-primary-900/20">
            <label className="mb-1 block text-xs font-medium text-sage-700 dark:text-primary-300">
              Quick Add (Natural Language)
            </label>
            <div className="flex gap-2">
              <input
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder='e.g. "Fix login bug by Friday, high priority"'
              />
              <button
                type="button"
                onClick={handleNaturalLanguage}
                disabled={nlLoading || !nlInput.trim()}
                className="btn-primary shrink-0 text-xs"
              >
                {nlLoading ? <LoadingSpinner size="sm" /> : 'Parse'}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="input-field">
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="input-field">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Effort Estimate</label>
            <input
              value={estimatedEffort}
              onChange={(e) => setEstimatedEffort(e.target.value)}
              className="input-field"
              placeholder="e.g. M (4-8 hours)"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={aiLoading || !title.trim()}
            className="btn-secondary text-xs"
          >
            {aiLoading ? <LoadingSpinner size="sm" /> : '✨ Suggest Estimate'}
          </button>
          <button
            type="button"
            onClick={handleSuggestSubtasks}
            disabled={subtasksLoading || !title.trim()}
            className="btn-secondary text-xs"
          >
            {subtasksLoading ? <LoadingSpinner size="sm" /> : '✨ Suggest Subtasks'}
          </button>
        </div>

        {aiSuggestion && (
          <div className="rounded-2xl border border-sage-200 bg-sage-50/80 p-3 dark:rounded-lg dark:border-indigo-800 dark:bg-indigo-900/20">
            <p className="text-sm font-medium text-sage-700 dark:text-indigo-300">AI Suggestion</p>
            <p className="mt-1 text-xs text-sage-600 dark:text-indigo-400">
              Effort: {aiSuggestion.estimatedEffort} · Due: {aiSuggestion.suggestedDueDate}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{aiSuggestion.reasoning}</p>
            {aiSuggestion.isMock && (
              <p className="mt-1 text-xs italic text-gray-500">(Fallback estimate — AI service unavailable)</p>
            )}
            <button type="button" onClick={handleAcceptSuggestion} className="btn-primary mt-2 text-xs">
              Accept Suggestion
            </button>
          </div>
        )}

        {subtasks.length > 0 && (
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="mb-2 text-sm font-medium">Suggested Subtasks</p>
            <ul className="space-y-1">
              {subtasks.map((st, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  {st}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? <LoadingSpinner size="sm" /> : task ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
