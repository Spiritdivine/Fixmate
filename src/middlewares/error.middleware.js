import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
        error = new ApiError(409, `Duplicate value for unique constraint on: ${target}`);
        break;
      }
      case 'P2025': {
        error = new ApiError(404, 'Record not found in the database');
        break;
      }
      case 'P2003': {
        error = new ApiError(400, 'Foreign key constraint violation');
        break;
      }
      default:
        error = new ApiError(500, `Database error: ${err.message}`);
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new ApiError(400, 'Invalid data provided to database query');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  // Log unhandled server errors (5xx) with request context
  if (statusCode >= 500) {
    console.error(`\n🚨 [500 Server Error] ${req.method} ${req.originalUrl}`);
    console.error(`Message: ${message}`);
    if (error.stack) console.error(error.stack);
    console.error(`User: ${req.user ? req.user.id : 'Anonymous'} | IP: ${req.ip}\n`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(error.errorCode && { errorCode: error.errorCode }),
    ...(error.requiresAuth && { requiresAuth: error.requiresAuth }),
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default errorHandler;
