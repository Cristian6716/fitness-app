import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import authRoutes from './routes/auth.routes';
import workoutRoutes from './routes/workout.routes';
import sessionRoutes from './routes/session.routes';
import uploadRoutes from './routes/upload';
import statsRoutes from './routes/stats.routes';
import newsRoutes from './routes/news';
import measurementRoutes from './routes/measurement.routes';
import { fetchAndSaveArticles } from './services/rssParser';
import { setupLocalTunnel, disconnectLocalTunnel } from './localtunnel-setup';
import logger from './utils/logger';
import { authenticateToken } from './middleware/auth.middleware';

dotenv.config();

// Global error handlers - MUST be at the top
process.on('uncaughtException', (error) => {
  // Ignore LocalTunnel errors to prevent server crash
  if (error.message.includes('connection refused') && error.stack?.includes('TunnelCluster')) {
    logger.warn('⚠️ LocalTunnel connection error (non-fatal):', error.message);
    return;
  }

  logger.error('💥 UNCAUGHT EXCEPTION - SERVER CRASH:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 UNHANDLED REJECTION:', {
    reason,
    promise,
  });
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import { getStats } from './controllers/stats.controller';

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/plans', uploadRoutes);
app.get('/api/stats', authenticateToken, getStats); // New specific GET route for /api/stats
app.use('/api/stats', statsRoutes); // Existing general stats routes
app.use('/api/news', newsRoutes);
app.use('/api/measurements', measurementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Express error middleware - comprehensive error logging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('🔥 EXPRESS ERROR MIDDLEWARE:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, async () => {
  logger.info('=================================');
  logger.info('🚀 SERVER STARTED');
  logger.info(`Port: ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health: http://localhost:${PORT}/health`);
  logger.info('=================================');

  // Setup LocalTunnel if ENABLE_TUNNEL is set
  if (process.env.ENABLE_TUNNEL === 'true') {
    try {
      await setupLocalTunnel(PORT);
    } catch (error) {
      logger.error('Failed to setup LocalTunnel, continuing with local server only');
    }
  }

  // Setup cron job for daily RSS feed fetch at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('🗞️  Running scheduled RSS fetch...');
    try {
      const result = await fetchAndSaveArticles();
      logger.info(`✅ RSS fetch complete: ${result.added} added, ${result.skipped} skipped`);
    } catch (error) {
      logger.error('❌ RSS fetch failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  logger.info('📅 RSS cron job scheduled: Daily at 8:00 AM');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\nShutting down...');
  await disconnectLocalTunnel();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await disconnectLocalTunnel();
  server.close(() => {
    process.exit(0);
  });
});