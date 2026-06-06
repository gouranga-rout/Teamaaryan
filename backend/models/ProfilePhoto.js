import mongoose from 'mongoose';

const profilePhotoSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  url: { type: String, required: true },
  version: { type: Number, required: true },
  is_current: { type: Boolean, default: true },
  file_size: { type: String },
}, { timestamps: true });

export default mongoose.model('ProfilePhoto', profilePhotoSchema);
