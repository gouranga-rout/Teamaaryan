import express from 'express';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import User from '../models/User.js';
import Click from '../models/Click.js';
import Media from '../models/Media.js';
import TripDetails from '../models/TripDetails.js';
import FestivalOffer from '../models/FestivalOffer.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { notifyAdmin, notifyUser } from '../utils/notificationHelper.js';

const router = express.Router();
router.use(protect, adminOnly);

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
});

const emailTemplate = (content) => `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #14051f; color: white; padding: 2rem; border-radius: 10px; border: 1px solid crimson;">
  <h1 style="color: crimson; text-align: center; margin-bottom: 0;">Team Aaryan</h1>
  <p style="color: #aaa; text-align: center; margin-top: .3rem; font-size: .85rem;">RichIND Affiliate Network</p>
  <hr style="border-color: #333; margin: 1rem 0;" />
  ${content}
  <hr style="border-color: #333; margin: 1.5rem 0 1rem;" />
  <p style="color: #666; font-size: 0.8rem; text-align: center;">© ${new Date().getFullYear()} Team Aaryan — All rights reserved.</p>
</div>
`;

const getSupabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const getBucket = () => process.env.SUPABASE_BUCKET;

const uploadToSupabase = async (file, folder) => {
  try {
    const supabase = getSupabase();
    const ext = file.mimetype.split('/')[1];
    const filename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const { error } = await supabase.storage.from(getBucket()).upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = getSupabase().storage.from(getBucket()).getPublicUrl(filename);
    return { url: data.publicUrl, public_id: filename };
  } catch (err) {
    console.error('uploadToSupabase error:', err.message);
    throw err;
  }
};

const deleteFromSupabase = async (public_id) => {
  if (!public_id) return;
  const supabase = getSupabase();
  await supabase.storage.from(getBucket()).remove([public_id]);
};

// GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const users = await User.find({ status: 'pending', role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const ProfilePhoto = (await import('../models/ProfilePhoto.js')).default;
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });

    // Recursive total team count
    const getTotalTeam = async (username) => {
      const direct = await User.find({ referred_by: username, role: 'user' });
      let total = direct.length;
      for (const member of direct) {
        total += await getTotalTeam(member.username);
      }
      return total;
    };

    const usersWithClicks = await Promise.all(users.map(async (u) => {
      const totalClicks = await Click.countDocuments({ username: u.username });
      const photo = await ProfilePhoto.findOne({ user_id: u._id, is_current: true });

      // Direct referrals
      const directTeam = await User.countDocuments({ referred_by: u.username, role: 'user' });

      // 1st level — direct members ke direct referrals
      const directMembers = await User.find({ referred_by: u.username, role: 'user' }).select('username');
      let firstLevelCount = 0;
      for (const m of directMembers) {
        const count = await User.countDocuments({ referred_by: m.username, role: 'user' });
        firstLevelCount += count;
      }

      // Total team — full depth
      const totalTeam = await getTotalTeam(u.username);

      return { ...u.toObject(), totalClicks, photoUrl: photo?.url || null, directTeam, firstLevelCount, totalTeam };
    }));

    res.json(usersWithClicks);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/approve/:id
router.put('/approve/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Send activation email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: '✅ Your Account is Approved — Team Aaryan',
        html: emailTemplate(`
          <h2 style="text-align: center; color: white;">Congratulations, <span style="color: crimson;">${user.full_name}</span>! 🎉</h2>
          <p style="color: #ccc;">Your Team Aaryan account has been <strong style="color: #0f0;">approved</strong> by the admin. You can now login and start sharing your referral link!</p>

          <div style="background: rgba(0,255,0,0.05); border: 1px solid #0f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: center;">
            <p style="color: #0f0; margin: 0; font-size: 1rem;">✅ Account Activated!</p>
          </div>

          <div style="background: #1a0a2e; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="margin: 0 0 .5rem; color: #aaa; font-size: .85rem;">Your Personalized Referral Page:</p>
            <div style="background: #0d0520; border: 1px solid #0ef; border-radius: 8px; padding: .8rem; text-align: center;">
              <p style="color: #0ef; margin: 0; font-size: 1rem; font-weight: bold;">teamaaryan.com/${user.username}</p>
            </div>
          </div>

          <p style="color: #aaa; font-size: .85rem;">Login using your registered mobile number and password:</p>
          <div style="text-align: center; margin: 1rem 0;">
            <a href="https://teamaaryan.com/login" style="background: crimson; color: white; padding: .7rem 1.5rem; border-radius: 5px; text-decoration: none; font-weight: bold;">Login Now →</a>
          </div>

          <p style="color: #666; font-size: .8rem;">Start sharing your link and earn commissions with every referral!</p>
        `)
      });
    } catch (mailErr) {
      console.error('Approval email error:', mailErr.message);
    }

    res.json({ message: 'User approved', user });

    // Notifications
    await notifyAdmin('account_approved', '✅ User Approved', `${user.full_name} (@${user.username}) account has been approved`);
    await notifyUser(user.username, 'account_approved', '🎉 Account Approved!', `Welcome to Team Aaryan! Your account has been approved. Start sharing your link!`);
    await notifyUser(user.referred_by || 'aaryan', 'team_joined', '👥 New Team Member!', `${user.full_name} (@${user.username}) has been approved and joined your team!`);

  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/reject/:id
