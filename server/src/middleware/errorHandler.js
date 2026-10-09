import { HttpError } from '../utils/errors.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, error: 'This address does not exist.' });
}

// Last stop for errors. Never sends stack traces to the browser.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'The request could not be read.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: 'Some information is not valid.' });
  }

  console.error('Unexpected server error:', err);
  return res.status(500).json({
    success: false,
    error: 'Something went wrong on the server. Please try again.'
  });
}
