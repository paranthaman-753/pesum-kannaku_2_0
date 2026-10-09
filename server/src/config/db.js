import mongoose from 'mongoose';
import { config } from './env.js';
import Customer from '../models/Customer.js';
import { makeNameKey } from '../utils/names.js';

const RETRY_DELAY_MS = 5000;
const SERVER_SELECTION_TIMEOUT_MS = 5000;

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

// Older versions of this project stored customers without "nameKey" and had a different unique index.
// This fills in the missing keys and syncs indexes so saving works on an existing database.
export async function prepareDatabase() {
  try {
    const legacy = await Customer.find({ nameKey: { $exists: false } }, 'name').lean();
    for (const customer of legacy) {
      await Customer.updateOne({ _id: customer._id }, { $set: { nameKey: makeNameKey(customer.name) } });
    }
    if (legacy.length > 0) console.log(`Updated ${legacy.length} older customer record(s).`);
    await Customer.syncIndexes();
  } catch (error) {
    console.error(`Could not prepare database indexes: ${error.message}`);
  }
}

// Connects to MongoDB. If MongoDB is not running, the API server still starts
// and keeps retrying, so the person only sees a friendly "database unavailable" message.
export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS
    });
    console.log('MongoDB connected.');
    await prepareDatabase();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error(`Check that MongoDB is running and MONGODB_URI is correct. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
}

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected.'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected.'));
