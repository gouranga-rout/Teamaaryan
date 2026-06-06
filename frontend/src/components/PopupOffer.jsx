import React from 'react';

const PopupOffer = ({ isVisible, onClose, bannerUrl, scrollTarget }) => {
  const handleMoreDetails = () => {
    document.getElementById(scrollTarget || 'TripSection')?.scrollIntoView({ behavior: 'smooth' });
    onClose();
  };
  return (
    <>
      <div className={`place ${isVisible ? 'visible' : ''}`} onClick={onClose}></div>
      <div className={`popupOffer ${isVisible ? 'visible' : ''}`}>
        <img src={bannerUrl || "/offer/Jim_Corbett.jpg"} alt="Offer" />
        <button className="offermore-btn" onClick={handleMoreDetails}>More Details</button>
        <button className="offerclose-btn" onClick={onClose}>Close</button>
      </div>
    </>
  );
};

export default PopupOffer;

