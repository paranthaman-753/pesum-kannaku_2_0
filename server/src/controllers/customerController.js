import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { calculateBalance } from '../utils/balance.js';
import { findOrCreateCustomer } from '../services/customerService.js';
import { validateCustomerName } from '../utils/validation.js';
import { HttpError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/customers  -> every customer with their outstanding balance
export const listCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ name: 1 }).lean();
  const transactions = await Transaction.find({}, 'customerId type amount').lean();

  const byCustomer = new Map();
  for (const tx of transactions) {
    const key = String(tx.customerId);
    if (!byCustomer.has(key)) byCustomer.set(key, []);
    byCustomer.get(key).push(tx);
  }

  const result = customers.map((customer) => ({
    ...customer,
    outstanding: calculateBalance(byCustomer.get(String(customer._id)) || []).outstanding
  }));

  res.json({ success: true, customers: result });
});

// GET /api/customers/:id  -> one customer, balance and history (newest first)
export const getCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Customer not found.');

  const customer = await Customer.findById(id).lean();
  if (!customer) throw new HttpError(404, 'Customer not found.');

  const transactions = await Transaction.find({ customerId: customer._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    customer: { ...customer, ...calculateBalance(transactions) },
    transactions
  });
});

// POST /api/customers  -> creates a customer (or returns the existing one with the same name)
export const createCustomer = asyncHandler(async (req, res) => {
  const name = validateCustomerName(req.body?.name);
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim().slice(0, 20) : '';

  const { customer, created } = await findOrCreateCustomer(name, phone);
  res.status(created ? 201 : 200).json({ success: true, created, customer });
});
