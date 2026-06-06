import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import '../App.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegisterPage = () => {
  const [form, setForm] = useState({
    full_name:'', username:'', email:'', mobile:'',
    dob:'', referral_link:'', password:'',
    state:'', district:'', pincode:'', referred_by: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  useEffect(() => {
  const ref = searchParams.get('ref');
  if (ref) setForm(prev => ({...prev, referred_by: ref}));
  }, []);

  const handle = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await API.post('/api/auth/register', form);
      setSuccess(res.data.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/login'), 6000);
      } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

     finally { setLoading(false); }
  };

  return (
    <>
    <Navbar />
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo"><h1>Team <span>Aaryan</span></h1></div>
        <h2>Promote Your Business 🚀</h2>
        <p className="auth-sub">Fill in your details and request access from admin</p>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}<br/><small>Redirecting to login...</small></div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-grid">
            <div className="auth-field">
              <label>Full Name *</label>
              <input name="full_name" placeholder="Your full name" value={form.full_name} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label>Username *</label>
            {/*  <input name="username" placeholder="e.g. rahul123" value={form.username} onChange={handle} required /> */}
              <input name="username" placeholder="e.g. rahul123" value={form.username}
                 onChange={e => setForm({...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)})}
                 maxLength={12}
		 required />
              <small>Your page: https://teamaaryan/<strong>{form.username || 'username'}</strong></small>
            </div>
            <div className="auth-field">
              <label>Email Address *</label>
              <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label>Mobile Number *</label>
              <input name="mobile" type="tel" placeholder="10 digit mobile number" value={form.mobile}
                onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                maxLength={10} required />
            </div>
            <div className="auth-field">
              <label>Date of Birth *</label>
              <input name="dob" type="date" value={form.dob} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label>Password *</label>
              <div className="pass-wrapper">
                <input name="password" type={showPass ? 'text' : 'password'}
                  placeholder="Create a strong password" value={form.password} onChange={handle} required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="auth-field">
              <label>State *</label>
              <input name="state" placeholder="Your state" value={form.state} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label>District *</label>
              <input name="district" placeholder="Your district" value={form.district} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label>Pincode *</label>
              <input name="pincode" type="text" inputMode="numeric" placeholder="6 digit pincode" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} maxLength={6} required />
            </div>
          </div>
          <div className="auth-field auth-field-full">
            <label>Your RichIND Referral Link *</label>
            <input name="referral_link" placeholder="https://richind.org/checkout?slug=...&referrer_code=..." 
             value={form.referral_link} 
             onChange={e => {
             setForm({...form, referral_link: e.target.value});
             const val = e.target.value;
             const isValid = val.startsWith('https://richind.org/checkout') && val.includes('referrer_code=');
             e.target.setCustomValidity(isValid || val === '' ? '' : 'Please enter a valid RichIND referral link');
             }}
             required />
             <small style={{color: form.referral_link && (!form.referral_link.startsWith('https://richind.org/checkout') || !form.referral_link.includes('referrer_code=')) ? 'crimson' : '#888'}}>
               {form.referral_link && (!form.referral_link.startsWith('https://richind.org/checkout') || !form.referral_link.includes('referrer_code='))
               ? '❌ Invalid link! Must be a RichIND referral link'
               : '✅ Paste your RichIND referral link here'}
            </small>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Submitting...' : '🔑 Request Access Code'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
        <p className="auth-link"><Link to="/">← Back to Home</Link></p>
      </div>
    </div>
<Footer />
</>
  );
};

export default RegisterPage;
