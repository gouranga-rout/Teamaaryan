import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true },
  ip: { type: String },
  package: { type: String, default: null }, // null = normal page visit, slug = package click
  visited_at: { type: Date, default: Date.now },
});

export default mongoose.model('Click', clickSchema);
