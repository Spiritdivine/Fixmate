import { ApiError } from '../utils/api-error.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body !== undefined ? req.body : {},
      query: req.query !== undefined ? req.query : {},
      params: req.params !== undefined ? req.params : {},
    });
    // Attach sanitized data safely for Express 5
    if (parsed.body !== undefined) req.body = parsed.body;

    if (parsed.query && req.query) {
      try {
        Object.assign(req.query, parsed.query);
      } catch {
        req.validatedQuery = parsed.query;
      }
    }
    if (parsed.params && req.params) {
      try {
        Object.assign(req.params, parsed.params);
      } catch {
        req.validatedParams = parsed.params;
      }
    }
    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      }));
      return next(new ApiError(400, 'Validation Error', formattedErrors));
    }
    next(error);
  }
};

export default validate;
