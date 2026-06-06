import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  announcementActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);

