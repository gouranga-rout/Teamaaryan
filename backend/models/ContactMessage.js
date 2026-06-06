import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 20 },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true, maxlength: 20 },
  message: { type: String, required: true, maxlength: 500 },
  is_read: { type: Boolean, default: false },
  reply: { type: String, default: null },
  replied_at: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('ContactMessage', contactMessageSchema);

