'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResponse('');
    setCharacterCount(0);

    try {
      console.log('Sending request with input:', userInput); // Debug log

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      console.log('Response status:', res.status); // Debug log

      // Try to get the raw text first
      const rawText = await res.text();
      console.log('Raw response:', rawText); // Debug log

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError); // Debug log
        throw new Error(`Failed to parse JSON response: ${rawText}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data.message);
      setCharacterCount(data.characterCount || 0);
    } catch (err) {
      console.error('Error details:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your component remains the same
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>CFTDTI Assistant</h1>
        <p className={styles.description}>
          Ask questions about the Canadian Forces Temporary Duty Travel Instructions
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask your question here..."
            className={styles.input}
            rows={4}
          />
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading || !userInput.trim()}
          >
            {isLoading ? 'Processing...' : 'Send Question'}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={styles.error}
            >
              {error}
            </motion.div>
          )}

          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={styles.response}
            >
              <h2>Response:</h2>
              <p>{response}</p>
              {characterCount > 0 && (
                <p className={styles.characterCount}>
                  Source content characters: {characterCount}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

