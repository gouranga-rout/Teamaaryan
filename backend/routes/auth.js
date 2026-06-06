import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { notifyAdmin, notifyUser } from '../utils/notificationHelper.js';

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status === 'pending') return res.status(403).json({ message: 'Account pending admin approval' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Account rejected by admin' });
    if (user.status === 'suspended') return res.status(403).json({ message: 'Your account has been suspended by admin' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, full_name: user.full_name, role: user.role, referral_link: user.referral_link }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, username, email, mobile, dob, referral_link, password, state, district, pincode, referred_by } = req.body;

  if (!referral_link.startsWith('https://richind.org/checkout') || !referral_link.includes('referrer_code=')) {
    return res.status(400).json({ message: 'Invalid referral link. Must be a valid RichIND referral link.' });
  }

  try {
    const reserved = ['default', 'admin', 'aaryan', 'login', 'register', 'dashboard', 'api'];
    if (reserved.includes(username.toLowerCase())) {
      return res.status(400).json({ message: 'This username is not allowed. Please choose another.' });
    }

   if (username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
   if (username.length > 12) return res.status(400).json({ message: 'Username must be at most 12 characters' });

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'This email is already registered' });

    const exists = await User.findOne({ $or: [{ mobile }, { username }] });
    if (exists) {
      if (await User.findOne({ mobile })) return res.status(400).json({ message: 'This mobile number is already registered' });
      return res.status(400).json({ message: 'This username is already taken' });
    }

    const user = await User.create({ full_name, username, email, mobile, dob, referral_link, password, state, district, pincode, referred_by: referred_by || 'aaryan',  role: 'user', status: 'pending' });

    // ── Notifications ──
    // Admin ko: naya user register hua
    await notifyAdmin('new_register', '🆕 New Registration', `${full_name} (@${username}) joined via @${referred_by || 'aaryan'}`);

    // Referrer ko: unki team mein koi join hua
    const referrerUsername = referred_by || 'aaryan';
    await notifyUser(referrerUsername, 'team_joined', '👥 New Team Member!', `${full_name} (@${username}) joined your team!`);

    // Check referrer ki team milestone (10, 20, 30...)
    const referrerTeamCount = await User.countDocuments({ referred_by: referrerUsername, role: 'user', status: 'active' });
    if (referrerTeamCount > 0 && referrerTeamCount % 10 === 0) {
      await notifyAdmin('team_milestone', '🚀 Team Milestone!', `@${referrerUsername}'s team crossed ${referrerTeamCount} members!`);
      await notifyUser(referrerUsername, 'team_milestone', '🚀 Team Milestone!', `Your team crossed ${referrerTeamCount} members! Keep growing! 🎉`);
    }

    // Send onboarding email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to Team Aaryan!',
        html: emailTemplate(`
          <h2 style="text-align: center; color: white;">Welcome, <span style="color: crimson;">${full_name}</span>! 🎉</h2>
          <p style="color: #ccc;">Thank you for registering with <strong style="color: white;">Team Aaryan</strong>. We're excited to have you on board!</p>

          <div style="background: #1a0a2e; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="margin: 0 0 .5rem; color: #aaa; font-size: .85rem;">Your Registration Details:</p>
            <p style="margin: .3rem 0; color: white;">👤 Name: <strong>${full_name}</strong></p>
            <p style="margin: .3rem 0; color: white;">🔑 Username: <strong>@${username}</strong></p>
            <p style="margin: .3rem 0; color: white;">📱 Mobile: <strong>${mobile}</strong></p>
          </div>

          <div style="background: rgba(255,165,0,0.1); border: 1px solid orange; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: center;">
            <p style="color: orange; margin: 0; font-size: .95rem;">⏳ Your request is pending admin approval.</p>
            <p style="color: #aaa; margin: .5rem 0 0; font-size: .85rem;">You will receive another email once your account is activated.</p>
          </div>

          <p style="color: #aaa; font-size: .85rem;">Once approved, your personalized referral page will be live at:</p>
          <div style="background: #0d0520; border: 1px solid #0ef; border-radius: 8px; padding: .8rem; text-align: center;">
            <p style="color: #0ef; margin: 0; font-size: 1rem; font-weight: bold;">teamaaryan.com/${username}</p>
          </div>
        `)
      });
    } catch (mailErr) {
      console.error('Onboarding email error:', mailErr.message);
    }

    res.status(201).json({ message: 'Registration request submitted! Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
