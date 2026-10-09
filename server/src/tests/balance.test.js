import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBalance } from '../utils/balance.js';
import { validateTransactionInput } from '../utils/validation.js';

test('balance = total credit - total payments', () => {
  const result = calculateBalance([
    { type: 'credit', amount: 600 },
    { type: 'credit', amount: 260 },
    { type: 'payment', amount: 200 },
    { type: 'credit', amount: 180 }
  ]);
  assert.deepEqual(result, { totalCredit: 1040, totalPayment: 200, outstanding: 840 });
});

test('balance of no transactions is zero', () => {
  assert.equal(calculateBalance([]).outstanding, 0);
});

test('overpayment gives a negative balance and decimals do not drift', () => {
  assert.equal(calculateBalance([{ type: 'credit', amount: 0.1 }, { type: 'credit', amount: 0.2 }]).outstanding, 0.3);
  assert.equal(calculateBalance([{ type: 'credit', amount: 100 }, { type: 'payment', amount: 150 }]).outstanding, -50);
});

test('transaction validation accepts a good credit entry', () => {
  const clean = validateTransactionInput({ customerName: ' Murugan ', type: 'credit', item: 'Rice', quantity: '2', unit: 'kg', amount: '120' });
  assert.equal(clean.customerName, 'Murugan');
  assert.equal(clean.amount, 120);
  assert.equal(clean.quantity, 2);
});

test('transaction validation rejects bad input', () => {
  const good = { customerName: 'Ravi', type: 'credit', amount: 10 };
  assert.throws(() => validateTransactionInput({ ...good, amount: 0 }), /greater than 0/);
  assert.throws(() => validateTransactionInput({ ...good, amount: 'abc' }), /greater than 0/);
  assert.throws(() => validateTransactionInput({ ...good, type: 'gift' }), /credit or payment/);
  assert.throws(() => validateTransactionInput({ ...good, quantity: -1 }), /positive/);
  assert.throws(() => validateTransactionInput({ ...good, customerName: '  ' }), /Customer name/);
});

test('payment entries ignore item details', () => {
  const clean = validateTransactionInput({ customerName: 'Ravi', type: 'payment', item: 'oil', quantity: 1, unit: 'L', amount: 50 });
  assert.equal(clean.item, null);
  assert.equal(clean.quantity, null);
  assert.equal(clean.unit, null);
});
