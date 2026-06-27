import { Router } from 'express';
import { body } from 'express-validator';
import { getEstimate, parseNaturalLanguage, getSubtasks } from '../controllers/ai.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/suggest-estimate',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
  ],
  validate,
  getEstimate
);

router.post(
  '/natural-language',
  [body('input').trim().notEmpty().withMessage('Input is required')],
  validate,
  parseNaturalLanguage
);

router.post(
  '/suggest-subtasks',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
  ],
  validate,
  getSubtasks
);

export default router;
