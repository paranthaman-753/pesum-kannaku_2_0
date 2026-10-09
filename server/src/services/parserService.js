import { callGemini } from './geminiService.js';
import { cleanName, editDistance, makeNameKey } from '../utils/names.js';

// parserService is the only thing the controller talks to.
// Today it uses Gemini. Later it can try a rules-based parser first and use Gemini as a fallback.

const VALID_INTENTS = ['credit', 'payment'];
const MAX_FIELD_LENGTH = 60;
const MIN_LENGTH_FOR_FUZZY_MATCH = 4;
const MAX_SPELLING_DIFFERENCE = 1;
const EMPTY_WORDS = ['null', 'none', 'n/a', 'na', 'unknown', 'undefined'];

const UNIT_ALIASES = {
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilogram: 'kg',
  g: 'g', gm: 'g', gram: 'g', grams: 'g',
  l: 'L', lt: 'L', ltr: 'L', liter: 'L', litre: 'L', liters: 'L', litres: 'L',
  ml: 'ml',
  packet: 'packet', packets: 'packet', pkt: 'packet',
  piece: 'piece', pieces: 'piece', pcs: 'piece', pc: 'piece',
  dozen: 'dozen'
};

function cleanText(value) {
  if (typeof value !== 'string') return null;
  const text = cleanName(value);
  if (!text || EMPTY_WORDS.includes(text.toLowerCase())) return null;
  return text.slice(0, MAX_FIELD_LENGTH);
}

// Accepts 120, "120", "₹1,200", "Rs. 85.50". Returns null for anything that is not a positive number.
export function toPositiveNumber(value) {
  let number = NaN;
  if (typeof value === 'number') {
    number = value;
  } else if (typeof value === 'string') {
    const digitsOnly = value.replace(/[₹,\s]|rs\.?|rupees?/gi, '');
    if (/^\d+(\.\d+)?$/.test(digitsOnly)) number = Number(digitsOnly);
  }
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeUnit(value) {
  const text = cleanText(value);
  if (!text) return null;
  return UNIT_ALIASES[text.toLowerCase()] || text.toLowerCase();
}

// If the name matches a saved customer, use the saved spelling. Also forgives a one-letter
// speech-recognition slip, but only when exactly one saved customer is that close.
export function matchSavedCustomer(name, knownCustomers = []) {
  const key = makeNameKey(name);
  const exact = knownCustomers.find((saved) => makeNameKey(saved) === key);
  if (exact) return exact;

  if (key.length < MIN_LENGTH_FOR_FUZZY_MATCH) return name;
  const close = knownCustomers.filter(
    (saved) => editDistance(makeNameKey(saved), key) <= MAX_SPELLING_DIFFERENCE
  );
  return close.length === 1 ? close[0] : name;
}

// Cleans whatever the AI returned so the rest of the app only sees safe, predictable values.
export function normalizeAiResult(raw = {}, knownCustomers = []) {
  const intentText = typeof raw.intent === 'string' ? raw.intent.trim().toLowerCase() : '';
  const intent = VALID_INTENTS.includes(intentText) ? intentText : 'unknown';

  let customer = cleanText(raw.customer);
  if (customer) customer = matchSavedCustomer(customer, knownCustomers);

  const isCredit = intent === 'credit';
  const item = cleanText(raw.item);

  return {
    intent,
    customer,
    item: isCredit && item ? item.toLowerCase() : null,
    quantity: isCredit ? toPositiveNumber(raw.quantity) : null,
    unit: isCredit ? normalizeUnit(raw.unit) : null,
    amount: toPositiveNumber(raw.amount)
  };
}

// Fields that must be present before an entry can be saved.
export function findMissingFields(data) {
  const missing = [];
  if (data.intent === 'unknown') missing.push('intent');
  if (!data.customer) missing.push('customer');
  if (data.amount === null) missing.push('amount');
  return missing;
}

// aiParse can be replaced in tests so they never call the real Gemini API.
export async function parseTransactionText(text, { knownCustomers = [], aiParse = callGemini } = {}) {
  const raw = await aiParse(text, knownCustomers);
  const data = normalizeAiResult(raw, knownCustomers);
  const missingFields = findMissingFields(data);

  return {
    success: missingFields.length === 0,
    data,
    missingFields
  };
}
