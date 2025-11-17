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
import { fetchAndSaveArticles } from './services/rssParser';
import { setupLocalTunnel, disconnectLocalTunnel } from './localtunnel-setup';

dotenv.config();

// Global error handlers - MUST be at the top
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION - SERVER CRASH:');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('Full error:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
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
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/plans', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/news', newsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Express error middleware - comprehensive error logging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 EXPRESS ERROR MIDDLEWARE:');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  console.error('Request headers:', req.headers);
  console.error('Full error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log('=================================');
  console.log('🚀 SERVER STARTED');
  console.log('Port:', PORT);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log('Body size limit: 50MB');
  console.log('File upload limit: 50MB');
  console.log('Request timeout: 120s (frontend)');
  console.log('=================================');

  // Setup LocalTunnel if ENABLE_TUNNEL is set
  if (process.env.ENABLE_TUNNEL === 'true') {
    try {
      await setupLocalTunnel(PORT);
    } catch (error) {
      console.error('Failed to setup LocalTunnel, continuing with local server only');
    }
  }

  // Setup cron job for daily RSS feed fetch at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('🗞️  Running scheduled RSS fetch...');
    try {
      const result = await fetchAndSaveArticles();
      console.log(`✅ RSS fetch complete: ${result.added} added, ${result.skipped} skipped`);
    } catch (error) {
      console.error('❌ RSS fetch failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  });
  console.log('📅 RSS cron job scheduled: Daily at 8:00 AM');
});

// CRITICAL: Keep Node.js process alive
setInterval(() => {
  // Empty interval prevents process from exiting
}, 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
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