import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';

const CFTDTI_URL = "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html";

async function fetchCFTDTIContent() {
  try {
    const response = await fetch(CFTDTI_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CFTDTI content: ${response.status}`);
    }
    const text = await response.text();
    return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    console.error('Error fetching CFTDTI content');
    throw new Error('Failed to fetch CFTDTI content');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key is not configured' }, { status: 500 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userInput } = body;
    if (!userInput) {
      return NextResponse.json({ error: 'Missing user input' }, { status: 400 });
    }

    // Fetch source content
    const sourceContent = await fetchCFTDTIContent();

    const systemPrompt = `You are a helpful assistant specializing in Canadian Forces Temporary Duty Travel Instructions (CFTDTI). 
    Use the following source content to answer questions accurately. Only provide information that is directly supported by the source content.
    If information isn't found in the source, clearly state that. Always reference specific sections when possible.

    Source Content:
    ${sourceContent}`;

    // Make request to OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "google/gemini-flash-1.5-8b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.YOUR_SITE_URL || 'http://localhost:3000',
          'X-Title': process.env.YOUR_APP_NAME || 'CFTDTI Assistant',
          'Content-Type': 'application/json'
        }
      }
    );

    // Validate response
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenRouter');
    }

    return NextResponse.json({
      message: response.data.choices[0].message.content,
      characterCount: sourceContent.length
    });

  } catch (error) {
    console.error('Error in API route:', error);

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message;
      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

