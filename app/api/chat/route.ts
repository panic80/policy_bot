import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import openai from '../../../utils/openaiClient';

const CFTDTI_URL = "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html";

async function fetchCFTDTIContent() {
  try {
    const response = await fetch(CFTDTI_URL);
    const text = await response.text();
    // Clean the HTML and get plain text
    const cleanText = text.replace(/<[^>]*>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();
    return cleanText;
  } catch (error) {
    console.error('Error fetching CFTDTI content:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'OpenRouter API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { userInput } = body;

    if (!userInput) {
      return NextResponse.json(
        { error: 'Missing user input' },
        { status: 400 }
      );
    }

    // Fetch CFTDTI content
    const sourceContent = await fetchCFTDTIContent();

    // Create a more focused system prompt
    const systemPrompt = `You are a helpful assistant specializing in Canadian Forces Temporary Duty Travel Instructions (CFTDTI). 
    Use the following source content to answer questions accurately. Only provide information that is directly supported by the source content.
    If information isn't found in the source, clearly state that. Always reference specific sections when possible.

    Source Content:
    ${sourceContent}`;

    console.log('Sending request to OpenRouter:', { 
      userInput,
      contentLength: sourceContent.length 
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemini-flash-1.5-8b",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: userInput
        }
      ],
      temperature: 0.3, // Lower temperature for more focused answers
      max_tokens: 1024,
      headers: {
        'HTTP-Referer': process.env.YOUR_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.YOUR_APP_NAME || 'CFTDTI Chat Assistant',
      }
    });

    if (!completion.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: 'No response content received' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: completion.choices[0].message.content,
      characterCount: sourceContent.length
    });

  } catch (error: Error | unknown) {
    console.error('Error in API route:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      console.error('OpenRouter API Error Details:', {
        status: statusCode,
        data: errorData
      });

      return NextResponse.json(
        { error: errorData.error || 'OpenRouter API error' },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

