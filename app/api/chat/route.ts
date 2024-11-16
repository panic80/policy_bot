// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { URLS } from '@/constants/urls';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function getSourceContent() {
  try {
    // Fetch directly from the source URL instead of internal API
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
    console.error('Error fetching source content:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { userInput } = await req.json();

    if (!userInput?.trim()) {
      return NextResponse.json(
        { error: 'No input provided' },
        { status: 400 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Fetch source content
    const sourceData = await getSourceContent();

    const systemPrompt = `You are a knowledgeable assistant for the Canadian Forces Temporary Duty Travel Instructions (CFTDTI).
    Use the following CFTDTI content to answer questions accurately and thoroughly:

    ${sourceData.content}

    When answering:
    1. Be specific and cite relevant sections when possible
    2. If information isn't available in the provided content, say so
    3. Provide complete answers based on the available information
    4. Consider all relevant context from the document`;

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

    return NextResponse.json({
      message,
      characterCount: message.length,
      sourceStats: {
        characterCount: sourceData.characterCount,
        wordCount: sourceData.wordCount
      }
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

