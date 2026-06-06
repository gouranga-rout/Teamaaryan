import React from 'react';

const Navbar = () => (
  <header>
    <nav>
      <div className="nav-bar">
        <div className="teamlogo">
          <a href="/"><img src="/assets/teamlogo.png" onError={e => e.target.style.display='none'} alt="TeamAaryan" /></a>
        </div>
        <div className="logo">
          <a href="/"><img src="/assets/RICHIND_LOGO.png" onError={e => e.target.style.display='none'} alt="RichIND" /></a>
        </div>
      </div>
    </nav>
  </header>
);

export default Navbar;
