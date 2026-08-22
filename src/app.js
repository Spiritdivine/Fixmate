import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/api-error.js';
import { standardApiLimiter } from './config/rate-limiter.js';

const app = express();

// Security & Utility Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parser with raw body buffer preservation for Webhook HMAC validation
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply rate limiting to all /api routes
app.use('/api', standardApiLimiter);

// API Version 1
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
});

// Central Error Handler
app.use(errorHandler);

export default app;

