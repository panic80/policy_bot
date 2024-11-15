// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import openai from '../../utils/openaiClient';

type Data = {
  message: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { userInput, sourceUrl } = req.body;

  if (!userInput || !sourceUrl) {
    res.status(400).json({ message: 'Missing userInput or sourceUrl' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemini-flash-1.5-8b",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": userInput
            },
            {
              "type": "url",
              "url": {
                "url": sourceUrl
              }
            }
          ]
        }
      ]
    });

    res.status(200).json({ message: completion.choices[0].message });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);

    // Provide more detailed error messages based on the error type
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response data:', error.response.data);
      res.status(error.response.status).json({ message: error.response.data });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      res.status(500).json({ message: 'No response from OpenRouter.ai API.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      res.status(500).json({ message: 'Error setting up the request.' });
    }
  }
}
