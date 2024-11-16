'use client';

import { useState, useEffect } from 'react'; // Remove useRef if not using it

type UrlStats = {
  characterCount: number;
  wordCount: number;
};

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [urlStats, setUrlStats] = useState<UrlStats | null>(null);
  const [isSourceLoading, setIsSourceLoading] = useState(true);

  useEffect(() => {
    const fetchUrlStats = async () => {
      setIsSourceLoading(true);
      try {
        const res = await fetch('/api/fetch-url');
        const data = await res.json();
        setUrlStats(data);
      } catch (error) {
        console.error('Failed to fetch URL stats:', error);
      } finally {
        setIsSourceLoading(false);
      }
    };

    fetchUrlStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.message);
      setCharacterCount(data.characterCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>CFTDTI Assistant</h1>

        <div className={styles.sourceInfo}>
          {isSourceLoading ? (
            <div className={styles.loading}>Loading source document information...</div>
          ) : urlStats ? (
            <div className={styles.statsContainer}>
              <h2>Source Document Statistics</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <label>Total Characters:</label>
                  <span>{urlStats.characterCount.toLocaleString()}</span>
                </div>
                <div className={styles.statBox}>
                  <label>Total Words:</label>
                  <span>{urlStats.wordCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.error}>Failed to load source document statistics</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask your question about CFTDTI..."
            className={styles.input}
            disabled={isLoading || isSourceLoading}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || isSourceLoading || !userInput.trim()}
          >
            {isLoading ? 'Processing...' : 'Ask Question'}
          </button>
        </form>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {response && (
          <div className={styles.response}>
            <h2>Response:</h2>
            <p>{response}</p>
            {characterCount > 0 && urlStats && (
              <div className={styles.responseStats}>
                <p>Characters processed: {characterCount.toLocaleString()}</p>
                <p>Source coverage: {((characterCount / urlStats.characterCount) * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

