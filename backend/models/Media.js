import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['banner', 'proof'], required: true },
  url: { type: String, required: true },
  public_id: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);
