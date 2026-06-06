import React from 'react';
import API from '../api';

const pkgs = [
  { slug:'starter-package', img:'/packages-list/STARTER_PKG.png', label:'Starter', price:'₹260.00' },
  { slug:'intermediate', img:'/packages-list/INTERMEDIATE_PKG.png', label:'Intermediate', price:'₹512.00' },
  { slug:'expert', img:'/packages-list/EXPERT_PKG.png', label:'Expert', price:'₹1050.00' },
  { slug:'master', img:'/packages-list/MASTER_PKG.png', label:'Master', price:'₹2299.00' },
  { slug:'brahmastra', img:'/packages-list/BRAMHASTRA_PKG.png', label:'Brahmastra', price:'₹4999.00' },
  { slug:'premium-pro', img:'/packages-list/PREMIUM-PRO_PKG.png', label:'Premium Pro', price:'₹9998.00' },
];

const Popup = ({ isVisible, onClose, referralLink, username, festivalOffer }) => {
  const buildLink = (slug) => {
    if (!referralLink) return '#';
    try {
      const url = new URL(referralLink);
      const code = url.searchParams.get('referrer_code') || '';
      return `https://richind.org/checkout?slug=${slug}&referrer_code=${code}`;
    } catch { return referralLink; }
  };

  const handlePackageClick = async (slug) => {
    try { await API.post('/api/dashboard/package-click', { username, package: slug }); } catch {}
    window.location.href = buildLink(slug);
  };

  if (!isVisible) return null;
  return (
    <div id="popupForm" className="popup" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="popup-content">
        <span className="close" onClick={onClose}>&times;</span>
        <div className="popup-pkg">
          <h1>PLEASE <span>SELECT</span> THE <span>PACKAGE</span> YOU <span>CHOOSE</span> TO <span>JOIN</span></h1>
          {festivalOffer && <div style={{ color:'crimson', textAlign:'center', marginBottom:'.8rem', fontSize:'.9rem' }}>🔥 Festival Offer Prices Applied!</div>}
          <div className="popup-pkg-container">
            {pkgs.map(p => {
              const fp = festivalOffer?.packages?.find(x => x.slug === p.slug);
              return (
                <div key={p.slug} className="pkg_with_price" onClick={() => handlePackageClick(p.slug)} style={{ cursor:'pointer' }}>
                  <img src={p.img} alt={p.label} />
                  <h1>PRICE : {fp
                    ? <><s style={{ color:'#888', fontSize:'.85em' }}>{p.price}</s> <span style={{ color:'#fff' }}>₹{fp.amount}</span></>
                    : p.price}
                  </h1>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
