import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Lower-case copy of the name, used to avoid duplicates like "Murugan" / "murugan".
    nameKey: { type: String, required: true, unique: true },
    phone: { type: String, trim: true, default: '', maxlength: 20 }
  },
  { timestamps: true }
);

export default mongoose.model('Customer', customerSchema);
