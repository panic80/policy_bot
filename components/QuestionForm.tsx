// components/QuestionForm.tsx

import React from 'react';

interface QuestionFormProps {
  userInput: string;
  setUserInput: (value: string) => void;
  sourceUrl: string;
  setSourceUrl: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  userInput,
  setUserInput,
  sourceUrl,
  setSourceUrl,
  handleSubmit,
  loading,
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700">Your Question:</label>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter your policy question"
        />
      </div>
      <div>
        <label className="block text-gray-700">Source URL:</label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="https://example.com/policy-document"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        {loading ? 'Loading...' : 'Ask'}
      </button>
    </form>
  );
};

export default QuestionForm;
