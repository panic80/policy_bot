// components/ResponseDisplay.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface ResponseDisplayProps {
  response: string;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  return (
    <motion.div
      className="mt-6 p-4 bg-gray-100 rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-xl font-semibold mb-2">Answer:</h2>
      <p className="text-gray-800">{response}</p>
    </motion.div>
  );
};

export default ResponseDisplay;
