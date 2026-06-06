import React from 'react';
import API from '../api';

const defaultPkgs = [
  { name:'Stater Package', slug:'starter-package', amount:'₹260', direct:'₹200', passive:'₹20', d:'₹200', w:'₹1,400', m:'₹6,000' },
  { name:'Intermediate Package', slug:'intermediate', amount:'₹512', direct:'₹400', passive:'₹40', d:'₹400', w:'₹2,800', m:'₹12,000' },
  { name:'Expert Package', slug:'expert', amount:'₹1050', direct:'₹800', passive:'₹80', d:'₹800', w:'₹5,600', m:'₹24,000' },
  { name:'Master Package', slug:'master', amount:'₹2299', direct:'₹1700', passive:'₹170', d:'₹1,700', w:'₹11,900', m:'₹51,000' },
  { name:'Brahmastra Package', slug:'brahmastra', amount:'₹4999', direct:'₹3800', passive:'₹380', d:'₹3,800', w:'₹26,600', m:'₹1,14,000' },
  { name:'Premium Pro Package', slug:'premium-pro', amount:'₹9998', direct:'₹7300', passive:'₹730', d:'₹7,300', w:'₹51,100', m:'₹2,19,000' },
];

const Calculations = ({ referralLink, username, festivalOffer }) => {
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

  const pkgs = festivalOffer
    ? defaultPkgs.map(p => {
        const fp = festivalOffer.packages?.find(x => x.slug === p.slug);
        if (!fp) return p;
        return { ...p, originalAmount: p.amount, amount: `₹${fp.amount}`, direct: `₹${fp.direct}`, passive: `₹${fp.passive}`, d: `₹${fp.direct}`, w: `₹${(fp.direct * 7).toLocaleString()}`, m: `₹${(fp.direct * 30).toLocaleString()}`, isFestival: true };
      })
    : defaultPkgs;

  return (
    <div className="calc-container" id="CalculationsSection">
      <div className="calc-heading">
        <h1>PRACTICAL CALCULATIONS</h1>
        {festivalOffer && <div style={{ color:'crimson', fontSize:'.9rem', marginTop:'.3rem', textAlign:'center' }}>🔥 Festival Offer Prices Applied!</div>}
      </div>
      <div className="income-calc">
        {pkgs.map(p => (
          <div key={p.name} className="calc-box" data-aos="zoom-in">
            <h1>By Choosing : {p.name}</h1>
            <div className="comm-str">
              <ul>
                <li>Amount : {p.isFestival ? <><s style={{ color:'#888' }}>{p.originalAmount}</s> <span style={{ color:'#fff' }}>{p.amount}</span></> : p.amount}</li>
                <li>Direct Commission : {p.direct}</li>
                <li>Passive Commission : {p.passive}</li>
              </ul>
            </div>
            <div className="pract-calc">
              <div className="calc">
                <h3>Calculation</h3>
                <ul>
                  <li>Daily 1 A/c : {p.d}</li>
                  <li>Weekly 7 A/c : {p.w}</li>
                  <li>Monthly 30 A/c : {p.m}</li>
                </ul>
              </div>
              <button className="choose-btn" onClick={() => handlePackageClick(p.slug)}>Choose This</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calculations;
