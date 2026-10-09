// Adds fictional demo customers and transactions.
//   npm run seed         -> only seeds an empty database
//   npm run seed:reset   -> DELETES all customers and transactions first, then seeds
import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import Customer from './src/models/Customer.js';
import Transaction from './src/models/Transaction.js';
import { makeNameKey } from './src/utils/names.js';
import { prepareDatabase } from './src/config/db.js';

const shouldReset = process.argv.includes('--reset');

// Names are stored exactly as a shopkeeper would say them (Tamil script).
const customerNames = ['முருகன்', 'ரவி', 'மீனா', 'குமார்', 'செல்வி'];

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// [customer, daysAgo, type, item, quantity, unit, amount]
// Murugan ends at 840 outstanding, Ravi at 320, Meena at 0, Kumar at 350, Selvi has no entries yet.
const sampleTransactions = [
  ['முருகன்', 12, 'credit', 'அரிசி', 10, 'kg', 600],
  ['முருகன்', 9, 'credit', 'பருப்பு', 2, 'kg', 260],
  ['முருகன்', 5, 'payment', null, null, null, 200],
  ['முருகன்', 3, 'credit', 'எண்ணெய்', 1, 'L', 180],
  ['ரவி', 8, 'credit', 'சர்க்கரை', 3, 'kg', 150],
  ['ரவி', 2, 'credit', 'டீ தூள்', 250, 'g', 170],
  ['மீனா', 6, 'credit', 'சோப்பு', 4, 'piece', 220],
  ['மீனா', 1, 'payment', null, null, null, 220],
  ['குமார்', 4, 'credit', 'பால்', 10, 'packet', 450],
  ['குமார்', 1, 'payment', null, null, null, 100]
];

async function seed() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB.');
  await prepareDatabase();

  const existingCount = await Customer.countDocuments();
  if (existingCount > 0 && !shouldReset) {
    console.log('The database already has customers, so nothing was changed.');
    console.log('Run "npm run seed:reset" to delete everything and load the demo data.');
    return;
  }

  if (shouldReset) {
    await Transaction.deleteMany({});
    await Customer.deleteMany({});
    console.log('Existing customers and transactions deleted.');
  }

  const customers = await Customer.insertMany(
    customerNames.map((name) => ({ name, nameKey: makeNameKey(name) }))
  );
  const idByName = new Map(customers.map((c) => [c.name, c]));

  const transactions = sampleTransactions.map(([name, days, type, item, quantity, unit, amount]) => {
    const customer = idByName.get(name);
    const createdAt = daysAgo(days);
    return {
      customerId: customer._id,
      customerName: customer.name,
      type, item, quantity, unit, amount,
      originalText: 'Demo data',
      createdAt,
      updatedAt: createdAt
    };
  });
  await Transaction.insertMany(transactions);

  console.log(`Added ${customers.length} customers and ${transactions.length} transactions (fictional demo data).`);
}

try {
  await seed();
} catch (error) {
  console.error(`Seeding failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
