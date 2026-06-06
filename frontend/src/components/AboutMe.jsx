import React from 'react';

const AboutMe = () => (
  <div className="about-me-container">
    <div className="about-heading"><h1>ABOUT TEAM FOUNDER</h1></div>
    <div className="owner-photo-and-details">
      <div className="profile"><img src="/assets/profile.png" alt="profile" /></div>
      <div className="social-links">
        <a href="https://www.facebook.com/gouranga.rout.908" target="_blank" rel="noreferrer"><img src="/social-icons/fb.png" alt="fb" /></a>
        <a href="https://www.instagram.com/gouranga__rout/" target="_blank" rel="noreferrer"><img src="/social-icons/ig.png" alt="ig" /></a>
        <a href="https://wa.me/message/M4D7POTWPL3RI1" target="_blank" rel="noreferrer"><img src="/social-icons/wa.png" alt="wa" /></a>
        <a href="https://www.linkedin.com/in/gourangarout" target="_blank" rel="noreferrer"><img src="/social-icons/in.png" alt="linkedin" /></a>
      </div>
      <div className="details">
        <p>I am <span className="sky">Aaryan</span><br />
          I'm proud to be the <span className="sky">Founder of Team Aaryan</span> — a newly launched digital network built on innovation, collaboration, and real results.<br /><br />
          <span className="sky">What's Next?</span><br />
          We're actively developing advanced <span className="sky">automation systems</span> for the team — designed to <span className="sky">streamline workflows, boost efficiency, and maximize profits</span> for all our members.</p>
      </div>
    </div>
  </div>
);

export default AboutMe;
