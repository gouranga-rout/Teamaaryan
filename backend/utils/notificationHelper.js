import Notification from '../models/Notification.js';
import { io } from '../server.js';

// Admin ko notification bhejo
export const notifyAdmin = async (type, title, body) => {
  try {
    const notif = await Notification.create({ recipient_type: 'admin', type, title, body });
    io.emit('notification:admin', notif);
  } catch (err) {
    console.error('notifyAdmin error:', err.message);
  }
};

// Specific user ko notification bhejo
export const notifyUser = async (username, type, title, body) => {
  try {
    const notif = await Notification.create({ recipient_type: 'user', recipient_username: username, type, title, body });
    io.emit(`notification:user:${username}`, notif);
  } catch (err) {
    console.error('notifyUser error:', err.message);
  }
};
