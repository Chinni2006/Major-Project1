/**
 * Async wrapper to catch errors in route handlers without try/catch everywhere
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validate required fields in request body
 */
const validateFields = (fields) => (req, res, next) => {
  const missing = fields.filter((f) => !req.body[f]);
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }
  next();
};

module.exports = { asyncHandler, validateFields };
