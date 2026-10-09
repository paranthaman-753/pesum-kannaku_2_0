import mongoose from 'mongoose';
import { HttpError } from './errors.js';
import { cleanName } from './names.js';

export const TRANSACTION_TYPES = ['credit', 'payment'];

const MAX_AMOUNT = 10000000;
const MAX_NAME_LENGTH = 60;
const MAX_UNIT_LENGTH = 20;
const MAX_TEXT_LENGTH = 500;
const MAX_KNOWN_CUSTOMERS = 200;

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, maxLength) : null;
}

export function validateCustomerName(name) {
  const cleaned = cleanName(name);
  if (!cleaned) throw new HttpError(400, 'Customer name is required.');
  if (cleaned.length > MAX_NAME_LENGTH) throw new HttpError(400, 'Customer name is too long.');
  return cleaned;
}

// Checks a request body for POST /api/transactions and returns clean values.
export function validateTransactionInput(body = {}) {
  const { customerId, customerName, type, item, quantity, unit, amount, originalText } = body;

  if (!TRANSACTION_TYPES.includes(type)) {
    throw new HttpError(400, 'Type must be credit or payment.');
  }

  const amountNumber = toNumber(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new HttpError(400, 'Amount must be greater than 0.');
  }
  if (amountNumber > MAX_AMOUNT) {
    throw new HttpError(400, 'Amount is too large.');
  }

  let quantityNumber = null;
  if (quantity !== undefined && quantity !== null && quantity !== '') {
    quantityNumber = toNumber(quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      throw new HttpError(400, 'Quantity must be a positive number.');
    }
  }

  let cleanCustomerId = null;
  let cleanCustomerName = null;
  if (customerId) {
    if (!mongoose.isValidObjectId(customerId)) throw new HttpError(400, 'Customer id is not valid.');
    cleanCustomerId = String(customerId);
  } else {
    cleanCustomerName = validateCustomerName(customerName);
  }

  const isCredit = type === 'credit';

  return {
    customerId: cleanCustomerId,
    customerName: cleanCustomerName,
    type,
    // Item details only make sense for credit entries.
    item: isCredit ? optionalText(item, MAX_NAME_LENGTH) : null,
    quantity: isCredit ? quantityNumber : null,
    unit: isCredit ? optionalText(unit, MAX_UNIT_LENGTH) : null,
    amount: amountNumber,
    originalText: optionalText(originalText, MAX_TEXT_LENGTH) || ''
  };
}

// Checks a request body for POST /api/parse.
export function validateParseInput(body = {}) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) throw new HttpError(400, 'Please enter or speak a sentence first.');
  if (text.length > MAX_TEXT_LENGTH) throw new HttpError(400, 'The sentence is too long. Please shorten it.');

  const knownCustomers = Array.isArray(body.knownCustomers)
    ? body.knownCustomers
        .filter((name) => typeof name === 'string' && name.trim())
        .map((name) => cleanName(name).slice(0, MAX_NAME_LENGTH))
        .slice(0, MAX_KNOWN_CUSTOMERS)
    : [];

  return { text, knownCustomers };
}
