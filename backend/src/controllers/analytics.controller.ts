import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { RowDataPacket } from 'mysql2';

export async function getDashboardAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const [statusRows] = await pool.query<RowDataPacket[]>(
    `SELECT status, COUNT(*) as count FROM tasks WHERE owner_id = ? GROUP BY status`,
    [userId]
  );

  const [priorityRows] = await pool.query<RowDataPacket[]>(
    `SELECT priority, COUNT(*) as count FROM tasks WHERE owner_id = ? GROUP BY priority`,
    [userId]
  );

  const [overdueRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM tasks
     WHERE owner_id = ? AND due_date < CURDATE() AND status != 'done'`,
    [userId]
  );

  const [totalRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM tasks WHERE owner_id = ?`,
    [userId]
  );

  const [completedRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM tasks WHERE owner_id = ? AND status = 'done'`,
    [userId]
  );

  const [recentActivity] = await pool.query<RowDataPacket[]>(
    `SELECT al.*, t.title as task_title, b.title as board_title
     FROM activity_logs al
     LEFT JOIN tasks t ON t.id = al.task_id
     LEFT JOIN boards b ON b.id = al.board_id
     WHERE al.user_id = ?
     ORDER BY al.created_at DESC
     LIMIT 10`,
    [userId]
  );

  const [boardStats] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.title,
       SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
       SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
       SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
     FROM boards b
     LEFT JOIN tasks t ON t.board_id = b.id
     WHERE b.owner_id = ?
     GROUP BY b.id, b.title`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      byStatus: statusRows,
      byPriority: priorityRows,
      overdueCount: overdueRows[0]?.count ?? 0,
      totalTasks: totalRows[0]?.total ?? 0,
      completedTasks: completedRows[0]?.count ?? 0,
      recentActivity,
      boardStats,
    },
  });
}
