import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import taskRoutes from './routes/task.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`TaskFlow API running on http://localhost:${env.port}`);
});

export default app;
