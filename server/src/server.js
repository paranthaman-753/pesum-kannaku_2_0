import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB, isDbReady } from './config/db.js';
import { requireDb } from './middleware/requireDb.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import parseRoutes from './routes/parseRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbReady() ? 'connected' : 'disconnected',
    aiConfigured: Boolean(config.geminiApiKey && config.geminiModel)
  });
});

// Parsing does not need the database, so it works even if MongoDB is down.
app.use('/api/parse', parseRoutes);
app.use('/api/customers', requireDb, customerRoutes);
app.use('/api/transactions', requireDb, transactionRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`Pesum Kanakku API running on http://localhost:${config.port}`);
  if (!config.geminiApiKey || !config.geminiModel) {
    console.warn('Warning: GEMINI_API_KEY or GEMINI_MODEL is not set. Typing and manual entry still work, but AI parsing will not.');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use. Change PORT in .env or stop the other program.`);
  } else {
    console.error('Server error:', error.message);
  }
  process.exit(1);
});

connectDB();
