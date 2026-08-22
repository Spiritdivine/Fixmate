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

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default errorHandler;
