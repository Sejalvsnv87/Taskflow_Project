import { Router } from 'express';
import { body } from 'express-validator';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/board.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);

router.get('/:id', getBoard);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional().trim(),
  ],
  validate,
  createBoard
);

router.put(
  '/:id',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional().trim(),
  ],
  validate,
  updateBoard
);

router.delete('/:id', deleteBoard);

export default router;