/*router.put('/reject/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User suspended', user });
  } catch { res.status(500).json({ message: 'Server error' }); }
});
*/

router.put('/reject/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Send suspension email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: '⚠️ Account Suspended — Team Aaryan',
        html: emailTemplate(`
          <h2 style="text-align: center; color: white;">Account <span style="color: crimson;">Suspended</span> ⚠️</h2>
          <p style="color: #ccc;">Hi <strong style="color: white;">${user.full_name}</strong>,</p>
          <p style="color: #ccc;">Your Team Aaryan account has been <strong style="color: crimson;">suspended</strong> by the admin.</p>

          <div style="background: rgba(220,20,60,0.1); border: 1px solid crimson; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: center;">
            <p style="color: crimson; margin: 0; font-size: 1rem;">🚫 Account Access Restricted</p>
          </div>

          <p style="color: #aaa; font-size: .85rem;">If you think this is a mistake or want to appeal, please contact the admin.</p>
        `)
      });
    } catch (mailErr) {
      console.error('Suspension email error:', mailErr.message);
    }

    res.json({ message: 'User suspended', user });

    // Notifications
    await notifyAdmin('account_suspended', '🚫 User Suspended', `${user.full_name} (@${user.username}) account has been suspended`);
    await notifyUser(user.username, 'account_suspended', '⚠️ Account Suspended', `Your account has been suspended. Contact admin for support.`);
    await notifyUser(user.referred_by || 'aaryan', 'team_update', '⚠️ Team Update', `${user.full_name} (@${user.username}) from your team has been suspended.`);

  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/media
