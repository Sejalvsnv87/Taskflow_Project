import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { parseId } from '../utils/params';

interface BoardRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
  task_count?: number;
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

export async function getBoards(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await pool.query<BoardRow[]>(
    `SELECT b.*, COUNT(t.id) as task_count
     FROM boards b
     LEFT JOIN tasks t ON t.board_id = b.id
     WHERE b.owner_id = ?
     GROUP BY b.id
     ORDER BY b.updated_at DESC`,
    [req.user!.userId]
  );

  res.json({ success: true, data: rows });
}

export async function getBoard(req: AuthRequest, res: Response): Promise<void> {
  const boardId = parseId(req.params.id);

  const [rows] = await pool.query<BoardRow[]>(
    'SELECT * FROM boards WHERE id = ? AND owner_id = ?',
    [boardId, req.user!.userId]
  );

  if (rows.length === 0) {
    res.status(404).json({ success: false, message: 'Board not found' });
    return;
  }

  res.json({ success: true, data: rows[0] });
}

export async function createBoard(req: AuthRequest, res: Response): Promise<void> {
  const { title, description } = req.body;
  const userId = req.user!.userId;

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO boards (title, description, owner_id) VALUES (?, ?, ?)',
    [title, description || null, userId]
  );

  await logActivity(userId, 'board_created', result.insertId, undefined, { title });

  const [rows] = await pool.query<BoardRow[]>('SELECT * FROM boards WHERE id = ?', [result.insertId]);

  res.status(201).json({ success: true, data: rows[0] });
}

export async function updateBoard(req: AuthRequest, res: Response): Promise<void> {
  const boardId = parseId(req.params.id);
  const { title, description } = req.body;

  const [existing] = await pool.query<BoardRow[]>(
    'SELECT * FROM boards WHERE id = ? AND owner_id = ?',
    [boardId, req.user!.userId]
  );

  if (existing.length === 0) {
    res.status(404).json({ success: false, message: 'Board not found' });
    return;
  }

  await pool.query('UPDATE boards SET title = ?, description = ? WHERE id = ?', [
    title,
    description ?? existing[0].description,
    boardId,
  ]);

  await logActivity(req.user!.userId, 'board_updated', boardId, undefined, { title });

  const [rows] = await pool.query<BoardRow[]>('SELECT * FROM boards WHERE id = ?', [boardId]);
  res.json({ success: true, data: rows[0] });
}

export async function deleteBoard(req: AuthRequest, res: Response): Promise<void> {
  const boardId = parseId(req.params.id);

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM boards WHERE id = ? AND owner_id = ?',
    [boardId, req.user!.userId]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ success: false, message: 'Board not found' });
    return;
  }

  await logActivity(req.user!.userId, 'board_deleted', boardId);

  res.json({ success: true, message: 'Board deleted successfully' });
}
