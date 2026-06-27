import pool from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  const [existing] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );

  const token = signToken({ userId: result.insertId, email });

  res.status(201).json({
    success: true,
    data: {
      user: { id: result.insertId, name, email },
      token,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user || !(await comparePassword(password, user.password_hash))) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    },
  });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await pool.query<UserRow[]>('SELECT id, name, email FROM users WHERE id = ?', [
    req.user!.userId,
  ]);

  if (rows.length === 0) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: rows[0] });
}
