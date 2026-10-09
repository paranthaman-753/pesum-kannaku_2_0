import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String, required: true },
    type: { type: String, enum: ['credit', 'payment'], required: true },
    item: { type: String, default: null },
    quantity: { type: Number, default: null, min: 0 },
    unit: { type: String, default: null },
    amount: { type: Number, required: true, min: 0.01 },
    originalText: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
