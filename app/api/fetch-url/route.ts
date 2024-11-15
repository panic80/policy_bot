import { NextResponse } from 'next/server';
import axios from 'axios';

// Define interfaces that we'll actually use
interface ApiResponse {
  content?: string;
  error?: string;
  timestamp?: string;
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const response = await axios.get('https://cfpguide.cfainstitute.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PolicyBot/1.0;)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 5000, // 5 seconds timeout
    });
    
    if (response.status === 200) {
      const sanitizedContent = response.data.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, 
        ''
      );
      
      return NextResponse.json({
        content: sanitizedContent,
        timestamp: new Date().toISOString()
      });
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

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    const response = await axios.get('https://cfpguide.cfainstitute.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PolicyBot/1.0;)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 5000,
    });
    
    if (response.status === 200) {
      const sanitizedContent = response.data.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, 
        ''
      );
      
      return NextResponse.json({
        content: sanitizedContent,
        timestamp: new Date().toISOString()
      });
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

