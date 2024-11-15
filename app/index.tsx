import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

const CFTDTI_URL = "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html";

type UrlStats = {
  characterCount: number;
  wordCount: number;
};

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      } catch (err) {
        console.error('Failed to fetch URL stats:', err);
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
    setCharacterCount(0);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Server error');
      }

      setResponse(data.message);
      setCharacterCount(data.characterCount || 0);
    } catch (err: Error | unknown) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>CFTDTI Assistant</h1>
        
        <div className={styles.urlDisplay}>
          <strong>Reference Document:</strong>
          <a href={CFTDTI_URL} target="_blank" rel="noopener noreferrer">
            CFTDTI
          </a>
          {isSourceLoading ? (
            <div className={styles.loading}>Loading source content...</div>
          ) : urlStats && (
            <div className={styles.urlStats}>
              <p>Source Document Statistics:</p>
              <ul>
                <li>Characters: {urlStats.characterCount.toLocaleString()}</li>
                <li>Words: {urlStats.wordCount.toLocaleString()}</li>
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label htmlFor="userInput">Your Question:</label>
            <textarea
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              required
              className={styles.textarea}
              placeholder="Ask a question about CFTDTI..."
              disabled={isLoading || isSourceLoading}
            />
            <div className={styles.characterCount}>
              Characters: {userInput.length}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isSourceLoading}
            className={styles.button}
          >
            {isLoading ? 'Processing...' : isSourceLoading ? 'Loading Source...' : 'Send Question'}
          </button>
        </form>

        {error && (
          <div className={styles.error}>
            <p>Error: {error}</p>
          </div>
        )}

        {response && (
          <div className={styles.response}>
            <h2>Response:</h2>
            <p>{response}</p>
            {characterCount > 0 && (
              <div className={styles.stats}>
                <p>Source characters processed: {characterCount.toLocaleString()}</p>
                {urlStats && (
                  <p>Source coverage: {((characterCount / urlStats.characterCount) * 100).toFixed(1)}%</p>
                )}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}>
              Processing your question...
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

