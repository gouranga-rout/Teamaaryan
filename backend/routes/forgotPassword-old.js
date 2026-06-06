import express from 'express';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  }
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

// Store OTPs temporarily in memory
const otpStore = {};

// POST /api/forgot-password/send-otp
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset OTP — Team Aaryan',
      html: emailTemplate(`
        <h2 style="text-align: center; color: white;">Password Reset OTP</h2>
        <p style="color: #ccc;">Hi <strong style="color: white;">${user.full_name}</strong>,</p>
        <p style="color: #ccc;">Your OTP for password reset is:</p>
        <div style="background: #1a0a2e; border: 2px solid #00eeff; border-radius: 8px; padding: 1rem; text-align: center; margin: 1rem 0;">
          <h1 style="color: #00eeff; font-size: 2.5rem; letter-spacing: 10px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #aaa;">This OTP is valid for <strong style="color: white;">10 minutes</strong>.</p>
        <p style="color: #aaa;">If you did not request this, please ignore this email.</p>
      `)
    });

    res.json({ message: 'OTP sent to your email!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /api/forgot-password/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: 'OTP not found. Please request again.' });
    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired. Please request again.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    otpStore[email].verified = true;
    res.json({ message: 'OTP verified!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/forgot-password/reset
router.post('/reset', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const record = otpStore[email];
    if (!record || !record.verified) return res.status(400).json({ message: 'Please verify OTP first' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();
    delete otpStore[email];

    // Send password changed email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🔐 Password Changed Successfully — Team Aaryan',
        html: emailTemplate(`
          <h2 style="text-align: center; color: white;">Password Changed <span style="color: #0f0;">Successfully</span> ✅</h2>
          <p style="color: #ccc;">Hi <strong style="color: white;">${user.full_name}</strong>,</p>
          <p style="color: #ccc;">Your Team Aaryan account password has been changed successfully.</p>

          <div style="background: rgba(0,255,0,0.05); border: 1px solid #0f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: center;">
            <p style="color: #0f0; margin: 0;">✅ Password updated on ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>

          <div style="background: rgba(255,0,0,0.05); border: 1px solid crimson; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="color: crimson; margin: 0 0 .3rem; font-weight: bold;">⚠️ Didn't change your password?</p>
            <p style="color: #aaa; margin: 0; font-size: .85rem;">If you did not make this change, please contact us immediately. Your account may be compromised.</p>
          </div>

          <div style="text-align: center; margin: 1rem 0;">
            <a href="https://teamaaryan.com/login" style="background: crimson; color: white; padding: .7rem 1.5rem; border-radius: 5px; text-decoration: none; font-weight: bold;">Login Now →</a>
          </div>
        `)
      });
    } catch (mailErr) {
      console.error('Password changed email error:', mailErr.message);
    }

    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
