import React from 'react';

const Presentation = () => (
  <div className="video-frame">
    <video width="100%" controls>
      <source src="https://gjzulbutoscorgkxrkmx.supabase.co/storage/v1/object/public/teamaaryan/presentation.mp4" />
      Your browser does not support video.
    </video>
  </div>
);

export default Presentation;
