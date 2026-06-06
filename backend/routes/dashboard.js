import express from 'express';
import Click from '../models/Click.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats - logged in user's click stats
router.get('/stats', protect, async (req, res) => {
  try {
    const username = req.user.username;
    const now = new Date();

    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 6); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [today, week, month, allClicks] = await Promise.all([
      Click.countDocuments({ username, visited_at: { $gte: startOfDay } }),
      Click.countDocuments({ username, visited_at: { $gte: startOfWeek } }),
      Click.countDocuments({ username, visited_at: { $gte: startOfMonth } }),
      Click.find({ username }).sort({ visited_at: 1 }),
    ]);

    // Build daily data (all time)
    const daily = {};
    allClicks.forEach(c => {
      const d = c.visited_at.toISOString().split('T')[0];
      daily[d] = (daily[d] || 0) + 1;
    });

    // Build monthly data (all time)
    const monthly = {};
    allClicks.forEach(c => {
      const m = c.visited_at.toISOString().substring(0, 7);
      monthly[m] = (monthly[m] || 0) + 1;
    });

    // Package clicks — month wise
    const selectedMonth = req.query.pkgMonth; // e.g. "2025-05"
    const pkgQuery = { username, package: { $ne: null } };
    if (selectedMonth) {
      const [yr, mo] = selectedMonth.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1);
      const end = new Date(yr, mo, 1);
      pkgQuery.visited_at = { $gte: start, $lt: end };
    }
    const pkgClicks = await Click.find(pkgQuery);
    const packageClicks = {};
    pkgClicks.forEach(c => {
      packageClicks[c.package] = (packageClicks[c.package] || 0) + 1;
    });

    res.json({ today, week, month, daily, monthly, packageClicks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/profile - logged in user's profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/dashboard/package-click — track package link click
router.post('/package-click', async (req, res) => {
  try {
    const { username, package: pkg } = req.body;
    if (!username || !pkg) return res.status(400).json({ message: 'Missing fields' });
    await Click.create({ username: username.toLowerCase(), package: pkg, ip: req.ip });

    // Real-time emit
    const { io } = await import('../server.js');
    io.emit(`pkg:click:${username.toLowerCase()}`, { package: pkg });

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
