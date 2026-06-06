import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api';
import '../App.css';

import Navbar from '../components/Navbar';
import Announcement from '../components/Announcement';
import IntroText from '../components/IntroText';
import Presentation from '../components/Presentation';
import RegisterButton from '../components/RegisterButton';
import EarningsProofs from '../components/EarningsProofs';
import LegalCertificates from '../components/LegalCertificates';
import Packages from '../components/Packages';
import Calculations from '../components/Calculations';
import TripDetails from '../components/TripDetails';
import PromoteBusiness from '../components/PromoteBusiness';
import AboutMe from '../components/AboutMe';
import FAQ from '../components/FAQ';
import Popup from '../components/Popup';
import PopupOffer from '../components/PopupOffer';
import ScrollToTopButton from '../components/ScrollToTopButton';
import ContactUs from '../components/ContactUs';
import Footer from '../components/Footer';

const ReferralPage = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [mediaData, setMediaData] = useState({ banner: null, proofs: [] });
  const [popupVisible, setPopupVisible] = useState(false);
  const [offerVisible, setOfferVisible] = useState(false);
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [festivalOffer, setFestivalOffer] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get(`/api/user/${username || 'aaryan'}`);
        setUserData(res.data);
      } catch {
        try { const res = await API.get('/api/user/aaryan'); setUserData(res.data); } catch {}
      }
    };
    const fetchMedia = async () => {
      try { const res = await API.get('/api/media'); setMediaData(res.data); } catch {}
    };
    const trackClick = async () => {
      try { await API.post(`/api/user/${username || 'aaryan'}/click`); } catch {}
    };
    const fetchAnnouncement = async () => {
      try { const r = await API.get('/api/announcement'); setAnnouncementActive(r.data.announcementActive); } catch {}
    };
    const fetchFestivalOffer = async () => {
      try { const r = await API.get('/api/festival-offer'); setFestivalOffer(r.data); } catch {}
    };

    fetchUser(); fetchMedia(); trackClick(); fetchAnnouncement(); fetchFestivalOffer();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.emit('visitor:join', { username: username || 'aaryan' });
    const timer = setTimeout(() => setOfferVisible(true), 5000);
    return () => { clearTimeout(timer); socket.disconnect(); };
  }, [username]);

  const referralLink = userData?.referral_link || '';
  const now = new Date();
  const festivalActive =
    festivalOffer?.active === true &&
    festivalOffer?.startDate && festivalOffer?.endDate &&
    now >= new Date(festivalOffer.startDate) &&
    now <= new Date(festivalOffer.endDate);

  return (
    <>
      <Navbar />
      {announcementActive && (
        festivalActive
          ? <div className="announcement">
              <div className="announcement-bar">
                <marquee className="offer" behavior="scroll" direction="left" scrollAmount="5"
                  onClick={() => setOfferVisible(true)} style={{ cursor:'pointer' }}>
                  {festivalOffer.marqueeText || '🔥 Festival Offer Active! Click to view details'}
                </marquee>
              </div>
            </div>
          : <Announcement onOfferClick={() => setOfferVisible(true)} />
      )}
      <IntroText />
      <Presentation />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <EarningsProofs proofImages={mediaData.proofs} />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <LegalCertificates />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <Packages festivalOffer={festivalActive ? festivalOffer : null} />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <Calculations referralLink={referralLink} username={userData?.username} festivalOffer={festivalActive ? festivalOffer : null} />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <TripDetails bannerUrl={mediaData.banner?.url} trip={mediaData.trip} />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <PromoteBusiness username={userData?.username} />
      <RegisterButton onClick={() => setPopupVisible(true)} />
      <AboutMe />
      <FAQ />
      <ScrollToTopButton />
      <ContactUs />
      <Footer />
      <Popup isVisible={popupVisible} onClose={() => setPopupVisible(false)} referralLink={referralLink} username={userData?.username} festivalOffer={festivalActive ? festivalOffer : null} />
      <PopupOffer isVisible={offerVisible} onClose={() => setOfferVisible(false)} bannerUrl={festivalActive ? festivalOffer.bannerUrl : mediaData.banner?.url} scrollTarget={festivalActive ? 'CalculationsSection' : 'TripSection'} />
    </>
  );
};

export default ReferralPage;
