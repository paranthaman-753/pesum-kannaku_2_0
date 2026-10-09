// An error whose message is safe to show to the person using the app.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Errors raised while turning a sentence into structured data.
// code: AI_NOT_CONFIGURED | AI_REQUEST_FAILED | AI_BAD_RESPONSE
export class ParserError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
