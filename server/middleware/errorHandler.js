export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(' ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier.';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    const messages = {
      email: 'An account with this email already exists.',
      sku: 'A product with this SKU already exists.',
      code: 'This code is already in use.',
      name: 'This name is already in use.',
    };
    message = messages[field] || 'A record with this value already exists.';
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : message,
  });
}
