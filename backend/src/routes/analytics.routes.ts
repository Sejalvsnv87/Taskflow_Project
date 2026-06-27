import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/dashboard', getDashboardAnalytics);

export default router;
