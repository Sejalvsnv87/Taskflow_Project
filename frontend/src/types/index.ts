export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Board {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  task_count?: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'med' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimated_effort: string | null;
  board_id: number;
  owner_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  board_title?: string;
}

export interface EstimateSuggestion {
  estimatedEffort: string;
  suggestedDueDate: string;
  reasoning: string;
  isMock?: boolean;
}

export interface AnalyticsData {
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  overdueCount: number;
  totalTasks: number;
  completedTasks: number;
  recentActivity: ActivityLog[];
  boardStats: BoardStat[];
}

export interface ActivityLog {
  id: number;
  action: string;
  task_title?: string;
  board_title?: string;
  details: string | null;
  created_at: string;
}

export interface BoardStat {
  id: number;
  title: string;
  todo: number;
  in_progress: number;
  done: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
}
