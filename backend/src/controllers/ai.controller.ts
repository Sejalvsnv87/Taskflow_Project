import { suggestEstimate, parseNaturalLanguageTask, suggestSubtasks } from '../services/ai.service';
import { Request, Response } from 'express';

export async function getEstimate(req: Request, res: Response): Promise<void> {
  const { title, description } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ success: false, message: 'Task title is required' });
    return;
  }

  const suggestion = await suggestEstimate(title, description);
  res.json({ success: true, data: suggestion });
}

export async function parseNaturalLanguage(req: Request, res: Response): Promise<void> {
  const { input } = req.body;

  if (!input?.trim()) {
    res.status(400).json({ success: false, message: 'Input text is required' });
    return;
  }

  const parsed = await parseNaturalLanguageTask(input);
  res.json({ success: true, data: parsed });
}

export async function getSubtasks(req: Request, res: Response): Promise<void> {
  const { title, description } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ success: false, message: 'Task title is required' });
    return;
  }

  const subtasks = await suggestSubtasks(title, description);
  res.json({ success: true, data: { subtasks } });
}
