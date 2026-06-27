import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { parseId } from '../utils/params';

interface TaskRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'med' | 'high';
  due_date: string | null;
  estimated_effort: string | null;
  board_id: number;
  owner_id: number;
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface BoardRow extends RowDataPacket {
  id: number;
  owner_id: number;
}

async function verifyBoardOwnership(boardId: number, userId: number): Promise<boolean> {
  const [rows] = await pool.query<BoardRow[]>(
    'SELECT id FROM boards WHERE id = ? AND owner_id = ?',
    [boardId, userId]
  );
  return rows.length > 0;
}

async function logActivity(
  userId: number,
  action: string,
  boardId?: number,
  taskId?: number,
  details?: Record<string, unknown>
): Promise<void> {
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, board_id, task_id, details) VALUES (?, ?, ?, ?, ?)',
    [userId, action, boardId ?? null, taskId ?? null, details ? JSON.stringify(details) : null]
  );
}

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  const boardId = parseId(req.params.boardId);
  const { priority, status, sort, search } = req.query;

  if (!(await verifyBoardOwnership(boardId, req.user!.userId))) {
    res.status(404).json({ success: false, message: 'Board not found' });
    return;
  }

  let query = 'SELECT * FROM tasks WHERE board_id = ?';
  const params: (string | number)[] = [boardId];

  if (priority && typeof priority === 'string') {
    query += ' AND priority = ?';
    params.push(priority);
  }

  if (status && typeof status === 'string') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search && typeof search === 'string') {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const sortField = sort === 'due_date' ? 'due_date' : sort === 'priority' ? 'priority' : 'position';
  const sortOrder = sort === 'due_date' ? 'ASC' : 'ASC';
  query += ` ORDER BY ${sortField} ${sortOrder}, created_at DESC`;

  const [rows] = await pool.query<TaskRow[]>(query, params);
  res.json({ success: true, data: rows });
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  const boardId = parseId(req.params.boardId);
  const userId = req.user!.userId;
  const { title, description, status, priority, dueDate, estimatedEffort } = req.body;

  if (!(await verifyBoardOwnership(boardId, userId))) {
    res.status(404).json({ success: false, message: 'Board not found' });
    return;
  }

  const [posRows] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE board_id = ? AND status = ?',
    [boardId, status || 'todo']
  );
  const position = posRows[0].next_pos as number;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO tasks (title, description, status, priority, due_date, estimated_effort, board_id, owner_id, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description || null,
      status || 'todo',
      priority || 'med',
      dueDate || null,
      estimatedEffort || null,
      boardId,
      userId,
      position,
    ]
  );

  await logActivity(userId, 'task_created', boardId, result.insertId, { title });

  const [rows] = await pool.query<TaskRow[]>('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, data: rows[0] });
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  const taskId = parseId(req.params.id);
  const userId = req.user!.userId;
  const { title, description, status, priority, dueDate, estimatedEffort } = req.body;

  const [existing] = await pool.query<TaskRow[]>(
    'SELECT * FROM tasks WHERE id = ? AND owner_id = ?',
    [taskId, userId]
  );

  if (existing.length === 0) {
    res.status(404).json({ success: false, message: 'Task not found' });
    return;
  }

  const task = existing[0];
  const newStatus = status ?? task.status;

  if (newStatus !== task.status) {
    const [posRows] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE board_id = ? AND status = ?',
      [task.board_id, newStatus]
    );
    const position = posRows[0].next_pos as number;

    await pool.query(
      `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, estimated_effort = ?, position = ?
       WHERE id = ?`,
      [
        title ?? task.title,
        description ?? task.description,
        newStatus,
        priority ?? task.priority,
        dueDate !== undefined ? dueDate : task.due_date,
        estimatedEffort !== undefined ? estimatedEffort : task.estimated_effort,
        position,
        taskId,
      ]
    );

    await logActivity(userId, 'task_moved', task.board_id, taskId, {
      from: task.status,
      to: newStatus,
    });
  } else {
    await pool.query(
      `UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, estimated_effort = ?
       WHERE id = ?`,
      [
        title ?? task.title,
        description ?? task.description,
        priority ?? task.priority,
        dueDate !== undefined ? dueDate : task.due_date,
        estimatedEffort !== undefined ? estimatedEffort : task.estimated_effort,
        taskId,
      ]
    );

    await logActivity(userId, 'task_updated', task.board_id, taskId, { title: title ?? task.title });
  }

  const [rows] = await pool.query<TaskRow[]>('SELECT * FROM tasks WHERE id = ?', [taskId]);
  res.json({ success: true, data: rows[0] });
}

export async function moveTask(req: AuthRequest, res: Response): Promise<void> {
  const taskId = parseId(req.params.id);
  const userId = req.user!.userId;
  const { status, position } = req.body;

  const [existing] = await pool.query<TaskRow[]>(
    'SELECT * FROM tasks WHERE id = ? AND owner_id = ?',
    [taskId, userId]
  );

  if (existing.length === 0) {
    res.status(404).json({ success: false, message: 'Task not found' });
    return;
  }

  const task = existing[0];
  const newPosition = position ?? 0;

  await pool.query('UPDATE tasks SET status = ?, position = ? WHERE id = ?', [status, newPosition, taskId]);

  await logActivity(userId, 'task_moved', task.board_id, taskId, {
    from: task.status,
    to: status,
    position: newPosition,
  });

  const [rows] = await pool.query<TaskRow[]>('SELECT * FROM tasks WHERE id = ?', [taskId]);
  res.json({ success: true, data: rows[0] });
}

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  const taskId = parseId(req.params.id);
  const userId = req.user!.userId;

  const [existing] = await pool.query<TaskRow[]>(
    'SELECT * FROM tasks WHERE id = ? AND owner_id = ?',
    [taskId, userId]
  );

  if (existing.length === 0) {
    res.status(404).json({ success: false, message: 'Task not found' });
    return;
  }

  await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
  await logActivity(userId, 'task_deleted', existing[0].board_id, taskId, { title: existing[0].title });

  res.json({ success: true, message: 'Task deleted successfully' });
}

export async function searchTasks(req: AuthRequest, res: Response): Promise<void> {
  const { q, priority, status } = req.query;
  const userId = req.user!.userId;

  let query = `
    SELECT t.*, b.title as board_title
    FROM tasks t
    JOIN boards b ON b.id = t.board_id
    WHERE t.owner_id = ?
  `;
  const params: (string | number)[] = [userId];

  if (q && typeof q === 'string') {
    query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  if (priority && typeof priority === 'string') {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  if (status && typeof status === 'string') {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.updated_at DESC LIMIT 50';

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  res.json({ success: true, data: rows });
}
