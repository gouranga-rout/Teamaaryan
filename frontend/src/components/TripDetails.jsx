import React from 'react';

const TripDetails = ({ bannerUrl, trip }) => {
  const totalDays = trip?.start_date && trip?.end_date
    ? Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))
    : 0;
  const remainingDays = trip?.end_date
    ? Math.max(0, Math.ceil((new Date(trip.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="moreDetailsSection" id="TripSection">
      <h1>National &amp; International Trip Details</h1>
      <h2 className="headline">Launching Richind's 3rd National Trip</h2>
      <div className="tripImage">
        <img src={bannerUrl || "/offer/Jim_Corbett.jpg"} alt="Trip" data-aos="zoom-in" />
      </div>
      {trip?.destination && (
        <ul>
          <li>Destination: <span>{trip.destination}</span></li>
          <li>Duration: <span>{trip.nights} Nights, {trip.days} Days</span></li>
          <li>Qualification Criteria: <span>Earn ₹{trip.qualification_amount?.toLocaleString()} Active Income</span></li>
          <li>Time Period: <span>{new Date(trip.start_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} to {new Date(trip.end_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</span> ({totalDays} Days)</li>
          <li>Remaining Days: <span style={{ color: remainingDays > 0 ? '#0ef' : 'crimson' }}>{remainingDays > 0 ? `${remainingDays} Days` : 'Offer Expired'}</span></li>
        </ul>
      )}
    </div>
  );
};

export default TripDetails;
