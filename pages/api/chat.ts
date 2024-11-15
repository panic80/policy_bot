import type { NextApiRequest, NextApiResponse } from 'next';
import openai from '../../utils/openaiClient';

type Data = {
  message: string;
  characterCount?: number;
  error?: string;
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OpenRouter API key is not configured');
    return res.status(500).json({ message: 'OpenRouter API key is not configured' });
  }

  try {
    const { userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ message: 'Missing user input' });
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
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'CFTDTI Chat Assistant',
      }
    });

    console.log('OpenRouter response:', completion);

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response content received');
    }

    return res.status(200).json({
      message: completion.choices[0].message.content,
      characterCount: sourceContent.length
    });

  } catch (error: any) {
    console.error('Error in API route:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      console.error('OpenRouter API Error Details:', {
        status: statusCode,
        data: errorData
      });

      return res.status(statusCode).json({ 
        message: errorData.error || 'OpenRouter API error' 
      });
    }
    
    return res.status(500).json({
      message: error.message || 'Internal server error'
    });
  }
}

