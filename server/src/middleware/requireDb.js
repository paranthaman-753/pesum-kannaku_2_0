import { isDbReady } from '../config/db.js';

// Stops requests early with a clear message when MongoDB is not connected.
export function requireDb(req, res, next) {
  if (isDbReady()) return next();
  return res.status(503).json({
    success: false,
    code: 'DB_UNAVAILABLE',
    error: 'The database is not available right now. Please try again in a moment.'
  });
}
