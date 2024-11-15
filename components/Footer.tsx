// components/Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 p-4 text-center text-white">
      © {new Date().getFullYear()} PolicyQA. All rights reserved.
    </footer>
  );
};

export default Footer;
