import express from 'express';
import User from '../models/User.js';
import Click from '../models/Click.js';

const router = express.Router();

// GET /api/user/team/:username - PEHLE RAKHO
router.get('/team/:username', async (req, res) => {
  try {
    const ProfilePhoto = (await import('../models/ProfilePhoto.js')).default;

    const getTotalTeam = async (username) => {
      const direct = await User.find({ referred_by: username, role: 'user', status: 'active' });
      let total = direct.length;
      for (const member of direct) {
        total += await getTotalTeam(member.username);
      }
      return total;
    };

    const members = await User.find({ referred_by: req.params.username, role: 'user', status: { $in: ['active', 'suspended'] } }).select('-password').sort({ createdAt: -1 });

    const membersWithData = await Promise.all(members.map(async (m) => {
      const totalClicks = await Click.countDocuments({ username: m.username });
      const photo = await ProfilePhoto.findOne({ user_id: m._id, is_current: true });

      // Direct referrals
      const directTeam = await User.countDocuments({ referred_by: m.username, role: 'user', status: 'active' });

      // 1st level
      const directMembers = await User.find({ referred_by: m.username, role: 'user', status: 'active' }).select('username');
      let firstLevelCount = 0;
      for (const d of directMembers) {
        const count = await User.countDocuments({ referred_by: d.username, role: 'user', status: 'active' });
        firstLevelCount += count;
      }

      // Total team
      const totalTeam = await getTotalTeam(m.username);

      return { ...m.toObject(), totalClicks, photoUrl: photo?.url || null, directTeam, firstLevelCount, totalTeam };
    }));

    res.json(membersWithData);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/user/:username - BAAD MEIN RAKHO
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    let user = await User.findOne({ username: username.toLowerCase(), status: 'active' });
    if (!user) {
      user = await User.findOne({ role: 'admin' });
    }
    if (!user) return res.status(404).json({ message: 'No user found' });
    res.json({
      username: user.username,
      full_name: user.full_name,
      referral_link: user.referral_link,
      is_default: !req.params.username || user.role === 'admin',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:username/click', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    let username = req.params.username.toLowerCase();
    const user = await User.findOne({ username, status: 'active' });
    if (!user) {
      const admin = await User.findOne({ role: 'admin' });
      username = admin?.username || username;
    }
    await Click.create({ username, ip });
    res.json({ message: 'Click recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