router.get('/media', async (req, res) => {
  try {
    const banner = await Media.findOne({ type: 'banner' }).sort({ createdAt: -1 });
    const proofs = await Media.find({ type: 'proof' }).sort({ createdAt: -1 });
    res.json({ banner, proofs });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/media/banner
router.post('/media/banner', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const old = await Media.findOne({ type: 'banner' });
    if (old) { await deleteFromSupabase(old.public_id); await Media.deleteOne({ _id: old._id }); }
    const { url, public_id } = await uploadToSupabase(req.file, 'banner');
    const media = await Media.create({ type: 'banner', url, public_id });
    res.json({ message: 'Banner uploaded', media });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// POST /api/admin/media/proof
router.post('/media/proof', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const count = await Media.countDocuments({ type: 'proof' });
    if (count >= 20) return res.status(400).json({ message: 'Maximum 20 proof images allowed' });
    const { url, public_id } = await uploadToSupabase(req.file, 'proofs');
    const media = await Media.create({ type: 'proof', url, public_id });
    res.json({ message: 'Proof uploaded', media });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// DELETE /api/admin/media/:id
router.delete('/media/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });
    await deleteFromSupabase(media.public_id);
    await Media.deleteOne({ _id: media._id });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/trip
router.get('/trip', async (req, res) => {
  try {
    const trip = await TripDetails.findOne().sort({ createdAt: -1 });
    res.json(trip || {});
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/trip
router.post('/trip', async (req, res) => {
  try {
    const { destination, nights, days, qualification_amount, start_date, end_date } = req.body;
    await TripDetails.deleteMany({});
    const trip = await TripDetails.create({ destination, nights, days, qualification_amount, start_date: new Date(start_date), end_date: new Date(end_date) });
    res.json({ message: 'Trip details saved!', trip });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// GET /api/admin/team/:username
router.get('/team/:username', async (req, res) => {
  try {
    const ProfilePhoto = (await import('../models/ProfilePhoto.js')).default;

    const getTotalTeam = async (username) => {
      const direct = await User.find({ referred_by: username, role: 'user' });
      let total = direct.length;
      for (const member of direct) {
        total += await getTotalTeam(member.username);
      }
      return total;
    };

    const members = await User.find({ referred_by: req.params.username, role: 'user' }).select('-password').sort({ createdAt: -1 });

    const membersWithData = await Promise.all(members.map(async (m) => {
      const totalClicks = await Click.countDocuments({ username: m.username });
      const photo = await ProfilePhoto.findOne({ user_id: m._id, is_current: true });

      // Direct referrals
      const directTeam = await User.countDocuments({ referred_by: m.username, role: 'user' });

      // 1st level
      const directMembers = await User.find({ referred_by: m.username, role: 'user' }).select('username');
      let firstLevelCount = 0;
      for (const d of directMembers) {
        const count = await User.countDocuments({ referred_by: d.username, role: 'user' });
        firstLevelCount += count;
      }

      // Total team
      const totalTeam = await getTotalTeam(m.username);

      return { ...m.toObject(), totalClicks, photoUrl: photo?.url || null, directTeam, firstLevelCount, totalTeam };
    }));

    res.json(membersWithData);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/user-profile/:id - fetch user details + profile photo
router.get('/user-profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ProfilePhoto = (await import('../models/ProfilePhoto.js')).default;
    const photo = await ProfilePhoto.findOne({ user_id: req.params.id, is_current: true });
    res.json({ ...user.toObject(), photoUrl: photo?.url || null });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/messages
router.get('/messages', async (req, res) => {
  try {
    const ContactMessage = (await import('../models/ContactMessage.js')).default;
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/messages/:id/read
router.put('/messages/:id/read', async (req, res) => {
  try {
    const ContactMessage = (await import('../models/ContactMessage.js')).default;
    await ContactMessage.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ message: 'Marked as read' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/messages/:id/reply
router.post('/messages/:id/reply', async (req, res) => {
  try {
    const ContactMessage = (await import('../models/ContactMessage.js')).default;
    const { replyText } = req.body;
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, 
      { reply: replyText, replied_at: new Date(), is_read: true }, 
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // Send reply email
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
      to: msg.email,
      subject: `Re: ${msg.subject} — Team Aaryan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #14051f; color: white; padding: 2rem; border-radius: 10px; border: 1px solid crimson;">
          <h1 style="color: crimson; text-align: center;">Team Aaryan</h1>
          <hr style="border-color: #333;" />
          <h2 style="color: white;">Reply to your message</h2>
          <p style="color: #ccc;">Hi <strong style="color: white;">${msg.name}</strong>,</p>
          <div style="background: #1a0a2e; border: 1px solid #0ef; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="color: #aaa; font-size: .85rem;">Your original message:</p>
            <p style="color: #ccc; font-style: italic;">${msg.message}</p>
          </div>
          <div style="background: rgba(0,238,255,0.05); border: 1px solid #0ef; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="color: #aaa; font-size: .85rem;">Our reply:</p>
            <p style="color: white;">${replyText}</p>
          </div>
          <hr style="border-color: #333;" />
          <p style="color: #666; font-size: .8rem; text-align: center;">© ${new Date().getFullYear()} Team Aaryan</p>
        </div>
      `
    });

    res.json({ message: 'Reply sent!' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', async (req, res) => {
  try {
    const ContactMessage = (await import('../models/ContactMessage.js')).default;
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});


// GET /api/admin/announcement
router.get('/announcement', async (req, res) => {
  try {
    const Settings = (await import('../models/Settings.js')).default;
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ announcementActive: true });
    res.json({ announcementActive: settings.announcementActive });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/announcement
router.put('/announcement', async (req, res) => {
  try {
    const Settings = (await import('../models/Settings.js')).default;
    const { announcementActive } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ announcementActive });
    else { settings.announcementActive = announcementActive; await settings.save(); }
    res.json({ announcementActive: settings.announcementActive });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/festival-offer
router.get('/festival-offer', async (req, res) => {
  try {
    let offer = await FestivalOffer.findOne();
    if (!offer) offer = await FestivalOffer.create({
      active: false, marqueeText: '', packages: [
        { slug:'starter-package', name:'Starter Package', amount:260, direct:200, passive:20 },
        { slug:'intermediate', name:'Intermediate Package', amount:512, direct:400, passive:40 },
        { slug:'expert', name:'Expert Package', amount:1050, direct:800, passive:80 },
        { slug:'master', name:'Master Package', amount:2299, direct:1700, passive:170 },
        { slug:'brahmastra', name:'Brahmastra Package', amount:4999, direct:3800, passive:380 },
        { slug:'premium-pro', name:'Premium Pro Package', amount:9998, direct:7300, passive:730 },
      ]
    });
    res.json(offer);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/festival-offer
router.put('/festival-offer', async (req, res) => {
  try {
    const { active, marqueeText, startDate, endDate, packages } = req.body;
    let offer = await FestivalOffer.findOne();
    if (!offer) offer = new FestivalOffer();
    offer.active = active;
    offer.marqueeText = marqueeText;
    offer.startDate = startDate ? new Date(startDate) : null;
    offer.endDate = endDate ? new Date(endDate) : null;
    if (packages) offer.packages = packages;
    await offer.save();
    res.json(offer);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/festival-offer/banner
router.post('/festival-offer/banner', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    let offer = await FestivalOffer.findOne();
    if (!offer) offer = new FestivalOffer();
    if (offer.bannerPublicId) await deleteFromSupabase(offer.bannerPublicId);
    const { url, public_id } = await uploadToSupabase(req.file, 'festival-banners');
    offer.bannerUrl = url;
    offer.bannerPublicId = public_id;
    await offer.save();
    res.json({ url });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

export default router;
