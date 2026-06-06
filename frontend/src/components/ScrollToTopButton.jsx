import React, { useState, useEffect } from 'react';

const ScrollToTopButton = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <button id="scrollToTopBtn" className={show ? 'show' : ''} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
  );
};

export default ScrollToTopButton;
