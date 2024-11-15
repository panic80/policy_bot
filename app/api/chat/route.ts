import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import openrouterClient from '../../../utils/openrouterClient';
import axios, { AxiosError } from 'axios';

const CFTDTI_URL = "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html";

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function fetchCFTDTIContent() {
  try {
    const response = await fetch(CFTDTI_URL);
    const text = await response.text();
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

    const sourceContent = await fetchCFTDTIContent();

    const systemPrompt = `You are a helpful assistant specializing in Canadian Forces Temporary Duty Travel Instructions (CFTDTI). 
    Use the following source content to answer questions accurately. Only provide information that is directly supported by the source content.
    If information isn't found in the source, clearly state that. Always reference specific sections when possible.

    Source Content:
    ${sourceContent}`;

    const response = await openrouterClient.post<OpenRouterResponse>('/chat/completions', {
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
      temperature: 0.3,
      max_tokens: 1024
    });

    const completion = response.data;

    if (!completion.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'No response content received' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: completion.choices[0].message.content,
      characterCount: sourceContent.length
    });

  } catch (error) {
    console.error('Error in API route:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error: string }>;
      const statusCode = axiosError.response?.status || 500;
      const errorData = axiosError.response?.data;
      
      return NextResponse.json(
        { error: errorData?.error || 'OpenRouter API error' },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

