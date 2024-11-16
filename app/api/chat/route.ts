// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { URLS } from '@/constants/urls';
import { fallbackContent } from '@/data/fallback-content';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Rate limiting configuration
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestLog = new Map<string, number[]>();

interface SourceData {
  content: string;
  characterCount: number;
  wordCount: number;
}

// Input validation
const validateInput = (input: string): boolean => {
  if (!input?.trim()) return false;
  if (input.length > 500) return false; // Maximum question length
  // Add additional validation rules as needed
  return true;
};

// Rate limiting check
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const userRequests = requestLog.get(ip) || [];
  
  // Remove requests outside the current window
  const recentRequests = userRequests.filter(
    timestamp => timestamp > now - RATE_LIMIT_WINDOW
  );
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  // Log new request
  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return true;
};

// Format AI response for better readability
const formatAIResponse = (text: string): string => {
  let formatted = text;

  // Add markdown formatting for sections
  formatted = formatted.replace(/^(.*?):\s*$/gm, '### $1\n');
  
  // Format lists
  formatted = formatted.replace(/^(\d+)\.\s/gm, '$1. ');
  formatted = formatted.replace(/^[-*]\s/gm, '• ');
  
  // Add emphasis to important terms
  formatted = formatted.replace(/\b(CFTDTI|CAF|DND)\b/g, '**$1**');
  
  // Format references
  formatted = formatted.replace(/$$ref:([^)]+)$$/g, '*($1)*');
  
  // Add horizontal rules between sections
  formatted = formatted.replace(/\n\n(?=###)/g, '\n\n---\n\n');

  return formatted;
};

// Fetch source content with retries
async function getSourceContent(retryCount = 0): Promise<SourceData> {
  try {
    const response = await fetch(URLS.CFTDTI_MAIN, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source content: ${response.status}`);
    }

    const html = await response.text();
    const content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      content,
      characterCount: content.length,
      wordCount: content.split(/\s+/).length
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
      return getSourceContent(retryCount + 1);
    }
    
    // If all retries fail, use fallback content
    console.error('Error fetching source content, using fallback:', error);
    return {
      content: fallbackContent.text,
      characterCount: fallbackContent.text.length,
      wordCount: fallbackContent.text.split(/\s+/).length
    };
  }
}

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate environment variables
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Parse and validate input
    const { userInput } = await req.json();
    if (!validateInput(userInput)) {
      return NextResponse.json(
        { error: 'Invalid input. Please check your question and try again.' },
        { status: 400 }
      );
    }

    // Fetch source content
    const sourceData = await getSourceContent();

    // Prepare system prompt
    const systemPrompt = `You are a knowledgeable assistant for the Canadian Forces Temporary Duty Travel Instructions (CFTDTI).
    Use the following CFTDTI content to answer questions accurately and thoroughly:

    ${sourceData.content}

    When answering:
    1. Be specific and cite relevant sections when possible
    2. If information isn't available in the provided content, clearly state that
    3. Provide complete answers based on the available information
    4. Consider all relevant context from the document
    5. Format important information using markdown for clarity
    6. Use bullet points for lists when appropriate
    7. Highlight key terms in bold
    8. If there are any monetary values, present them clearly`;

    // Make API request to OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'CFTDTI Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5-8b',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from AI');
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || 'No response generated';
    const formattedMessage = formatAIResponse(message);

    // Return formatted response with metadata
    return NextResponse.json({
      message: formattedMessage,
      characterCount: formattedMessage.length,
      sourceStats: {
        characterCount: sourceData.characterCount,
        wordCount: sourceData.wordCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    
    // Return appropriate error response
    const statusCode = error instanceof Error && error.message.includes('Rate limit') ? 429 : 500;
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: statusCode }
    );
  }
}

