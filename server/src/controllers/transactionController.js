import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { calculateBalance } from '../utils/balance.js';
import { findOrCreateCustomer } from '../services/customerService.js';
import { validateTransactionInput } from '../utils/validation.js';
import { HttpError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// POST /api/transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const input = validateTransactionInput(req.body);

  let customer;
  if (input.customerId) {
    customer = await Customer.findById(input.customerId);
    if (!customer) throw new HttpError(404, 'Customer not found.');
  } else {
    ({ customer } = await findOrCreateCustomer(input.customerName));
  }

  const transaction = await Transaction.create({
    customerId: customer._id,
    customerName: customer.name,
    type: input.type,
    item: input.item,
    quantity: input.quantity,
    unit: input.unit,
    amount: input.amount,
    originalText: input.originalText
  });

  const customerTransactions = await Transaction.find({ customerId: customer._id }, 'type amount').lean();
  const balance = calculateBalance(customerTransactions);

  res.status(201).json({ success: true, transaction, customer, balance });
});

// GET /api/transactions?customerId=...&limit=50  -> newest first
export const listTransactions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customerId) {
    if (!mongoose.isValidObjectId(req.query.customerId)) throw new HttpError(400, 'Customer id is not valid.');
    filter.customerId = req.query.customerId;
  }

  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ success: true, transactions });
});
