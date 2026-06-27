import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTasks,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  searchTasks,
} from '../controllers/task.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/search', searchTasks);

router.get('/:boardId/tasks', getTasks);

router.post(
  '/:boardId/tasks',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'med', 'high']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
    body('estimatedEffort').optional({ nullable: true }).trim(),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'med', 'high']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('estimatedEffort').optional({ nullable: true }).trim(),
  ],
  validate,
  updateTask
);

router.patch(
  '/:id/move',
  [
    body('status').isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
    body('position').optional().isInt({ min: 0 }),
  ],
  validate,
  moveTask
);

router.delete('/:id', deleteTask);

export default router;
