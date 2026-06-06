import React from 'react';

const EarningsProofs = ({ proofImages }) => (
  <>
    <div className="proof-text">
      <h1>LETS HAVE A <span>LOOK</span> HOW MUCH <span>OTHERS EARNS </span>
        WITH THIS <span>PLATFORM</span> BY <span>UTILIZING </span>
        THERE <span>FREE TIME</span>
      </h1>
    </div>
    <div className="earnings">
      {proofImages.length > 0
        ? proofImages.map((img, i) => (
            <img key={img._id || i} src={img.url} alt={`proof-${i+1}`} data-aos={i >= 2 ? "zoom-in" : undefined} />
          ))
        : Array.from({ length: 8 }, (_, i) => (
            <img key={i} src={`/earnings/proof-${i+1}.jpg`} alt={`proof-${i+1}`} />
          ))
      }
    </div>
  </>
);

export default EarningsProofs;
