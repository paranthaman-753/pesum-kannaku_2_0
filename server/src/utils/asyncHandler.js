// Lets controllers throw errors without repeating try/catch everywhere.
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
