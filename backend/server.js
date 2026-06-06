import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import mediaRoutes from './routes/media.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import User from './models/User.js';
import profileRoutes from './routes/profileRoute.js';
import contactRoutes from './routes/contact.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Live visitors tracking
/*
let liveVisitors = 0;

io.on('connection', (socket) => {
  socket.on('visitor:join', () => {
    liveVisitors++;
    io.emit('live:count', liveVisitors);
  });
  socket.on('disconnect', () => {
    if (liveVisitors > 0) liveVisitors--;
    io.emit('live:count', liveVisitors);
  });
});
*/

// Live visitors tracking per username
const liveVisitors = {}; // { username: count }
const liveMilestones = {}; // { username: last milestone hit }

io.on('connection', (socket) => {
  let joinedUsername = null;

  socket.on('visitor:join', (data) => {
    // Safe handling — data could be undefined, string, or object
    const username = (typeof data === 'object' && data !== null)
      ? (data.username || 'aaryan')
      : (typeof data === 'string' && data ? data : 'aaryan');
    if (!username) return;
    joinedUsername = username;
    liveVisitors[username] = (liveVisitors[username] || 0) + 1;
    const count = liveVisitors[username];
    io.emit(`live:count:${username}`, count);

    // Milestone check (10, 20, 30...)
    const milestone = Math.floor(count / 10) * 10;
    if (milestone > 0 && milestone !== liveMilestones[username]) {
      liveMilestones[username] = milestone;
      import('./utils/notificationHelper.js').then(({ notifyAdmin, notifyUser }) => {
        notifyAdmin('live_milestone', '👁️ Live Milestone!', `@${username}'s page has ${milestone}+ live visitors!`);
        notifyUser(username, 'live_milestone', '👁️ Live Milestone!', `Your page has ${milestone}+ live visitors right now! 🔥`);
      });
    }
  });

  socket.on('disconnect', () => {
    if (!joinedUsername) return;
    if (liveVisitors[joinedUsername] > 0) liveVisitors[joinedUsername]--;
    io.emit(`live:count:${joinedUsername}`, liveVisitors[joinedUsername] || 0);
  });
});




// Export io for use in routes if needed
export { io };

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);

// Public announcement status route (no auth required)
app.get('/api/announcement', async (req, res) => {
  try {
    const Settings = (await import('./models/Settings.js')).default;
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ announcementActive: true });
    res.json({ announcementActive: settings.announcementActive });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Public festival offer route (no auth required)
app.get('/api/festival-offer', async (req, res) => {
  try {
    const FestivalOffer = (await import('./models/FestivalOffer.js')).default;
    const offer = await FestivalOffer.findOne();
    if (!offer) return res.json({ active: false });
    const now = new Date();
    const isActive = offer.active &&
      (!offer.startDate || now >= offer.startDate) &&
      (!offer.endDate || now <= offer.endDate);
    res.json({ ...offer.toObject(), isActive });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Seed admin user on startup
const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (!existing) {
      await User.create({
        full_name: process.env.ADMIN_FULL_NAME,
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL,
        mobile: '0000000000',
        dob: '01/01/1990',
        referral_link: process.env.ADMIN_REFERRAL_LINK,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        status: 'active',
      });
      console.log('✅ Admin seeded successfully');
    }
  } catch (err) {
    console.error('❌ Admin seed error:', err.message);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedAdmin();
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error('❌ DB connection error:', err));
