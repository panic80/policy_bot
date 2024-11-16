'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { KeyboardShortcut } from '../components/KeyboardShortcut';

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

  const responseRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Helper functions
  const formatResponse = (text: string) => {
    text = text.replace(/^\s*[-*]\s/gm, '• ');
    text = text.replace(/^([A-Z][^.!?]*:)/gm, '### $1');
    text = text.replace(/^\s*(\d+)\.\s/gm, '$1. ');
    text = text.replace(/\b(CFTDTI|CAF|DND)\b/g, '**$1**');
    text = text.replace(/\$\$([^)]+)\$\$/g, '*($1)*');
    return text;
  };

  // Effects
  useEffect(() => {
    const fetchUrlStats = async () => {
      try {
        setIsSourceLoading(true);
        setError('');
        const res = await fetch('/api/fetch-url');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setUrlStats({
          characterCount: data.characterCount,
          wordCount: data.wordCount,
          source: data.source
        });
        setContentSource(data.source);
      } catch (error) {
        console.error('Failed to fetch URL stats:', error);
        setError(error instanceof Error ? error.message : 'Failed to load source document statistics.');
        setUrlStats(null);
      } finally {
        setIsSourceLoading(false);
      }
    };

    fetchUrlStats();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('form');
        if (form && !isLoading && userInput.trim()) {
          form.requestSubmit();
        }
      }
      
      if (e.key === 'Escape' && error) {
        setError('');
      }

      if (e.key === '/' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [error, isLoading, userInput]);

  const scrollToResponse = () => {
    responseRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'nearest' 
    });
  };

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
      setTimeout(scrollToResponse, 100);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  function renderUI() {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Hero Section with Glass Effect */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <h1 className="text-6xl font-extrabold tracking-tight mb-8">
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  CFTDTI Assistant
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-blue-100/80 leading-relaxed">
                Your AI-powered guide to Canadian Forces Temporary Duty Travel Instructions
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="space-y-8">
              {/* Keyboard Shortcuts Card */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl">
                <h2 className="text-xl font-semibold text-blue-300 mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  </svg>
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <KeyboardShortcut keys={['/']} />
                      <span className="text-blue-100/60">Focus search</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <KeyboardShortcut keys={['Ctrl', 'Enter']} />
                      <span className="text-blue-100/60">Submit</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <KeyboardShortcut keys={['Esc']} />
                      <span className="text-blue-100/60">Clear error</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl">
                <h2 className="text-xl font-semibold text-blue-300 mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Document Stats
                </h2>
                {isSourceLoading ? (
                  <div className="space-y-4">
                    <div className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
                    <div className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <div className="text-sm text-blue-100/60 mb-1">Characters</div>
                      <div className="text-2xl font-semibold text-blue-300">
                        {urlStats?.characterCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <div className="text-sm text-blue-100/60 mb-1">Words</div>
                      <div className="text-2xl font-semibold text-blue-300">
                        {urlStats?.wordCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <div className="text-sm text-blue-100/60 mb-1">Source</div>
                      <div className={`inline-flex px-4 py-1 rounded-full text-sm font-medium
                        ${contentSource === 'live' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                        }`}>
                        {contentSource === 'live' ? '● Live Document' : '● Cached Version'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* Chat Input */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <textarea
                      ref={textareaRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Ask your question about CFTDTI... (Press '/' to focus)"
                      className="w-full min-h-[200px] p-6 bg-white/5 rounded-2xl
                               text-blue-50 placeholder-blue-200/30
                               border-2 border-white/10
                               focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200
                               group-hover:border-white/20
                               text-lg"
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/5 rounded-full text-sm text-blue-200/50">
                      {userInput.length} characters
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500
                             text-white rounded-2xl font-medium text-lg
                             hover:from-blue-600 hover:to-purple-600
                             focus:ring-4 focus:ring-blue-500/50
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-300 transform hover:scale-[1.02]
                             flex items-center justify-center gap-3
                             shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Ask Question</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Response Area */}
              {response && (
                <div ref={responseRef} 
                     className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl
                              animate-fade-in-up">
                  <h2 className="text-xl font-semibold text-blue-300 mb-6 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Response
                  </h2>
                  <div className="prose prose-invert prose-blue max-w-none">
                    <ReactMarkdown>{formatResponse(response)}</ReactMarkdown>
                  </div>
                  
                  {/* Response Stats */}
                  {characterCount > 0 && urlStats && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4">
                          <div className="text-sm text-blue-100/60 mb-1">Processed</div>
                          <div className="text-lg font-semibold text-blue-300">
                            {characterCount.toLocaleString()} chars
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4">
                          <div className="text-sm text-blue-100/60 mb-1">Coverage</div>
                          <div className="text-lg font-semibold text-blue-300">
                            {((characterCount / urlStats.characterCount) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4">
                          <div className="text-sm text-blue-100/60 mb-1">Source</div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium
                            ${contentSource === 'live' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-amber-500/20 text-amber-400'
                            }`}>
                            {contentSource === 'live' ? '● Live' : '● Cached'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="backdrop-blur-xl bg-red-500/10 rounded-3xl p-6 border border-red-500/20 shadow-2xl
                               flex items-center justify-between animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-400">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError('')}
                    className="px-4 py-2 text-red-400 border border-red-400 rounded-full
                             hover:bg-red-400 hover:text-gray-900
                             transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 mb-8 backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl text-center">
            <p className="text-blue-100/60">
              This assistant uses AI to help interpret CFTDTI policies. Always verify important 
              information with official sources and your chain of command.
            </p>
            {contentSource && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/5 rounded-full text-sm text-blue-200/50 gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  contentSource === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                Using {contentSource === 'live' ? 'live' : 'cached'} content
              </div>
            )}
          </footer>
        </div>
      </main>
    );
  }

  return renderUI();
}

