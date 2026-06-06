import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // 'admin' = sirf admin ko, 'user' = specific user ko
  recipient_type: { type: String, enum: ['admin', 'user'], required: true },
  recipient_username: { type: String, default: null }, // user ke liye username
  type: { type: String, required: true },   // 'new_register', 'live_milestone', 'new_message', 'team_milestone', 'photo_upload', 'account_approved', 'account_suspended', 'welcome', 'new_offer', 'team_joined'
  title: { type: String, required: true },
  body: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
