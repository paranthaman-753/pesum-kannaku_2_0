import { MESSAGES } from '../utils/messages.js';

// Every request goes through request(), so error handling is written once.
export class ApiError extends Error {
  constructor(message, { status = 0, code = '' } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch {
    throw new ApiError(MESSAGES.serverUnavailable.title, { code: 'NETWORK' });
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON (for example the dev proxy could not reach the backend).
  }

  if (!body) {
    throw new ApiError(MESSAGES.serverUnavailable.title, { status: response.status, code: 'NETWORK' });
  }
  if (!response.ok) {
    throw new ApiError(body.error || MESSAGES.serverUnavailable.title, {
      status: response.status,
      code: body.code || ''
    });
  }
  return body;
}

const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) });

export const parseText = (text, knownCustomers = []) => post('/parse', { text, knownCustomers });
export const getCustomers = () => request('/customers');
export const getCustomer = (id) => request(`/customers/${id}`);
export const addCustomer = (name) => post('/customers', { name });
export const saveTransaction = (transaction) => post('/transactions', transaction);
