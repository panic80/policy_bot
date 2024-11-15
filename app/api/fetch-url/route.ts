import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://cfpguide.cfainstitute.org/');
    
    if (response.status === 200) {
      const htmlContent = response.data;
      return NextResponse.json({ content: htmlContent });
    } else {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching URL:', err);
    
    return NextResponse.json(
      { error: err.message || 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}

// Optional: If you need POST functionality
export async function POST() {
  try {
    const response = await axios.get('https://cfpguide.cfainstitute.org/');
    
    if (response.status === 200) {
      const htmlContent = response.data;
      return NextResponse.json({ content: htmlContent });
    } else {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching URL:', err);
    
    return NextResponse.json(
      { error: err.message || 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}

// Add types for better type safety
interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  content: string;
}

// Optional: Add rate limiting
import { RateLimiter } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiter({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds
});

// Optional: Enhanced version with rate limiting
export async function GETWithRateLimit() {
  try {
    // Check rate limit
    await rateLimiter.consume('fetch-url-api');

    const response = await axios.get('https://cfpguide.cfainstitute.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PolicyBot/1.0;)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 5000, // 5 seconds timeout
    });

    if (response.status === 200) {
      const htmlContent = response.data;
      return NextResponse.json({ 
        content: htmlContent,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching URL:', err);

    if (err.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}

// Optional: Helper function to sanitize HTML content
function sanitizeHtml(html: string): string {
  // Add your HTML sanitization logic here
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Optional: Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

