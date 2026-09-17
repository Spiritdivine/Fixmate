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

    if (parsed.query) {
      req.validatedQuery = parsed.query;
      try {
        Object.assign(req.query, parsed.query);
      } catch {}
    }
    if (parsed.params) {
      req.validatedParams = parsed.params;
      try {
        Object.assign(req.params, parsed.params);
      } catch {}
    }
    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    if (issues && Array.isArray(issues)) {
      const formattedErrors = issues.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      }));
      return next(new ApiError(400, 'Validation Error', formattedErrors));
    }
    next(error);
  }
};

export default validate;
