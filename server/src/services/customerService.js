import Customer from '../models/Customer.js';
import { cleanName, makeNameKey } from '../utils/names.js';

const DUPLICATE_KEY_ERROR = 11000;

// Finds a customer by name, or creates one. Returns { customer, created }.
export async function findOrCreateCustomer(name, phone = '') {
  const cleanedName = cleanName(name);
  const nameKey = makeNameKey(cleanedName);

  const existing = await Customer.findOne({ nameKey });
  if (existing) return { customer: existing, created: false };

  try {
    const customer = await Customer.create({ name: cleanedName, nameKey, phone });
    return { customer, created: true };
  } catch (error) {
    // Two requests created the same customer at the same moment: use the one that won.
    if (error.code === DUPLICATE_KEY_ERROR) {
      const winner = await Customer.findOne({ nameKey });
      if (winner) return { customer: winner, created: false };
    }
    throw error;
  }
}
