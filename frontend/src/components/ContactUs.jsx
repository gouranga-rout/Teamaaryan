import React, { useState } from 'react';
import { FaFacebook, FaInstagram, FaTelegram } from 'react-icons/fa';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && value.length > 20) return;
    if (name === 'subject' && value.length > 20) return;
    if (name === 'message' && value.length > 500) return;
    if (name === 'phone') {
      setForm(prev => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally { setLoading(false); }
  };

  return (
    <div className="contact-section" id="ContactSection">
      <div className="contact-inner">
        <h1 className="contact-title">📬 CONTACT <span>US</span></h1>
        <p className="contact-subtitle">Have a question? We'd love to hear from you!</p>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">✅ {success}</div>}
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="contact-grid">
            <div className="auth-field"><label>Your Name *</label><input name="name" placeholder="Your full name" value={form.name} onChange={handle} required /></div>
            <div className="auth-field"><label>Your Email *</label><input name="email" type="email" placeholder="your@gmail.com" value={form.email} onChange={handle} required /></div>
            <div className="auth-field"><label>Your Phone *</label><input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={handle} maxLength={10} required /></div>
            <div className="auth-field"><label>Subject *</label><input name="subject" placeholder="Message subject" value={form.subject} onChange={handle} required /></div>
          </div>
          <div className="auth-field">
            <label>Your Message *</label>
            <textarea name="message" placeholder="Write your message here..." value={form.message} onChange={handle} rows={5} required className="contact-textarea" />
            <small>{form.message.length}/500</small>
          </div>
          <button type="submit" className="contact-btn" disabled={loading}>{loading ? 'Sending...' : '📤 Send Message'}</button>
        </form>
        <div className="contact-info">
          <div className="contact-info-item"><span className="contact-info-icon">📍</span><div><div className="contact-info-label">Office Address</div><div className="contact-info-value">Baleshwar, 756030, Odisha, India</div></div></div>
          <div className="contact-info-item"><span className="contact-info-icon">📞</span><div><div className="contact-info-label">Phone</div><div className="contact-info-value">+91 8455934031</div></div></div>
          <div className="contact-info-item"><span className="contact-info-icon">📧</span><div><div className="contact-info-label">Email</div><div className="contact-info-value">support.teamaaryan@gmail.com</div></div></div>
          <div className="contact-info-item"><FaFacebook className="contact-icon-fb" /><div><div className="contact-info-label">Facebook</div><div className="contact-info-value"><a href="https://www.facebook.com/share/1LPvWEVPGX/" target="_blank" rel="noreferrer">Team Aaryan</a></div></div></div>
          <div className="contact-info-item"><FaInstagram className="contact-icon-ig" /><div><div className="contact-info-label">Instagram</div><div className="contact-info-value"><a href="https://www.instagram.com/teamaaryan.in" target="_blank" rel="noreferrer">@teamaaryan.in</a></div></div></div>
          <div className="contact-info-item"><FaTelegram className="contact-icon-tg" /><div><div className="contact-info-label">Telegram</div><div className="contact-info-value"><a href="https://t.me/team_aaryan" target="_blank" rel="noreferrer">@team_aaryan</a></div></div></div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
