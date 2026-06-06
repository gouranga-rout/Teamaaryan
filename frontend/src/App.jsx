import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ReferralPage from './pages/ReferralPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';


const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/dashboard" element={
      <ProtectedRoute><UserDashboard /></ProtectedRoute>
    } />
    <Route path="/admin" element={
      <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
    } />
    {/* Dynamic referral page - catches /:username AND / */}
    <Route path="/:username" element={<ReferralPage />} />
    <Route path="/" element={<ReferralPage />} />
  </Routes>
);

export default App;
