import React from 'react';
import { useNavigate } from 'react-router-dom';

const PromoteBusiness = ({ username }) => {
  const navigate = useNavigate();
  return (
    <div className="promote-section">
      <div className="promote-inner">
        <div className="promote-icon">🚀</div>
        <h1>PROMOTE YOUR BUSINESS WITH <span>TEAM AARYAN</span></h1>
        <p>Join Team Aaryan and get your own personal referral page at<br />
          <strong>https://teamaaryan/<span className="promote-highlight">{username || 'yourname'}</span></strong>
        </p>
        <div className="promote-features">
          <div className="promote-feature">✅ Your own personal referral page</div>
          <div className="promote-feature">📊 Real-time analytics dashboard</div>
          <div className="promote-feature">📡 Check real-time data</div>
          <div className="promote-feature">🔗 Share your custom page with anyone</div>
        </div>
        <button className="promote-btn" onClick={() => navigate(`/register?ref=${username || 'aaryan'}`)}>
          Setup My Referral Page →
        </button>
      </div>
    </div>
  );
};

export default PromoteBusiness;
