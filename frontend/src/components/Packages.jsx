import React from 'react';

const pkgList = [
  { slug:'starter-package', cls:'marketing', img:'/packages-list/STARTER_PKG.png', name:'Starter', price:'260.00', direct:'200.00', passive:'20.00' },
  { slug:'intermediate', cls:'branding', img:'/packages-list/INTERMEDIATE_PKG.png', name:'Intermediate', price:'512.00', direct:'400.00', passive:'40.00' },
  { slug:'expert', cls:'supreme', img:'/packages-list/EXPERT_PKG.png', name:'Expert', price:'1050.00', direct:'800.00', passive:'80.00' },
  { slug:'master', cls:'trafic', img:'/packages-list/MASTER_PKG.png', name:'Master', price:'2299.00', direct:'1700.00', passive:'170.00' },
  { slug:'brahmastra', cls:'influence', img:'/packages-list/BRAMHASTRA_PKG.png', name:'Brahmastra', price:'4999.00', direct:'3800.00', passive:'380.00' },
  { slug:'premium-pro', cls:'finance', img:'/packages-list/PREMIUM-PRO_PKG.png', name:'Premium Pro', price:'9998.00', direct:'7300.00', passive:'730.00' },
];

const Packages = ({ festivalOffer }) => (
  <div className="pkg-container">
    <div className="heading">
      <h1>OUR DIGITAL PACKAGES</h1>
      {festivalOffer && <div style={{ color:'crimson', fontSize:'.95rem', margin:'.3rem' }}>🔥 Festival Offer Prices Applied!</div>}
    </div>
    <div className="all_pkg_container">
      {pkgList.map(p => {
        const fp = festivalOffer?.packages?.find(x => x.slug === p.slug);
        return (
          <div key={p.name} className={p.cls} data-aos="fade-up">
            <div className="pkg-img"><img src={p.img} alt={p.name} /></div>
            <div className="details-container">
              <h2>Pkg Name : {p.name}</h2>
              <h2>Discounted Amount : Rs. {fp
                ? <><s style={{ color:'#fff' }}>{p.price}</s> <span style={{ color:'#fff' }}>{fp.amount}</span></>
                : p.price}
              </h2>
              <h2>Direct Commission : Rs. {fp ? fp.direct : p.direct}</h2>
              <h2>Passive Commission : Rs. {fp ? fp.passive : p.passive}</h2>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default Packages;
