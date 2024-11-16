'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

type UrlStats = {
  characterCount: number;
  wordCount: number;
  source: 'live' | 'fallback';
};

interface ChatResponse {
  message: string;
  characterCount: number;
}

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [urlStats, setUrlStats] = useState<UrlStats | null>(null);
  const [isSourceLoading, setIsSourceLoading] = useState(true);
  const [contentSource, setContentSource] = useState<'live' | 'fallback' | null>(null);

  useEffect(() => {
    const fetchUrlStats = async () => {
      try {
        setIsSourceLoading(true);
        setError('');
        console.log('Fetching URL stats...');
        const res = await fetch('/api/fetch-url');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('URL stats received:', data);
        setUrlStats({
          characterCount: data.characterCount,
          wordCount: data.wordCount,
          source: data.source
        });
        setContentSource(data.source);
      } catch (error) {
        console.error('Failed to fetch URL stats:', error);
        setError(error instanceof Error ? error.message : 'Failed to load source document statistics. Please try refreshing the page.');
        setUrlStats(null);
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
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      setResponse(data.message);
      setCharacterCount(data.characterCount);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLoading = async () => {
    setIsSourceLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fetch-url');
      if (!res.ok) {
        throw new Error(`Failed to reload content: ${res.status}`);
      }
      const data = await res.json();
      setUrlStats({
        characterCount: data.characterCount,
        wordCount: data.wordCount,
        source: data.source
      });
      setContentSource(data.source);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reload content');
    } finally {
      setIsSourceLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>CFTDTI Assistant</h1>
        
        <div className={styles.description}>
          <p>
            Welcome to the CFTDTI Assistant. This AI-powered tool helps you find information about
            the Canadian Forces Temporary Duty Travel Instructions. Ask any question about travel
            policies and regulations.
          </p>
        </div>

        <div className={styles.sourceInfo}>
          {isSourceLoading ? (
            <div className={styles.loading}>
              <p>Loading source document information...</p>
              <div className={styles.loadingSpinner}></div>
            </div>
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
                <div className={styles.statBox}>
                  <label>Source:</label>
                  <span className={contentSource === 'live' ? styles.sourceLive : styles.sourceFallback}>
                    {contentSource === 'live' ? 'Live Document' : 'Cached Version'}
                  </span>
                </div>
              </div>
              {contentSource === 'fallback' && (
                <button 
                  onClick={handleRetryLoading}
                  className={styles.retryButton}
                  disabled={isSourceLoading}
                >
                  Retry Loading Live Content
                </button>
              )}
            </div>
          ) : (
            <div className={styles.error}>
              <p>Error loading content: {error}</p>
              <p>Using cached version of the document</p>
              <button 
                onClick={handleRetryLoading}
                className={styles.retryButton}
                disabled={isSourceLoading}
              >
                Retry Loading Live Content
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask your question about CFTDTI..."
            className={styles.input}
            disabled={isLoading}
            rows={4}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !userInput.trim()}
          >
            {isLoading ? (
              <>
                <span className={styles.loadingSpinner}></span>
                Processing...
              </>
            ) : (
              'Ask Question'
            )}
          </button>
        </form>

        {error && (
          <div className={styles.error}>
            <p>Error: {error}</p>
            <button 
              onClick={() => setError('')}
              className={styles.dismissError}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {response && (
          <div className={styles.response}>
            <h2>Response:</h2>
            <p>{response}</p>
            {characterCount > 0 && urlStats && (
              <div className={styles.responseStats}>
                <p>Characters processed: {characterCount.toLocaleString()}</p>
                <p>Source coverage: {((characterCount / urlStats.characterCount) * 100).toFixed(1)}%</p>
                <p>Source type: {contentSource === 'live' ? 'Live Document' : 'Cached Version'}</p>
              </div>
            )}
          </div>
        )}

        <footer className={styles.footer}>
          <p>
            This assistant uses AI to help interpret CFTDTI policies. Always verify important 
            information with official sources and your chain of command.
          </p>
          <p className={styles.sourceIndicator}>
            Using {contentSource === 'live' ? 'live' : 'cached'} content
          </p>
        </footer>
      </div>
    </main>
  );
}

