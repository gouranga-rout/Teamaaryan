import express from 'express';
import nodemailer from 'nodemailer';
import ContactMessage from '../models/ContactMessage.js';
import { notifyAdmin } from '../utils/notificationHelper.js';

const router = express.Router();

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

// XSS sanitizer
const sanitize = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;')
  .replace(/\//g, '&#x2F;')
  .trim();

// POST /api/contact - submit contact form
router.post('/', async (req, res) => {
  try {
    let { name, email, phone, subject, message } = req.body;

    // Sanitize all inputs
    name = sanitize(name);
    email = sanitize(email);
    phone = sanitize(phone);
    subject = sanitize(subject);
    message = sanitize(message);

    // Validate
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (name.length > 20) return res.status(400).json({ message: 'Name must be max 20 characters' });
    if (subject.length > 20) return res.status(400).json({ message: 'Subject must be max 20 characters' });
    if (message.length > 500) return res.status(400).json({ message: 'Message must be max 500 characters' });
    if (phone.replace(/\D/g, '').length !== 10) return res.status(400).json({ message: 'Phone must be 10 digits' });
    if (!email.toLowerCase().endsWith('@gmail.com')) return res.status(400).json({ message: 'Only Gmail addresses allowed' });

    // Save to DB
    await ContactMessage.create({ name, email, phone, subject, message });

    // Admin ko notification
    const preview = message.length > 60 ? message.substring(0, 60) + '...' : message;
    await notifyAdmin('new_message', '📩 New Contact Message', `From ${name}: "${preview}"`);

    // Send confirmation email to user
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Team Aaryan" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `✅ We received your message — Team Aaryan`,
        html: emailTemplate(`
          <h2 style="text-align: center; color: white;">Message Received! ✅</h2>
          <p style="color: #ccc;">Hi <strong style="color: white;">${name}</strong>,</p>
          <p style="color: #ccc;">Thank you for contacting <strong style="color: white;">Team Aaryan</strong>. We have received your message and will get back to you soon!</p>

          <div style="background: #1a0a2e; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="margin: 0 0 .5rem; color: #aaa; font-size: .85rem;">Your Message Details:</p>
            <p style="margin: .3rem 0; color: white;">📌 Subject: <strong>${subject}</strong></p>
            <p style="margin: .3rem 0; color: white;">💬 Message: <em style="color: #ccc;">${message}</em></p>
          </div>

          <div style="background: rgba(0,238,255,0.05); border: 1px solid #0ef; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="color: #0ef; margin: 0; font-size: .9rem;">⏳ Our team will respond within 24-48 hours.</p>
          </div>

          <p style="color: #aaa; font-size: .85rem;">You can also reach us at:</p>
          <p style="color: white; font-size: .85rem;">📧 support.teamaaryan@gmail.com</p>
          <p style="color: white; font-size: .85rem;">📞 +91 8455934031</p>
        `)
      });
    } catch (mailErr) {
      console.error('Contact confirmation email error:', mailErr.message);
    }

    res.json({ message: 'Message sent successfully! We will get back to you soon.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
