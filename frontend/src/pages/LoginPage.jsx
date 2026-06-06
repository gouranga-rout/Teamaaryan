import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import '../App.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MAX_RESENDS = 3;

const LoginPage = () => {
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotStep, setForgotStep] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0); // ✅ NEW

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.mobile.length !== 10) return setError('Mobile number must be 10 digits');
    setLoading(true); setError('');
    try {
      const res = await API.post('/api/auth/login', form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleMobile = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, mobile: val });
  };

  const sendOtp = async () => {
    if (!forgotEmail) return setForgotError('Please enter your email');

    // Frontend UX check (real block backend pe hoga)
    if (resendCount >= MAX_RESENDS) {
      return setForgotError('OTP limit reached. Please try again after 1 hour.');
    }

    setForgotLoading(true); setForgotError(''); setForgotMsg('');
    try {
      const res = await API.post('/api/forgot-password/send-otp', { email: forgotEmail });
      setForgotMsg(res.data.message);
      setForgotStep(2);
      setResendCount(prev => prev + 1); // ✅ count badhao

      // 30 second cooldown
      setResendTimer(30);
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      // Backend ka 429 error bhi yahan dikhe ga
      setForgotError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setForgotLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp) return setForgotError('Please enter OTP');
    setForgotLoading(true); setForgotError(''); setForgotMsg('');
    try {
      const res = await API.post('/api/forgot-password/verify-otp', { email: forgotEmail, otp });
      setForgotMsg(res.data.message);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid OTP');
    } finally { setForgotLoading(false); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return setForgotError('Password must be at least 6 characters');
    setForgotLoading(true); setForgotError(''); setForgotMsg('');
    try {
      const res = await API.post('/api/forgot-password/reset', { email: forgotEmail, newPassword });
      setForgotMsg(res.data.message);
      setTimeout(() => {
        setForgotStep(0); setForgotEmail(''); setOtp('');
        setNewPassword(''); setForgotMsg(''); setResendCount(0); // ✅ reset on success
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Reset failed');
    } finally { setForgotLoading(false); }
  };

  if (forgotStep > 0) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-logo"><h1>Team <span>Aaryan</span></h1></div>
            <h2>🔐 Reset Password</h2>

            <div className="forgot-steps">
              <span className={forgotStep >= 1 ? 'step active' : 'step'}>1. Email</span>
              <span className="step-divider">→</span>
              <span className={forgotStep >= 2 ? 'step active' : 'step'}>2. OTP</span>
              <span className="step-divider">→</span>
              <span className={forgotStep >= 3 ? 'step active' : 'step'}>3. New Password</span>
            </div>

            {forgotError && <div className="auth-error">{forgotError}</div>}
            {forgotMsg && <div className="auth-success">{forgotMsg}</div>}

            {forgotStep === 1 && (
              <div>
                <div className="auth-field">
                  <label>Registered Email Address</label>
                  <input type="email" placeholder="your@email.com" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button className="auth-btn" onClick={sendOtp} disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : '📧 Send OTP'}
                </button>
              </div>
            )}

            {forgotStep === 2 && (
              <div>
                <p className="auth-sub">OTP sent to <strong>{forgotEmail}</strong></p>
                <div className="auth-field">
                  <label>Enter 6-digit OTP</label>
                  <input type="number" placeholder="XXXXXX" value={otp}
                    onChange={e => setOtp(e.target.value.slice(0, 6))} />
                </div>
                <button className="auth-btn" onClick={verifyOtp} disabled={forgotLoading}>
                  {forgotLoading ? 'Verifying...' : '✅ Verify OTP'}
                </button>

                {/* ✅ Updated Resend Button */}
                <button
                  className="auth-btn"
                  style={{ background: 'transparent', border: '1px solid #444', marginTop: '.5rem' }}
                  onClick={sendOtp}
                  disabled={forgotLoading || resendTimer > 0 || resendCount >= MAX_RESENDS}
                >
                  {resendCount >= MAX_RESENDS
                    ? '🚫 Limit Reached (1hr mein try karo)'
                    : resendTimer > 0
                      ? `🔄 Resend OTP in ${resendTimer}s`
                      : `🔄 Resend OTP (${MAX_RESENDS - resendCount} left)`}
                </button>
              </div>
            )}

            {forgotStep === 3 && (
              <div>
                <div className="auth-field">
                  <label>New Password</label>
                  <div className="pass-wrapper">
                    <input type={showNewPass ? 'text' : 'password'} placeholder="Enter new password"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <button type="button" className="pass-toggle" onClick={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button className="auth-btn" onClick={resetPassword} disabled={forgotLoading}>
                  {forgotLoading ? 'Resetting...' : '🔐 Reset Password'}
                </button>
              </div>
            )}

            <p className="auth-link" style={{ marginTop: '1rem' }}>
              <span style={{ cursor: 'pointer', color: '#0ef' }}
                onClick={() => { setForgotStep(0); setForgotError(''); setForgotMsg(''); setResendCount(0); }}>
                ← Back to Login
              </span>
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo"><h1>Team <span>Aaryan</span></h1></div>
          <h2>Welcome Back 👋</h2>
          <p className="auth-sub">Login to your account</p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Mobile Number</label>
              <input type="tel" placeholder="Enter your mobile number" value={form.mobile}
                onChange={handleMobile} maxLength={10} required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <div className="pass-wrapper">
                <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <span className="forgot-link" onClick={() => { setForgotStep(1); setError(''); }}>
                Forgot Password?
              </span>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="auth-link">Don't have an account? <Link to="/register">Request Access</Link></p>
          <p className="auth-link"><Link to="/">← Back to Home</Link></p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginPage;
