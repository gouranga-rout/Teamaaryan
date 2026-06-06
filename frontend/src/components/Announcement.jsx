import React from 'react';

const Announcement = ({ onOfferClick }) => (
  <div className="announcement">
    <div className="offer-txt">Offer</div>
    <marquee className="offer" behavior="scroll" direction="left" scrollAmount="5">
      <a href="/" onClick={e => { e.preventDefault(); onOfferClick(); }}>
        🎉 3 Night's 4 Day's Nainital &amp; Jim Corbett Trip 🎉{' '}
        <span className="green">Get Details</span>
      </a>
    </marquee>
  </div>
);

export default Announcement;
