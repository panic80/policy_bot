import type { NextApiRequest, NextApiResponse } from 'next';
import openrouterClient from '../../utils/openrouterClient';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type Data = {
  message: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed', 
      error: 'Use POST method' 
    });
  }

  try {
    const { messages } = req.body;

    const response = await openrouterClient.post('/chat/completions', {
      model: 'gpt-3.5-turbo', // or your preferred model
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return res.status(200).json({ 
      message: response.data.choices[0].message.content 
    });
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('OpenRouter API Error:', err);
    return res.status(500).json({ 
      message: 'Error processing your request',
      error: err.message 
    });
  }
}

