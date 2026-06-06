import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const { role, username } = req.user;
    const query = role === 'admin' ? { recipient_type: 'admin' } : { recipient_type: 'user', recipient_username: username };
    const notifications = await Notification.find(query).sort({ created_at: -1 }).limit(50);
    res.json(notifications);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
  try {
    const { role, username } = req.user;
    const query = role === 'admin' ? { recipient_type: 'admin', is_read: false } : { recipient_type: 'user', recipient_username: username, is_read: false };
    await Notification.updateMany(query, { is_read: true });
    res.json({ message: 'All marked as read' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ message: 'Marked as read' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/notifications/all — clear all
router.delete('/all', protect, async (req, res) => {
  try {
    const { role, username } = req.user;
    const query = role === 'admin' ? { recipient_type: 'admin' } : { recipient_type: 'user', recipient_username: username };
    await Notification.deleteMany(query);
    res.json({ message: 'All cleared' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/notifications/:id — delete single
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

export default router;
